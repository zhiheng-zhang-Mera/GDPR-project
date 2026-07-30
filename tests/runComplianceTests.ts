import { calculateMetrics } from '../src/compliance/Evaluation';
import { GDPRComplianceEngine } from '../src/compliance/GDPRComplianceEngine';
import { createSimulationConfig, simulationToAudit } from '../src/compliance/ViolationSimulator';

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

const metrics = calculateMetrics([
  { expectedViolation: true, detectedViolation: true },
  { expectedViolation: true, detectedViolation: false },
  { expectedViolation: false, detectedViolation: true },
  { expectedViolation: false, detectedViolation: false },
]);
assert(metrics.precision === 0.5, 'Precision calculation is incorrect.');
assert(metrics.recall === 0.5, 'Recall calculation is incorrect.');

console.log('Compliance engine tests passed.');
