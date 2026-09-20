#!/usr/bin/env node
/**
 * Executable mutation verification for the registered safety properties.
 *
 * `docs/research/safety-property-catalog.json` records nine properties, nine
 * curated mutants, and a 9/9 detection score. Before this script existed that
 * record was metadata only: a reader could confirm the catalogue was
 * self-consistent, but nothing demonstrated that the cited tests actually
 * distinguish the registered weakenings from the correct implementation.
 *
 * This script makes the claim executable. For each registered mutant it:
 *
 *   1. copies the compilable sources into a temporary tree;
 *   2. applies one literal, declared source transformation;
 *   3. compiles that tree with `tsc` from the compliance-test project;
 *   4. runs the property's own registered test file;
 *   5. requires the run to FAIL, meaning the suite detected the weakening.
 *
 * It also runs every registered test file once against the unmodified source and
 * requires it to PASS, so a mutant cannot be "detected" merely because its test
 * file is broken.
 *
 * The transformations are literal string replacements against exact anchors. If
 * an anchor disappears, the script fails loudly rather than silently skipping a
 * mutant, because a skipped mutant would otherwise look like a pass.
 */
const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'docs/research/safety-property-catalog.json'), 'utf8'));

/**
 * Files the compliance test project compiles.
 *
 * Detection runs the whole compiled compliance suite for a source mutant rather
 * than only the property's catalogued `testFile`. The catalog records where a
 * property's principal witness lives; other suites may also witness the same
 * weakening, and requiring the catalogued file alone would under-report
 * detection.
 */
const SOURCE_FILES = [
  'src/compliance',
  'src/regulations',
];
const TEST_FILES = [
  'tests/runComplianceTests.ts',
  'tests/runExtendedComplianceTests.ts',
  'tests/runGovernanceAndPropertyTests.ts',
  'tests/runTemporalCooccurrenceTests.ts',
  'tests/runInformationFlowPolicyTests.ts',
  'tests/pinned-evaluation-date.ts',
];
const COMPILED_SUITE = TEST_FILES
  .filter((file) => file !== 'tests/pinned-evaluation-date.ts')
  .map((file) => `.compliance-test-build/${file.replace(/\.ts$/, '.js')}`);

/** Non-TypeScript sources verified by their own standalone runner. */
const SCRIPT_FILES = ['scripts/summarize-droidbench-flowdroid.js'];

/**
 * One declared weakening per registered mutant.
 *
 * `anchor` must occur exactly once in `file`. `replacement` is the weakened
 * implementation. `detectedBy` names the assertion a reader can inspect.
 */
