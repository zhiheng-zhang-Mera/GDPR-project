#!/usr/bin/env node
/* Aggregates non-overlapping authorised device receipts without inventing missing telemetry. */
const { createHash } = require('crypto');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const values = (flag) => args.flatMap((value, index) => value === flag && args[index + 1] ? [args[index + 1]] : []);
const inputs = values('--input');
const output = values('--output')[0];
if (inputs.length < 1 || !output) throw new Error('Usage: node scripts/aggregate-authorized-device-batches.js --input <results.json> [--input <results.json> ...] --output <aggregate.json>');

const sha256 = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const numberValues = (items, select) => items.map(select).filter((value) => Number.isFinite(value));
const mean = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined;
const records = []; const failures = []; const receipts = []; const packageIdentities = new Set();
for (const input of inputs) {
  const report = JSON.parse(fs.readFileSync(input, 'utf8'));
  if (report?.schema !== 'privacy-lens.android-store-corpus-run.v1' || !Array.isArray(report.results) || !Array.isArray(report.failures)) throw new Error(`Invalid device batch receipt: ${input}`);
  if (report.execution !== 'AUTHORISED_DEVICE_RUN') throw new Error(`Only authorised device execution receipts may be aggregated: ${input}`);
  const all = [...report.results, ...report.failures];
  for (const item of all) {
    const identity = item.packageName || item.id;
    if (!identity || packageIdentities.has(identity)) throw new Error(`Batch receipts overlap or lack a stable identity: ${identity || input}`);
    packageIdentities.add(identity);
  }
  records.push(...report.results); failures.push(...report.failures);
  receipts.push({ path: path.normalize(input), sha256: sha256(input), corpusId: report.corpusId, corpusKind: report.corpusKind, results: report.results.length, failures: report.failures.length });
}
const completed = records.filter((item) => item.cleanup === 'VERIFIED_REMOVED');
const memory = numberValues(completed, (item) => item.afterLaunch?.memoryPssKb);
const energy = numberValues(completed, (item) => item.afterLaunch?.estimatedPowerMah);
const elapsed = numberValues(completed, (item) => item.wallClockElapsedMs);
const failureCategories = {};
for (const failure of failures) {
  const category = /timed out/i.test(failure.error || '') ? 'TIMEOUT' : failure.preExistingPackage ? 'PREEXISTING_PACKAGE_PROTECTED' : failure.cleanup === 'REMOVAL_FAILED' ? 'REMOVAL_FAILURE' : 'OTHER';
  failureCategories[category] = (failureCategories[category] || 0) + 1;
}
const aggregate = {
  schema: 'privacy-lens.authorised-device-batch-aggregate.v1', generatedAt: new Date().toISOString(), receipts,
  corpusKind: [...new Set(receipts.map((item) => item.corpusKind))], uniquePackagesProcessed: packageIdentities.size,
  completedAndVerifiedRemoved: completed.length, failed: failures.length,
  cleanup: { verifiedRemoved: completed.length, removalFailures: failures.filter((item) => item.cleanup === 'REMOVAL_FAILED').length },
  failuresByCategory: failureCategories,
  telemetry: {
    afterLaunchMemoryPssKb: { mean: mean(memory), observed: memory.length, unavailable: completed.length - memory.length },
    afterLaunchEstimatedPowerMah: { mean: mean(energy), observed: energy.length, unavailable: completed.length - energy.length },
    wallClockElapsedMs: { mean: mean(elapsed), observed: elapsed.length, unavailable: completed.length - elapsed.length },
  },
  caveat: 'This aggregate counts authorised install-launch-uninstall engineering runs. It does not label GDPR compliance or legal infringement. Missing energy and memory remain unavailable, and receipts must be non-overlapping.',
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(aggregate, null, 2)}\n`);
console.log(`Aggregated ${completed.length} verified removals from ${inputs.length} non-overlapping receipts; failures=${failures.length}.`);
