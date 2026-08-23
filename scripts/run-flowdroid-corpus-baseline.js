#!/usr/bin/env node
/* Runs the version-pinned FlowDroid receipt generator over every retained APK. */
const { createHash } = require('crypto');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const value = (flag) => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
const catalogPath = value('--catalog');
const outputDir = value('--output-dir');
const definitions = value('--sources-sinks');
const execute = args.includes('--execute') && args.includes('--allow-static-analysis');
if (!catalogPath || !outputDir) throw new Error('Usage: node scripts/run-flowdroid-corpus-baseline.js --catalog <100-to-500-app-catalog.json> --output-dir <directory> [--sources-sinks <file>] [--execute --allow-static-analysis]');
if (!fs.existsSync(catalogPath)) throw new Error(`Catalog is unavailable: ${catalogPath}`);
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const sha256 = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex').toLowerCase();
function validateCatalog(value) {
  if (value?.schema !== 'privacy-lens.android-store-corpus.v1' || !['APP_STORE_COMMERCIAL', 'OPEN_SOURCE_APP_STORE', 'ACADEMIC_BENCHMARK'].includes(value.corpusKind) || !Array.isArray(value.apps) || value.apps.length < 100 || value.apps.length > 500) throw new Error('FlowDroid corpus baseline requires a 100-to-500 entry authorised catalog.');
  const ids = new Set(); const packages = new Set();
  for (const app of value.apps) {
    if (!app?.id || !app.packageName || ids.has(app.id) || packages.has(app.packageName) || !Array.isArray(app.apkFiles) || app.apkFiles.length !== 1) throw new Error(`FlowDroid corpus baseline requires exactly one verified APK per item: ${app?.id || 'unknown'}`);
    ids.add(app.id); packages.add(app.packageName);
    for (const file of app.apkFiles) if (!fs.existsSync(file.path) || !/^[a-f0-9]{64}$/i.test(file.sha256 || '') || sha256(file.path) !== file.sha256.toLowerCase()) throw new Error(`Unverified APK input for ${app.packageName}.`);
  }
}
validateCatalog(catalog);
const runner = path.join(root, 'scripts', 'run-flowdroid-baseline.js');
const receipt = { schema: 'privacy-lens.flowdroid-corpus-baseline.v1', corpusId: catalog.corpusId, corpusKind: catalog.corpusKind, generatedAt: new Date().toISOString(), execution: execute ? 'AUTHORISED_STATIC_ANALYSIS' : 'VALIDATION_ONLY', inputCatalogSha256: sha256(catalogPath), sourceAndSinkDefinition: definitions || path.join(root, 'experiments', 'baselines', 'flowdroid', 'SourcesAndSinks.txt'), runs: [] };
fs.mkdirSync(outputDir, { recursive: true });
for (const app of catalog.apps) {
  const runDirectory = path.join(outputDir, app.id);
  const item = { id: app.id, packageName: app.packageName, apkSha256: app.apkFiles.map((file) => file.sha256), outputDirectory: runDirectory };
  if (!execute) { receipt.runs.push({ ...item, status: 'NOT_EXECUTED' }); continue; }
  try {
    const command = [runner, '--apk', app.apkFiles[0].path, '--output-dir', runDirectory];
    if (definitions) command.push('--sources-sinks', definitions);
    execFileSync(process.execPath, command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 270_000 });
  } catch { /* FlowDroid writes a fail-closed receipt before its non-zero exit. */ }
  const receiptPath = path.join(runDirectory, 'flowdroid-receipt.json');
  if (!fs.existsSync(receiptPath)) { receipt.runs.push({ ...item, status: 'FAILED_WITHOUT_RECEIPT' }); }
  else {
    const runReceipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
    receipt.runs.push({ ...item, status: runReceipt.status, elapsedMs: runReceipt.elapsedMs, resultCount: runReceipt.resultCount, flowdroidReceiptSha256: sha256(receiptPath), flowdroidResultSha256: runReceipt.resultSha256 });
  }
  fs.writeFileSync(path.join(outputDir, 'corpus-baseline.partial.json'), `${JSON.stringify(receipt, null, 2)}\n`);
}
const completed = receipt.runs.filter((run) => run.status === 'COMPLETED' || run.status === 'COMPLETED_NO_RESULT_ARTIFACT').length;
const failed = receipt.runs.filter((run) => run.status === 'FAILED_OR_TIMED_OUT' || run.status === 'FAILED_WITHOUT_RECEIPT').length;
receipt.summary = { planned: catalog.apps.length, completed, failed, notExecuted: receipt.runs.filter((run) => run.status === 'NOT_EXECUTED').length, caveat: 'FlowDroid potential flows remain static-analysis output. Failed, timed-out, or no-artifact runs are never converted into a negative prediction.' };
fs.writeFileSync(path.join(outputDir, 'corpus-baseline.json'), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`FlowDroid corpus baseline: execution=${receipt.execution}, planned=${receipt.summary.planned}, completed=${completed}, failed=${failed}.`);
if (execute && failed > 0) process.exitCode = 2;
