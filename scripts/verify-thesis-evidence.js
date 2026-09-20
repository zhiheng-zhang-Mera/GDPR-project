const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const fail = (message) => {
  throw new Error(message);
};

const manifestPath = 'docs/research/thesis-evidence-manifest.json';
const generatedPath = 'Thesis/Final/generated-results.tex';
const manifest = readJson(manifestPath);
const releaseIdentity = readJson('docs/research/release-identity.json');
const app = readJson('app.json');
const pkg = readJson('package.json');
const gradle = readText('android/app/build.gradle');
const readMatch = (regex, label) => {
  const match = gradle.match(regex);
  if (!match) fail(`Cannot read ${label} from android/app/build.gradle.`);
  return match[1];
};

const identity = manifest.projectIdentity;
const expectedIdentity = {
  releaseVersion: app.expo.version,
  packageName: app.expo.android.package,
  androidVersionCode: Number(readMatch(/versionCode\s+(\d+)/, 'versionCode')),
  androidMinSdk: releaseIdentity.android.minSdk,
  androidTargetSdk: releaseIdentity.android.targetSdk,
};

for (const [key, value] of Object.entries(expectedIdentity)) {
  if (identity[key] !== value) fail(`Project identity drift for ${key}: manifest=${identity[key]} source=${value}.`);
}
if (pkg.version !== identity.releaseVersion || releaseIdentity.releaseVersion !== identity.releaseVersion) {
  fail('Release version drift across package.json, app.json, release identity, and evidence manifest.');
}
if (releaseIdentity.sourceBaseline.gitCommitSha !== identity.sourceBaselineSha) {
  fail('Frozen source baseline SHA differs between release identity and evidence manifest.');
}

for (const source of manifest.evidenceSources) {
  const absolute = path.join(root, source.path);
  if (!fs.existsSync(absolute)) fail(`Missing evidence source: ${source.path}`);
  const actual = crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
  if (actual !== source.sha256) fail(`Evidence source hash drift: ${source.path}`);
}
if (!fs.existsSync(path.join(root, manifest.formalEvidence.stressReceipt))) {
  fail(`Missing stress receipt: ${manifest.formalEvidence.stressReceipt}`);
}

const census = readJson('testing-report/fdroid-open-store-2026-08-22/dex-manifest-census-verified-final-495.json');
const device = readJson('testing-report/fdroid-open-store-2026-08-22/device-batch-aggregate-final.json');
const flowdroid = readJson('testing-report/academic-baseline-2026-08-22/flowdroid-wps-rerun/flowdroid-receipt.json');
const redacted = readJson('experiments/thesis-results/device-metrics-redacted.json');
const count = (predicate) => census.apps.filter(predicate).length;

/**
 * The chapter-5 percentiles are computed from the per-sample redacted metrics,
 * which the pinned aggregate does not carry. This independent recomputation
 * means the published median and quartiles are checked against the pinned
 * samples on every run rather than trusted as prose.
 */
