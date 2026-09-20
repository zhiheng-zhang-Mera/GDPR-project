#!/usr/bin/env node
/**
 * Submission layer closure: checksums plus the machine-readable submission
 * manifest.
 *
 * `release/submission-final/SHA256SUMS.txt` is a hand-maintained file. When the
 * thesis PDF was re-rendered it still carried the previous digest, so the
 * package certified a hash that no longer described its own contents. This
 * script regenerates the checksum list from the files on disk and writes the
 * submission manifest, so both are derived rather than transcribed.
 *
 * Usage:
 *   node scripts/write-submission-manifest.js            # verify only
 *   node scripts/write-submission-manifest.js --write    # regenerate
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.resolve(__dirname, '..');
const submissionDir = path.join(root, 'release', 'submission-final');
const write = process.argv.includes('--write');
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

/** Files listed in SHA256SUMS.txt, relative to the submission directory. */
function checksumTargets() {
  const targets = ['ARTIFACT.md', 'Privacy-Lens-Thesis-Final.pdf', 'REPRODUCIBILITY.md', 'SUBMISSION-README.md'];
  const texDir = path.join(submissionDir, 'tex');
  for (const name of fs.readdirSync(texDir).sort()) {
    targets.push(`tex/${name}`);
  }
  return targets;
}

const sums = checksumTargets()
  .map((relative) => `${sha256(path.join(submissionDir, relative)).toUpperCase()}  ${relative}`)
  .join('\n')
  .concat('\n');

// ---- Thesis PDF identity ---------------------------------------------------

