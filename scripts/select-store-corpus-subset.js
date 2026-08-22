#!/usr/bin/env node
/* Selects a bounded reproducible subset and redirects APK paths to an isolated download directory. */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const value = (flag) => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
const input = value('--input'); const output = value('--output'); const apkDir = value('--apk-dir'); const count = Number(value('--count'));
if (!input || !output || !apkDir || !Number.isInteger(count) || count < 100 || count > 500) throw new Error('Usage: node scripts/select-store-corpus-subset.js --input <catalog.json> --count <100..500> --apk-dir <isolated-dir> --output <catalog.json>');
const catalog = JSON.parse(fs.readFileSync(input, 'utf8'));
if (catalog?.schema !== 'privacy-lens.android-store-corpus.v1' || !Array.isArray(catalog.apps) || catalog.apps.length < count) throw new Error('Input catalog does not contain the requested subset size.');
const apps = catalog.apps.slice(0, count).map((app, index) => {
  const original = app.apkFiles?.[0];
  if (!original?.path || !/^[a-f0-9]{64}$/i.test(original.sha256 || '')) throw new Error(`Invalid APK entry: ${app.id}`);
  return { ...app, id: `${app.id}-subset-${String(index + 1).padStart(3, '0')}`, apkFiles: [{ ...original, path: path.join(apkDir, path.basename(original.path)) }] };
});
const subset = {
  ...catalog,
  corpusId: `${catalog.corpusId}-subset-${count}`,
  source: { ...catalog.source, subset: { count, selection: 'first-unattempted-from-deterministic-category-balanced-catalog', isolatedApkDirectory: path.normalize(apkDir) } },
  apps,
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(subset, null, 2)}\n`);
console.log(`Wrote ${apps.length}-entry isolated subset: ${output}`);
