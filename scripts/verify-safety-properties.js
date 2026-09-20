#!/usr/bin/env node
/**
 * Structural check of the safety-property catalogue.
 *
 * IMPORTANT: this script does NOT execute a property test. It verifies that the
 * catalogue is complete and internally consistent, and that each registered
 * property names a test file containing its declared evidence marker. Its output
 * is worded accordingly, because reporting "9/9 curated mutants detected" from a
 * division of two committed integers would misrepresent what ran here.
 *
 * The executable form of the mutation claim is `npm run verify:mutation`, which
 * applies each registered weakening to an isolated copy of the sources,
 * recompiles, and requires the compiled suite to fail.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'docs/research/safety-property-catalog.json'), 'utf8'));
const required = ['id', 'definition', 'positiveCase', 'counterexample', 'testFile', 'testEvidence', 'mutantId'];
const ids = new Set();
const mutants = new Set();
for (const property of catalog.properties) {
  for (const field of required) if (!property[field]) throw new Error(`${property.id || 'property'} lacks ${field}.`);
  if (ids.has(property.id) || mutants.has(property.mutantId)) throw new Error('Property and mutant identifiers must be unique.');
  ids.add(property.id);
  mutants.add(property.mutantId);
  const testPath = path.join(root, property.testFile);
  if (!fs.existsSync(testPath)) throw new Error(`${property.id} names a test file that does not exist: ${property.testFile}`);
  const test = fs.readFileSync(testPath, 'utf8').toLowerCase();
  if (!test.includes(property.testEvidence.toLowerCase())) throw new Error(`${property.id} has no matching executable test evidence in ${property.testFile}.`);
}
const run = catalog.mutationRun;
if (run.status !== 'COMPLETE' || run.total !== mutants.size || run.killed + run.survived + run.equivalentOrInvalid !== run.total) throw new Error('Mutation totals are inconsistent.');
if (run.survived !== 0) throw new Error('A non-equivalent high-risk mutant survived.');
if (run.score !== run.killed / (run.total - run.equivalentOrInvalid)) throw new Error('Mutation score is not derived from observed totals.');
console.log(
  `Safety-property catalogue verified: ${ids.size} properties, each naming existing test evidence, ` +
  `and a recorded mutation run of ${run.killed}/${run.total} detected. ` +
  'This is a structural check only; run "npm run verify:mutation" for executable mutant detection.',
);