const quantile = (sorted, q) => {
  const index = (sorted.length - 1) * q;
  const low = Math.floor(index);
  const high = Math.ceil(index);
  return sorted[low] + (sorted[high] - sorted[low]) * (index - low);
};
const finiteSorted = (values) => values.filter(Number.isFinite).sort((a, b) => a - b);
const pssValues = finiteSorted(redacted.samples.map((sample) => sample.memoryPssKb));
const timingValues = finiteSorted(redacted.samples.filter((sample) => sample.terminalStatus === 'COMPLETED').map((sample) => sample.wallClockElapsedMs));
const publishedStats = readJson('output/thesis-results/device-summary.json');
const expectClose = (label, expected, actual) => {
  if (expected === null || actual === null) {
    if (expected !== actual) fail(`${label}: summary=${expected} recomputed=${actual}`);
    return;
  }
  if (Math.abs(expected - actual) > 1e-6) fail(`${label}: summary=${expected} recomputed from pinned samples=${actual}`);
};
expectClose('PSS median', publishedStats.memoryPssKb.median, quantile(pssValues, 0.5));
expectClose('PSS q1', publishedStats.memoryPssKb.q1, quantile(pssValues, 0.25));
expectClose('PSS q3', publishedStats.memoryPssKb.q3, quantile(pssValues, 0.75));
expectClose('PSS observedN', publishedStats.memoryPssKb.observedN, pssValues.length);
expectClose('timing median', publishedStats.wallClockElapsedMs.median, quantile(timingValues, 0.5));
expectClose('timing q1', publishedStats.wallClockElapsedMs.q1, quantile(timingValues, 0.25));
expectClose('timing q3', publishedStats.wallClockElapsedMs.q3, quantile(timingValues, 0.75));
expectClose('timing observedN', publishedStats.wallClockElapsedMs.observedN, timingValues.length);
if (redacted.samples.length !== device.uniquePackagesProcessed) {
  fail(`The redacted sample set has ${redacted.samples.length} entries but the pinned aggregate reports ${device.uniquePackagesProcessed} packages.`);
}
if (redacted.samples.filter((sample) => sample.terminalStatus === 'COMPLETED').length !== device.completedAndVerifiedRemoved) {
  fail('The redacted sample set and the pinned aggregate disagree on completed workflow count.');
}
const redactedPssMean = pssValues.reduce((sum, value) => sum + value, 0) / pssValues.length;
expectClose('PSS mean versus pinned aggregate', device.telemetry.afterLaunchMemoryPssKb.mean, redactedPssMean);

const observed = {
  fdroidStaticCorpusN: census.apps.length,
  fdroidSensitivePermissionN: count((item) => item.sensitiveCategories.length > 0),
  fdroidSensitiveAndNetworkN: count((item) => item.sensitiveCategories.length > 0 && item.hasNetwork),
  fdroidSensitiveAndBackgroundN: count((item) => item.sensitiveCategories.length > 0 && item.backgroundSignals.length > 0),
  fdroidMultiProcessN: count((item) => item.multiprocessDeclared),
  deviceDistinctPackagesN: device.uniquePackagesProcessed,
  completedEndToEndWorkflowsN: device.completedAndVerifiedRemoved,
  failedDeviceWorkflowsN: device.failed,
  validPssTelemetryN: device.telemetry.afterLaunchMemoryPssKb.observed,
  validTimingTelemetryN: device.telemetry.wallClockElapsedMs.observed,
  flowdroidReceiptsN: 1,
  flowdroidXmlArtifactsN: flowdroid.status === 'COMPLETED_WITH_RESULT_ARTIFACT' ? 1 : 0,
};
for (const [key, value] of Object.entries(observed)) {
  if (manifest.empiricalEvidence[key] !== value) fail(`Receipt-derived metric drift for ${key}: manifest=${manifest.empiricalEvidence[key]} receipt=${value}.`);
}

if (manifest.independentReview.status !== 'COMPLETE') {
  for (const key of ['reviewedItemsN', 'reviewersN', 'rawAgreement', 'cohensKappa', 'unresolvedCriticalDisagreements']) {
    if (manifest.independentReview[key] !== null) fail(`Future independent-review result must remain null while status is ${manifest.independentReview.status}: ${key}.`);
  }
}
if (manifest.formalEvidence.mutationCases.length === 0 && manifest.formalEvidence.mutationScore !== null) {
  fail('Mutation score must remain null until mutation cases are recorded.');
}

