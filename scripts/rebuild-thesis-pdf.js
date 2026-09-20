#!/usr/bin/env node
/**
 * Rebuilds the thesis PDF from source and reports whether the result is
 * byte-identical to the published artifact.
 *
 * The PDF was previously a hand-built artifact that no command could
 * regenerate, which is how it drifted a full revision behind the corrected
 * source. This script makes the render reproducible: it locates a usable TeX
 * installation, runs the documented four-pass build in a temporary directory,
 * compares digests, and then runs the PDF prose consistency check.
 *
 * It is deliberately tolerant of a missing TeX installation. CI runners usually
 * have none, and failing there would block the core gate for an environment
 * reason rather than a content reason. Instead it reports that the render was
 * skipped and why, and the PDF prose check still runs against the committed
 * bytes so a stale PDF is caught even without a toolchain.
 *
 * Usage:
 *   node scripts/rebuild-thesis-pdf.js            # check only; do not write
 *   node scripts/rebuild-thesis-pdf.js --write    # install the rebuilt PDF
 */
const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'Thesis', 'Final');
const publishedRelative = 'output/pdf/Privacy-Lens-Thesis-Final.pdf';
const packagedRelative = 'release/submission-final/Privacy-Lens-Thesis-Final.pdf';
const write = process.argv.includes('--write');
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

/**
 * Fixed render timestamp.
 *
 * pdfTeX embeds the current time in `CreationDate`, which makes two renders of
 * identical sources differ by a few bytes. Pinning `SOURCE_DATE_EPOCH` — the
 * standard reproducible-builds variable — removes that, so the published digest
 * is a function of the sources alone and a reader can confirm the PDF was built
 * from the committed TeX.
 *
 * The epoch below is the instant `2026-09-01T07:00:00Z`. pdfTeX writes
 * `CreationDate` from this value using the zone offset it was started with, so
 * the rendered string is `20260901070000` in the reference environment and
 * `CreationDate` then names 1 September 2026, agreeing with the thesis date. A
 * reproducer in another zone may render the same instant with a different
 * offset, so the digest comparison is reported rather than asserted as identical
 * on every host.
 */
const SOURCE_DATE_EPOCH = '1788246000'; // 2026-09-01T07:00:00Z

/** Candidate TeX binary directories, in preference order. */
function texBinDirectories() {
  const candidates = [];
  if (process.env.PDFLATEX_BIN) candidates.push(process.env.PDFLATEX_BIN);
  if (process.env.TINYTEX_ROOT) candidates.push(path.join(process.env.TINYTEX_ROOT, 'bin', 'windows'));
  candidates.push(
    'D:\\Tools\\TinyTeX\\TinyTeX\\bin\\windows',
    path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'MiKTeX', 'miktex', 'bin', 'x64'),
    'C:\\Program Files\\MiKTeX\\miktex\\bin\\x64',
    '/usr/local/texlive/2026/bin/x86_64-linux',
    '/usr/bin',
  );
  return candidates;
}

function findTex() {
  const executable = process.platform === 'win32' ? 'pdflatex.exe' : 'pdflatex';
  for (const directory of texBinDirectories()) {
    const candidate = path.join(directory, executable);
    if (fs.existsSync(candidate)) return candidate;
  }
  // Fall back to PATH.
  try {
    const resolved = execFileSync(process.platform === 'win32' ? 'where' : 'which', ['pdflatex'], { encoding: 'utf8' }).split('\n')[0].trim();
    if (resolved && fs.existsSync(resolved)) return resolved;
  } catch {
    // Not on PATH.
  }
  return null;
}

const publishedPath = path.join(root, publishedRelative);
const packagedPath = path.join(root, packagedRelative);
if (!fs.existsSync(publishedPath)) throw new Error(`Missing published PDF: ${publishedRelative}`);
const published = fs.readFileSync(publishedPath);
const publishedSha = sha256(published);

const pdflatex = findTex();
if (!pdflatex) {
  console.log(
    'Thesis PDF render skipped: no pdflatex found.\n' +
    '  The committed PDF is still prose-checked below. To verify the render, install TeX Live or TinyTeX,\n' +
    '  or point PDFLATEX_BIN at a directory containing pdflatex.',
  );
} else {
  const bin = path.dirname(pdflatex);
  const env = {
    ...process.env,
    PATH: `${bin}${path.delimiter}${process.env.PATH}`,
    SOURCE_DATE_EPOCH,
    FORCE_SOURCE_DATE: '1',
  };
  const buildDir = fs.mkdtempSync(path.join(os.tmpdir(), 'privacy-lens-thesis-'));
  try {
    for (const name of fs.readdirSync(sourceDir)) {
      if (!/\.(tex|bib)$/.test(name)) continue;
      fs.copyFileSync(path.join(sourceDir, name), path.join(buildDir, name));
    }
    const passes = [
      ['pdflatex', ['-interaction=nonstopmode', '-halt-on-error', 'main.tex']],
      ['bibtex', ['main']],
      ['pdflatex', ['-interaction=nonstopmode', '-halt-on-error', 'main.tex']],
      ['pdflatex', ['-interaction=nonstopmode', '-halt-on-error', 'main.tex']],
    ];
    for (const [tool, toolArgs] of passes) {
      const executable = tool === 'pdflatex' ? pdflatex : path.join(bin, process.platform === 'win32' ? 'bibtex.exe' : 'bibtex');
      execFileSync(executable, toolArgs, { cwd: buildDir, env, stdio: 'pipe', encoding: 'utf8' });
    }
    const rebuilt = fs.readFileSync(path.join(buildDir, 'main.pdf'));
    const rebuiltSha = sha256(rebuilt);
    const identical = rebuiltSha === publishedSha;
    console.log(`Thesis PDF rebuilt with ${pdflatex} (${rebuilt.length} bytes, sha256 ${rebuiltSha}).`);
    console.log(`Render timestamp pinned to SOURCE_DATE_EPOCH=${SOURCE_DATE_EPOCH}, so identical sources give identical bytes.`);
    console.log(identical
      ? 'Render is byte-identical to the published PDF.'
      : `Render differs from the published PDF (published sha256 ${publishedSha}).`);
    if (write) {
      fs.writeFileSync(publishedPath, rebuilt);
      fs.writeFileSync(packagedPath, rebuilt);
      console.log(`Published PDF replaced with the fresh render (${publishedRelative}, ${packagedRelative}).`);
      console.log('Run `node scripts/verify-pdf-consistency.js` and `node scripts/write-submission-manifest.js --write` next.');
    } else if (!identical) {
      console.log('Run with --write to install the fresh render.');
    }
  } catch (error) {
    throw new Error(`Thesis PDF render failed:\n${error.stdout ?? ''}${error.stderr ?? ''}${error.message}`);
  } finally {
    fs.rmSync(buildDir, { recursive: true, force: true });
  }
}

// The prose check always runs, with or without a toolchain.
execFileSync(process.execPath, [path.join(root, 'scripts', 'verify-pdf-consistency.js'), publishedRelative], { stdio: 'inherit' });
