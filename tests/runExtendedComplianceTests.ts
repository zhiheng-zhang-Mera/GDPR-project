import { GDPRComplianceEngine } from '../src/compliance/GDPRComplianceEngine';
import { calculateMetrics } from '../src/compliance/Evaluation';
import { STATUS_PRESENTATION } from '../src/compliance/DashboardModel';
import { createEvaluationConfig, createSimulationConfig, simulationToAudit } from '../src/compliance/ViolationSimulator';
import { ProcessingContext, SensitivePermission } from '../src/compliance/types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const now = 1_700_000_000_000;
const validContext: ProcessingContext = {
  purpose: 'Deliver a requested feature', lawfulBasis: 'CONTRACT',
  controllerIdentity: 'Example Controller', retentionDays: 1, userInitiated: true,
};

const malformedContexts: Record<string, unknown>[] = [
  { ...validContext, purpose: 7 },
  { ...validContext, controllerIdentity: [] },
  { ...validContext, article9Condition: {} },
  { ...validContext, consentWithdrawn: 'false' },
  { ...validContext, specialCategoryData: 1 },
  { ...validContext, userInitiated: 'true' },
];
for (const processingContext of malformedContexts) {
  const result = new GDPRComplianceEngine().evaluateSafe({
    packageName: 'extended.context', permissionType: 'LOCATION', accessCount: 1,
    windowStart: now - 1_000, windowEnd: now, processingContext,
  });
  assert(!result.accepted && result.code === 'INVALID_CONTEXT', 'Malformed context must return INVALID_CONTEXT.');
}

const timestampCases = [
  [now - 500],
  [now - 1_001, now - 500],
  [now - 500, now + 1],
  [now - 500.5, now - 400],
];
for (const accessTimestamps of timestampCases) {
  const result = new GDPRComplianceEngine().evaluateSafe({
    packageName: 'extended.timestamps', permissionType: 'MICROPHONE', accessCount: 2,
    windowStart: now - 1_000, windowEnd: now, accessTimestamps,
  });
  assert(!result.accepted && result.code === 'INVALID_TIMESTAMPS', 'Invalid timestamp evidence must fail closed.');
}

for (const invalidNumber of [Number.MAX_SAFE_INTEGER + 1, Number.POSITIVE_INFINITY]) {
  const invalidCount = new GDPRComplianceEngine().evaluateSafe({
    packageName: 'extended.numeric', permissionType: 'LOCATION', accessCount: invalidNumber,
    windowStart: now - 1_000, windowEnd: now,
  });
  assert(!invalidCount.accepted && invalidCount.code === 'INVALID_COUNT', 'Unsafe counts must fail closed.');
}

const invalidSource = new GDPRComplianceEngine().evaluateSafe({
  packageName: 'extended.source', permissionType: 'LOCATION', accessCount: 1,
  windowStart: now - 1_000, windowEnd: now, source: 'FORGED',
});
assert(!invalidSource.accepted && invalidSource.code === 'INVALID_SOURCE', 'Unknown sources must fail closed.');

for (const [permissionType, limit] of [['LOCATION', 12], ['MICROPHONE', 6], ['CONTACTS', 4]] as const) {
  const atLimit = Array.from({ length: limit }, (_, index) => now - 10_000 + index);
  const aboveLimit = Array.from({ length: limit + 1 }, (_, index) => now - 10_000 + index);
  const engine = new GDPRComplianceEngine();
  const normal = engine.evaluate({ packageName: `burst.limit.${permissionType}`, permissionType, accessCount: limit, windowStart: now - 60_000, windowEnd: now, accessTimestamps: atLimit, source: 'IMPORTED', processingContext: validContext });
  const alert = engine.evaluate({ packageName: `burst.above.${permissionType}`, permissionType, accessCount: limit + 1, windowStart: now - 60_000, windowEnd: now, accessTimestamps: aboveLimit, source: 'IMPORTED', processingContext: validContext });
  assert(!normal.signals.includes('BURST_RATE'), `${permissionType} must not alert at its burst limit.`);
  assert(alert.signals.includes('BURST_RATE'), `${permissionType} must alert above its burst limit.`);
}

