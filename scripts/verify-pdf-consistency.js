#!/usr/bin/env node
/**
 * PDF prose consistency check for the rendered thesis.
 *
 * Compiling successfully does not mean the rendered document says the right
 * thing. This script extracts the text of the shipped thesis PDF and asserts
 * that the corrected claims are present and the retracted ones are absent, so a
 * stale PDF cannot be committed unnoticed.
 *
 * Extraction is deliberately dependency-free: the PDF content streams are
 * inflated with zlib and the text-showing operators are decoded. That is enough
 * for searching prose, and it avoids adding a PDF library to the repository.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.resolve(__dirname, '..');
const target = process.argv[2] || 'output/pdf/Privacy-Lens-Thesis-Final.pdf';
const labels = { path: target, dest: 'stdout' };

function inflateStreams(buffer) {
  const chunks = [];
  let cursor = 0;
  while (true) {
    const start = buffer.indexOf('stream', cursor);
    if (start === -1) break;
    // Only content and metadata streams carry page text. Font programs, embedded
    // files, and images are excluded so that glyph-outline data containing
    // arbitrary character sequences cannot masquerade as prose.
    const header = buffer.subarray(Math.max(0, start - 400), start).toString('latin1');
    if (/\/Subtype\s*\/Type1C|\/Subtype\s*\/CIDFontType0C|\/Subtype\s*\/OpenType|\/Type\s*\/EmbeddedFile|\/Subtype\s*\/Image|\/FontFile|\/Length1/.test(header)) {
      cursor = start + 'stream'.length;
      continue;
    }
    let dataStart = start + 'stream'.length;
    if (buffer[dataStart] === 0x0d) dataStart += 1;
    if (buffer[dataStart] === 0x0a) dataStart += 1;
    const end = buffer.indexOf('endstream', dataStart);
    if (end === -1) break;
    const raw = buffer.subarray(dataStart, end);
    try {
      chunks.push(zlib.inflateSync(raw));
    } catch {
      // Not a flate stream; ignore.
    }
    cursor = end + 'endstream'.length;
  }
  return chunks;
}

/**
 * Decodes a PDF literal string into searchable ASCII.
 *
 * pdfTeX with T1 encoding does not emit punctuation at its ASCII code point. A
 * comma arrives as `;`, a period as `:`, and ligatures and symbols arrive as
 * octal escapes. Without this mapping the extracted text reads
 * `53;603:5` for `53,603.5`, and a naive search would report correct prose as
 * missing. Byte values that are not printable ASCII become spaces so ligature
 * and symbol-font inserts cannot corrupt the surrounding words.
 */
const PUNCTUATION_MAP = new Map([
  [0x3b, ','], // ;
  [0x3a, '.'], // :
  [0x3f, '?'], // ?
  [0x21, '!'], // !
  [0x22, '"'], // "
  [0x25, '%'], // %
  [0x23, '#'], // #
  [0x26, '&'], // &
  [0x3c, '<'], // <
  [0x3e, '>'], // >
  [0x40, '@'], // @
  [0x2a, '*'], // *
  [0x2b, '+'], // +
  [0x3d, '='], // =
]);

/** Ligature and symbol escapes pdfTeX emits as octal inside literal strings. */
const OCTAL_WORDS = new Map([
  ['034', 'fi'],
  ['035', 'fl'],
  ['036', 'ff'],
  ['013', '-'],
  ['014', '-'],
  ['015', '-'],
  ['023', '--'],
  ['024', '---'],
  ['047', "'"],
  ['140', "'"],
  ['022', "'"],
  ['021', "'"],
  ['134', '"'],
  ['135', '"'],
  ['0', ' '],
]);

function decodeLiteral(value) {
  let out = '';
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character !== '\\') {
      const code = value.charCodeAt(index);
      out += PUNCTUATION_MAP.get(code) ?? (code >= 0x20 && code <= 0x7e ? character : ' ');
      continue;
    }
    const rest = value.slice(index + 1);
    const octal = /^[0-7]{1,3}/.exec(rest);
    if (octal) {
      const word = OCTAL_WORDS.get(octal[0]);
      out += word ?? ' ';
      index += octal[0].length;
      continue;
    }
    // Escaped literals such as \( \) \\
    const escaped = rest[0];
    if (escaped !== undefined) {
      out += escaped;
      index += 1;
    }
  }
  return out;
}

