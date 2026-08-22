#!/usr/bin/env node
/* Materialises a runnable catalog from a signed-download receipt. */
const { createHash } = require('crypto');
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const get = (flag) => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
const catalogPath = get('--catalog'); const receiptPath = get('--receipt'); const output = get('--output');
if (!catalogPath || !receiptPath || !output) throw new Error('Usage: node scripts/filter-verified-store-corpus.js --catalog <catalog.json> --receipt <download-receipt.json> --output <verified-catalog.json>');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
if (catalog?.schema !== 'privacy-lens.android-store-corpus.v1' || receipt?.schema !== 'privacy-lens.verified-apk-download.v1' || catalog.corpusId !== receipt.corpusId) throw new Error('Catalog and download receipt are incompatible.');
const verified = new Set((receipt.verified || []).map((item) => item.id));
const apps = (catalog.apps || []).filter((app) => verified.has(app.id));
if (apps.length < 100 || apps.length > 500) throw new Error(`Verified catalog requires 100 to 500 entries; received ${apps.length}.`);
const receiptSha256 = createHash('sha256').update(fs.readFileSync(receiptPath)).digest('hex');
const filtered = { ...catalog, corpusId: `${catalog.corpusId}-verified-${apps.length}`, source: { ...catalog.source, verifiedDownloadReceipt: { schema: receipt.schema, sha256: receiptSha256, verified: apps.length, rejected: (receipt.rejected || []).length } }, apps };
fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, `${JSON.stringify(filtered, null, 2)}\n`);
console.log(`Wrote ${apps.length}-entry verified catalog: ${output}`);