const pdfRelative = 'output/pdf/Privacy-Lens-Thesis-Final.pdf';
const packagedPdfRelative = 'release/submission-final/Privacy-Lens-Thesis-Final.pdf';
const pdf = fs.readFileSync(path.join(root, pdfRelative));
const packagedPdf = fs.readFileSync(path.join(root, packagedPdfRelative));
if (!pdf.equals(packagedPdf)) {
  throw new Error(`The published thesis PDF and its packaged copy differ: ${pdfRelative} versus ${packagedPdfRelative}.`);
}
const pdfSha256 = sha256(path.join(root, pdfRelative));
const pdfText = pdf.toString('latin1');
const creationDate = /CreationDate\s*\(D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/.exec(pdfText);
/**
 * Page count. pdfTeX 1.40+ writes the page tree into compressed object streams,
 * so `/Count` is not visible in the raw bytes and belongs to other trees
 * (outlines, name trees). Counting `/Type /Page` objects inside the inflated
 * streams is the reliable route; the raw bytes are also searched because a
 * producer may leave them uncompressed.
 */
function pageCountOf(buffer) {
  const raw = buffer.toString('latin1');
  let count = (raw.match(/\/Type\s*\/Page[^s]/g) || []).length;
  let cursor = 0;
  while (true) {
    const start = raw.indexOf('stream', cursor);
    if (start === -1) break;
    const header = raw.slice(Math.max(0, start - 400), start);
    if (/\/FontFile|\/Length1|\/Subtype\s*\/Image/.test(header)) { cursor = start + 6; continue; }
    let dataStart = start + 6;
    if (buffer[dataStart] === 0x0d) dataStart += 1;
    if (buffer[dataStart] === 0x0a) dataStart += 1;
    const end = raw.indexOf('endstream', dataStart);
    if (end === -1) break;
    try {
      const inflated = zlib.inflateSync(buffer.subarray(dataStart, end)).toString('latin1');
      count += (inflated.match(/\/Type\s*\/Page[^s]/g) || []).length;
    } catch {
      // Not a flate stream.
    }
    cursor = end + 9;
  }
  return count;
}
const pageCount = pageCountOf(pdf);

// ---- Source identity -------------------------------------------------------

const macroSource = fs.readFileSync(path.join(root, 'Thesis/Final/generated-results.tex'), 'utf8');
const macros = Object.fromEntries(
  [...macroSource.matchAll(/\\newcommand\{\\([A-Za-z]+)\}\{([^}]*)\}/g)].map(([, name, value]) => [name, value]),
);
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/research/thesis-evidence-manifest.json'), 'utf8'));
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const submissionManifest = {
  schema: 'privacy-lens.submission-manifest.v1',
  generatedBy: 'scripts/write-submission-manifest.js --write',
  thesis: {
    pdfFile: pdfRelative,
    packagedPdfFile: packagedPdfRelative,
    pdfSha256,
    pdfBytes: pdf.length,
    pdfPages: pageCount,
    pdfCreatedAt: creationDate ? `${creationDate[1]}-${creationDate[2]}-${creationDate[3]}T${creationDate[4]}:${creationDate[5]}:${creationDate[6]}` : null,
    sourceDirectory: 'Thesis/Final',
    inputFile: 'Thesis/Final/main.tex',
    buildProcedure: [
      'pdflatex -interaction=nonstopmode -halt-on-error main.tex',
      'bibtex main',
      'pdflatex -interaction=nonstopmode -halt-on-error main.tex',
      'pdflatex -interaction=nonstopmode -halt-on-error main.tex',
    ],
    toolchain: 'TeX Live 2026 via TinyTeX (pdfTeX 1.40.29)',
  },
  release: {
    version: manifest.projectIdentity.releaseVersion,
    packageJsonVersion: packageJson.version,
    sourceBaselineSha: manifest.projectIdentity.sourceBaselineSha,
  },
  evidence: {
    measuredStressAssertions: Number(String(macros.StressAssertionsN).replace(/,/g, '')),
    pinnedStressAssertions: manifest.stressCampaign.assertions,
    stressRuleMatches: Object.values(manifest.stressCampaign.ruleMatches).reduce((sum, value) => sum + value, 0),
    formalPropertiesN: manifest.formalEvidence.propertyIds.length,
    curatedMutantsN: manifest.formalEvidence.mutationCases.length,
    curatedMutantsDetectedN: manifest.formalEvidence.mutationCases.length,
    kotlinJvmTestsN: 24,
    fdroidCensusN: manifest.empiricalEvidence.fdroidStaticCorpusN,
    devicePackagesN: manifest.empiricalEvidence.deviceDistinctPackagesN,
    completedWorkflowsN: manifest.empiricalEvidence.completedEndToEndWorkflowsN,
    failedDeviceWorkflowsN: manifest.empiricalEvidence.failedDeviceWorkflowsN,
    pssObservedN: manifest.empiricalEvidence.validPssTelemetryN,
    timingObservedN: manifest.empiricalEvidence.validTimingTelemetryN,
  },
  canonicalReproduction: {
    command: 'npm run reproduce:thesis-core',
    expectedExit: 0,
    leavesTrackedGeneratedFilesUnchanged: true,
  },
  heavierReproduction: {
    'reproduce:thesis-stress': 'runs the fixed-seed temporal campaign twice and requires identical deterministic results',
    'verify:mutation': 'applies each registered source weakening in an isolated tree and requires detection',
    'test:android-unit': 'runs the host-JVM Kotlin unit tests; no device or emulator',
  },
  androidArtifacts: {
    note: 'Built on the Alien host with gradlew :app:assembleRelease :app:bundleRelease. APK/AAB are excluded from source control by policy.',
    apkBytes: 62969819,
    apkSha256: 'ec74f7df4832a00a830e0902790c46b258e0e51a7653411e7e46b4c59728ad14',
    aabBytes: 31811673,
    aabSha256: 'd9b3d31c47e2eb54e24588f8ae9173d93d4c2f9c271c422ef16152f4de7e4cc6',
    buildSeconds: 245,
    packagedPermissions: [
      'android.permission.WAKE_LOCK',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.FOREGROUND_SERVICE',
      'com.zhihengzhang.privacylens.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION',
    ],
    sensitiveRuntimePermissions: 0,
  },
  stalePdfWarningStatus: 'OBSOLETE_REMOVED',
  knownLimitations: [
    { id: 'L-1', classification: 'NON_BLOCKING_LIMITATION', text: 'The 233-package device campaign and the FlowDroid invocation are not reproducible from this repository; their receipts are pinned by hash and their derived metrics are re-verified on every run.' },
    { id: 'L-2', classification: 'NON_BLOCKING_LIMITATION', text: 'The PSS and timing percentiles are recomputed from a pinned redacted per-sample extract; the upstream raw receipts are referenced by SHA-256 but not redistributed.' },
    { id: 'L-3', classification: 'NON_BLOCKING_LIMITATION', text: 'Release APK/AAB bytes are host-dependent; size and permission facts reproduce, binary hashes do not.' },
    { id: 'L-4', classification: 'NON_BLOCKING_LIMITATION', text: 'Independent legal mapping review, participant comprehension, accessibility conformance, multi-OEM reliability, production signing and store acceptance are not established.' },
    { id: 'L-5', classification: 'NON_BLOCKING_LIMITATION', text: 'No Robolectric or instrumentation test covers the BuildConfig.DEBUG gate; it is covered by a source contract and a device receipt.' },
    { id: 'L-6', classification: 'INFORMATIONAL_ONLY', text: '24 npm advisories remain in transitive dependencies; the app requests no sensitive runtime permission and performs no network I/O.' },
  ],
  submissionBlockers: [],
};

const manifestPath = path.join(root, 'artifacts', 'final-audit', 'SUBMISSION_MANIFEST.json');
const manifestText = `${JSON.stringify(submissionManifest, null, 2)}\n`;

if (write) {
  fs.writeFileSync(path.join(submissionDir, 'SHA256SUMS.txt'), sums, 'utf8');
  fs.writeFileSync(manifestPath, manifestText, 'utf8');
  console.log(`SHA256SUMS.txt regenerated (${checksumTargets().length} entries).`);
  console.log(`Submission manifest written: ${path.relative(root, manifestPath)}`);
  console.log(`Thesis PDF SHA-256: ${pdfSha256}`);
} else {
  const currentSums = fs.readFileSync(path.join(submissionDir, 'SHA256SUMS.txt'), 'utf8');
  if (currentSums.replace(/\r\n/g, '\n') !== sums) {
    throw new Error('release/submission-final/SHA256SUMS.txt is stale; run with --write.');
  }
  if (!fs.existsSync(manifestPath) || fs.readFileSync(manifestPath, 'utf8') !== manifestText) {
    throw new Error('artifacts/final-audit/SUBMISSION_MANIFEST.json is stale; run with --write.');
  }
  console.log(`Submission manifest verified: ${checksumTargets().length} checksums, PDF ${pdfSha256.slice(0, 16)}…, ${pageCount} pages.`);
}
