const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const thesisDir = path.join(root, 'Thesis', 'Final');
const bibPath = path.join(thesisDir, 'reference.bib');
const texFiles = fs.readdirSync(thesisDir)
  .filter((name) => name.endsWith('.tex'))
  .map((name) => path.join(thesisDir, name));

function matches(text, pattern) {
  return [...text.matchAll(pattern)];
}

const failures = [];
const bib = fs.readFileSync(bibPath, 'utf8');
const bibKeys = matches(bib, /^@[^{]+\{([^,]+),/gm).map((match) => match[1].trim());
const bibKeySet = new Set(bibKeys);

for (const key of bibKeys) {
  if (bibKeys.indexOf(key) !== bibKeys.lastIndexOf(key)) {
    failures.push(`duplicate bibliography key: ${key}`);
  }
}

const labels = [];
const references = [];
const citations = [];

for (const file of texFiles) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const text = fs.readFileSync(file, 'utf8');

  labels.push(...matches(text, /\\label\{([^}]+)\}/g).map((match) => ({ key: match[1], file: relative })));
  references.push(...matches(text, /\\(?:ref|pageref|autoref)\{([^}]+)\}/g).map((match) => ({ key: match[1], file: relative })));
  for (const match of matches(text, /\\cite\{([^}]+)\}/g)) {
    citations.push(...match[1].split(',').map((key) => ({ key: key.trim(), file: relative })));
  }

  for (const match of matches(text, /\\input\{([^}]+)\}/g)) {
    const target = match[1].endsWith('.tex') ? match[1] : `${match[1]}.tex`;
    if (!fs.existsSync(path.resolve(thesisDir, target))) {
      failures.push(`${relative}: missing input ${target}`);
    }
  }
}

const labelKeys = new Set(labels.map(({ key }) => key));
for (const { key, file } of labels) {
  if (labels.filter((label) => label.key === key).length > 1) {
    failures.push(`${file}: duplicate label ${key}`);
  }
}
for (const { key, file } of references) {
  if (!labelKeys.has(key)) failures.push(`${file}: unresolved reference ${key}`);
}
for (const { key, file } of citations) {
  if (!bibKeySet.has(key)) failures.push(`${file}: unresolved citation ${key}`);
}

const uniqueFailures = [...new Set(failures)].sort();
if (uniqueFailures.length) {
  console.error(uniqueFailures.join('\n'));
  process.exit(1);
}

console.log(`Thesis references verified: ${texFiles.length} TeX files, ${bibKeys.length} bibliography entries, ${labels.length} labels, ${citations.length} citations.`);