const historyEngine = new GDPRComplianceEngine();
for (const permissionType of ['LOCATION', 'MICROPHONE', 'CONTACTS'] as SensitivePermission[]) {
  const first = historyEngine.evaluate({ packageName: 'history.a', permissionType, accessCount: 1, windowStart: now - 4_000, windowEnd: now - 3_000, source: 'IMPORTED' });
  const otherPackage = historyEngine.evaluate({ packageName: 'history.b', permissionType, accessCount: 100, windowStart: now - 2_000, windowEnd: now - 1_000, source: 'IMPORTED' });
  const second = historyEngine.evaluate({ packageName: 'history.a', permissionType, accessCount: 1, windowStart: now - 500, windowEnd: now, source: 'IMPORTED' });
  assert(!first.signals.includes('CROSS_WINDOW') && !second.signals.includes('CROSS_WINDOW'), `History leaked between packages for ${permissionType}.`);
  assert(otherPackage.isActive, `Large independent audit must remain detectable for ${permissionType}.`);
}
const simulatorHistory = new GDPRComplianceEngine();
simulatorHistory.evaluate({ packageName: 'history.sim', permissionType: 'LOCATION', accessCount: 20, windowStart: now - 2_000, windowEnd: now - 1_000, source: 'SIMULATOR' });
const simulatorSecond = simulatorHistory.evaluate({ packageName: 'history.sim', permissionType: 'LOCATION', accessCount: 20, windowStart: now - 500, windowEnd: now, source: 'SIMULATOR' });
assert(!simulatorSecond.signals.includes('CROSS_WINDOW'), 'Simulator history must not be presented as imported temporal evidence.');

const overlapEngine = new GDPRComplianceEngine();
overlapEngine.evaluate({ packageName: 'history.overlap', permissionType: 'LOCATION', accessCount: 20, windowStart: now - 60_000, windowEnd: now - 20_000, source: 'IMPORTED' });
const overlapping = overlapEngine.evaluate({ packageName: 'history.overlap', permissionType: 'LOCATION', accessCount: 20, windowStart: now - 30_000, windowEnd: now, source: 'IMPORTED' });
assert(!overlapping.signals.includes('CROSS_WINDOW'), 'Overlapping windows must not be double-counted as cross-window evidence.');
assert(overlapping.evidence.rollingCount === 20, 'Overlapping history must be excluded from the rolling count.');

const adjacentEngine = new GDPRComplianceEngine();
adjacentEngine.evaluate({ packageName: 'history.adjacent', permissionType: 'LOCATION', accessCount: 20, windowStart: now - 60_000, windowEnd: now - 30_000, source: 'IMPORTED' });
const adjacent = adjacentEngine.evaluate({ packageName: 'history.adjacent', permissionType: 'LOCATION', accessCount: 20, windowStart: now - 30_000, windowEnd: now, source: 'IMPORTED' });
assert(adjacent.signals.includes('CROSS_WINDOW'), 'Adjacent completed windows must remain eligible for cross-window evidence.');
assert(adjacent.evidence.rollingCount === 40, 'Adjacent completed windows must contribute to the rolling count.');

const replayEngine = new GDPRComplianceEngine();
const replayAudit = { packageName: 'history.replay', permissionType: 'LOCATION' as const, accessCount: 20, windowStart: now - 60_000, windowEnd: now - 30_000, source: 'IMPORTED' as const };
replayEngine.evaluate(replayAudit);
replayEngine.evaluate(replayAudit);
const afterReplay = replayEngine.evaluate({ ...replayAudit, windowStart: now - 30_000, windowEnd: now });
assert(afterReplay.evidence.rollingCount === 40, 'An identical replay must replace, not duplicate, stored window evidence.');

for (const randomValue of [0, 0.999_999_999]) {
  const config = createSimulationConfig(now, () => randomValue);
  assert(config.totalCalls >= 50 && config.totalCalls <= 200, 'Simulation count escaped the documented 50-200 range.');
  assert(config.triggerTimes.length === config.totalCalls, 'Simulation timestamps must match totalCalls.');
  assert(config.triggerTimes.every((value) => value >= now - 86_400_000 && value < now), 'Simulation timestamp escaped its 24-hour window.');
  assert(new GDPRComplianceEngine().evaluateSafe(simulationToAudit(config)).accepted, 'Bounded simulator output must be accepted.');
}
for (let round = 0; round < 100; round += 1) {
  const control = createEvaluationConfig(round, now, () => 0.5);
  assert(control.expectedViolation === ((round + 1) % 5 !== 0), 'Evaluation corpus must preserve its 80/20 design.');
}

for (const samples of [[], [{ expectedViolation: false, detectedViolation: false }], [{ expectedViolation: true, detectedViolation: false }]]) {
  const metrics = calculateMetrics(samples);
  assert(Number.isFinite(metrics.precision) && Number.isFinite(metrics.recall), 'Metrics must never produce NaN or Infinity.');
}
for (const presentation of Object.values(STATUS_PRESENTATION)) {
  assert(presentation.label.trim().length > 0 && presentation.marker.trim().length > 0, 'Every status requires text and a marker.');
}

console.log('Extended input, temporal-isolation, simulator-boundary, metric, and presentation tests passed.');
