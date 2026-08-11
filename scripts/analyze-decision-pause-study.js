const fs = require('node:fs');
const path = require('node:path');

const EXPECTED_HEADERS = [
  'evidence_class', 'participant_id', 'arm', 'correct_signal_not_verdict',
  'impulsive_action_intent', 'confidence_correctness', 'task_time_ms',
  'proportionate_next_step',
];

function fail(message) {
  throw new Error(`Decision-pause analysis rejected input: ${message}`);
}

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { field += '"'; index += 1; } else { quoted = !quoted; }
    } else if (character === ',' && !quoted) {
      row.push(field); field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field); field = '';
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
    } else {
      field += character;
    }
  }
  if (quoted) fail('unterminated quoted field');
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function integer(value, minimum, maximum, fieldName) {
  if (!/^-?\d+$/.test(value)) fail(`${fieldName} must be an integer`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) fail(`${fieldName} escaped ${minimum}-${maximum}`);
  return parsed;
}

function mean(values) { return values.reduce((sum, value) => sum + value, 0) / values.length; }

function wilson(successes, total) {
  const z = 1.959963984540054;
  const p = successes / total;
  const denominator = 1 + (z * z) / total;
  const center = (p + (z * z) / (2 * total)) / denominator;
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total) / denominator;
  return [center - margin, center + margin];
}

function normalCdf(x) {
  const sign = x < 0 ? -1 : 1;
  const absolute = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * absolute);
  const erf = sign * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-absolute * absolute));
  return 0.5 * (1 + erf);
}

function summarize(records) {
  const grouped = Object.fromEntries(['BASELINE', 'DECISION_PAUSE'].map((arm) => {
    const subset = records.filter((record) => record.arm === arm);
    if (subset.length === 0) fail(`arm ${arm} has no rows`);
    const successes = subset.reduce((sum, record) => sum + record.correct, 0);
    return [arm, {
      n: subset.length,
      correct: successes,
      correct_rate: successes / subset.length,
      correct_wilson_95: wilson(successes, subset.length),
      mean_impulsive_action_intent: mean(subset.map((record) => record.impulsive)),
      mean_confidence_correctness: mean(subset.map((record) => record.confidence)),
      mean_task_time_ms: mean(subset.map((record) => record.time)),
      proportionate_next_step_rate: mean(subset.map((record) => record.proportionate)),
    }];
  }));
  const baseline = grouped.BASELINE;
  const intervention = grouped.DECISION_PAUSE;
  const difference = intervention.correct_rate - baseline.correct_rate;
  const unpooledSe = Math.sqrt((intervention.correct_rate * (1 - intervention.correct_rate)) / intervention.n + (baseline.correct_rate * (1 - baseline.correct_rate)) / baseline.n);
  const pooled = (intervention.correct + baseline.correct) / (intervention.n + baseline.n);
  const pooledSe = Math.sqrt(pooled * (1 - pooled) * (1 / intervention.n + 1 / baseline.n));
  const z = pooledSe === 0 ? 0 : difference / pooledSe;
  return {
    groups: grouped,
    primary: {
      risk_difference: difference,
      risk_difference_wald_95: [difference - 1.959963984540054 * unpooledSe, difference + 1.959963984540054 * unpooledSe],
      two_sided_z: z,
      two_sided_p_approx: 2 * (1 - normalCdf(Math.abs(z))),
    },
  };
}

const inputPath = process.argv[2];
if (!inputPath) fail('usage: node scripts/analyze-decision-pause-study.js <input.csv>');
const resolved = path.resolve(inputPath);
const rows = parseCsv(fs.readFileSync(resolved, 'utf8'));
if (rows.length < 3) fail('header and at least one row per arm are required');
const headers = rows.shift();
if (headers.length !== EXPECTED_HEADERS.length || headers.some((header, index) => header !== EXPECTED_HEADERS[index])) fail(`headers must exactly equal ${EXPECTED_HEADERS.join(',')}`);
const seen = new Set();
const records = rows.map((values, rowIndex) => {
  if (values.length !== headers.length) fail(`row ${rowIndex + 2} has ${values.length} columns`);
  const record = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  if (!['PARTICIPANT', 'SIMULATED_PIPELINE_ONLY'].includes(record.evidence_class)) fail(`row ${rowIndex + 2} has invalid evidence_class`);
  if (!record.participant_id || seen.has(record.participant_id)) fail(`row ${rowIndex + 2} has empty or duplicate participant_id`);
  seen.add(record.participant_id);
  if (!['BASELINE', 'DECISION_PAUSE'].includes(record.arm)) fail(`row ${rowIndex + 2} has invalid arm`);
  return {
    evidenceClass: record.evidence_class,
    arm: record.arm,
    correct: integer(record.correct_signal_not_verdict, 0, 1, 'correct_signal_not_verdict'),
    impulsive: integer(record.impulsive_action_intent, 1, 7, 'impulsive_action_intent'),
    confidence: integer(record.confidence_correctness, 0, 100, 'confidence_correctness'),
    time: integer(record.task_time_ms, 3000, 3_600_000, 'task_time_ms'),
    proportionate: integer(record.proportionate_next_step, 0, 1, 'proportionate_next_step'),
  };
});
const evidenceClasses = [...new Set(records.map((record) => record.evidenceClass))];
if (evidenceClasses.length !== 1) fail('evidence classes may not be mixed');
const output = { evidence_class: evidenceClasses[0], input_file: resolved, ...summarize(records) };
if (output.evidence_class === 'SIMULATED_PIPELINE_ONLY') output.warning = 'Synthetic dry run only. Do not cite as participant evidence or product effect.';
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
