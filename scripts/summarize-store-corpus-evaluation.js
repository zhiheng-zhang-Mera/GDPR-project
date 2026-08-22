#!/usr/bin/env node
/* Produces labelled-comparison metrics; missing telemetry is never coerced to zero. */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const get = (flag) => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
const input = get('--input');
const output = get('--output');
if (!input || !output) throw new Error('Usage: node scripts/summarize-store-corpus-evaluation.js --input <independently-labelled-100.json> --output <summary.json>');
const evaluation = JSON.parse(fs.readFileSync(input, 'utf8'));
if (evaluation?.schema !== 'privacy-lens.android-store-evaluation.v1' || !Array.isArray(evaluation.cases) || evaluation.cases.length !== 100) throw new Error('Evaluation must contain exactly 100 independently labelled cases.');
const ids = new Set();
const names = new Set();
for (const record of evaluation.cases) {
  if (!record?.id || ids.has(record.id) || typeof record.independentLabel !== 'boolean' || !record.predictions || typeof record.predictions !== 'object') throw new Error('Each case needs a unique id, independent boolean label, and predictions.');
  ids.add(record.id);
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
  const elapsed = []; const memory = []; const energy = [];
  for (const record of evaluation.cases) {
    const prediction = record.predictions[name];
    if (typeof prediction !== 'boolean') { cells.unreported += 1; continue; }
    if (prediction && record.independentLabel) cells.tp += 1;
    else if (prediction) cells.fp += 1;
    else if (record.independentLabel) cells.fn += 1;
    else cells.tn += 1;
    const measured = record.measurements?.[name] ?? {};
    elapsed.push(measured.elapsedMs); memory.push(measured.memoryPssKb); energy.push(measured.estimatedPowerMah);
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
      estimatedPowerMah: { mean: mean(finiteValues(energy)), observed: finiteValues(energy).length },
    },
  };
}
const summary = { schema: 'privacy-lens.android-store-evaluation-summary.v1', corpusId: evaluation.corpusId, generatedAt: new Date().toISOString(), sampleSize: 100, independentlyLabelled: true, tools: rows, caveat: 'Metrics apply only to the supplied independent labels. A review request or static potential flow is not a GDPR infringement determination; missing telemetry remains missing.' };
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(summary, null, 2)}\n`);
console.log(`Evaluation summary written for ${Object.keys(rows).length} tools and 100 independently labelled cases.`);
