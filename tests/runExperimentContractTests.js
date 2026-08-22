#!/usr/bin/env node
const { createHash } = require('crypto');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'privacy-lens-corpus-'));
try {
  for (const file of ['scripts/run-store-corpus-batch.js', 'scripts/run-flowdroid-baseline.js']) {
    execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
  }
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
  console.log('Experiment contracts passed: 100-entry catalog validates without ADB installation, and labelled metrics preserve missing telemetry.');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
