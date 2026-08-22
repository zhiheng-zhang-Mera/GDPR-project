#!/usr/bin/env node
/* Authorised, fail-closed install -> inspect -> stop -> uninstall experiment. */
const { createHash } = require('crypto');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const arg = (flag) => { const i = args.indexOf(flag); return i < 0 ? undefined : args[i + 1]; };
const catalogPath = arg('--catalog');
const serial = arg('--serial');
const execute = args.includes('--execute') && args.includes('--allow-device-installs');
const outputDir = arg('--output-dir') || path.join(root, 'commercial-app-batch', `store-corpus-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const oemInstaller = path.join(root, 'scripts', 'install-authorized-apk-with-oem-confirmation.js');
if (!catalogPath || !serial) throw new Error('Usage: node scripts/run-store-corpus-batch.js --catalog <100-app.json> --serial <adb-serial> [--execute --allow-device-installs] [--output-dir <dir>]');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const sha256 = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function validateCatalog(value) {
  if (value?.schema !== 'privacy-lens.android-store-corpus.v1' || !Array.isArray(value.apps) || value.apps.length !== 100) throw new Error('Corpus must declare exactly 100 apps with the v1 schema.');
  const benchmark = value.corpusKind === 'ACADEMIC_BENCHMARK';
  if (value.corpusKind !== undefined && value.corpusKind !== 'APP_STORE_COMMERCIAL' && !benchmark) throw new Error('Corpus kind must be APP_STORE_COMMERCIAL or ACADEMIC_BENCHMARK.');
  const ids = new Set(); const packages = new Set();
  for (const app of value.apps) {
    if (!app?.id || !app.displayName || !/^[A-Za-z0-9_.-]+$/.test(app.packageName || '') || !/^https:\/\//.test(app.storeUrl || '') || !Array.isArray(app.apkFiles) || !app.apkFiles.length) throw new Error(`Invalid corpus entry: ${app?.id ?? 'unknown'}`);
    if (ids.has(app.id) || (!benchmark && packages.has(app.packageName))) throw new Error(`Duplicate corpus identity: ${app.id}/${app.packageName}`);
    ids.add(app.id); packages.add(app.packageName);
    for (const file of app.apkFiles) {
      if (!fs.existsSync(file.path) || !/^[a-f0-9]{64}$/i.test(file.sha256) || sha256(file.path).toLowerCase() !== file.sha256.toLowerCase()) throw new Error(`Unverified APK input for ${app.packageName}`);
    }
  }
}
function adb(command, commandArgs = []) {
  try {
    return execFileSync('adb', ['-s', serial, ...command, ...commandArgs], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'], timeout: 60_000 }).trim();
  } catch (error) {
    if (error?.signal === 'SIGTERM' || error?.code === 'ETIMEDOUT') throw new Error(`ADB command timed out after 60 seconds: ${command.join(' ')}`);
    throw error;
  }
}
function isInstalled(packageName) {
  // `pm path` returns exit status 1 for an absent package on this Android
  // release, which must not be conflated with a transport failure. `list
  // packages` returns successfully for both cases and preserves fail-closed
  // behaviour for genuine ADB errors.
  return adb(['shell', 'pm', 'list', 'packages', '--user', '0', packageName])
    .split(/\r?\n/).some((line) => line.trim() === `package:${packageName}`);
}
function snapshot(packageName) {
  // A freshly installed APK often has no process until its launch activity is
  // started. Treat this as a valid zero-process snapshot, not an ADB failure.
  const pids = adb(['shell', 'sh', '-c', `pidof ${packageName} || true`]).split(/\s+/).filter(Boolean);
  const mem = pids.length ? adb(['shell', 'dumpsys', 'meminfo', pids[0]]) : '';
  const pssMatch = mem.match(/TOTAL\s+PSS:\s*([\d,]+)/i);
  const pss = pssMatch ? Number(pssMatch[1].replace(/,/g, '')) : undefined;
  const battery = adb(['shell', 'dumpsys', 'batterystats', packageName]);
  const mahMatch = battery.match(/Estimated power use[^\n]*?([\d.]+)\s*mAh/i);
  const mah = mahMatch ? Number(mahMatch[1]) : undefined;
  return { processCount: pids.length, memoryPssKb: pss, batteryStatsSha256: createHash('sha256').update(battery).digest('hex'), estimatedPowerMah: mah };
}
validateCatalog(catalog);
fs.mkdirSync(outputDir, { recursive: true });
const report = { schema: 'privacy-lens.android-store-corpus-run.v1', corpusId: catalog.corpusId, corpusKind: catalog.corpusKind ?? 'APP_STORE_COMMERCIAL', generatedAt: new Date().toISOString(), execution: execute ? 'AUTHORISED_DEVICE_RUN' : 'VALIDATION_ONLY', results: [], failures: [] };
for (const app of catalog.apps) {
  const item = { id: app.id, displayName: app.displayName, packageName: app.packageName, storeUrl: app.storeUrl, apkSha256: app.apkFiles.map((file) => file.sha256), installedByRunner: false, cleanup: 'NOT_STARTED' };
  try {
    if (!execute) { item.cleanup = 'NOT_EXECUTED'; report.results.push(item); continue; }
    if (isInstalled(app.packageName)) throw new Error('Refusing to replace or uninstall a pre-existing package.');
    const installerOutput = execFileSync(process.execPath, [oemInstaller, '--serial', serial, '--apk', ...app.apkFiles.map((file) => file.path)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 75_000 });
    item.installer = JSON.parse(installerOutput);
    item.installedByRunner = true;
    item.afterInstall = snapshot(app.packageName);
    const activity = adb(['shell', 'cmd', 'package', 'resolve-activity', '--brief', app.packageName]).split(/\r?\n/).at(-1);
    if (!activity || !activity.includes('/')) throw new Error('No launchable activity was resolved.');
    adb(['shell', 'am', 'start', '-n', activity]);
    item.afterLaunch = snapshot(app.packageName);
    const permissions = adb(['shell', 'dumpsys', 'package', app.packageName]);
    item.packageDumpSha256 = createHash('sha256').update(permissions).digest('hex');
    item.cleanup = 'PENDING';
    adb(['shell', 'am', 'force-stop', app.packageName]);
    adb(['uninstall', app.packageName]);
    if (isInstalled(app.packageName)) throw new Error('Uninstall verification failed.');
    item.cleanup = 'VERIFIED_REMOVED';
    report.results.push(item);
  } catch (error) {
    if (item.installedByRunner) {
      try { adb(['shell', 'am', 'force-stop', app.packageName]); adb(['uninstall', app.packageName]); item.cleanup = isInstalled(app.packageName) ? 'REMOVAL_FAILED' : 'REMOVED_AFTER_FAILURE'; } catch { item.cleanup = 'REMOVAL_FAILED'; }
    }
    report.failures.push({ ...item, error: error instanceof Error ? error.message : String(error) });
  }
  fs.writeFileSync(path.join(outputDir, 'results.partial.json'), `${JSON.stringify(report, null, 2)}\n`);
}
fs.writeFileSync(path.join(outputDir, 'results.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Corpus run finished: ${report.results.length} records, ${report.failures.length} failures, execute=${execute}.`);
if (report.failures.length) process.exitCode = 2;
