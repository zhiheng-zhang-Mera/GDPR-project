#!/usr/bin/env node
/* Summarises installation/telemetry evidence without recoding missing values. */
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const value = (flag) => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
const input = value('--input'); const output = value('--output');
if (!input || !output) throw new Error('Usage: node scripts/summarize-authorized-device-batch.js --input <results.json> --output <summary.json>');
const report = JSON.parse(fs.readFileSync(input, 'utf8'));
if (report?.schema !== 'privacy-lens.android-store-corpus-run.v1' || !Array.isArray(report.results) || !Array.isArray(report.failures)) throw new Error('Input is not a supported device-batch report.');
const numeric = (records, selector) => records.map(selector).filter((value) => Number.isFinite(value));
const mean = (values) => values.length ? values.reduce((total, value) => total + value, 0) / values.length : undefined;
const failureCategory = (message) => {
  if (/Failure \[-?\d+\]/.test(message)) return 'PACKAGE_MANAGER_REJECTED';
  if (/timed out/i.test(message)) return 'TIMEOUT';
  if (/pre-existing package/i.test(message)) return 'PREEXISTING_PACKAGE_PROTECTED';
  if (/No launchable activity/i.test(message)) return 'NO_LAUNCHABLE_ACTIVITY';
  if (/Uninstall verification failed|REMOVAL_FAILED/i.test(message)) return 'REMOVAL_FAILURE';
  return 'OTHER';
};
const failuresByCategory = {};
for (const failure of report.failures) {
  const category = failureCategory(failure.error ?? '');
  failuresByCategory[category] = (failuresByCategory[category] ?? 0) + 1;
}
const completed = report.results.filter((record) => record.cleanup === 'VERIFIED_REMOVED');
const all = [...report.results, ...report.failures];
const preExistingProtected = report.failures.filter((record) => record.preExistingPackage === true);
// Legacy reports omit installAttempted; preserve their historical denominator.
const installAttempts = all.filter((record) => record.installAttempted !== false);
const installerPrompts = all.reduce((total, record) => ({
  continueInstall: total.continueInstall + (record.installer?.oemPrompts?.continueInstall ?? 0),
  optionalProtectionCancelled: total.optionalProtectionCancelled + (record.installer?.oemPrompts?.optionalProtectionCancelled ?? 0),
  installerCompleted: total.installerCompleted + (record.installer?.oemPrompts?.installerCompleted ?? 0),
}), { continueInstall: 0, optionalProtectionCancelled: 0, installerCompleted: 0 });
const runtimePermissionPrompts = all.reduce((total, record) => {
  const state = record.runtimePermissionPrompt;
  if (state === 'OBSERVED_NOT_GRANTED') total.observedNotGranted += 1;
  else if (state === 'NOT_OBSERVED') total.notObserved += 1;
  else total.unavailable += 1;
  return total;
}, { observedNotGranted: 0, notObserved: 0, unavailable: 0 });
const memory = numeric(completed, (record) => record.afterLaunch?.memoryPssKb);
const energy = numeric(completed, (record) => record.afterLaunch?.estimatedPowerMah);
const elapsed = numeric(completed, (record) => record.wallClockElapsedMs);
const summary = {
  schema: 'privacy-lens.authorised-device-batch-summary.v1', corpusId: report.corpusId, corpusKind: report.corpusKind, generatedAt: new Date().toISOString(),
  catalogEntriesProcessed: all.length, installAttempts: installAttempts.length, preExistingProtected: preExistingProtected.length,
  completedAndVerifiedRemoved: completed.length, failed: report.failures.length,
  cleanup: { verifiedRemoved: completed.length, removalFailures: report.failures.filter((record) => record.cleanup === 'REMOVAL_FAILED').length },
  installerPrompts, runtimePermissionPrompts, failuresByCategory,
  executionOverhead: { wallClockElapsedMs: { mean: mean(elapsed), observed: elapsed.length, unavailable: completed.length - elapsed.length }, batteryStatsResetRequested: completed.filter((record) => record.batteryStatsReset === 'REQUESTED').length },
  telemetry: {
    afterLaunchMemoryPssKb: { mean: mean(memory), observed: memory.length, unavailable: completed.length - memory.length },
    afterLaunchEstimatedPowerMah: { mean: mean(energy), observed: energy.length, unavailable: completed.length - energy.length },
  },
  caveat: 'This summary reports authorised device execution and engineering overhead only. It does not label GDPR compliance, data collection, or legal violations. Missing memory/energy values remain unavailable.',
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(summary, null, 2)}\n`);
console.log(`Device batch summary: installAttempts=${summary.installAttempts}, completed=${summary.completedAndVerifiedRemoved}, failed=${summary.failed}.`);