const metrics = manifest.empiricalEvidence;
const stress = manifest.stressCampaign;
const deviceMacroSource = readJson('output/thesis-results/device-summary.json');
const texNumber = (value) => (value === null ? 'NOT\\_AVAILABLE' : String(value));
const totalRuleMatches = Object.values(stress.ruleMatches).reduce((sum, value) => sum + value, 0);
if (stress.boundedSnapshotEntries !== 10001) fail(`The stress campaign bounded snapshot must remain 10001 entries, observed ${stress.boundedSnapshotEntries}.`);
if (typeof stress.assertions !== 'number' || stress.assertions <= 0) fail('The stress campaign must record a positive assertion total.');
const generated = [
  '% Generated by scripts/verify-thesis-evidence.js --write. Do not edit manually.',
  `\\newcommand{\\PrivacyLensVersion}{${identity.releaseVersion}}`,
  `\\newcommand{\\FDroidCensusN}{${metrics.fdroidStaticCorpusN}}`,
  `\\newcommand{\\FDroidSensitiveN}{${metrics.fdroidSensitivePermissionN}}`,
  `\\newcommand{\\FDroidSensitiveNetworkN}{${metrics.fdroidSensitiveAndNetworkN}}`,
  `\\newcommand{\\FDroidSensitiveBackgroundN}{${metrics.fdroidSensitiveAndBackgroundN}}`,
  `\\newcommand{\\FDroidMultiProcessN}{${metrics.fdroidMultiProcessN}}`,
  `\\newcommand{\\DevicePackagesN}{${metrics.deviceDistinctPackagesN}}`,
  `\\newcommand{\\CompletedWorkflowsN}{${metrics.completedEndToEndWorkflowsN}}`,
  `\\newcommand{\\FailedDeviceWorkflowsN}{${metrics.failedDeviceWorkflowsN}}`,
  `\\newcommand{\\PssObservedN}{${metrics.validPssTelemetryN}}`,
  `\\newcommand{\\TimingObservedN}{${metrics.validTimingTelemetryN}}`,
  `\\newcommand{\\DevicePssMedianKb}{${texNumber(deviceMacroSource.memoryPssKb.median)}}`,
  `\\newcommand{\\DevicePssQOneKb}{${texNumber(deviceMacroSource.memoryPssKb.q1)}}`,
  `\\newcommand{\\DevicePssQThreeKb}{${texNumber(deviceMacroSource.memoryPssKb.q3)}}`,
  `\\newcommand{\\DeviceTimingMedianMs}{${texNumber(deviceMacroSource.wallClockElapsedMs.median)}}`,
  `\\newcommand{\\DeviceTimingQOneMs}{${texNumber(deviceMacroSource.wallClockElapsedMs.q1)}}`,
  `\\newcommand{\\DeviceTimingQThreeMs}{${texNumber(deviceMacroSource.wallClockElapsedMs.q3)}}`,
  `\\newcommand{\\FlowDroidReceiptsN}{${metrics.flowdroidReceiptsN}}`,
  `\\newcommand{\\FlowDroidXmlArtifactsN}{${metrics.flowdroidXmlArtifactsN}}`,
  `\\newcommand{\\StressCorpusN}{${stress.corpusRounds.toLocaleString('en-US')}}`,
  `\\newcommand{\\StressRestartN}{${stress.restartCases.toLocaleString('en-US')}}`,
  `\\newcommand{\\StressMalformedN}{${stress.malformedCases.toLocaleString('en-US')}}`,
  `\\newcommand{\\StressAssertionsN}{${stress.assertions.toLocaleString('en-US')}}`,
  `\\newcommand{\\StressRuleMatchesN}{${totalRuleMatches.toLocaleString('en-US')}}`,
  '',
].join('\n');

if (process.argv.includes('--write')) {
  fs.writeFileSync(path.join(root, generatedPath), generated, 'utf8');
} else if (readText(generatedPath).replace(/\r\n/g, '\n') !== generated) {
  fail(`${generatedPath} is stale; regenerate it with node scripts/verify-thesis-evidence.js --write.`);
}

console.log(`Thesis evidence verified: ${Object.keys(observed).length} receipt-derived metrics, ${manifest.evidenceSources.length} pinned sources, release ${identity.releaseVersion}.`);
