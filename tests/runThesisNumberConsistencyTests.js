#!/usr/bin/env node
/**
 * Thesis numeric-consistency check.
 *
 * The final thesis states concrete figures about the prototype and the recorded
 * evaluation. Those figures are produced by the engine, the pack definitions, and
 * the committed receipts, so they can be checked mechanically instead of by
 * reading. This script resolves the generated LaTeX macros to their current
 * values, then asserts that the prose and tables still agree with:
 *
 *   - the EU GDPR and Research Baseline pack definitions;
 *   - the committed device, PSS, and missingness summaries;
 *   - the pinned evidence manifest;
 *   - the generated-results macro file itself.
 *
 * It fails on drift in either direction: a stale number in the thesis, or an
 * artifact that no longer supports the published number.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = (relative) => JSON.parse(read(relative));
const fail = (message) => {
  throw new Error(message);
};

const FINAL_CHAPTERS = ['chapter-01', 'chapter-02', 'chapter-03', 'chapter-04', 'chapter-05', 'chapter-06', 'chapter-07', 'main'];
const thesis = Object.fromEntries(FINAL_CHAPTERS.map((name) => [name, read(`Thesis/Final/${name}.tex`)]));
const thesisAll = Object.values(thesis).join('\n');

// ---- Resolve generated macros to their current values ----------------------

const generatedSource = read('Thesis/Final/generated-results.tex');
const macros = Object.fromEntries(
  [...generatedSource.matchAll(/\\newcommand\{\\([A-Za-z]+)\}\{([^}]*)\}/g)].map(([, name, value]) => [name, value]),
);
const expand = (text) => text.replace(/\\([A-Za-z]+)\{\}/g, (whole, name) => (name in macros ? macros[name] : whole));
const expandedThesis = expand(thesisAll);

const packSource = read('src/regulations/packs/euGdpr.ts');
const baselineSource = read('src/regulations/packs/researchBaseline.ts');
const baselineAll = expand(baselineSource);
const device = readJson('output/thesis-results/device-summary.json');
const missingness = readJson('output/thesis-results/missingness-summary.json');
const manifest = readJson('docs/research/thesis-evidence-manifest.json');
const formalModel = read('Thesis/Final/formal-evidence-model.tex');
const generated = read('Thesis/Final/generated-results.tex');

const failures = [];
function check(condition, message) {
  if (!condition) failures.push(message);
}
const numeric = (value) => Number(String(value).replace(/,/g, ''));

// ---- 1. Macros agree with the pinned evidence manifest ---------------------

const empirical = manifest.empiricalEvidence;
check(numeric(macros.FDroidCensusN) === empirical.fdroidStaticCorpusN, `FDroidCensusN=${macros.FDroidCensusN} but manifest=${empirical.fdroidStaticCorpusN}`);
check(numeric(macros.FDroidSensitiveN) === empirical.fdroidSensitivePermissionN, `FDroidSensitiveN=${macros.FDroidSensitiveN} but manifest=${empirical.fdroidSensitivePermissionN}`);
check(numeric(macros.FDroidSensitiveNetworkN) === empirical.fdroidSensitiveAndNetworkN, `FDroidSensitiveNetworkN=${macros.FDroidSensitiveNetworkN} but manifest=${empirical.fdroidSensitiveAndNetworkN}`);
check(numeric(macros.FDroidSensitiveBackgroundN) === empirical.fdroidSensitiveAndBackgroundN, `FDroidSensitiveBackgroundN=${macros.FDroidSensitiveBackgroundN} but manifest=${empirical.fdroidSensitiveAndBackgroundN}`);
check(numeric(macros.FDroidMultiProcessN) === empirical.fdroidMultiProcessN, `FDroidMultiProcessN=${macros.FDroidMultiProcessN} but manifest=${empirical.fdroidMultiProcessN}`);
check(numeric(macros.DevicePackagesN) === empirical.deviceDistinctPackagesN, `DevicePackagesN=${macros.DevicePackagesN} but manifest=${empirical.deviceDistinctPackagesN}`);
check(numeric(macros.CompletedWorkflowsN) === empirical.completedEndToEndWorkflowsN, `CompletedWorkflowsN=${macros.CompletedWorkflowsN} but manifest=${empirical.completedEndToEndWorkflowsN}`);
check(numeric(macros.FailedDeviceWorkflowsN) === empirical.failedDeviceWorkflowsN, `FailedDeviceWorkflowsN=${macros.FailedDeviceWorkflowsN} but manifest=${empirical.failedDeviceWorkflowsN}`);
check(numeric(macros.PssObservedN) === empirical.validPssTelemetryN, `PssObservedN=${macros.PssObservedN} but manifest=${empirical.validPssTelemetryN}`);
check(numeric(macros.FlowDroidXmlArtifactsN) === empirical.flowdroidXmlArtifactsN, `FlowDroidXmlArtifactsN=${macros.FlowDroidXmlArtifactsN} but manifest=${empirical.flowdroidXmlArtifactsN}`);

// ---- 2. Stress-campaign macros agree with the pinned campaign --------------

const stress = manifest.stressCampaign;
check(numeric(macros.StressCorpusN) === stress.corpusRounds, `StressCorpusN=${macros.StressCorpusN} but manifest=${stress.corpusRounds}`);
check(numeric(macros.StressRestartN) === stress.restartCases, `StressRestartN=${macros.StressRestartN} but manifest=${stress.restartCases}`);
check(numeric(macros.StressMalformedN) === stress.malformedCases, `StressMalformedN=${macros.StressMalformedN} but manifest=${stress.malformedCases}`);
check(numeric(macros.StressAssertionsN) === stress.assertions, `StressAssertionsN=${macros.StressAssertionsN} but manifest=${stress.assertions}`);
const stressRuleTotal = Object.values(stress.ruleMatches).reduce((sum, value) => sum + value, 0);
check(numeric(macros.StressRuleMatchesN) === stressRuleTotal, `StressRuleMatchesN=${macros.StressRuleMatchesN} but manifest total=${stressRuleTotal}`);
check(stress.assertions >= stress.corpusRounds + stress.restartCases + stress.malformedCases, 'The campaign assertion total must be at least one per case across every campaign.');

// ---- 3. Device narrative agrees with the committed summaries --------------

const terminal = device.terminalStatuses;
check(device.eligibleN === empirical.deviceDistinctPackagesN, `device summary eligibleN=${device.eligibleN} but manifest=${empirical.deviceDistinctPackagesN}`);
check(device.completedN === empirical.completedEndToEndWorkflowsN, `device summary completedN=${device.completedN} but manifest=${empirical.completedEndToEndWorkflowsN}`);
check(device.memoryPssKb.observedN === empirical.validPssTelemetryN, `device summary PSS observedN=${device.memoryPssKb.observedN} but manifest=${empirical.validPssTelemetryN}`);
const failedTotal = device.eligibleN - device.completedN;
check(failedTotal === empirical.failedDeviceWorkflowsN, `device summary implies ${failedTotal} failures but manifest=${empirical.failedDeviceWorkflowsN}`);
check(terminal.INSTALL_TIMEOUT === 26, `chapter 5 states 26 installer timeouts but the receipt records ${terminal.INSTALL_TIMEOUT}`);
check(terminal.NO_LAUNCHABLE_ACTIVITY === 2, `chapter 5 states two no-launchable-activity cases but the receipt records ${terminal.NO_LAUNCHABLE_ACTIVITY}`);
check(terminal.PACKAGE_MANAGER_REJECTION === 1, `chapter 5 states one package-manager rejection but the receipt records ${terminal.PACKAGE_MANAGER_REJECTION}`);
check(terminal.PRE_EXISTING_PROTECTION === 1, `chapter 5 states one pre-existing-package protection but the receipt records ${terminal.PRE_EXISTING_PROTECTION}`);

const memoryMissing = missingness.metrics.find(({ metric }) => metric === 'memoryPssKb');
const timingMissing = missingness.metrics.find(({ metric }) => metric === 'wallClockElapsedMs');
check(memoryMissing.missingN === device.completedN - device.memoryPssKb.observedN, 'the memory missingness count must equal completed workflows minus observed PSS');
check(timingMissing.missingN === device.completedN - device.wallClockElapsedMs.observedN, 'the timing missingness count must equal completed workflows minus observed timing');

// ---- 4. Pack facts stated in chapter 4 agree with the pack sources --------

const euRules = {
  LOCATION: { baseline: 24, threshold: 36 },
  MICROPHONE: { baseline: 8, threshold: 12 },
  CONTACTS: { baseline: 4, threshold: 6 },
};
for (const [permission, expected] of Object.entries(euRules)) {
  check(
    new RegExp(`${permission}:\\s*\\{[^}]*baseline:\\s*${expected.baseline}\\b`, 's').test(packSource),
    `chapter 4 states an EU ${permission} baseline of ${expected.baseline} but the pack does not declare it`,
  );
}
const researchRules = { LOCATION: 36, MICROPHONE: 12, CONTACTS: 6 };
for (const [permission, baseline] of Object.entries(researchRules)) {
  check(
    new RegExp(`${permission}:\\s*\\{[^}]*baseline:\\s*${baseline}\\b`, 's').test(baselineAll),
    `chapter 4 states a Research Baseline ${permission} baseline of ${baseline} but the pack does not declare it`,
  );
}
check(/deviationMultiplier:\s*1\.5/.test(packSource), 'chapter 4 states an EU multiplier of 1.5 but the pack does not declare it');
check(/BURST_LIMIT[^=]*=\s*\{\s*LOCATION:\s*12,\s*MICROPHONE:\s*6,\s*CONTACTS:\s*4\s*\}/.test(read('src/compliance/RulePackComplianceEngine.ts')), 'chapter 4 states burst limits of 12/6/4 but the engine does not declare them');
check(/MAX_RETAINED_WINDOW_SUMMARIES = 4_096/.test(read('src/compliance/temporalLedgerLimits.ts')), 'chapter 6 states a history limit of 4,096 entries but the implementation does not declare it');
check(/MAX_RESTORED_TEMPORAL_ENTRIES = 10_000/.test(read('src/compliance/temporalLedgerLimits.ts')), 'chapter 5 states a 10,000-entry ledger bound but the implementation does not declare it');
check(/MAX_CONTROLLED_FIXTURE_EVENTS = 100/.test(read('android/app/src/main/java/com/zhihengzhang/privacylens/privacy/ObservationMapper.kt')), 'the controlled fixture event bound must remain declared in ObservationMapper');

// ---- 5. Figures and tables cited in the prose actually exist --------------

const labels = new Set([...thesisAll.matchAll(/\\label\{([^}]+)\}/g)].map(([, label]) => label));
const references = [...thesisAll.matchAll(/\\ref\{([^}]+)\}/g)].map(([, label]) => label);
for (const reference of references) {
  check(labels.has(reference), `\\ref{${reference}} has no matching \\label`);
}
check(thesis['chapter-05'].includes('(TP,TN,FP,FN)=(800,200,0,0)'), 'chapter 5 must state the seeded confusion matrix that the compliance suite produces');
check(thesis['chapter-05'].includes('1.0000'), 'chapter 5 must state the precision and recall observed by the compliance suite');
check(thesis['chapter-01'].includes('1,000 seeded cases'), 'chapter 1 must state the seeded corpus size the suite produces');

// ---- 6. Formal property count agrees with the catalogue -------------------

const catalog = readJson('docs/research/safety-property-catalog.json');
const propertyCount = catalog.properties.length;
check(thesis['chapter-05'].includes('Nine registered safety properties'), `chapter 5 must state the ${propertyCount} registered safety properties`);
check(thesis['chapter-01'].includes('nine curated mutants'), 'chapter 1 must state the curated mutant count consistently');
check(catalog.mutationRun.total === propertyCount, 'every registered property must have exactly one registered mutant');
check(catalog.mutationRun.killed === propertyCount && catalog.mutationRun.survived === 0, 'the curated mutation run must record every mutant as detected');
const catalogPropertyIds = new Set(catalog.properties.map(({ id }) => id));
check(catalogPropertyIds.size === propertyCount, 'property identifiers must be unique');
check(Object.keys(stress.ruleMatches).length > 0, 'the stress campaign must record at least one matched rule');

// ---- 7. Abstract and conclusion do not cite superseded figures ------------

const abstractBlock = thesis['main'].slice(thesis['main'].indexOf('\\begin{abstract}'), thesis['main'].indexOf('\\end{abstract}'));
for (const superseded of ['150,010', '150010']) {
  check(!expandedThesis.includes(superseded), `the superseded external stress figure ${superseded} must not appear in the final thesis`);
}
check(abstractBlock.includes('\\FDroidCensusN'), 'the abstract must cite the generated F-Droid census macro rather than a literal');
check(abstractBlock.includes('\\DevicePackagesN'), 'the abstract must cite the generated device macro rather than a literal');
check(abstractBlock.includes('\\CompletedWorkflowsN'), 'the abstract must cite the generated completed-workflow macro rather than a literal');

// No chapter may hard-code a value that a macro already owns. Macro
// invocations are removed first, so a value that appears only through its macro
// is not treated as a literal. A trailing `-word` or an immediately following
// unit word is excluded because such occurrences are durations or measurements
// rather than the count the macro owns.
const GENERATED_VALUE_MACROS = ['FDroidCensusN', 'FDroidSensitiveN', 'DevicePackagesN', 'CompletedWorkflowsN', 'FailedDeviceWorkflowsN', 'PssObservedN'];
for (const name of GENERATED_VALUE_MACROS) {
  const rawValue = macros[name];
  const literal = new RegExp(`(?<![\\d,.])${rawValue}(?![\\d,.])(?!\\s*-?\\s*(?:minute|second|hour|ms|KB|MB|day|per))`, 'i');
  for (const [chapter, text] of Object.entries(thesis)) {
    for (const [index, line] of text.split('\n').entries()) {
      const strippedOfMacros = line.replace(new RegExp(`\\\\${name}\\{\\}`, 'g'), ' ');
      if (literal.test(strippedOfMacros)) {
        failures.push(`${chapter}.tex:${index + 1} hard-codes ${rawValue} where \\${name}{} is the generated source of truth: ${line.trim().slice(0, 120)}`);
      }
    }
  }
}

// ---- 8. generated-results.tex is the single macro authority ---------------

check(generated.includes('Do not edit manually'), 'generated-results.tex must warn that it is generated');
check(read('release/submission-final/tex/generated-results.tex') === generated, 'the submission chapter-split source must carry the same generated macros as Thesis/Final');

if (failures.length) {
  console.error('Thesis numeric consistency failed:');
  console.error(failures.map((message) => ` - ${message}`).join('\n'));
  process.exit(1);
}

console.log(
  `Thesis numeric consistency verified: ${Object.keys(macros).length} generated macros, ` +
  `${propertyCount} formal properties, ${references.length} cross-references, ` +
  `device N=${device.eligibleN}, completed=${device.completedN}, PSS=${device.memoryPssKb.observedN}.`,
);
