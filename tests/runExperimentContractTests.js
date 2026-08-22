#!/usr/bin/env node
const { createHash } = require('crypto');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'privacy-lens-corpus-'));
try {
  for (const file of ['scripts/run-store-corpus-batch.js', 'scripts/run-flowdroid-baseline.js', 'scripts/install-authorized-apk-with-oem-confirmation.js', 'scripts/build-droidbench-100-catalog.js', 'scripts/build-fdroid-store-catalog.js', 'scripts/download-verified-store-corpus.js', 'scripts/filter-verified-store-corpus.js', 'scripts/scan-verified-store-corpus.js', 'scripts/summarize-authorized-device-batch.js']) {
    execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
  }
  const runnerSource = fs.readFileSync(path.join(root, 'scripts', 'run-store-corpus-batch.js'), 'utf8');
  if (!runnerSource.includes('item.installAttempted = true;') || !runnerSource.includes('if (item.installAttempted && !runnerPackagePresent && execute)')) throw new Error('Runner cleanup must be gated on a successful pre-install absence check and an actual install attempt.');
  const fixtureApk = path.join(temp, 'fixture.apk');
  fs.writeFileSync(fixtureApk, 'fixture-not-an-apk');
  const digest = createHash('sha256').update(fs.readFileSync(fixtureApk)).digest('hex');
  const catalog = {
    schema: 'privacy-lens.android-store-corpus.v1', corpusId: 'contract-fixture',
    apps: Array.from({ length: 100 }, (_, index) => ({
      id: `fixture-${index}`, displayName: `Fixture ${index}`, packageName: `org.fixture.app${index}`,
      storeUrl: `https://example.invalid/store/${index}`, apkFiles: [{ path: fixtureApk, sha256: digest }],
    })),
  };
  const catalogFile = path.join(temp, 'catalog.json'); const output = path.join(temp, 'output');
  fs.writeFileSync(catalogFile, JSON.stringify(catalog));
  execFileSync(process.execPath, [path.join(root, 'scripts/run-store-corpus-batch.js'), '--catalog', catalogFile, '--serial', 'not-used-in-validation', '--output-dir', output], { stdio: 'pipe' });
  const report = JSON.parse(fs.readFileSync(path.join(output, 'results.json'), 'utf8'));
  if (report.execution !== 'VALIDATION_ONLY' || report.results.length !== 100 || report.failures.length !== 0 || report.results.some((result) => result.cleanup !== 'NOT_EXECUTED')) throw new Error('Validation-only corpus contract failed.');
  const benchmarkCatalog = { ...catalog, corpusKind: 'ACADEMIC_BENCHMARK', apps: catalog.apps.map((app) => ({ ...app, packageName: 'org.fixture.shared' })) };
  const benchmarkFile = path.join(temp, 'benchmark-catalog.json'); const benchmarkOutput = path.join(temp, 'benchmark-output');
  fs.writeFileSync(benchmarkFile, JSON.stringify(benchmarkCatalog));
  execFileSync(process.execPath, [path.join(root, 'scripts/run-store-corpus-batch.js'), '--catalog', benchmarkFile, '--serial', 'not-used-in-validation', '--output-dir', benchmarkOutput], { stdio: 'pipe' });
  const benchmarkReport = JSON.parse(fs.readFileSync(path.join(benchmarkOutput, 'results.json'), 'utf8'));
  if (benchmarkReport.corpusKind !== 'ACADEMIC_BENCHMARK' || benchmarkReport.results.length !== 100) throw new Error('Academic benchmark corpus contract failed.');
  const openSourceCatalog = { ...catalog, corpusKind: 'OPEN_SOURCE_APP_STORE' };
  const openSourceFile = path.join(temp, 'open-source-catalog.json'); const openSourceOutput = path.join(temp, 'open-source-output');
  fs.writeFileSync(openSourceFile, JSON.stringify(openSourceCatalog));
  execFileSync(process.execPath, [path.join(root, 'scripts/run-store-corpus-batch.js'), '--catalog', openSourceFile, '--serial', 'not-used-in-validation', '--output-dir', openSourceOutput], { stdio: 'pipe' });
  const openSourceReport = JSON.parse(fs.readFileSync(path.join(openSourceOutput, 'results.json'), 'utf8'));
  if (openSourceReport.corpusKind !== 'OPEN_SOURCE_APP_STORE' || openSourceReport.results.length !== 100) throw new Error('Open-source app-store corpus contract failed.');
  const evaluation = {
    schema: 'privacy-lens.android-store-evaluation.v1', corpusId: 'contract-fixture',
    cases: Array.from({ length: 100 }, (_, index) => ({
      id: `case-${index}`, independentLabel: index < 50,
      predictions: { privacyLens: index < 50, flowdroid: index < 40 },
      measurements: { privacyLens: { elapsedMs: 2, memoryPssKb: 0 }, flowdroid: { elapsedMs: 3 } },
    })),
  };
  const evaluationInput = path.join(temp, 'evaluation.json'); const summaryFile = path.join(temp, 'summary.json');
  fs.writeFileSync(evaluationInput, JSON.stringify(evaluation));
  execFileSync(process.execPath, [path.join(root, 'scripts/summarize-store-corpus-evaluation.js'), '--input', evaluationInput, '--output', summaryFile], { stdio: 'pipe' });
  const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
  if (summary.tools.privacyLens.confusionMatrix.tp !== 50 || summary.tools.privacyLens.confusionMatrix.fp !== 0 || summary.tools.privacyLens.confusionMatrix.tn !== 50 || summary.tools.privacyLens.confusionMatrix.fn !== 0 || summary.tools.privacyLens.telemetry.estimatedPowerMah.observed !== 0) throw new Error('Evaluation summarisation contract failed.');
  const deviceInput = path.join(temp, 'device.json'); const deviceOutput = path.join(temp, 'device-summary.json');
  fs.writeFileSync(deviceInput, JSON.stringify({ schema: 'privacy-lens.android-store-corpus-run.v1', corpusId: 'device-fixture', corpusKind: 'ACADEMIC_BENCHMARK', results: [{ cleanup: 'VERIFIED_REMOVED', installer: { oemPrompts: { continueInstall: 1, installerCompleted: 1 } }, afterLaunch: { memoryPssKb: 0 } }], failures: [{ cleanup: 'NOT_STARTED', error: 'Failure [-99]' }] }));
  execFileSync(process.execPath, [path.join(root, 'scripts/summarize-authorized-device-batch.js'), '--input', deviceInput, '--output', deviceOutput], { stdio: 'pipe' });
  const deviceSummary = JSON.parse(fs.readFileSync(deviceOutput, 'utf8'));
  if (deviceSummary.completedAndVerifiedRemoved !== 1 || deviceSummary.failuresByCategory.PACKAGE_MANAGER_REJECTED !== 1 || deviceSummary.telemetry.afterLaunchMemoryPssKb.mean !== 0 || deviceSummary.telemetry.afterLaunchEstimatedPowerMah.observed !== 0) throw new Error('Device batch summarisation contract failed.');
  console.log('Experiment contracts passed: 100-entry catalog validates without ADB installation, and labelled metrics preserve missing telemetry.');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
