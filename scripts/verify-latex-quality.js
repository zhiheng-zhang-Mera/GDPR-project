const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const thesisDir = path.join(root, 'Thesis', 'Final');
const texFiles = fs.readdirSync(thesisDir)
  .filter((name) => name.endsWith('.tex'))
  .map((name) => path.join(thesisDir, name));
const failures = [];

const referenceCheck = spawnSync(process.execPath, [path.join(__dirname, 'verify-thesis-references.js')], {
  cwd: root,
  encoding: 'utf8',
});
if (referenceCheck.status !== 0) {
  failures.push(referenceCheck.stderr.trim() || referenceCheck.stdout.trim() || 'thesis reference check failed');
}

const stalePatterns = [
  [/\b1\.1\.0\b/g, 'stale version 1.1.0'],
  [/version\s*code\s*2\b/gi, 'stale Android version code 2'],
  [/the\s+final\s+delivery/gi, 'generated delivery-language residue'],
];
const paragraphOwners = new Map();

for (const file of texFiles) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/\b(?:TODO|FIXME|TBD|XXX)\b/.test(line)) failures.push(`${relative}:${index + 1}: unresolved editorial marker`);
  });
  for (const [pattern, label] of stalePatterns) {
    if (pattern.test(text)) failures.push(`${relative}: ${label}`);
    pattern.lastIndex = 0;
  }
  for (const match of text.matchAll(/\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}/g)) {
    const target = match[1];
    const candidates = path.extname(target)
      ? [target]
      : ['.pdf', '.png', '.jpg', '.jpeg'].map((extension) => `${target}${extension}`);
    if (!candidates.some((candidate) => fs.existsSync(path.resolve(thesisDir, candidate)))) {
      failures.push(`${relative}: missing figure ${target}`);
    }
  }
  if (!file.endsWith('generated-results.tex')) {
    for (const paragraph of text.split(/\r?\n\s*\r?\n/)) {
      const normalized = paragraph.replace(/%.*$/gm, '').replace(/\s+/g, ' ').trim();
      if (normalized.length < 220 || normalized.startsWith('\\begin{') || normalized.startsWith('\\end{')) continue;
      if (paragraphOwners.has(normalized)) {
        failures.push(`${relative}: accidental duplicate paragraph also found in ${paragraphOwners.get(normalized)}`);
      } else {
        paragraphOwners.set(normalized, relative);
      }
    }
  }
}

if (failures.length) {
  console.error([...new Set(failures)].join('\n'));
  process.exit(1);
}

if (referenceCheck.stdout.trim()) console.log(referenceCheck.stdout.trim());
console.log(`LaTeX source quality verified: ${texFiles.length} files, no stale markers, missing figures, or duplicate long paragraphs. PDF compilation is a separate rendered-artifact check.`);
