#!/usr/bin/env node
/* Produces adjudicated-comparison metrics; missing telemetry is never coerced to zero. */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const get = (flag) => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
const input = get('--input');
const output = get('--output');
if (!input || !output) throw new Error('Usage: node scripts/summarize-store-corpus-evaluation.js --input <independently-adjudicated-100.json> --output <summary.json>');
const evaluation = JSON.parse(fs.readFileSync(input, 'utf8'));
if (evaluation?.schema !== 'privacy-lens.android-store-evaluation.v2' || !evaluation.labellingProtocol || !Array.isArray(evaluation.cases) || evaluation.cases.length !== 100) throw new Error('Evaluation must contain exactly 100 independently adjudicated cases using the v2 schema.');
const declaredReviewers = new Set(evaluation.labellingProtocol.reviewerIds);
if (declaredReviewers.size < 2 || [...declaredReviewers].some((reviewer) => typeof reviewer !== 'string' || !reviewer.trim()) || typeof evaluation.labellingProtocol.taskDefinitionId !== 'string' || !evaluation.labellingProtocol.taskDefinitionId.trim() || typeof evaluation.labellingProtocol.preregistrationReference !== 'string' || !evaluation.labellingProtocol.preregistrationReference.trim()) throw new Error('Labelling protocol requires a task definition, preregistration reference, and at least two distinct reviewer IDs.');
const ids = new Set();
const names = new Set();
for (const record of evaluation.cases) {
  if (!record?.id || ids.has(record.id) || !Array.isArray(record.independentReviews) || record.independentReviews.length < 2 || !record.adjudication || typeof record.adjudication.label !== 'boolean' || !record.predictions || typeof record.predictions !== 'object') throw new Error('Each case needs a unique id, at least two independent reviews, an adjudication, and predictions.');
  ids.add(record.id);
  const reviewers = new Set(); const reviewLabels = [];
  for (const review of record.independentReviews) {
    if (!review || !declaredReviewers.has(review.reviewerId) || reviewers.has(review.reviewerId) || typeof review.label !== 'boolean' || typeof review.evidenceReference !== 'string' || !review.evidenceReference.trim()) throw new Error(`Invalid independent review for ${record.id}.`);
    reviewers.add(review.reviewerId); reviewLabels.push(review.label);
  }
  const unanimous = reviewLabels.every((label) => label === reviewLabels[0]);
  if (record.adjudication.method === 'CONSENSUS') {
    if (!unanimous || record.adjudication.label !== reviewLabels[0] || record.adjudication.adjudicatorId !== undefined) throw new Error(`Consensus adjudication for ${record.id} must exactly match distinct reviewer agreement.`);
  } else if (record.adjudication.method === 'ADJUDICATED') {
    if (unanimous || typeof record.adjudication.adjudicatorId !== 'string' || reviewers.has(record.adjudication.adjudicatorId) || typeof record.adjudication.rationaleReference !== 'string' || !record.adjudication.rationaleReference.trim()) throw new Error(`Disputed case ${record.id} requires a non-reviewer adjudicator and rationale reference.`);
  } else throw new Error(`Unknown adjudication method for ${record.id}.`);
  Object.entries(record.predictions).forEach(([name, prediction]) => {
    if (typeof prediction !== 'boolean') throw new Error(`Prediction ${name} for ${record.id} must be boolean.`);
    names.add(name);
  });
}
const finiteValues = (values) => values.filter((value) => Number.isFinite(value));
const mean = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined;
const rows = {};
for (const name of [...names].sort()) {
  const cells = { tp: 0, fp: 0, tn: 0, fn: 0, unreported: 0 };
  const elapsed = []; const memory = [];
  for (const record of evaluation.cases) {
    const prediction = record.predictions[name];
    if (typeof prediction !== 'boolean') { cells.unreported += 1; continue; }
    if (prediction && record.adjudication.label) cells.tp += 1;
    else if (prediction) cells.fp += 1;
    else if (record.adjudication.label) cells.fn += 1;
    else cells.tn += 1;
    const measured = record.measurements?.[name] ?? {};
    elapsed.push(measured.elapsedMs); memory.push(measured.memoryPssKb);
  }
  const precisionDenominator = cells.tp + cells.fp;
  const recallDenominator = cells.tp + cells.fn;
  const precision = precisionDenominator ? cells.tp / precisionDenominator : undefined;
  const recall = recallDenominator ? cells.tp / recallDenominator : undefined;
  rows[name] = {
    confusionMatrix: cells,
    precision, recall,
    f1: precision !== undefined && recall !== undefined && precision + recall ? (2 * precision * recall) / (precision + recall) : undefined,
    coverage: (100 - cells.unreported) / 100,
    telemetry: {
      elapsedMs: { mean: mean(finiteValues(elapsed)), observed: finiteValues(elapsed).length },
      memoryPssKb: { mean: mean(finiteValues(memory)), observed: finiteValues(memory).length },
    },
  };
}
const summary = { schema: 'privacy-lens.android-store-evaluation-summary.v2', corpusId: evaluation.corpusId, generatedAt: new Date().toISOString(), sampleSize: 100, independentlyAdjudicated: true, labellingProtocol: evaluation.labellingProtocol, tools: rows, caveat: 'Metrics apply only to the supplied, independently reviewed and adjudicated task labels. A review request or static potential flow is not a GDPR infringement determination; missing telemetry remains missing. Energy is intentionally outside this authorised evaluation scope.' };
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(summary, null, 2)}\n`);
console.log(`Evaluation summary written for ${Object.keys(rows).length} tools and 100 independently labelled cases.`);
