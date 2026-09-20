#!/usr/bin/env node
/**
 * Thesis-facing temporal stress reproduction.
 *
 * Runs the full fixed-seed campaign twice from the compiled source and requires
 * both executions to report identical observed results. A single run can pass by
 * chance on a stateful bug; two agreeing runs over the same seed and the same
 * generated inputs is the weakest honest determinism check available without an
 * independent implementation.
 *
 * The receipt is written under `artifacts/reproduction/<host>/`, which is
 * generated output and therefore not tracked. Host facts are recorded as
 * provenance only and never feed the campaign.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const driver = path.join(root, '.compliance-test-build', 'tests', 'runTemporalStressCampaign.js');
const argument = (name) => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
};
const outputDir = path.resolve(
  argument('output-dir') || path.join(root, 'artifacts', 'reproduction', os.hostname().replace(/[^A-Za-z0-9._-]/g, '_')),
);

if (!fs.existsSync(driver)) {
  throw new Error('Compile the campaign first: tsc -p tsconfig.compliance-tests.json');
}
fs.mkdirSync(outputDir, { recursive: true });

function run(label) {
  const receiptPath = path.join(outputDir, `temporal-stress-campaign-${label}.json`);
  process.stdout.write(execFileSync(process.execPath, [driver, '--receipt', receiptPath], { encoding: 'utf8' }).replace(/\r\n/g, '\n'));
  return { receipt: JSON.parse(fs.readFileSync(receiptPath, 'utf8')), receiptPath };
}

const first = run('run1');
const second = run('run2');

/** Only the deterministic outcome is compared; timing is host-dependent. */
const DETERMINISTIC_FIELDS = ['assertions', 'ruleMatches'];
const deterministicOutcome = (receipt) => JSON.stringify(Object.fromEntries(
  DETERMINISTIC_FIELDS.map((field) => [field, receipt.observed[field]]),
));
if (deterministicOutcome(first.receipt) !== deterministicOutcome(second.receipt)) {
  throw new Error(
    `The stress campaign is not deterministic: run 1 observed ${deterministicOutcome(first.receipt)} ` +
    `but run 2 observed ${deterministicOutcome(second.receipt)}.`,
  );
}

const { campaign, observed: result, host, seed } = first.receipt;
const summary = {
  schema: 'privacy-lens.temporal-stress-summary.v1',
  seed,
  evaluatedAt: first.receipt.evaluatedAt,
  campaign,
  observed: result,
  host,
  determinism: {
    runs: 2,
    verdict: 'IDENTICAL_DETERMINISTIC_RESULTS',
    comparedFields: DETERMINISTIC_FIELDS,
    excludedFields: ['elapsedMs', 'generatedAt'],
    note: 'Elapsed time and generation timestamp intentionally differ between runs and are excluded from the comparison.',
  },
  receipts: [path.relative(root, first.receiptPath), path.relative(root, second.receiptPath)],
  caveat: first.receipt.caveat,
};
const summaryPath = path.join(outputDir, 'temporal-stress-summary.json');
fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

console.log(
  `Temporal stress reproduction verified: ${result.assertions} assertions, ` +
  `${Object.keys(result.ruleMatches).length} rules matched, two runs agreed.`,
);
console.log(`Receipts: ${path.relative(root, summaryPath)}`);
