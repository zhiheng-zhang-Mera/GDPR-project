#!/usr/bin/env node
/*
 * Reproducible, read-only APK experiment. It never launches, changes, or
 * uploads a target app. Results are capability and signature observations,
 * not legal conclusions. APK files are deliberately excluded from Git.
 */
const { createHash } = require('crypto');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const adb = process.env.ADB || 'adb';
const apkanalyzer = process.env.APKANALYZER || 'apkanalyzer.bat';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputDir = path.join(root, 'commercial-app-batch', timestamp);
const apkDir = path.join(outputDir, 'apks');
const defaults = ['com.sankuai.meituan', 'com.microsoft.emmx', 'cn.wps.moffice.lite'];
const requestedPackages = process.argv.slice(2).filter((value) => !value.startsWith('-'));
const packages = requestedPackages.length ? requestedPackages : defaults;

// Offline subset of Exodus Privacy's public code-signature method. The result
// is explicitly a subset: a match means embedded code, not effective tracking.
const exodusSignatureSubset = {
  'Firebase Analytics': ['com.google.firebase.analytics', 'com.google.android.gms.measurement'],
  'Facebook Analytics': ['com.facebook.appevents'],
  'Adjust': ['com.adjust.sdk'],
  'AppsFlyer': ['com.appsflyer'],
  'Amplitude': ['com.amplitude'],
  'Mixpanel': ['com.mixpanel'],
  'Umeng': ['com.umeng'],
  'Sensors Data': ['com.sensorsdata'],
};
const permissionPredicates = {
  'android.permission.ACCESS_FINE_LOCATION': 'MANIFEST_LOCATION',
  'android.permission.ACCESS_COARSE_LOCATION': 'MANIFEST_LOCATION',
  'android.permission.RECORD_AUDIO': 'MANIFEST_MICROPHONE',
  'android.permission.READ_CONTACTS': 'MANIFEST_CONTACTS',
  'android.permission.CAMERA': 'MANIFEST_CAMERA',
  'android.permission.BODY_SENSORS': 'MANIFEST_BODY_SENSORS',
};
const formalConstraints = [
  { id: 'LOCATION_ACCOUNTABILITY_CONTEXT', legalReferences: ['GDPR Art. 5(1)(a)', 'GDPR Art. 5(1)(c)', 'GDPR Art. 6', 'GDPR Arts. 13-14'], whenAll: ['MANIFEST_LOCATION'], requiresAll: ['PROCESSING_PURPOSE', 'LAWFUL_BASIS', 'TRANSPARENCY_NOTICE', 'MINIMISATION_ASSESSMENT', 'RETENTION_JUSTIFICATION'] },
  { id: 'TRACKER_TRANSPARENCY_CONTEXT', legalReferences: ['GDPR Art. 5(1)(a)-(b)', 'GDPR Art. 6', 'GDPR Arts. 13-14'], whenAll: ['TRACKER_SIGNATURE'], requiresAll: ['PROCESSING_PURPOSE', 'LAWFUL_BASIS', 'TRANSPARENCY_NOTICE', 'RETENTION_JUSTIFICATION'] },
];

