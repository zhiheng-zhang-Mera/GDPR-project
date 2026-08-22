#!/usr/bin/env node
/* Creates a non-overlapping, reproducible follow-up corpus from prior run receipts. */
const { createHash } = require('crypto');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const values = (flag) => args.flatMap((value, index) => value === flag && args[index + 1] ? [args[index + 1]] : []);
const catalogPath = values('--catalog')[0];
const priorPaths = values('--prior');
const exclusionCatalogPaths = values('--exclude-catalog');
const output = values('--output')[0];
if (!catalogPath || !output || (!priorPaths.length && !exclusionCatalogPaths.length)) throw new Error('Usage: node scripts/exclude-attempted-store-corpus.js --catalog <verified-catalog.json> [--prior <results.json> ...] [--exclude-catalog <catalog.json> ...] --output <follow-up-catalog.json>');

const sha256 = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (catalog?.schema !== 'privacy-lens.android-store-corpus.v1' || !Array.isArray(catalog.apps) || catalog.apps.length < 100 || catalog.apps.length > 500) throw new Error('Input must be a 100-to-500 app v1 catalog.');
const attemptedPackages = new Set();
const priorRuns = priorPaths.map((priorPath) => {
  const prior = JSON.parse(fs.readFileSync(priorPath, 'utf8'));
  if (prior?.schema !== 'privacy-lens.android-store-corpus-run.v1' || !Array.isArray(prior.results) || !Array.isArray(prior.failures)) throw new Error(`Invalid prior run receipt: ${priorPath}`);
  if (prior.corpusKind !== catalog.corpusKind) throw new Error(`Corpus kind mismatch for prior run: ${priorPath}`);
  for (const item of [...prior.results, ...prior.failures]) {
    if (!/^[A-Za-z0-9_.-]+$/.test(item?.packageName || '')) throw new Error(`Prior run contains an invalid package identity: ${priorPath}`);
    attemptedPackages.add(item.packageName);
  }
  return { path: path.normalize(priorPath), sha256: sha256(priorPath), results: prior.results.length, failures: prior.failures.length };
});
const excludedCatalogs = exclusionCatalogPaths.map((exclusionPath) => {
  const exclusionCatalog = JSON.parse(fs.readFileSync(exclusionPath, 'utf8'));
  if (exclusionCatalog?.schema !== 'privacy-lens.android-store-corpus.v1' || exclusionCatalog.corpusKind !== catalog.corpusKind || !Array.isArray(exclusionCatalog.apps)) throw new Error(`Invalid or incompatible exclusion catalog: ${exclusionPath}`);
  for (const app of exclusionCatalog.apps) {
    if (!/^[A-Za-z0-9_.-]+$/.test(app?.packageName || '')) throw new Error(`Exclusion catalog contains an invalid package identity: ${exclusionPath}`);
    attemptedPackages.add(app.packageName);
  }
  return { path: path.normalize(exclusionPath), sha256: sha256(exclusionPath), apps: exclusionCatalog.apps.length };
});
const apps = catalog.apps.filter((app) => !attemptedPackages.has(app.packageName));
if (apps.length < 100 || apps.length > 500) throw new Error(`Follow-up corpus requires 100 to 500 unattempted apps; received ${apps.length}.`);
const followUp = {
  ...catalog,
  corpusId: `${catalog.corpusId}-unattempted-${apps.length}`,
  source: { ...catalog.source, priorRunExclusions: { attemptedPackages: attemptedPackages.size, priorRuns, excludedCatalogs } },
  apps,
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(followUp, null, 2)}\n`);
console.log(`Wrote ${apps.length}-entry follow-up corpus excluding ${attemptedPackages.size} attempted packages: ${output}`);
