import { EvaluationMetrics } from './types';

export function calculateMetrics(
  samples: Array<{ expectedViolation: boolean; detectedViolation: boolean }>,
): EvaluationMetrics {
  let truePositive = 0;
  let falsePositive = 0;
  let trueNegative = 0;
  let falseNegative = 0;

  for (const sample of samples) {
    if (sample.expectedViolation && sample.detectedViolation) truePositive += 1;
    else if (!sample.expectedViolation && sample.detectedViolation) falsePositive += 1;
    else if (!sample.expectedViolation && !sample.detectedViolation) trueNegative += 1;
    else falseNegative += 1;
  }

  return {
    truePositive,
    falsePositive,
    trueNegative,
    falseNegative,
    precision: truePositive + falsePositive === 0 ? 1 : truePositive / (truePositive + falsePositive),
    recall: truePositive + falseNegative === 0 ? 1 : truePositive / (truePositive + falseNegative),
  };
}