function run(command, args) {
  const invocation = process.platform === 'win32' && /\.bat$/i.test(command)
    ? ['cmd.exe', ['/d', '/s', '/c', command, ...args]]
    : [command, args];
  return execFileSync(invocation[0], invocation[1], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function sha256(file) { return createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function makeSafeName(packageName) { return packageName.replace(/[^A-Za-z0-9._-]/g, '_'); }
function collectPackage(packageName) {
  const remotePaths = run(adb, ['shell', 'pm', 'path', packageName]).split(/\r?\n/).map((line) => line.replace(/^package:/, '')).filter(Boolean);
  const basePath = remotePaths.find((remote) => /(^|\/)base\.apk$/.test(remote)) || remotePaths[0];
  if (!basePath) throw new Error('Package path was not returned by ADB.');
  const localApk = path.join(apkDir, `${makeSafeName(packageName)}.apk`);
  run(adb, ['pull', basePath, localApk]);
  return localApk;
}
function analyzePackage(packageName) {
  const apk = collectPackage(packageName);
  const permissionsText = run(apkanalyzer, ['manifest', 'permissions', apk]);
  let dexPackages = '';
  let dexAnalysisStatus = 'COMPLETED';
  try {
    dexPackages = run(apkanalyzer, ['dex', 'packages', '--defined-only', apk]);
  } catch (error) {
    // A bounded collector is preferable to silently truncating a huge package
    // tree and claiming that no tracker signature was found.
    if (error && error.code === 'ENOBUFS') dexAnalysisStatus = 'NOT_COMPLETED_OUTPUT_OVER_LIMIT';
    else throw error;
  }
  const permissions = permissionsText.split(/\r?\n/).map((value) => value.trim()).filter(Boolean).sort();
  const evidence = new Set(permissions.map((permission) => permissionPredicates[permission]).filter(Boolean));
  const trackerMatches = dexAnalysisStatus === 'COMPLETED' ? Object.entries(exodusSignatureSubset)
    .filter(([, signatures]) => signatures.some((signature) => dexPackages.includes(signature)))
    .map(([tracker]) => tracker) : [];
  if (trackerMatches.length) evidence.add('TRACKER_SIGNATURE');
  const policyPrompts = formalConstraints
    .filter((constraint) => constraint.whenAll.every((predicate) => evidence.has(predicate)))
    .map((constraint) => ({
      constraintId: constraint.id,
      legalReferences: constraint.legalReferences,
      missingEvidence: constraint.requiresAll.filter((predicate) => !evidence.has(predicate)),
      outcome: 'REVIEW_REQUIRED_NOT_A_VIOLATION',
    }));
  return {
    packageName,
    apk: { sha256: sha256(apk), byteLength: fs.statSync(apk).size, retainedInGit: false },
    androidSdkApkAnalyzer: { permissions, dexPackageAnalysis: dexAnalysisStatus === 'COMPLETED' ? { status: dexAnalysisStatus, listingSha256: createHash('sha256').update(dexPackages).digest('hex') } : { status: dexAnalysisStatus, reason: 'The Android SDK package listing exceeded the bounded collector; no tracker absence is inferred.' } },
    exodusPrivacySignatureBaseline: { mode: dexAnalysisStatus === 'COMPLETED' ? 'OFFLINE_CURATED_SUBSET' : 'NOT_COMPLETED', matches: trackerMatches, caveat: dexAnalysisStatus === 'COMPLETED' ? 'A code-signature match indicates embedded code only; it does not prove tracker execution or data transfer.' : 'No tracker result was produced because the bounded Android SDK DEX listing did not complete.' },
    privacyLensFormalPolicy: { suppliedPredicates: [...evidence].sort(), prompts: policyPrompts, caveat: 'Static APK evidence cannot establish processing, legal applicability, GDPR compliance, or a legal violation.' },
  };
}

fs.mkdirSync(apkDir, { recursive: true });
const report = {
  schema: 'privacy-lens.commercial-app-batch.v1',
  generatedAt: new Date().toISOString(),
  methodology: {
    acquisition: 'ADB pull of the installed base APK only; no target app was launched, changed, uploaded, or redistributed.',
    baselines: ['Android SDK apkanalyzer manifest/dex static analysis', 'Exodus Privacy code-signature methodology using a documented offline curated subset'],
    formalModelSha256: createHash('sha256').update(JSON.stringify(formalConstraints)).digest('hex'),
  },
  results: [],
  failures: [],
};
for (const packageName of packages) {
  try { report.results.push(analyzePackage(packageName)); }
  catch (error) { report.failures.push({ packageName, error: error instanceof Error ? error.message : String(error) }); }
}
fs.writeFileSync(path.join(outputDir, 'results.json'), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(outputDir, 'README.md'), `# Commercial Android batch evidence\n\nGenerated: ${report.generatedAt}\n\nThis is a read-only, static APK experiment on installed commercial applications. APKs are retained locally under \`apks/\` and ignored by Git; \`results.json\` retains hashes and aggregate static evidence only. Android SDK \`apkanalyzer\` is the static-analysis baseline. The tracker baseline follows Exodus Privacy's documented class-signature method using a deliberately limited offline subset, so it is not an Exodus report or a complete tracker database. Privacy Lens converts matching static predicates into missing-evidence prompts only. No output is a GDPR decision, compliance claim, proof of execution, or data-transfer finding.\n`);
console.log(`Batch complete: ${report.results.length} analysed, ${report.failures.length} failed. Results: ${outputDir}`);
if (report.failures.length) process.exitCode = 2;
