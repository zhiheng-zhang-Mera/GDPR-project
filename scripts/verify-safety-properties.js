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
  const test = fs.readFileSync(path.join(root, property.testFile), 'utf8').toLowerCase();
  if (!test.includes(property.testEvidence.toLowerCase())) throw new Error(`${property.id} has no matching executable test evidence.`);
}
const run = catalog.mutationRun;
if (run.status !== 'COMPLETE' || run.total !== mutants.size || run.killed + run.survived + run.equivalentOrInvalid !== run.total) throw new Error('Mutation totals are inconsistent.');
if (run.survived !== 0) throw new Error('A non-equivalent high-risk mutant survived.');
if (run.score !== run.killed / (run.total - run.equivalentOrInvalid)) throw new Error('Mutation score is not derived from observed totals.');
console.log(`Safety properties verified: ${ids.size} properties, ${run.killed}/${run.total} curated mutants detected.`);