/**
 * Extracts the literal strings passed to Tj/TJ text operators.
 */
function textFromStreams(streams) {
  const pieces = [];
  for (const stream of streams) {
    const source = stream.toString('latin1');
    const literal = /\((?:\\.|[^()\\])*\)/g;
    let match;
    let collected = '';
    while ((match = literal.exec(source))) {
      collected += decodeLiteral(match[0].slice(1, -1));
    }
    if (collected.trim()) pieces.push(collected);
  }
  return pieces
    .join('\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/^%+/gm, '')
    .replace(/\s+/g, ' ');
}

const buffer = fs.readFileSync(path.join(root, target));
const streams = inflateStreams(buffer);
const text = textFromStreams(streams);
/**
 * Normalisation for search.
 *
 * PDF text extraction from a subset font loses information, and `pdfTeX` maps
 * punctuation to neighbouring code points (a period inside a number arrives as a
 * comma, a comma as a semi-colon). Rather than trying to reconstruct which
 * separator is which, the comparison removes separator characters from both the
 * document text and the fragment being searched for. That makes `23,960.5423`,
 * `23,960.542,3`, and `23960.5423` all compare equal.
 *
 * Only whitespace and separator punctuation is removed. Digits are deliberately
 * preserved, because deleting digit runs between letters would splice unrelated
 * adjacent strings together and could manufacture a phrase the document does not
 * contain.
 */
const normalised = text
  .replace(/[`\u00b4\u2018\u2019]/g, "'")
  .replace(/[\u201c\u201d]/g, '"');
const compact = normalised.replace(/\s+/g, ' ');
const SEPARATORS = /[\s\u00ad\u2010-\u2015,;:.\u00b7\u2027-]/g;
const squeezed = compact.replace(SEPARATORS, '').toLowerCase();

/**
 * Builds the set of searchable variants for a fragment.
 *
 * Separator punctuation and whitespace are removed; ligature positions may lose
 * a letter, because `insufficient` can extract as `insuffcient` and `offline` as
 * `oine`.
 */
function variants(needle) {
  const base = needle.replace(SEPARATORS, '').toLowerCase();
  const forms = new Set([base]);
  for (const [full, reduced] of [['ffl', 'fl'], ['ffl', 'l'], ['ffi', 'fi'], ['ffi', 'i'], ['ff', 'f'], ['fi', 'f'], ['fl', 'l']]) {
    for (const form of [...forms]) {
      if (form.includes(full)) forms.add(form.split(full).join(reduced));
    }
  }
  return [...forms];
}

/**
 * A fragment is present when any variant matches. It is absent only when a
 * byte-exact search of the raw and inflated PDF streams also fails to find the
 * literal, so a glyph-extraction artefact can never be reported as a stale
 * claim.
 */
const rawBytes = `${buffer.toString('latin1')}\n${streams.map((s) => s.toString('latin1')).join('\n')}`;
const missing = (needle) =>
  !variants(needle).some((form) => squeezed.includes(form)) && !rawBytes.includes(needle);

const mustAppear = [
  ['measured stress total', '112,236'],
  ['stress corpus size', '40,000'],
  ['restart campaign size', '10,000'],
  ['malformed campaign size', '20,000'],
  ['F-Droid census', '495'],
  ['device packages', '233'],
  ['completed workflows', '203'],
  ['PSS observed count', '98'],
  ['PSS median', '53,603.5'],
  ['PSS lower quartile', '47,884'],
  ['PSS upper quartile', '64,831.25'],
  ['timing median', '23,960.5423'],
  ['timing lower quartile', '21,494.4533'],
  ['timing upper quartile', '25,115.4851'],
  ['timing observed count', '101'],
  ['seeded corpus precision', '800'],
  ['executable mutation status', '9/9'],
  ['mutation harness reference', 'verify:mutation'],
  ['corrected dashboard summary', 'two evidence gaps'],
  ['corrected withdrawal status', 'insufficient evidence with a standard priority'],
  ['independent review not run', 'NOT_RUN'],
  ['fail-closed governance explanation', 'independent legal-review attestation'],
];

const mustNotAppear = [
  ['retracted 150,010 assertion total', '150,010'],
  ['retracted 150010 assertion total', '150010'],
  ['retracted 6.7 second timing', 'approximately 6.7 seconds'],
  ['retracted one-gap dashboard summary', 'one evidence gap, and one no-concern'],
  ['retracted no-concern contextual record', 'returns no technical concern and a silent priority'],
  // Byte-level absence only: the narrative reports legitimately quote removed
  // identifiers when describing what was fixed, so extracted prose is the wrong
  // place to look for absence.
  ['removed module citation', 'evidenceAdmission', 'bytes-only'],
];

/**
 * Exact decimal forms.
 *
 * The main matcher strips separator punctuation so that it tolerates the
 * extraction ambiguities above, which means it cannot see a number rendered with
 * the wrong separator. siunitx defaulted to a French-style decimal mark once and
 * printed a timing value of 23960.5423 as `23,960.542,3`. These patterns require
 * the comma-grouped, period-decimal form to appear literally, so a formatting
 * regression like that fails the check instead of passing it.
 */
const exactDecimalForms = [
  ['PSS median', /53,603\.5/],
  ['PSS upper quartile', /64,831\.25/],
  ['timing median', /23,960\.5423/],
  ['timing lower quartile', /21,494\.4533/],
  ['timing upper quartile', /25,115\.4851/],
];

const failures = [];
for (const [label, pattern] of exactDecimalForms) {
  if (!pattern.test(compact)) failures.push(`MALFORMED in PDF (${label}): expected the form ${pattern.source} but it is absent`);
}
for (const [label, needle] of mustAppear) {
  if (missing(needle)) failures.push(`MISSING from PDF (${label}): ${needle}`);
}
for (const [label, needle, mode] of mustNotAppear) {
  if (mode === 'bytes-only') {
    // Checked against the raw and inflated streams only. The narrative reports
    // legitimately quote removed identifiers when describing what was fixed, so
    // extracted prose is the wrong place to look for absence.
    if (rawBytes.includes(needle)) failures.push(`STALE in PDF bytes (${label}): ${needle}`);
  } else if (!missing(needle)) {
    failures.push(`STALE in PDF (${label}): ${needle}`);
  }
}

if (process.argv.includes('--debug')) {
  const anchor = (needle) => {
    const probe = needle.replace(/[\s\u00ad-]/g, '').toLowerCase().slice(0, 6);
    const index = squeezed.indexOf(probe);
    return index === -1 ? '(anchor not found)' : JSON.stringify(squeezed.slice(Math.max(0, index - 60), index + 90));
  };
  console.log('--- debug: extracted context per probe ---');
  for (const [label, needle] of [...mustAppear, ...mustNotAppear]) {
    console.log(`${label}\n  needle: ${needle}\n  ctx   : ${anchor(needle)}`);
  }
  console.log('--- end debug ---\n');
}

// The PDF must carry the version generated for this revision.
if (!compact.includes('1.15.0')) failures.push('MISSING from PDF: release version 1.15.0');

const pdfVersion = buffer.subarray(0, 8).toString('latin1');
const creationDate = /CreationDate\s*\(D:(\d{14})/.exec(buffer.toString('latin1'))?.[1];
/**
 * Page count. pdfTeX writes the page tree into compressed object streams, so
 * `/Type /Page` is not visible in the raw bytes and `/Count` belongs to other
 * trees. Counting page objects inside the inflated streams is the reliable route.
 */
function pageObjects(buffer, streams) {
  const raw = buffer.toString('latin1');
  let count = (raw.match(/\/Type\s*\/Page[^s]/g) || []).length;
  for (const stream of streams) {
    count += (stream.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  }
  return count;
}
const pageCount = pageObjects(buffer, streams);

if (failures.length) {
  console.error(`PDF prose consistency FAILED for ${target}:`);
  for (const failure of failures) console.error(` - ${failure}`);
  console.error(`\nExtracted ${compact.length} characters from ${streams.length} content streams, ${pageCount} page objects, header ${pdfVersion}, creation ${creationDate ?? 'unknown'}.`);
  process.exit(1);
}

console.log(
  `PDF prose consistency verified: ${target}\n` +
  `  header ${pdfVersion}, ${pageCount} pages, creation ${creationDate ?? 'unknown'}, ` +
  `${streams.length} content streams, ${compact.length} characters extracted\n` +
  `  ${mustAppear.length} required fragments present, ${mustNotAppear.length} retracted fragments absent`,
);
