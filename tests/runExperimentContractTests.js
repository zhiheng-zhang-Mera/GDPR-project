#!/usr/bin/env node
const { createHash } = require('crypto');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'privacy-lens-corpus-'));
try {
  for (const file of ['scripts/run-store-corpus-batch.js', 'scripts/dismiss-authorized-notification-prompts.js', 'scripts/run-flowdroid-baseline.js', 'scripts/convert-flowdroid-results-to-information-flow.js', 'scripts/summarize-droidbench-flowdroid.js', 'scripts/install-authorized-apk-with-oem-confirmation.js', 'scripts/build-droidbench-100-catalog.js', 'scripts/build-fdroid-store-catalog.js', 'scripts/build-androzoo-play-catalog.js', 'scripts/download-authorized-androzoo-corpus.js', 'scripts/download-verified-store-corpus.js', 'scripts/filter-verified-store-corpus.js', 'scripts/exclude-attempted-store-corpus.js', 'scripts/select-store-corpus-subset.js', 'scripts/scan-verified-store-corpus.js', 'scripts/summarize-authorized-device-batch.js', 'scripts/aggregate-authorized-device-batches.js']) {
    execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
  }
  const runnerSource = fs.readFileSync(path.join(root, 'scripts', 'run-store-corpus-batch.js'), 'utf8');
  if (!runnerSource.includes('item.installAttempted = true;') || !runnerSource.includes('if (item.installAttempted && !runnerPackagePresent && execute)')) throw new Error('Runner cleanup must be gated on a successful pre-install absence check and an actual install attempt.');
  if (!runnerSource.includes("report.stopReason = 'MAX_SUCCESSES_REACHED';")) throw new Error('Runner must report an explicit bounded-success stop, never silently omit unattempted apps.');
  if (!runnerSource.includes("['shell', 'dumpsys', 'meminfo', packageName]") || runnerSource.includes("['shell', 'dumpsys', 'batterystats'")) throw new Error('Runner must preserve package-scoped memory fallback and omit batterystats collection.');
  if (!runnerSource.includes("Number(arg('--install-timeout-ms') || 120_000)") || !runnerSource.includes("installTimeoutMs > 120_000")) throw new Error('Runner must allow a bounded 120-second installer timeout for slow authorised OEM installation.');
  if (!runnerSource.includes("node['resource-id'] === 'android:id/button2'") || !runnerSource.includes("runtimePermissionPromptDismissed") || runnerSource.includes("android:id/button1")) throw new Error('Runtime-permission handling must target only the exact deny control and record its disposition.');
  const watcherSource = fs.readFileSync(path.join(root, 'scripts', 'dismiss-authorized-notification-prompts.js'), 'utf8');
  if (!watcherSource.includes("node['resource-id'] === 'android:id/button2'") || !watcherSource.includes('authorisedNames.has(quotedName)') || watcherSource.includes("android:id/button1")) throw new Error('Prompt watcher must target only authorised denial controls.');
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
  const androzooMetadata = path.join(temp, 'androzoo.csv'); const androzooAccess = path.join(temp, 'androzoo-access.json'); const androzooCatalogFile = path.join(temp, 'androzoo-catalog.json');
  const androzooHeader = 'sha256,sha1,md5,apk_size,dex_size,dex_date,pkg_name,vercode,vt_detection,vt_scan_date,markets';
  const androzooRows = Array.from({ length: 103 }, (_, index) => `${index.toString(16).padStart(64, '0')},sha1,md5,1048576,1,2025-01-01,org.fixture.play${index},${index + 1},0,2025-01-02,play.google.com`).join('\n');
  fs.writeFileSync(androzooMetadata, `${androzooHeader}\n${androzooRows}\nmalformed`);
  fs.writeFileSync(androzooAccess, JSON.stringify({ schema: 'privacy-lens.authorized-commercial-corpus-access.v1', provider: 'AndroZoo', authorizedForResearch: true, noRedistributionAcknowledged: true, commercialCorpusApproved: true, approvedBy: 'fixture approver', approvalReference: 'fixture approval' }));
  execFileSync(process.execPath, [path.join(root, 'scripts/build-androzoo-play-catalog.js'), '--metadata', androzooMetadata, '--access-record', androzooAccess, '--output', androzooCatalogFile, '--apk-dir', path.join(temp, 'androzoo-apks'), '--count', '100', '--seed', 'fixture'], { stdio: 'pipe' });
  const androzooCatalog = JSON.parse(fs.readFileSync(androzooCatalogFile, 'utf8'));
  if (androzooCatalog.corpusKind !== 'APP_STORE_COMMERCIAL' || androzooCatalog.apps.length !== 100 || new Set(androzooCatalog.apps.map((app) => app.packageName)).size !== 100 || androzooCatalog.source.commercialStatus !== 'OPERATOR_ATTESTED_WITH_EVIDENCE' || androzooCatalog.apps.some((app) => app.provenance.vtDetection !== 0 || !app.provenance.markets.includes('play.google.com'))) throw new Error('AndroZoo authorised commercial-corpus catalog contract failed.');
  const androzooReceipt = path.join(temp, 'androzoo-validation.json');
  execFileSync(process.execPath, [path.join(root, 'scripts/download-authorized-androzoo-corpus.js'), '--catalog', androzooCatalogFile, '--output', androzooReceipt, '--validation-only'], { stdio: 'pipe' });
  const androzooValidation = JSON.parse(fs.readFileSync(androzooReceipt, 'utf8'));
  if (androzooValidation.execution !== 'VALIDATION_ONLY' || androzooValidation.planned.length !== 100 || androzooValidation.verified.length !== 0 || androzooValidation.rejected.length !== 0) throw new Error('AndroZoo downloader validation-only contract failed.');
  const extendedOpenSourceFile = path.join(temp, 'extended-open-source-catalog.json');
  const extraApps = [100, 101].map((index) => ({ ...openSourceCatalog.apps[index - 100], id: `fixture-${index}`, displayName: `Fixture ${index}`, packageName: `org.fixture.app${index}`, storeUrl: `https://example.invalid/store/${index}` }));
  fs.writeFileSync(extendedOpenSourceFile, JSON.stringify({ ...openSourceCatalog, apps: [...openSourceCatalog.apps, ...extraApps] }));
  const priorFile = path.join(temp, 'prior.json'); const followUpFile = path.join(temp, 'follow-up.json');
  fs.writeFileSync(priorFile, JSON.stringify({ ...openSourceReport, results: openSourceReport.results.slice(0, 1), failures: [{ ...openSourceReport.results[1], error: 'fixture failure' }] }));
  execFileSync(process.execPath, [path.join(root, 'scripts/exclude-attempted-store-corpus.js'), '--catalog', extendedOpenSourceFile, '--prior', priorFile, '--output', followUpFile], { stdio: 'pipe' });
  const followUp = JSON.parse(fs.readFileSync(followUpFile, 'utf8'));
  if (followUp.apps.length !== 100 || followUp.apps.some((app) => app.packageName === 'org.fixture.app0' || app.packageName === 'org.fixture.app1') || followUp.source.priorRunExclusions.attemptedPackages !== 2) throw new Error('Follow-up corpus exclusion contract failed.');
  const catalogExclusionFile = path.join(temp, 'catalog-exclusion.json'); const catalogFollowUpFile = path.join(temp, 'catalog-follow-up.json');
  fs.writeFileSync(catalogExclusionFile, JSON.stringify({ ...openSourceCatalog, apps: openSourceCatalog.apps.slice(0, 1) }));
  execFileSync(process.execPath, [path.join(root, 'scripts/exclude-attempted-store-corpus.js'), '--catalog', extendedOpenSourceFile, '--exclude-catalog', catalogExclusionFile, '--output', catalogFollowUpFile], { stdio: 'pipe' });
  const catalogFollowUp = JSON.parse(fs.readFileSync(catalogFollowUpFile, 'utf8'));
  if (catalogFollowUp.apps.length !== 101 || catalogFollowUp.apps.some((app) => app.packageName === 'org.fixture.app0') || catalogFollowUp.source.priorRunExclusions.excludedCatalogs.length !== 1) throw new Error('Reserved-catalog exclusion contract failed.');
  const subsetFile = path.join(temp, 'subset.json'); const isolatedApks = path.join(temp, 'isolated-apks');
  execFileSync(process.execPath, [path.join(root, 'scripts/select-store-corpus-subset.js'), '--input', catalogFollowUpFile, '--count', '100', '--apk-dir', isolatedApks, '--output', subsetFile], { stdio: 'pipe' });
  const subset = JSON.parse(fs.readFileSync(subsetFile, 'utf8'));
  if (subset.apps.length !== 100 || subset.apps.some((app) => app.packageName === 'org.fixture.app0') || !subset.apps.every((app) => path.dirname(app.apkFiles[0].path) === isolatedApks) || new Set(subset.apps.map((app) => app.id)).size !== 100) throw new Error('Isolated subset contract failed.');
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
  const dismissalInput = path.join(temp, 'dismissals.json');
  fs.writeFileSync(deviceInput, JSON.stringify({ schema: 'privacy-lens.android-store-corpus-run.v1', corpusId: 'device-fixture', corpusKind: 'ACADEMIC_BENCHMARK', execution: 'AUTHORISED_DEVICE_RUN', results: [{ id: 'device-1', packageName: 'org.fixture.device1', cleanup: 'VERIFIED_REMOVED', wallClockElapsedMs: 5, runtimePermissionPrompt: 'OBSERVED_NOT_GRANTED', runtimePermissionPromptDismissed: true, installer: { oemPrompts: { continueInstall: 1, installerCompleted: 1 } }, afterLaunch: { memoryPssKb: 0 } }], failures: [{ id: 'device-2', packageName: 'org.fixture.device2', cleanup: 'NOT_STARTED', error: 'Failure [-99]' }] }));
  fs.writeFileSync(dismissalInput, JSON.stringify({ schema: 'privacy-lens.authorised-notification-prompt-dismissals.v1', catalogId: 'device-fixture', dismissals: [{ app: 'Fixture', action: 'DENY_NOTIFICATION_PERMISSION' }] }));
  execFileSync(process.execPath, [path.join(root, 'scripts/summarize-authorized-device-batch.js'), '--input', deviceInput, '--output', deviceOutput, '--notification-dismissals', dismissalInput], { stdio: 'pipe' });
  const deviceSummary = JSON.parse(fs.readFileSync(deviceOutput, 'utf8'));
  if (deviceSummary.completedAndVerifiedRemoved !== 1 || deviceSummary.runtimePermissionPrompts.observedNotGranted !== 1 || deviceSummary.runtimePermissionPrompts.unavailable !== 1 || deviceSummary.runtimePermissionPrompts.dismissed !== 1 || deviceSummary.notificationPromptDismissals.reported !== true || deviceSummary.notificationPromptDismissals.count !== 1 || deviceSummary.failuresByCategory.PACKAGE_MANAGER_REJECTED !== 1 || deviceSummary.executionOverhead.wallClockElapsedMs.mean !== 5 || deviceSummary.telemetry.afterLaunchMemoryPssKb.mean !== 0 || Object.prototype.hasOwnProperty.call(deviceSummary.telemetry, 'afterLaunchEstimatedPowerMah')) throw new Error('Device batch summarisation contract failed.');
  const aggregateOutput = path.join(temp, 'aggregate.json');
  execFileSync(process.execPath, [path.join(root, 'scripts/aggregate-authorized-device-batches.js'), '--input', deviceInput, '--notification-dismissals', dismissalInput, '--output', aggregateOutput], { stdio: 'pipe' });
  const aggregate = JSON.parse(fs.readFileSync(aggregateOutput, 'utf8'));
  if (aggregate.completedAndVerifiedRemoved !== 1 || aggregate.failed !== 1 || aggregate.uniquePackagesProcessed !== 2 || aggregate.runtimePermissionPrompts.observedNotGranted !== 1 || aggregate.runtimePermissionPrompts.unavailable !== 1 || aggregate.runtimePermissionPrompts.dismissed !== 1 || aggregate.notificationPromptDismissals.reportedReceipts !== 1 || aggregate.notificationPromptDismissals.count !== 1 || aggregate.telemetry.afterLaunchMemoryPssKb.mean !== 0 || Object.prototype.hasOwnProperty.call(aggregate.telemetry, 'afterLaunchEstimatedPowerMah')) throw new Error('Device batch aggregation contract failed.');
  const droidbenchReceipts = path.join(temp, 'droidbench-receipts');
  const writeReceipt = (id, status, resultCount) => {
    const directory = path.join(droidbenchReceipts, id); fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'receipt.json'), JSON.stringify({ schema: 'privacy-lens.flowdroid-baseline.v1', status, resultCount }));
  };
  writeReceipt('positive', 'COMPLETED', 1); writeReceipt('negative', 'COMPLETED', 0); writeReceipt('false-positive', 'COMPLETED', 1); writeReceipt('unresolved', 'COMPLETED_NO_RESULT_ARTIFACT');
  const droidbenchManifest = { schema: 'privacy-lens.droidbench-ground-truth.v1', suite: { name: 'fixture', revision: 'fixture' }, cases: [
    { id: 'positive', expectedLeak: true, receiptPath: path.relative(root, path.join(droidbenchReceipts, 'positive', 'receipt.json')) },
    { id: 'negative', expectedLeak: false, receiptPath: path.relative(root, path.join(droidbenchReceipts, 'negative', 'receipt.json')) },
    { id: 'false-positive', expectedLeak: false, receiptPath: path.relative(root, path.join(droidbenchReceipts, 'false-positive', 'receipt.json')) },
    { id: 'unresolved', expectedLeak: true, receiptPath: path.relative(root, path.join(droidbenchReceipts, 'unresolved', 'receipt.json')) },
  ] };
  const droidbenchInput = path.join(temp, 'droidbench.json'); const droidbenchOutput = path.join(temp, 'droidbench-summary.json');
  fs.writeFileSync(droidbenchInput, JSON.stringify(droidbenchManifest));
  execFileSync(process.execPath, [path.join(root, 'scripts/summarize-droidbench-flowdroid.js'), '--input', droidbenchInput, '--output', droidbenchOutput], { stdio: 'pipe' });
  const droidbenchSummary = JSON.parse(fs.readFileSync(droidbenchOutput, 'utf8'));
  if (droidbenchSummary.evaluation.evaluatedCases !== 3 || droidbenchSummary.evaluation.unresolvedCases !== 1 || droidbenchSummary.evaluation.confusionMatrix.tp !== 1 || droidbenchSummary.evaluation.confusionMatrix.fp !== 1 || droidbenchSummary.evaluation.confusionMatrix.tn !== 1 || droidbenchSummary.evaluation.confusionMatrix.fn !== 0 || droidbenchSummary.evaluation.precision !== 0.5) throw new Error('DroidBench baseline scoring contract failed.');
  const flowXml = path.join(temp, 'flowdroid.xml'); const typedFlow = path.join(temp, 'typed-flow.json');
  fs.writeFileSync(flowXml, '<?xml version="1.0"?><DataFlowResults><Results><Result><Sink MethodSourceSinkDefinition="&lt;android.telephony.SmsManager: void sendTextMessage()&gt;"/><Sources><Source MethodSourceSinkDefinition="&lt;android.telephony.TelephonyManager: java.lang.String getDeviceId()&gt;"/></Sources></Result><Result><Sink MethodSourceSinkDefinition="&lt;android.util.Log: int i()&gt;"/><Sources><Source MethodSourceSinkDefinition="&lt;android.telephony.TelephonyManager: java.lang.String getLine1Number()&gt;"/></Sources></Result></Results></DataFlowResults>');
  execFileSync(process.execPath, [path.join(root, 'scripts/convert-flowdroid-results-to-information-flow.js'), '--input', flowXml, '--output', typedFlow], { stdio: 'pipe' });
  const typed = JSON.parse(fs.readFileSync(typedFlow, 'utf8'));
  if (typed.nodes.length !== 4 || typed.edges.length !== 2 || typed.nodes[1].sink !== 'SMS' || typed.nodes[3].sink !== 'LOG' || typed.unmappedResults.length !== 0) throw new Error('FlowDroid typed-flow conversion contract failed.');
  console.log('Experiment contracts passed: 100-entry catalog validates without ADB installation, and labelled metrics preserve missing telemetry.');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
