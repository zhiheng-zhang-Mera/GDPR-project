#!/usr/bin/env node
/* Scores FlowDroid only where a public DroidBench label and an emitted result are both available. */
const { createHash } = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const value = (flag) => {
  const index = args.indexOf(flag);
  return index < 0 ? undefined : args[index + 1];
};
const input = value('--input');
const output = value('--output');
if (!input || !output) throw new Error('Usage: node scripts/summarize-droidbench-flowdroid.js --input <ground-truth.json> --output <summary.json>');

const absoluteInput = path.resolve(input);
const labels = JSON.parse(fs.readFileSync(absoluteInput, 'utf8'));
if (labels?.schema !== 'privacy-lens.droidbench-ground-truth.v1' || !Array.isArray(labels.cases) || labels.cases.length === 0) {
  throw new Error(`Invalid DroidBench ground-truth manifest: ${input}`);
}
const digest = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const rate = (numerator, denominator) => denominator === 0 ? null : Number((numerator / denominator).toFixed(6));
const matrix = { tp: 0, fp: 0, tn: 0, fn: 0 };
const evaluated = []; const unresolved = [];
for (const item of labels.cases) {
  if (!item.id || typeof item.expectedLeak !== 'boolean' || !item.receiptPath) throw new Error(`Invalid labelled case: ${JSON.stringify(item)}`);
  const receiptFile = path.resolve(root, item.receiptPath);
  if (!fs.existsSync(receiptFile)) {
    unresolved.push({ id: item.id, reason: 'MISSING_RECEIPT', receiptPath: item.receiptPath });
    continue;
  }
  const receipt = JSON.parse(fs.readFileSync(receiptFile, 'utf8'));
  if (receipt?.schema !== 'privacy-lens.flowdroid-baseline.v1') throw new Error(`Invalid FlowDroid receipt: ${receiptFile}`);
  if (receipt.status !== 'COMPLETED' || !Number.isInteger(receipt.resultCount) || receipt.resultCount < 0) {
    unresolved.push({ id: item.id, reason: receipt.status || 'INVALID_RECEIPT', receiptPath: item.receiptPath, receiptSha256: digest(receiptFile) });
    continue;
  }
  const predictedLeak = receipt.resultCount > 0;
  if (item.expectedLeak && predictedLeak) matrix.tp += 1;
  else if (!item.expectedLeak && predictedLeak) matrix.fp += 1;
  else if (!item.expectedLeak && !predictedLeak) matrix.tn += 1;
  else matrix.fn += 1;
  evaluated.push({ id: item.id, expectedLeak: item.expectedLeak, predictedLeak, resultCount: receipt.resultCount, receiptPath: item.receiptPath, receiptSha256: digest(receiptFile) });
}
const precision = rate(matrix.tp, matrix.tp + matrix.fp);
const recall = rate(matrix.tp, matrix.tp + matrix.fn);
const f1 = precision === null || recall === null || precision + recall === 0 ? null : Number((2 * precision * recall / (precision + recall)).toFixed(6));
const summary = {
  schema: 'privacy-lens.droidbench-flowdroid-summary.v1', generatedAt: new Date().toISOString(),
  groundTruth: { path: path.normalize(input), sha256: digest(absoluteInput), suite: labels.suite },
  evaluation: { labelledCases: labels.cases.length, evaluatedCases: evaluated.length, unresolvedCases: unresolved.length, confusionMatrix: matrix, precision, recall, f1 },
  evaluated, unresolved,
  caveat: 'This is a small public benchmark score for FlowDroid only. It excludes completed runs that emitted no result artifact rather than treating them as zero flows. It is neither an evaluation of Privacy Lens nor a GDPR-compliance or commercial-app accuracy claim.',
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(summary, null, 2)}\n`);
console.log(`Scored ${evaluated.length}/${labels.cases.length} labelled cases; unresolved=${unresolved.length}; F1=${f1 ?? 'NOT_COMPUTABLE'}.`);
