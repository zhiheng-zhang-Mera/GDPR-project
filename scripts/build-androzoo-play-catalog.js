#!/usr/bin/env node
/*
 * Builds a deterministic Google-Play-observed Android corpus from an
 * operator-supplied AndroZoo metadata CSV.  It never downloads an APK and
 * deliberately refuses to manufacture an access or commercial-status claim.
 */
const { createHash } = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const zlib = require('zlib');

const args = process.argv.slice(2);
const value = (flag) => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
const metadataPath = value('--metadata');
const accessRecordPath = value('--access-record');
const output = value('--output');
const apkDir = value('--apk-dir');
const count = Number(value('--count') || 100);
const seed = String(value('--seed') || '8222026');
const maxApkBytes = Number(value('--max-apk-bytes') || 100_000_000);
if (!metadataPath || !accessRecordPath || !output || !apkDir || !Number.isInteger(count) || count < 100 || count > 500 || !Number.isSafeInteger(maxApkBytes) || maxApkBytes < 100_000) {
  throw new Error('Usage: node scripts/build-androzoo-play-catalog.js --metadata <latest.csv[.gz]> --access-record <approved-record.json> --output <catalog.json> --apk-dir <ignored-local-apk-dir> [--count 100..500] [--seed string] [--max-apk-bytes bytes]');
}
if (!fs.existsSync(metadataPath) || !fs.existsSync(accessRecordPath)) throw new Error('Both an AndroZoo metadata file and an operator-approved access record are required.');

function digest(file) { return createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function parseCsv(line) {
  const values = []; let field = ''; let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') { field += '"'; index += 1; } else quoted = !quoted;
    } else if (character === ',' && !quoted) { values.push(field); field = ''; } else field += character;
  }
  if (quoted) return null;
  values.push(field); return values;
}
function rank(sha256) { return createHash('sha256').update(`${seed}:${sha256}`).digest('hex'); }
function packageNameOk(name) { return /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$/.test(name || ''); }
function accessRecord() {
  const record = JSON.parse(fs.readFileSync(accessRecordPath, 'utf8'));
  if (record?.schema !== 'privacy-lens.authorized-commercial-corpus-access.v1' || record.provider !== 'AndroZoo' || record.authorizedForResearch !== true || record.noRedistributionAcknowledged !== true || record.commercialCorpusApproved !== true || typeof record.approvedBy !== 'string' || !record.approvedBy.trim() || typeof record.approvalReference !== 'string' || !record.approvalReference.trim()) {
    throw new Error('Access record must attest authorised research access, non-redistribution, and commercial-corpus approval with an approver and approval reference.');
  }
  return record;
}
const approval = accessRecord();
const candidates = []; const reserve = count * 16;
function retain(candidate) {
  candidates.push(candidate);
  candidates.sort((left, right) => left.rank.localeCompare(right.rank));
  if (candidates.length > reserve) candidates.length = reserve;
}

const sourceStream = fs.createReadStream(metadataPath);
const input = /\.gz$/i.test(metadataPath) ? sourceStream.pipe(zlib.createGunzip()) : sourceStream;
(async () => {
  const reader = readline.createInterface({ input, crlfDelay: Infinity });
  let header; let eligibleRows = 0; let malformedRows = 0;
  for await (const line of reader) {
    if (!header) { header = parseCsv(line); if (!header) throw new Error('AndroZoo CSV header is malformed.'); continue; }
    const fields = parseCsv(line);
    if (!fields || fields.length !== header.length) { malformedRows += 1; continue; }
    const row = Object.fromEntries(header.map((name, index) => [name, fields[index]]));
    const sha256 = (row.sha256 || '').toLowerCase();
    const packageName = row.pkg_name || '';
    const bytes = Number(row.apk_size);
    const vtDetection = Number(row.vt_detection);
    const markets = (row.markets || '').split('|').map((market) => market.trim()).filter(Boolean);
    if (!/^[a-f0-9]{64}$/.test(sha256) || !packageNameOk(packageName) || !Number.isSafeInteger(bytes) || bytes < 100_000 || bytes > maxApkBytes || !Number.isFinite(vtDetection) || vtDetection !== 0 || !markets.includes('play.google.com')) continue;
    eligibleRows += 1;
    retain({ sha256, packageName, bytes, versionCode: row.vercode || null, dexDate: row.dex_date || null, markets, rank: rank(sha256) });
  }
  const selected = []; const packages = new Set();
  for (const candidate of candidates) {
    if (packages.has(candidate.packageName)) continue;
    packages.add(candidate.packageName); selected.push(candidate);
    if (selected.length === count) break;
  }
  if (selected.length < count) throw new Error(`Only ${selected.length} unique, Google-Play-observed, VT=0 candidates were retained; ${count} required. Use a complete metadata file or adjust documented bounds.`);
  const catalog = {
    schema: 'privacy-lens.android-store-corpus.v1',
    corpusId: `androzoo-play-commercial-${count}-seed-${seed}`,
    corpusKind: 'APP_STORE_COMMERCIAL',
    source: {
      provider: 'AndroZoo', metadataSha256: digest(metadataPath), metadataFileName: path.basename(metadataPath),
      accessRecordSha256: digest(accessRecordPath),
      commercialStatus: 'OPERATOR_ATTESTED_WITH_EVIDENCE',
      marketEvidence: 'AndroZoo metadata markets contains play.google.com; this proves observed distribution only, while commercial status is the operator attestation in the access record.',
      selection: { seed, count, maxApkBytes, requiredMarket: 'play.google.com', requiredVirusTotalDetection: 0, strategy: 'deterministic-hash-rank-with-unique-package-deduplication', eligibleRows, malformedRows, retainedCandidateReserve: reserve },
    },
    apps: selected.map((candidate, index) => ({
      id: `androzoo-play-${String(index + 1).padStart(3, '0')}`,
      displayName: candidate.packageName,
      packageName: candidate.packageName,
      storeUrl: `https://play.google.com/store/apps/details?id=${encodeURIComponent(candidate.packageName)}`,
      provenance: { provider: 'AndroZoo', sha256: candidate.sha256, markets: candidate.markets, vtDetection: 0, versionCode: candidate.versionCode, dexDate: candidate.dexDate },
      apkFiles: [{ path: path.join(apkDir, `${candidate.sha256}.apk`), sha256: candidate.sha256 }],
    })),
  };
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`Wrote ${catalog.apps.length}-entry AndroZoo Google-Play-observed catalog: ${output}`);
})().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
