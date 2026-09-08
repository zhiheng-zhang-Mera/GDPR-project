#!/usr/bin/env node
/* global __dirname */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const expectedVersion = '1.15.0';
const failures = [];

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const fail = (message) => failures.push(message);

const requiredFiles = [
  'README.md',
  'User-Guide.md',
  'docs/PROJECT-MANUAL.md',
  'docs/DELIVERY-CHECKLIST.md',
  'docs/FIRST-CONTACT-REVIEW.md',
  'docs/privacy-policy.md',
  'docs/rule-cards.md',
  'docs/research/CITATION-AUDIT.md',
  'docs/research/THESIS-PROVENANCE.md',
  'docs/research/FINALIZATION-REVIEWS.md',
  'docs/research/FINALIZATION-GATE.md',
  'LICENSE.md',
  'output/pdf/Privacy-Lens-Thesis-Final.pdf',
  'release/submission-final/Privacy-Lens-Thesis-Final.pdf',
  'release/submission-final/ARTIFACT.md',
  'release/submission-final/SUBMISSION-README.md',
  'release/submission-final/REPRODUCIBILITY.md',
  'release/submission-final/SHA256SUMS.txt',
  'release/submission-final/tex/main.tex',
  'release/submission-final/tex/chapter-01.tex',
  'release/submission-final/tex/chapter-02.tex',
  'release/submission-final/tex/chapter-03.tex',
  'release/submission-final/tex/chapter-04.tex',
  'release/submission-final/tex/chapter-05.tex',
  'release/submission-final/tex/chapter-06.tex',
  'release/submission-final/tex/chapter-07.tex',
  'release/submission-final/tex/formal-evidence-model.tex',
  'release/submission-final/tex/generated-results.tex',
  'release/submission-final/tex/reference.bib',
  'testing-report/real-device-9-8-finalize-v1.15.0/README.md',
  'testing-report/real-device-9-8-finalize-v1.15.0/overview.png',
  'testing-report/real-device-9-8-finalize-v1.15.0/findings.png',
  'testing-report/real-device-9-8-finalize-v1.15.0/settings.png',
  'assets/screenshots/product-overview.png',
  'assets/screenshots/findings-summary.png',
  'assets/screenshots/decision-pause.png',
];

for (const file of requiredFiles) {
  if (!exists(file)) fail(`missing required delivery file: ${file}`);
}

for (const name of ['main.tex', 'chapter-01.tex', 'chapter-02.tex', 'chapter-03.tex', 'chapter-04.tex', 'chapter-05.tex', 'chapter-06.tex', 'chapter-07.tex', 'formal-evidence-model.tex', 'generated-results.tex', 'reference.bib']) {
  const canonical = path.join(root, 'Thesis', 'Final', name);
  const packaged = path.join(root, 'release', 'submission-final', 'tex', name);
  if (fs.existsSync(canonical) && fs.existsSync(packaged) && !fs.readFileSync(canonical).equals(fs.readFileSync(packaged))) {
    fail(`chapter-split submission source differs from Thesis/Final: ${name}`);
  }
}

const packageJson = JSON.parse(read('package.json'));
const appJson = JSON.parse(read('app.json'));
const gradle = read('android/app/build.gradle');
if (packageJson.version !== expectedVersion) fail(`package.json version is ${packageJson.version}`);
if (appJson.expo?.version !== expectedVersion) fail(`app.json version is ${appJson.expo?.version}`);
if (!new RegExp(`versionName\\s+"${expectedVersion.replaceAll('.', '\\.')}"`).test(gradle)) {
  fail(`android/app/build.gradle versionName is not ${expectedVersion}`);
}

// Include new delivery files before they are staged, but ignore tracked paths
// that the cleanup intentionally removed from the working tree.
const tracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' })
  .split(/\r?\n/)
  .filter((file) => file && exists(file));
const forbiddenTracked = tracked.filter((file) =>
  /(^|\/)(\.idea|\.vs)(\/|$)/.test(file)
  || /(^|\/)(logcat|jobscheduler)[^/]*$/i.test(file)
  || /(^|\/)project_clean\.zip$/i.test(file)
  || /GDPR-Permission-Audit-1\.0\.0-x86_64\.apk$/i.test(file)
  || /^backend\//.test(file)
  || /^scripts\/reset-project\.js$/.test(file)
  || /^release\/submission-private\//.test(file)
  || /^Thesis\/Final\/(?:main-submission|private-submission-metadata)\.tex$/.test(file)
);
if (forbiddenTracked.length > 0) fail(`forbidden delivery files are tracked: ${forbiddenTracked.join(', ')}`);

const markdownFiles = tracked.filter((file) => file.endsWith('.md'));
const localLinkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g;
for (const markdownFile of markdownFiles) {
  const source = read(markdownFile);
  let match;
  while ((match = localLinkPattern.exec(source)) !== null) {
    const target = match[1].trim().replace(/^<|>$/g, '').split('#')[0].split('?')[0];
    if (!target || /^(https?:|mailto:)/i.test(target)) continue;
    const decoded = decodeURIComponent(target);
    const resolved = path.resolve(root, path.dirname(markdownFile), decoded);
    if (!resolved.startsWith(root + path.sep) && resolved !== root) {
      fail(`${markdownFile} links outside the repository: ${target}`);
    } else if (!fs.existsSync(resolved)) {
      fail(`${markdownFile} has a broken local link: ${target}`);
    }
  }
}

const readme = read('README.md');
for (const screenshot of requiredFiles.filter((file) => file.startsWith('assets/screenshots/'))) {
  if (!readme.includes(screenshot)) fail(`README.md does not display ${screenshot}`);
}
const ruleCards = read('docs/rule-cards.md');
for (const id of ['WEARABLE_LOCATION_HEALTH', 'MULTIMODAL_BIOMETRIC_CAPTURE', 'CROSS_DOMAIN_PROFILING', 'POST_BACKGROUND_MEDIA_ACCESS', 'HIGH_FREQUENCY_LOCATION']) {
  if (!ruleCards.includes(`\`${id}\``)) fail(`rule-card coverage is missing ${id}`);
}
if (!readme.includes(`Version ${expectedVersion}`) || !readme.includes(`版本 ${expectedVersion}`)) {
  fail('README.md does not state the current version in both languages');
}

if (failures.length > 0) {
  console.error('Delivery verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Delivery verification passed: ${requiredFiles.length} required files, ${markdownFiles.length} Markdown files, version ${expectedVersion}.`);