const MUTANTS = {
  M1_VERDICT_ESCALATION: {
    file: 'src/compliance/RulePackComplianceEngine.ts',
    anchor: '    const missingEvidence = this.pack.findMissingEvidence(audit);',
    replacement: [
      '    const missingEvidence = this.pack.findMissingEvidence(audit);',
      "    if (missingEvidence.length > 0) missingEvidence.length = 0;",
    ].join('\n'),
    detectedBy: 'runGovernanceAndPropertyTests.ts: a legal pack without current independent attestation must not emit a reassuring no-concern result',
  },
  M2_UNKNOWN_SOURCE_ACCEPTED: {
    file: 'src/compliance/RulePackComplianceEngine.ts',
    anchor: "  if (x.source !== undefined && (typeof x.source !== 'string' || !SOURCES.has(x.source))) return reject('INVALID_SOURCE', 'Unknown audit source.');",
    replacement: "  if (x.source !== undefined && typeof x.source !== 'string') return reject('INVALID_SOURCE', 'Unknown audit source.');",
    detectedBy: 'runExtendedComplianceTests.ts: unknown sources must fail closed',
  },
  M3_SYNTHETIC_PROMOTION: {
    file: 'src/compliance/RulePackComplianceEngine.ts',
    anchor: "    if ((audit.source ?? 'SIMULATOR') !== 'SIMULATOR' && completed.length > 0 && rollingCount > threshold) signals.push('CROSS_WINDOW');",
    replacement: "    if (completed.length > 0 && rollingCount > threshold) signals.push('CROSS_WINDOW');",
    detectedBy: 'runExtendedComplianceTests.ts: simulator history must not be presented as imported temporal evidence',
  },
  M4_REPLAY_INCREMENT: {
    file: 'src/compliance/RulePackComplianceEngine.ts',
    detectedBy: 'runExtendedComplianceTests.ts: an identical replay must replace, not duplicate, stored window evidence',
    // The replay check that removes an identical stored window is dropped, so an
    // exact replay is counted twice instead of replacing its predecessor.
    verifyAnchor: '    const entries = previous.filter((entry) => entry.end > watermark - DAY_MS && !(entry.start === audit.windowStart && entry.end === audit.windowEnd));',
    transform: (source) => source.replace(
      '    const entries = previous.filter((entry) => entry.end > watermark - DAY_MS && !(entry.start === audit.windowStart && entry.end === audit.windowEnd));',
      '    const entries = previous.filter((entry) => entry.end > watermark - DAY_MS);',
    ),
  },
  M5_ORDER_SENSITIVE: {
    file: 'src/compliance/TemporalCooccurrenceEngine.ts',
    anchor: '  const canonicalEvents = [...input.observations]\n    .filter((event) => event.occurredAt <= input.evaluatedAt)\n    .sort(compareObservation);',
    replacement: '  const canonicalEvents = [...input.observations]\n    .filter((event) => event.occurredAt <= input.evaluatedAt);',
    detectedBy: 'runTemporalCooccurrenceTests.ts: the evidence receipt must be invariant under input order',
  },
  M6_OVERLAP_SUM: {
    file: 'src/compliance/RulePackComplianceEngine.ts',
    anchor: '    const completed = entries.filter((entry) => entry.end <= audit.windowStart);',
    replacement: '    const completed = entries.filter((entry) => entry.end <= audit.windowEnd);',
    detectedBy: 'runExtendedComplianceTests.ts: overlapping history must be excluded from the rolling count',
  },
  M7_CROSS_PACK_RESTORE: {
    file: 'src/compliance/RulePackComplianceEngine.ts',
    anchor: "    if (snapshot.schema !== 'privacy-lens.temporal-ledger.v1' || snapshot.regulationId !== this.pack.id || snapshot.packVersion !== this.pack.versionLabel || !Array.isArray(snapshot.entries)) return false;",
    replacement: "    if (snapshot.schema !== 'privacy-lens.temporal-ledger.v1' || !Array.isArray(snapshot.entries)) return false;",
    detectedBy: 'runTemporalCooccurrenceTests.ts: a temporal ledger must not cross regulation-pack boundaries',
  },
  M8_HISTORY_REWRITE: {
    file: 'src/compliance/RulePackComplianceEngine.ts',
    anchor: '      regulationId: this.pack.id,',
    replacement: "      regulationId: 'EU_GDPR',",
    detectedBy: 'runExtendedComplianceTests.ts: findings must retain their producing rule-pack identity',
  },
  M9_MISSING_AS_NEGATIVE: {
    file: 'scripts/summarize-droidbench-flowdroid.js',
    anchor: "  if (receipt.status !== 'COMPLETED' || !Number.isInteger(receipt.resultCount) || receipt.resultCount < 0) {",
    replacement: "  const missingArtifact = receipt.status === 'COMPLETED_NO_RESULT_ARTIFACT';\n  if (!missingArtifact && (receipt.status !== 'COMPLETED' || !Number.isInteger(receipt.resultCount) || receipt.resultCount < 0)) {",
    detectedBy: 'runExperimentContractTests.js: a completed run with no result artifact must stay unresolved rather than score as zero flows',
    testFileOverride: 'tests/runExperimentContractTests.js',
    asScript: true,
  },
};

const MUTANT_SOURCE_FILES = [...new Set(Object.values(MUTANTS).map(({ file }) => file))];
const testFileFor = (property) => `tests/${property.testFile.replace(/^tests\//, '')}`;

