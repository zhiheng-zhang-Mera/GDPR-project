#!/usr/bin/env node
/*
 * Downloads an operator-approved AndroZoo corpus only with a personal API key.
 * APK binaries and API keys must remain outside Git. Content hashes and manifest
 * package identities are verified before a file becomes installable input.
 */
const { createHash } = require('crypto');
const { execFileSync } = require('child_process');
const fs = require('fs');
const https = require('https');
const path = require('path');

const args = process.argv.slice(2);
const value = (flag) => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
const catalogPath = value('--catalog');
const output = value('--output');
const apiBase = value('--api-base') || 'https://androzoo.uni.lu/api/download';
const aapt = value('--aapt') || 'C:\\Users\\15601\\AppData\\Local\\Android\\Sdk\\build-tools\\36.0.0\\aapt.exe';
const validationOnly = args.includes('--validation-only');
if (!catalogPath || !output) throw new Error('Usage: node scripts/download-authorized-androzoo-corpus.js --catalog <catalog.json> --output <receipt.json> [--aapt <aapt>] [--validation-only]');
if (!fs.existsSync(catalogPath)) throw new Error(`Catalog does not exist: ${catalogPath}`);
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const sha256 = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex').toLowerCase();
function validCatalog(value) {
  if (value?.schema !== 'privacy-lens.android-store-corpus.v1' || value.corpusKind !== 'APP_STORE_COMMERCIAL' || value.source?.provider !== 'AndroZoo' || value.source?.commercialStatus !== 'OPERATOR_ATTESTED_WITH_EVIDENCE' || !/^[a-f0-9]{64}$/i.test(value.source?.accessRecordSha256 || '') || !Array.isArray(value.apps) || value.apps.length < 100 || value.apps.length > 500) throw new Error('Catalog must be an operator-approved 100-to-500 APP_STORE_COMMERCIAL AndroZoo catalog.');
  const ids = new Set(); const packages = new Set();
  for (const app of value.apps) {
    const file = app?.apkFiles?.[0]; const expected = app?.provenance?.sha256;
    if (!app?.id || !/^[A-Za-z0-9_.-]+$/.test(app.packageName || '') || ids.has(app.id) || packages.has(app.packageName) || !file || !/^[a-f0-9]{64}$/i.test(file.sha256 || '') || file.sha256.toLowerCase() !== String(expected || '').toLowerCase() || !/^https:\/\/play\.google\.com\/store\/apps\/details\?id=/.test(app.storeUrl || '')) throw new Error(`Invalid authorised catalog item: ${app?.id || 'unknown'}`);
    ids.add(app.id); packages.add(app.packageName);
  }
}
function download(url, destination) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: 120_000, headers: { 'User-Agent': 'Privacy-Lens-authorised-research/1.0' } }, (response) => {
      if (response.statusCode !== 200) { response.resume(); reject(new Error(`AndroZoo download returned HTTP ${response.statusCode}.`)); return; }
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      const temporary = `${destination}.partial`;
      const stream = fs.createWriteStream(temporary);
      response.pipe(stream);
      stream.on('finish', () => stream.close(() => { fs.renameSync(temporary, destination); resolve(); }));
      stream.on('error', (error) => { try { fs.rmSync(temporary, { force: true }); } catch { /* keep original error */ } reject(error); });
    });
    request.on('timeout', () => request.destroy(new Error('AndroZoo download timed out.')));
    request.on('error', reject);
  });
}
function apkPackageName(file) {
  if (!fs.existsSync(aapt)) throw new Error(`aapt is required to verify manifest package identity: ${aapt}`);
  const text = execFileSync(aapt, ['dump', 'badging', file], { encoding: 'utf8', timeout: 30_000, stdio: ['ignore', 'pipe', 'pipe'] });
  const match = text.match(/^package: name='([^']+)'/m);
  if (!match) throw new Error('aapt did not report a manifest package name.');
  return match[1];
}
(async () => {
  validCatalog(catalog);
  const receipt = { schema: 'privacy-lens.androzoo-authorized-download.v1', corpusId: catalog.corpusId, corpusKind: catalog.corpusKind, generatedAt: new Date().toISOString(), source: { provider: 'AndroZoo', metadataSha256: catalog.source.metadataSha256, accessRecordSha256: catalog.source.accessRecordSha256 }, execution: validationOnly ? 'VALIDATION_ONLY' : 'AUTHORISED_DOWNLOAD', verified: [], rejected: [] };
  if (validationOnly) {
    receipt.planned = catalog.apps.map((app) => ({ id: app.id, packageName: app.packageName, sha256: app.apkFiles[0].sha256, path: app.apkFiles[0].path }));
    fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
    console.log(`Validated authorised AndroZoo catalog with ${receipt.planned.length} entries.`); return;
  }
  const key = process.env.ANDROZOO_API_KEY;
  if (!key) throw new Error('ANDROZOO_API_KEY is required for authorised downloads and must never be persisted in a file or command line.');
  for (const app of catalog.apps) {
    const file = app.apkFiles[0]; const item = { id: app.id, packageName: app.packageName, sha256: file.sha256, path: file.path };
    try {
      if (!fs.existsSync(file.path) || sha256(file.path) !== file.sha256.toLowerCase()) {
        try { fs.rmSync(file.path, { force: true }); } catch { /* no prior local file */ }
        const endpoint = new URL(apiBase); endpoint.searchParams.set('apikey', key); endpoint.searchParams.set('sha256', file.sha256);
        await download(endpoint, file.path);
      }
      const actualSha256 = sha256(file.path); if (actualSha256 !== file.sha256.toLowerCase()) throw new Error('APK SHA-256 mismatch.');
      const actualPackageName = apkPackageName(file.path); if (actualPackageName !== app.packageName) throw new Error(`Manifest package mismatch: expected ${app.packageName}, received ${actualPackageName}.`);
      receipt.verified.push({ ...item, actualSha256, actualPackageName });
    } catch (error) { receipt.rejected.push({ ...item, error: error instanceof Error ? error.message : String(error) }); }
    fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
  }
  console.log(`Authorised AndroZoo downloads: ${receipt.verified.length} verified, ${receipt.rejected.length} rejected.`);
  if (receipt.verified.length < 100) process.exitCode = 2;
})().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
