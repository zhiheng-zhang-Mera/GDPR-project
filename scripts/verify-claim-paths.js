#!/usr/bin/env node
/**
 * Verifies that repository paths cited by the governing research documents and
 * the final thesis actually exist.
 *
 * A claim-to-evidence matrix that points at a module which no longer exists is a
 * silent loss of traceability: the claim still reads as supported while its
 * named evidence has moved. This check keeps those citations honest.
 *
 * Scope is the governing narrative surface. `docs/research/` and `Thesis/Final/`
 * carry the claim-to-evidence record; `README.md`, `ARTIFACT.md`, and
 * `release/submission-final/*.md` are the documents a reader actually starts
 * from, so they are scanned too. The archived review notes under
 * `Thesis Version/` are excluded because they describe superseded rounds and may
 * legitimately reference retired artefacts. Paths that the repository
 * intentionally does not track (generated APK/AAB/PDF outputs and git-ignored
 * directories) are skipped rather than reported as missing.
 */
const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const SCANNED_ROOTS = ['docs/research', 'Thesis/Final'];
const SCANNED_FILES = ['README.md', 'ARTIFACT.md', 'User-Guide.md', 'docs/PROJECT-MANUAL.md', 'docs/DELIVERY-CHECKLIST.md'];
const SCANNED_FILE_GLOBS = ['release/submission-final'];
const CITED_PREFIXES = ['src', 'scripts', 'tests', 'android', 'docs', 'experiments', 'release', 'output', 'testing-report', 'Thesis', 'components', 'app', 'assets'];
const CITATION = new RegExp('`((?:' + CITED_PREFIXES.join('|') + ')/[^`\\n]+?)`', 'g');

/** Untracked by design: build outputs and binaries excluded from source control. */
const UNTRACKED_BY_DESIGN = [/\.apk$/, /\.aab$/, /\.zip$/];

function trackedFiles() {
  return new Set(
    execFileSync('git', ['ls-files'], { encoding: 'utf8', cwd: root })
      .split('\n')
      .filter(Boolean)
      .map((file) => file.replaceAll('\\', '/')),
  );
}

function ignoredDirectory(relativePath) {
  try {
    execFileSync('git', ['check-ignore', '-q', relativePath], { cwd: root, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const tracked = trackedFiles();
const scanned = [];
for (const scannedRoot of SCANNED_ROOTS) {
  const absoluteRoot = path.join(root, scannedRoot);
  if (!fs.existsSync(absoluteRoot)) continue;
  for (const entry of fs.readdirSync(absoluteRoot, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile() || !/\.(md|tex)$/.test(entry.name)) continue;
    scanned.push(path.join(entry.parentPath ?? absoluteRoot, entry.name));
  }
}
for (const scannedFile of SCANNED_FILES) {
  const absolute = path.join(root, scannedFile);
  if (fs.existsSync(absolute)) scanned.push(absolute);
}
for (const scannedDir of SCANNED_FILE_GLOBS) {
  const absoluteRoot = path.join(root, scannedDir);
  if (!fs.existsSync(absoluteRoot)) continue;
  for (const entry of fs.readdirSync(absoluteRoot, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile() || !/\.(md|tex)$/.test(entry.name)) continue;
    scanned.push(path.join(entry.parentPath ?? absoluteRoot, entry.name));
  }
}

const failures = [];
let citations = 0;
for (const absolute of scanned) {
  const relative = path.relative(root, absolute).replaceAll('\\', '/');
  const text = fs.readFileSync(absolute, 'utf8');
  let match;
  while ((match = CITATION.exec(text))) {
    let cited = match[1].replaceAll('\\', '/').replace(/[.,;:]+$/, '').trim();
    // Skip globs, placeholders, and prose that merely starts with a scanned prefix.
    if (/[*<>]|\.\.\./.test(cited)) continue;
    if (UNTRACKED_BY_DESIGN.some((pattern) => pattern.test(cited))) continue;
    if (tracked.has(cited)) { citations += 1; continue; }
    // A citation may legitimately name a directory rather than a file.
    if (fs.existsSync(path.join(root, cited)) && fs.statSync(path.join(root, cited)).isDirectory()) { citations += 1; continue; }
    if (ignoredDirectory(cited.split('/').slice(0, 2).join('/'))) continue;
    const line = text.slice(0, match.index).split('\n').length;
    failures.push(`${relative}:${line}: cited path does not exist and is not tracked: ${cited}`);
    citations += 1;
  }
}

if (failures.length) {
  console.error('Claim-evidence path traceability failed:');
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Claim-evidence path traceability verified: ${citations} cited repository paths across ${scanned.length} documents resolve to tracked files.`);