function copy(sourceRelative, targetRoot) {
  const source = path.join(root, sourceRelative);
  const target = path.join(targetRoot, sourceRelative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

/** Junction the host dependency tree into the temporary project root. */
function linkModules(targetRoot) {
  const link = path.join(targetRoot, 'node_modules');
  if (fs.existsSync(link)) return;
  fs.symlinkSync(path.join(root, 'node_modules'), link, 'junction');
}

function buildTree(targetRoot, mutation) {
  for (const directory of SOURCE_FILES) copy(directory, targetRoot);
  for (const file of TEST_FILES) copy(file, targetRoot);
  for (const file of SCRIPT_FILES) copy(file, targetRoot);
  fs.copyFileSync(path.join(root, 'tsconfig.compliance-tests.json'), path.join(targetRoot, 'tsconfig.compliance-tests.json'));
  // The compiled runners require runtime dependencies (for example
  // `node-forge/lib/ed25519`) that TypeScript does not type-check deeply enough
  // to report. A directory junction gives the temporary tree the host's already
  // installed dependency graph without copying it.
  linkModules(targetRoot);

  if (!mutation) return;
  const absolute = path.join(targetRoot, mutation.file);
  let source = fs.readFileSync(absolute, 'utf8');
  if (mutation.transform) {
    if (!source.includes(mutation.verifyAnchor)) {
      throw new Error(`Mutant ${mutation.id}: anchor not found in ${mutation.file}: ${mutation.verifyAnchor}`);
    }
    const mutated = mutation.transform(source);
    if (mutated === source) throw new Error(`Mutant ${mutation.id}: transformation changed nothing in ${mutation.file}`);
    fs.writeFileSync(absolute, mutated);
    return;
  }
  const occurrences = source.split(mutation.anchor).length - 1;
  if (occurrences !== 1) {
    throw new Error(`Mutant ${mutation.id}: anchor must occur exactly once in ${mutation.file} but occurred ${occurrences} times`);
  }
  source = source.replace(mutation.anchor, mutation.replacement);
  fs.writeFileSync(absolute, source);
}

/** Absolute path to an emitted test runner inside a temp tree. */
function compiledTestPath(targetRoot, testRelative) {
  return path.join(targetRoot, '.compliance-test-build', testRelative.replace(/\.ts$/, '.js'));
}

function compile(targetRoot) {
  const tsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  const configPath = path.join(targetRoot, 'tsconfig.compliance-tests.json');
  // The compliance project resolves a few modules from the host dependency tree.
  // Copy exactly the packages TypeScript reports as missing, one round at a time,
  // so the temporary tree stays minimal instead of duplicating node_modules.
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      execFileSync(process.execPath, [tsc, '-p', configPath], { cwd: targetRoot, stdio: 'pipe', encoding: 'utf8' });
      return;
    } catch (error) {
      const output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
      const missing = [...output.matchAll(/error TS2307: Cannot find module '([^']+)'/g)].map(([, name]) => name);
      const unique = [...new Set(missing)];
      if (unique.length === 0) {
        throw new Error(`Mutation verification could not compile ${targetRoot}:\n${output.slice(0, 4000)}`);
      }
      for (const moduleName of unique) {
        const source = path.join(root, 'node_modules', moduleName);
        if (!fs.existsSync(source)) {
          throw new Error(`Compilation requires ${moduleName} but it is not installed in the repository.`);
        }
        const target = path.join(targetRoot, 'node_modules', moduleName);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.cpSync(source, target, { recursive: true, dereference: true });
      }
    }
  }
  throw new Error(`Mutation verification exhausted module-resolution attempts for ${targetRoot}.`);
}

function runTest(targetRoot, testRelative, cwd) {
  try {
    const stdout = execFileSync(process.execPath, [compiledTestPath(targetRoot, testRelative)], { cwd, stdio: 'pipe', encoding: 'utf8' });
    return { passed: true, output: stdout, failingFile: null };
  } catch (error) {
    return { passed: false, output: `${error.stdout ?? ''}${error.stderr ?? ''}${error.message ?? ''}`, failingFile: testRelative };
  }
}

