#!/usr/bin/env node
/* Downloads only catalogued F-Droid APKs, then verifies content and signer hashes. */
const { createHash } = require('crypto');
const { execFileSync } = require('child_process');
const fs = require('fs');
const https = require('https');
const path = require('path');
const args = process.argv.slice(2);
const get = (flag) => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
const catalogPath = get('--catalog'); const output = get('--output');
const apksigner = get('--apksigner') || 'C:\\Users\\15601\\AppData\\Local\\Android\\Sdk\\build-tools\\36.0.0\\apksigner.bat';
if (!catalogPath || !output) throw new Error('Usage: node scripts/download-verified-store-corpus.js --catalog <catalog.json> --output <download-receipt.json> [--apksigner <path>]');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (catalog?.corpusKind !== 'OPEN_SOURCE_APP_STORE' || !Array.isArray(catalog.apps) || catalog.apps.length < 100 || catalog.apps.length > 500) throw new Error('Only a 100-to-500 OPEN_SOURCE_APP_STORE catalog may be downloaded.');
if (!fs.existsSync(apksigner)) throw new Error(`apksigner is required for signer verification: ${apksigner}`);
const sha256 = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function download(url, destination, redirects = 0) {
  if (redirects > 3) return Promise.reject(new Error('Too many redirects.'));
  return new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: 90_000, headers: { 'User-Agent': 'Privacy-Lens-research-corpus/1.0' } }, (response) => {
      if ([301, 302, 307, 308].includes(response.statusCode) && response.headers.location) { response.resume(); return resolve(download(new URL(response.headers.location, url).toString(), destination, redirects + 1)); }
      if (response.statusCode !== 200) { response.resume(); return reject(new Error(`HTTP ${response.statusCode}`)); }
      fs.mkdirSync(path.dirname(destination), { recursive: true }); const file = fs.createWriteStream(destination);
      response.pipe(file); file.on('finish', () => file.close(resolve)); file.on('error', reject);
    });
    request.on('timeout', () => request.destroy(new Error('Download timed out.'))); request.on('error', reject);
  });
}
function signerSha256(file) {
  const windowsBatch = process.platform === 'win32' && /\.bat$/i.test(apksigner);
  const text = windowsBatch
    ? execFileSync('java', ['-jar', path.join(path.dirname(apksigner), 'lib', 'apksigner.jar'), 'verify', '--print-certs', file], { encoding: 'utf8', timeout: 30_000, stdio: ['ignore', 'pipe', 'pipe'] })
    : execFileSync(apksigner, ['verify', '--print-certs', file], { encoding: 'utf8', timeout: 30_000, stdio: ['ignore', 'pipe', 'pipe'] });
  const match = text.match(/Signer #1 certificate SHA-256 digest:\s*([a-f0-9:]+)/i);
  if (!match) throw new Error('apksigner did not report an SHA-256 signer digest.');
  return match[1].replace(/:/g, '').toLowerCase();
}
(async () => {
  const receipt = { schema: 'privacy-lens.verified-apk-download.v1', corpusId: catalog.corpusId, corpusKind: catalog.corpusKind, generatedAt: new Date().toISOString(), verified: [], rejected: [] };
  for (const app of catalog.apps) {
    const file = app.apkFiles?.[0]; const item = { id: app.id, packageName: app.packageName, downloadUrl: app.downloadUrl, path: file?.path, expectedApkSha256: file?.sha256, expectedSignerSha256: app.expectedSignerSha256 };
    try {
      if (!file || !app.downloadUrl || !/^[a-f0-9]{64}$/i.test(file.sha256 || '') || !/^[a-f0-9]{64}$/i.test(app.expectedSignerSha256 || '')) throw new Error('Catalog entry lacks required integrity metadata.');
      if (!fs.existsSync(file.path) || sha256(file.path).toLowerCase() !== file.sha256.toLowerCase()) await download(app.downloadUrl, file.path);
      const actualApkSha256 = sha256(file.path).toLowerCase(); if (actualApkSha256 !== file.sha256.toLowerCase()) throw new Error('APK SHA-256 mismatch.');
      const actualSignerSha256 = signerSha256(file.path); if (actualSignerSha256 !== app.expectedSignerSha256.toLowerCase()) throw new Error('APK signing certificate mismatch.');
      receipt.verified.push({ ...item, actualApkSha256, actualSignerSha256 });
    } catch (error) { receipt.rejected.push({ ...item, error: error instanceof Error ? error.message : String(error) }); }
    fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
  }
  console.log(`Verified downloads: ${receipt.verified.length}; rejected: ${receipt.rejected.length}.`);
  if (receipt.verified.length < 100) process.exitCode = 2;
})();
