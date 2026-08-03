import { calculateMetrics } from '../src/compliance/Evaluation';
import { GDPRComplianceEngine } from '../src/compliance/GDPRComplianceEngine';
import { filterFindings, STATUS_PRESENTATION, summarizeFindings } from '../src/compliance/DashboardModel';
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

let seed = 0x5eed1234;
const seededRandom = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 0x1_0000_0000;
};
const monteCarloSamples = Array.from({ length: 1_000 }, (_, round) => {
  const evaluationConfig = createEvaluationConfig(round, 1_700_000_000_000 + round, seededRandom);
  const result = new GDPRComplianceEngine().evaluate(simulationToAudit(evaluationConfig));
  return {
    expectedViolation: evaluationConfig.expectedViolation,
    detectedViolation: result.isActive,
  };
});
const monteCarloMetrics = calculateMetrics(monteCarloSamples);
assert(monteCarloMetrics.truePositive === 800, '1000-round evaluation must include 800 violations.');
assert(monteCarloMetrics.trueNegative === 200, '1000-round evaluation must include 200 controls.');
assert(monteCarloMetrics.falsePositive === 0, '1000-round evaluation must have no false positives against its oracle.');
assert(monteCarloMetrics.falseNegative === 0, '1000-round evaluation must have no false negatives against its oracle.');
console.log(
  `1000-round seeded logical evaluation: TP=${monteCarloMetrics.truePositive}, TN=${monteCarloMetrics.trueNegative}, ` +
    `FP=${monteCarloMetrics.falsePositive}, FN=${monteCarloMetrics.falseNegative}, ` +
    `precision=${monteCarloMetrics.precision.toFixed(4)}, recall=${monteCarloMetrics.recall.toFixed(4)}.`,
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

const secureEngine = new GDPRComplianceEngine();
const invalidInputs: { value: unknown; code: string }[] = [
  { value: { packageName: 'x', permissionType: 'UNKNOWN', accessCount: 1, windowStart: 0, windowEnd: 1 }, code: 'UNSUPPORTED_PERMISSION' },
  { value: { packageName: 'x', permissionType: 'LOCATION', accessCount: Number.NaN, windowStart: 0, windowEnd: 1 }, code: 'INVALID_COUNT' },
  { value: { packageName: 'x', permissionType: 'LOCATION', accessCount: -1, windowStart: 0, windowEnd: 1 }, code: 'INVALID_COUNT' },
  { value: { packageName: 'x', permissionType: 'LOCATION', accessCount: 1, windowStart: 2, windowEnd: 1 }, code: 'INVALID_WINDOW' },
  { value: { packageName: 'x', permissionType: '__proto__', accessCount: 1, windowStart: 0, windowEnd: 1 }, code: 'UNSUPPORTED_PERMISSION' },
];
for (const sample of invalidInputs) {
  const result = secureEngine.evaluateSafe(sample.value);
  assert(!result.accepted && result.code === sample.code, `Expected ${sample.code}.`);
}
const burstTimes = Array.from({ length: 20 }, (_, index) => 1_000 + index * 100);
const burst = secureEngine.evaluate({ packageName: 'burst.app', permissionType: 'LOCATION', accessCount: 20, windowStart: 1_000, windowEnd: 61_000, accessTimestamps: burstTimes, source: 'IMPORTED' });
assert(burst.isActive && burst.signals.includes('BURST_RATE'), 'Burst must be detected.');
const splitEngine = new GDPRComplianceEngine();
const first = splitEngine.evaluate({ packageName: 'split.app', permissionType: 'LOCATION', accessCount: 20, windowStart: 1, windowEnd: 2, source: 'IMPORTED' });
const second = splitEngine.evaluate({ packageName: 'split.app', permissionType: 'LOCATION', accessCount: 20, windowStart: 3, windowEnd: 4, source: 'IMPORTED' });
assert(!first.isActive, 'First below-threshold window must remain normal.');
assert(second.isActive && second.signals.includes('CROSS_WINDOW'), 'Cross-window accumulation must be detected.');
const boundaryEngine = new GDPRComplianceEngine();
for (const [permissionType, threshold] of [['LOCATION', 36], ['MICROPHONE', 12], ['CONTACTS', 6]] as const) {
  for (let offset = -2; offset <= 2; offset += 1) {
    const result = boundaryEngine.evaluate({ packageName: `boundary.${permissionType}.${offset}`, permissionType, accessCount: threshold + offset, windowStart: 1, windowEnd: 2 });
    assert(result.isActive === (offset > 0), `Boundary failed for ${permissionType} ${offset}.`);
  }
}
console.log('Security boundary and temporal detection tests passed.');

const legalEngine = new GDPRComplianceEngine();
const insufficient = legalEngine.evaluate({ packageName: 'context.missing', permissionType: 'CONTACTS', accessCount: 1, windowStart: 1, windowEnd: 2 });
assert(insufficient.compliance.status === 'INSUFFICIENT_EVIDENCE', 'Missing legal context must not be labelled compliant.');
assert(insufficient.communication.notificationPriority === 'STANDARD', 'Evidence gaps require a review notification.');

const documented = legalEngine.evaluate({
  packageName: 'context.documented', permissionType: 'LOCATION', accessCount: 1, windowStart: 1, windowEnd: 2,
  processingContext: { purpose: 'Turn-by-turn navigation', lawfulBasis: 'CONTRACT', controllerIdentity: 'Example Controller', retentionDays: 1, userInitiated: true },
});
assert(documented.compliance.status === 'NO_TECHNICAL_CONCERN', 'Complete context without anomaly should produce no technical concern.');
assert(documented.communication.notificationPriority === 'SILENT', 'No-concern findings should be silent.');

const withdrawn = legalEngine.evaluate({
  packageName: 'context.withdrawn', permissionType: 'MICROPHONE', accessCount: 1, windowStart: 1, windowEnd: 2,
  processingContext: { purpose: 'Voice diary', lawfulBasis: 'CONSENT', controllerIdentity: 'Example Controller', retentionDays: 30, consentWithdrawn: true, specialCategoryData: true, article9Condition: 'Explicit consent previously recorded' },
});
assert(withdrawn.compliance.status === 'LIKELY_NON_COMPLIANT', 'Processing after withdrawal under consent must be escalated.');
assert(withdrawn.communication.notificationPriority === 'URGENT', 'Likely non-compliance must be urgent.');

const specialCategoryGap = legalEngine.evaluate({
  packageName: 'context.article9', permissionType: 'MICROPHONE', accessCount: 1, windowStart: 1, windowEnd: 2,
  processingContext: { purpose: 'Health symptom recording', lawfulBasis: 'CONSENT', controllerIdentity: 'Example Controller', retentionDays: 30, specialCategoryData: true },
});
assert(specialCategoryGap.compliance.missingEvidence.includes('Article 9 condition'), 'Special-category processing requires an Article 9 condition.');

const invalidContext = legalEngine.evaluateSafe({ packageName: 'context.invalid', permissionType: 'LOCATION', accessCount: 1, windowStart: 1, windowEnd: 2, processingContext: { lawfulBasis: 'MADE_UP', retentionDays: -1 } });
assert(!invalidContext.accepted && invalidContext.code === 'INVALID_CONTEXT', 'Malformed legal context must be rejected.');
console.log('GDPR accountability and communication tests passed.');

const dashboardFindings = [insufficient, documented, withdrawn];
const dashboardSummary = summarizeFindings(dashboardFindings);
assert(dashboardSummary.total === 3 && dashboardSummary.action === 1 && dashboardSummary.evidence === 1 && dashboardSummary.noConcern === 1, 'Dashboard summary must preserve distinct legal states.');
assert(filterFindings(dashboardFindings, 'ACTION')[0] === withdrawn, 'Action filter must surface likely conflicts.');
assert(filterFindings(dashboardFindings, 'EVIDENCE')[0] === insufficient, 'Evidence filter must surface missing context.');
assert(STATUS_PRESENTATION.REVIEW_REQUIRED.label.length > 0, 'Every state requires a non-colour label.');
console.log('Dashboard presentation and accessibility-state tests passed.');