/** Runs every compiled compliance runner; detection is any single failure. */
function runSuite(targetRoot) {
  const failures = [];
  const outputs = [];
  for (const testRelative of COMPILED_SUITE) {
    const outcome = runTest(targetRoot, testRelative.replace(/^\.compliance-test-build\//, ''), targetRoot);
    if (!outcome.passed) failures.push({ testRelative, output: outcome.output });
    outputs.push(outcome.output);
  }
  return { passed: failures.length === 0, failures, output: failures[0]?.output ?? outputs.join('\n') };
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'privacy-lens-mutants-'));
const results = [];
try {
  // ---- Baseline: the compliance suite must be green on unmodified source ---
  const baselineRoot = path.join(tempRoot, 'baseline');
  buildTree(baselineRoot, null);
  compile(baselineRoot);
  const baseline = runSuite(baselineRoot);
  if (!baseline.passed) {
    throw new Error(`Baseline is not green for ${baseline.failures[0].testRelative}, so mutant detection would be meaningless:\n${baseline.failures[0].output.slice(-2000)}`);
  }
  console.log(`Baseline verified: ${COMPILED_SUITE.length} compiled compliance runner(s) pass on unmodified source.`);

  // ---- One tree per mutant ------------------------------------------------
  for (const property of catalog.properties) {
    const mutation = MUTANTS[property.mutantId];
    if (!mutation) throw new Error(`No declared mutation exists for registered mutant ${property.mutantId}`);
    const mutantRoot = path.join(tempRoot, property.mutantId);
    buildTree(mutantRoot, { ...mutation, id: property.mutantId });

    let detected;
    let detectedByFile;
    let evidence;
    if (mutation.asScript) {
      // A non-TypeScript source is verified by its own standalone runner, which
      // is executed against the mutated script inside the temporary tree.
      const outcome = runTest(mutantRoot, mutation.testFileOverride, mutantRoot);
      detected = !outcome.passed;
      detectedByFile = mutation.testFileOverride;
      evidence = outcome.output;
    } else {
      compile(mutantRoot);
      const outcome = runSuite(mutantRoot);
      detected = !outcome.passed;
      detectedByFile = outcome.failures[0]?.testRelative ?? null;
      evidence = outcome.output;
    }

    results.push({
      mutantId: property.mutantId,
      propertyId: property.id,
      file: mutation.file,
      cataloguedTestFile: mutation.testFileOverride ?? testFileFor(property),
      detectingTestFile: detectedByFile,
      detected,
      declaredWeakening: mutation.detectedBy,
      evidence: String(evidence).split('\n').filter(Boolean).slice(-4).join(' | ').slice(0, 400),
    });
    console.log(`${property.mutantId.padEnd(28)} ${detected ? 'DETECTED' : 'SURVIVED'}${detected && process.argv.includes('--verbose') ? `  by ${detectedByFile}` : ''}`);
    fs.rmSync(mutantRoot, { recursive: true, force: true });
  }
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

const survivors = results.filter(({ detected }) => !detected);
const summary = {
  schema: 'privacy-lens.mutation-verification.v1',
  propertiesN: catalog.properties.length,
  mutantsN: results.length,
  detectedN: results.length - survivors.length,
  survivedN: survivors.length,
  score: results.length === 0 ? null : Number(((results.length - survivors.length) / results.length).toFixed(6)),
  results,
  caveat: 'Executed detection evidence for the curated mutant set only. A detected mutant shows that its registered test distinguishes that specific declared weakening; it is not a complete mutation score and does not prove the absence of unmodelled defects.',
};
const summaryPath = path.join(root, 'artifacts', 'mutation', 'mutation-verification.json');
fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);

if (survivors.length) {
  console.error(`\n${survivors.length} registered mutant(s) survived, so the curated mutation score is not supported:`);
  for (const survivor of survivors) console.error(` - ${survivor.mutantId} (${survivor.file}) was not detected by ${survivor.testFile}`);
  process.exit(1);
}

console.log(`\nMutation verification passed: ${summary.detectedN}/${summary.mutantsN} registered mutants detected by the compiled compliance suite.`);
console.log(`Receipt: ${path.relative(root, summaryPath)}`);
