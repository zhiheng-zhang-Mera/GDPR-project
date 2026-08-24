const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const productionRoots = ['src', 'app', 'components'];
const narrativeRoots = ['docs/research', 'Thesis/Final'];
const textExtensions = new Set(['.ts', '.tsx', '.js', '.json', '.md', '.tex']);
const forbiddenRuntimeTokens = /\b(?:GDPR_VIOLATION|LEGAL_COMPLIANCE|COMPLIANT)\b/i;
const riskyAssertion = /\b(?:proves?|detects?)\b.{0,45}\b(?:GDPR|legal|compliance|violation|accuracy)\b|\b(?:GDPR|legal)\b.{0,45}\b(?:compliant|violation)\b/i;
const boundaryQualifier = /\b(?:not|never|neither|cannot|does not|do not|no |exclude[sd]?|prohibit(?:ed|s)?|unsupported|rather than|without|fails? closed|missing|limitation|boundary|errors?|doesn't)\b/i;

function walk(relativeRoot) {
  const absoluteRoot = path.join(root, relativeRoot);
  if (!fs.existsSync(absoluteRoot)) return [];
  const files = [];
  for (const entry of fs.readdirSync(absoluteRoot, { withFileTypes: true })) {
    const relative = path.join(relativeRoot, entry.name);
    if (entry.isDirectory()) files.push(...walk(relative));
    else if (textExtensions.has(path.extname(entry.name))) files.push(relative);
  }
  return files;
}

const failures = [];
for (const file of productionRoots.flatMap(walk)) {
  const lines = fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    if (forbiddenRuntimeTokens.test(line)) {
      failures.push(`${file.replaceAll('\\', '/')}:${index + 1}: prohibited legal-verdict runtime token`);
    }
  });
}

for (const file of narrativeRoots.flatMap(walk)) {
  const lines = fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    if ((forbiddenRuntimeTokens.test(line) || riskyAssertion.test(line)) && !boundaryQualifier.test(line)) {
      failures.push(`${file.replaceAll('\\', '/')}:${index + 1}: high-risk claim lacks a same-line boundary qualifier`);
    }
  });
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Claim boundaries verified: no production legal-verdict tokens and all registered high-risk narrative claims are qualified.');
