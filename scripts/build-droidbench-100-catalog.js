#!/usr/bin/env node
/* Builds an executable, non-commercial 100-APK DroidBench device corpus. */
const { createHash } = require('crypto');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const get = (flag) => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
const suite = get('--suite') || path.join(root, '.codex-tools', 'DroidBench');
const output = get('--output');
if (!output || !fs.existsSync(suite)) throw new Error('Usage: node scripts/build-droidbench-100-catalog.js --output <catalog.json> [--suite <DroidBench root>]');
const apkRoot = path.join(suite, 'apk');
const files = fs.readdirSync(apkRoot, { recursive: true }).filter((entry) => entry.endsWith('.apk')).map((entry) => path.join(apkRoot, entry)).sort();
if (files.length < 100) throw new Error('DroidBench suite does not contain 100 APK files.');
const sha256 = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const apkanalyzer = process.env.APKANALYZER || 'apkanalyzer.bat';
const aapt = process.env.AAPT || 'C:\\Users\\15601\\AppData\\Local\\Android\\Sdk\\build-tools\\36.0.0\\aapt.exe';
const packageName = (file) => {
  if (fs.existsSync(aapt)) {
    const badging = execFileSync(aapt, ['dump', 'badging', file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10_000 });
    const match = badging.match(/^package: name='([^']+)'/m);
    if (match) return match[1];
  }
  const command = process.platform === 'win32' && /\.bat$/i.test(apkanalyzer) ? 'cmd.exe' : apkanalyzer;
  const commandArgs = process.platform === 'win32' && /\.bat$/i.test(apkanalyzer)
    ? ['/d', '/s', '/c', apkanalyzer, 'manifest', 'application-id', file]
    : ['manifest', 'application-id', file];
  return execFileSync(command, commandArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10_000 }).trim();
};
const skipped = [];
const apps = [];
for (const file of files) {
  try {
    const resolvedPackage = packageName(file);
    if (!/^[A-Za-z0-9_.-]+$/.test(resolvedPackage)) throw new Error(`Invalid application id: ${resolvedPackage}`);
    apps.push({ id: `droidbench-${String(apps.length + 1).padStart(3, '0')}`, displayName: path.relative(apkRoot, file).replace(/\\/g, '/'), packageName: resolvedPackage, storeUrl: 'https://github.com/secure-software-engineering/DroidBench', apkFiles: [{ path: file, sha256: sha256(file) }] });
    if (apps.length === 100) break;
  } catch (error) {
    skipped.push({ file: path.relative(apkRoot, file).replace(/\\/g, '/'), reason: error instanceof Error ? error.message : String(error) });
  }
}
if (apps.length !== 100) throw new Error(`Only ${apps.length} DroidBench APKs supplied a valid package id; 100 are required.`);
const catalog = { schema: 'privacy-lens.android-store-corpus.v1', corpusId: 'droidbench-100-device-2026-08-22', corpusKind: 'ACADEMIC_BENCHMARK', source: { repository: 'https://github.com/secure-software-engineering/DroidBench', revision: execFileSync('git', ['-C', suite, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), skippedPackageResolution: skipped }, apps };
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Wrote 100-entry DroidBench catalog: ${output}`);
