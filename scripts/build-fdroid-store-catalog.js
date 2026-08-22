#!/usr/bin/env node
/* Creates a deterministic, category-balanced F-Droid APK download plan. */
const { createHash } = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const get = (flag) => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
const indexPath = get('--index') || path.join(root, '.codex-tools', 'fdroid', 'index-v2.json');
const signerPath = get('--signer-index') || path.join(root, '.codex-tools', 'fdroid', 'signer-index.json');
const output = get('--output');
const apkDir = get('--apk-dir');
const count = Number(get('--count') || 100);
const seed = Number(get('--seed') || 8222026) >>> 0;
const maxBytes = Number(get('--max-apk-bytes') || 12_000_000);
if (!output || !apkDir || !Number.isInteger(count) || count < 100 || count > 500) throw new Error('Usage: node scripts/build-fdroid-store-catalog.js --output <catalog.json> --apk-dir <dir> [--index <index-v2.json>] [--signer-index <signer-index.json>] [--count 100..500] [--seed integer] [--max-apk-bytes bytes]');
if (!fs.existsSync(indexPath) || !fs.existsSync(signerPath)) throw new Error('F-Droid index and signer index are required before catalog construction.');
const digest = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const signers = JSON.parse(fs.readFileSync(signerPath, 'utf8'));
let state = seed || 0x6d2b79f5;
const random = () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return ((state >>> 0) / 0x1_0000_0000); };
const shuffle = (items) => { const copy = [...items]; for (let i = copy.length - 1; i > 0; i -= 1) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; };
const candidateByCategory = new Map();
for (const [packageName, app] of Object.entries(index.packages || {})) {
  const versions = Object.values(app.versions || {}).sort((a, b) => (b.manifest?.versionCode || 0) - (a.manifest?.versionCode || 0));
  const version = versions.find((entry) => {
    const file = entry.file || {};
    const native = entry.manifest?.nativecode || [];
    return typeof file.name === 'string' && file.name.endsWith('.apk') && /^[a-f0-9]{64}$/i.test(file.sha256 || '') && Number.isFinite(file.size) && file.size > 0 && file.size <= maxBytes && (entry.manifest?.usesSdk?.minSdkVersion || 1) <= 31 && (!native.length || native.includes('arm64-v8a'));
  });
  const metadata = app.metadata || {};
  const categories = Array.isArray(metadata.categories) ? metadata.categories.filter((category) => typeof category === 'string' && category.trim()) : [];
  if (!version || !categories.length || !signers[packageName]?.signer) continue;
  const candidate = {
    packageName,
    displayName: metadata.name?.['en-US'] || metadata.name?.en || packageName,
    categories,
    fileName: version.file.name.replace(/^\//, ''),
    sha256: version.file.sha256.toLowerCase(),
    size: version.file.size,
    versionCode: version.manifest?.versionCode,
    versionName: version.manifest?.versionName,
    expectedSignerSha256: signers[packageName].signer.toLowerCase(),
  };
  for (const category of categories) {
    if (!candidateByCategory.has(category)) candidateByCategory.set(category, []);
    candidateByCategory.get(category).push(candidate);
  }
}
for (const [category, candidates] of candidateByCategory) candidateByCategory.set(category, shuffle(candidates));
const categoryOrder = shuffle([...candidateByCategory.keys()]);
const cursors = new Map(categoryOrder.map((category) => [category, 0]));
const picked = []; const used = new Set(); const selectedCategories = [];
while (picked.length < count) {
  let advanced = false;
  for (const category of categoryOrder) {
    const candidates = candidateByCategory.get(category);
    while (cursors.get(category) < candidates.length && used.has(candidates[cursors.get(category)].packageName)) cursors.set(category, cursors.get(category) + 1);
    if (cursors.get(category) >= candidates.length) continue;
    const cursor = cursors.get(category);
    const candidate = candidates[cursor];
    cursors.set(category, cursor + 1);
    used.add(candidate.packageName); picked.push(candidate); selectedCategories.push(category); advanced = true;
    if (picked.length === count) break;
  }
  if (!advanced) break;
}
if (picked.length < count) throw new Error(`Only ${picked.length} eligible F-Droid packages were selected; ${count} required.`);
const catalog = {
  schema: 'privacy-lens.android-store-corpus.v1',
  corpusId: `fdroid-open-source-store-${count}-seed-${seed}`,
  corpusKind: 'OPEN_SOURCE_APP_STORE',
  source: {
    repository: 'https://f-droid.org/repo/',
    indexUrl: 'https://f-droid.org/repo/index-v2.json', indexSha256: digest(indexPath),
    signerIndexUrl: 'https://f-droid.org/repo/signer-index.json', signerIndexSha256: digest(signerPath),
    selection: { seed, count, maxApkBytes: maxBytes, minDeviceSdk: 31, architecture: 'arm64-v8a-or-none', strategy: 'deterministic-random-category-round-robin', selectedCategories },
  },
  apps: picked.map((candidate, indexInCorpus) => ({
    id: `fdroid-${String(indexInCorpus + 1).padStart(3, '0')}`,
    displayName: candidate.displayName,
    packageName: candidate.packageName,
    storeUrl: `https://f-droid.org/packages/${encodeURIComponent(candidate.packageName)}`,
    downloadUrl: `https://f-droid.org/repo/${encodeURIComponent(candidate.fileName)}`,
    expectedSignerSha256: candidate.expectedSignerSha256,
    category: selectedCategories[indexInCorpus], versionCode: candidate.versionCode, versionName: candidate.versionName, size: candidate.size,
    apkFiles: [{ path: path.join(apkDir, candidate.fileName), sha256: candidate.sha256 }],
  })),
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Wrote ${catalog.apps.length}-entry deterministic F-Droid catalog: ${output}`);
