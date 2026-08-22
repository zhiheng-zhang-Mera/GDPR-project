#!/usr/bin/env node
/* Manifest-level corpus census: potential-review signals, never legal findings. */
const { createHash } = require('crypto');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const get = (flag) => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
const catalogPath = get('--catalog'); const output = get('--output');
const aapt = get('--aapt') || 'C:\\Users\\15601\\AppData\\Local\\Android\\Sdk\\build-tools\\36.0.0\\aapt.exe';
if (!catalogPath || !output || !fs.existsSync(aapt)) throw new Error('Usage: node scripts/scan-verified-store-corpus.js --catalog <catalog.json> --output <report.json> [--aapt <path>]');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!Array.isArray(catalog.apps) || catalog.apps.length < 100 || catalog.apps.length > 500) throw new Error('Catalog must contain 100 to 500 APK entries.');
const sha256 = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sensitive = new Map([
  ['android.permission.ACCESS_FINE_LOCATION', 'LOCATION'], ['android.permission.ACCESS_COARSE_LOCATION', 'LOCATION'],
  ['android.permission.RECORD_AUDIO', 'MICROPHONE'], ['android.permission.CAMERA', 'CAMERA'],
  ['android.permission.READ_CONTACTS', 'CONTACTS'], ['android.permission.WRITE_CONTACTS', 'CONTACTS'],
  ['android.permission.READ_SMS', 'SMS'], ['android.permission.SEND_SMS', 'SMS'], ['android.permission.READ_PHONE_STATE', 'DEVICE_IDENTIFIER'],
  ['android.permission.BODY_SENSORS', 'BODY_SENSORS'], ['android.permission.ACTIVITY_RECOGNITION', 'ACTIVITY_RECOGNITION'],
]);
const backgroundPermissions = new Set(['android.permission.RECEIVE_BOOT_COMPLETED', 'android.permission.FOREGROUND_SERVICE', 'android.permission.WAKE_LOCK']);
const countBy = (items) => Object.fromEntries([...items.entries()].sort(([left], [right]) => left.localeCompare(right)));
const report = { schema: 'privacy-lens.verified-store-manifest-census.v1', corpusId: catalog.corpusId, corpusKind: catalog.corpusKind, generatedAt: new Date().toISOString(), method: { level: 'STATIC_MANIFEST_ONLY', aapt, findingMeaning: 'Potential review signal only; no runtime data flow, controller intent, legal basis, or GDPR infringement is inferred.' }, apps: [], failures: [] };
for (const app of catalog.apps) {
  try {
    const file = app.apkFiles?.[0];
    if (!file || !fs.existsSync(file.path) || sha256(file.path).toLowerCase() !== file.sha256.toLowerCase()) throw new Error('APK missing or catalog hash mismatch.');
    const permissionsOutput = execFileSync(aapt, ['dump', 'permissions', file.path], { encoding: 'utf8', timeout: 30_000 });
    const manifest = execFileSync(aapt, ['dump', 'xmltree', file.path, 'AndroidManifest.xml'], { encoding: 'utf8', timeout: 30_000 });
    const permissions = [...permissionsOutput.matchAll(/uses-permission: name='([^']+)'/g)].map((match) => match[1]).sort();
    const sensitiveCategories = [...new Set(permissions.map((permission) => sensitive.get(permission)).filter(Boolean))].sort();
    const hasNetwork = permissions.includes('android.permission.INTERNET');
    const backgroundSignals = permissions.filter((permission) => backgroundPermissions.has(permission));
    const multiprocessDeclared = /android:process\([^)]*\)=\"[^\"]+\"/i.test(manifest);
    const findings = [];
    if (sensitiveCategories.length && hasNetwork) findings.push('SENSITIVE_PERMISSION_WITH_NETWORK_REVIEW');
    if (sensitiveCategories.length && backgroundSignals.length) findings.push('SENSITIVE_PERMISSION_WITH_BACKGROUND_EXECUTION_REVIEW');
    if (multiprocessDeclared) findings.push('DECLARED_MULTIPROCESS_REVIEW');
    report.apps.push({ id: app.id, packageName: app.packageName, permissions, sensitiveCategories, hasNetwork, backgroundSignals, multiprocessDeclared, potentialReviewSignals: findings });
  } catch (error) { report.failures.push({ id: app.id, packageName: app.packageName, error: error instanceof Error ? error.message : String(error) }); }
}
const signalCounts = new Map(); const categoryCounts = new Map();
for (const app of report.apps) { for (const signal of app.potentialReviewSignals) signalCounts.set(signal, (signalCounts.get(signal) || 0) + 1); for (const category of app.sensitiveCategories) categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1); }
report.summary = { catalogEntries: catalog.apps.length, staticallyScanned: report.apps.length, staticFailures: report.failures.length, potentialReviewSignals: countBy(signalCounts), sensitivePermissionCategories: countBy(categoryCounts), metrics: { precision: 'NOT_COMPUTABLE_WITHOUT_INDEPENDENT_GROUND_TRUTH', recall: 'NOT_COMPUTABLE_WITHOUT_INDEPENDENT_GROUND_TRUTH', f1: 'NOT_COMPUTABLE_WITHOUT_INDEPENDENT_GROUND_TRUTH', tp: 'NOT_COMPUTABLE_WITHOUT_INDEPENDENT_GROUND_TRUTH', fp: 'NOT_COMPUTABLE_WITHOUT_INDEPENDENT_GROUND_TRUTH', tn: 'NOT_COMPUTABLE_WITHOUT_INDEPENDENT_GROUND_TRUTH', fn: 'NOT_COMPUTABLE_WITHOUT_INDEPENDENT_GROUND_TRUTH' } };
fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Static manifest census: ${report.apps.length}/${catalog.apps.length} scanned; ${report.failures.length} failures.`);
if (report.failures.length) process.exitCode = 2;
