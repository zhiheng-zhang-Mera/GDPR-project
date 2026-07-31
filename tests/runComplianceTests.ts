import { calculateMetrics } from '../src/compliance/Evaluation';
import { GDPRComplianceEngine } from '../src/compliance/GDPRComplianceEngine';
import {
  createEvaluationConfig,
  createSimulationConfig,
  simulationToAudit,
} from '../src/compliance/ViolationSimulator';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const engine = new GDPRComplianceEngine();
const safe = engine.evaluate({
  packageName: 'safe.app',
  permissionType: 'LOCATION',
  accessCount: 36,
  windowStart: 0,
  windowEnd: 1,
});
assert(!safe.isActive, 'Count at the dynamic threshold must remain compliant.');

const violation = engine.evaluate({
  packageName: 'risky.app',
  permissionType: 'MICROPHONE',
  accessCount: 60,
  windowStart: 0,
  windowEnd: 1,
});
assert(violation.isActive, 'Excessive microphone access must be detected.');
assert(violation.riskLevel === 'CRITICAL', 'Large deviations must be critical.');

const sequence = [0.1, 0.99, ...Array.from({ length: 200 }, (_, i) => (i % 10) / 10)];
let position = 0;
const config = createSimulationConfig(1_000, () => sequence[position++] ?? 0.5);
const simulated = engine.evaluate(simulationToAudit(config));
assert(
  simulated.isActive === config.expectedViolation,
  'Simulation ground truth and engine verdict must agree.',
);

const evaluationSamples = Array.from({ length: 50 }, (_, round) => {
  const evaluationConfig = createEvaluationConfig(round);
  const result = engine.evaluate(simulationToAudit(evaluationConfig));
  return {
    expectedViolation: evaluationConfig.expectedViolation,
    detectedViolation: result.isActive,
  };
});
const evaluationMetrics = calculateMetrics(evaluationSamples);
assert(evaluationMetrics.truePositive === 40, '50-round evaluation must include 40 violations.');
assert(evaluationMetrics.trueNegative === 10, '50-round evaluation must include 10 controls.');
assert(evaluationMetrics.precision === 1, '50-round evaluation precision must be 1.');
assert(evaluationMetrics.recall === 1, '50-round evaluation recall must be 1.');

const metrics = calculateMetrics([
  { expectedViolation: true, detectedViolation: true },
  { expectedViolation: true, detectedViolation: false },
  { expectedViolation: false, detectedViolation: true },
  { expectedViolation: false, detectedViolation: false },
]);
assert(metrics.precision === 0.5, 'Precision calculation is incorrect.');
assert(metrics.recall === 0.5, 'Recall calculation is incorrect.');

console.log('Compliance engine tests passed.');
