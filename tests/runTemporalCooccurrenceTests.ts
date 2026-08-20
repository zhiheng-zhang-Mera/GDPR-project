import { RulePackComplianceEngine } from '../src/compliance/RulePackComplianceEngine';
import { evaluateTemporalCooccurrence } from '../src/compliance/TemporalCooccurrenceEngine';
import { PrivacyObservation } from '../src/compliance/types';
import { getRegulationPack } from '../src/regulations/registry';
import { compileTemporalRuleMapping, validateTemporalRuleMapping } from '../src/regulations/temporalRuleMapping';
import { RegulationPack } from '../src/regulations/types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function permutations<T>(values: T[]): T[][] {
  if (values.length <= 1) return [values];
  return values.flatMap((value, index) => permutations([...values.slice(0, index), ...values.slice(index + 1)]).map((tail) => [value, ...tail]));
}

const gdpr = getRegulationPack('EU_GDPR');
const gdprRules = compileTemporalRuleMapping(gdpr);
const biometricRule = gdprRules.find(({ id }) => id === 'MULTIMODAL_BIOMETRIC_CAPTURE');
assert(biometricRule, 'GDPR biometric temporal mapping must compile.');
const evaluatedAt = Date.now() - 1_000;

const inside: PrivacyObservation[] = [
  { type: 'BODY_SENSORS', occurredAt: evaluatedAt - biometricRule.windowMs + 1, source: 'IMPORTED' },
  { type: 'MICROPHONE', occurredAt: evaluatedAt - 2_000, source: 'IMPORTED' },
  { type: 'CAMERA', occurredAt: evaluatedAt - 1_000, source: 'IMPORTED' },
];
const outside = inside.map((event, index) => index === 0 ? { ...event, occurredAt: evaluatedAt - biometricRule.windowMs - 1 } : event);
assert(evaluateTemporalCooccurrence({ packageName: 'test.boundary', evaluatedAt, observations: inside, rules: [biometricRule] }).length === 1, 'T-W+1ms must be included.');
assert(evaluateTemporalCooccurrence({ packageName: 'test.boundary', evaluatedAt, observations: outside, rules: [biometricRule] }).length === 0, 'T-W-1ms must be excluded.');

const sixEvents: PrivacyObservation[] = [
  ...inside,
  { type: 'BODY_SENSORS', occurredAt: evaluatedAt - 4_000, source: 'IMPORTED' },
  { type: 'LOCATION', occurredAt: evaluatedAt - 3_000, source: 'IMPORTED' },
  { type: 'CONTACTS', occurredAt: evaluatedAt - 5_000, source: 'IMPORTED' },
];
const invariant = evaluateTemporalCooccurrence({ packageName: 'test.permutation', evaluatedAt, observations: sixEvents, rules: [biometricRule] })[0];
assert(invariant, 'Reference permutation must match.');
for (const permutation of permutations(sixEvents)) {
  const result = evaluateTemporalCooccurrence({ packageName: 'test.permutation', evaluatedAt, observations: permutation, rules: [biometricRule] })[0];
  assert(result?.riskLevel === invariant.riskLevel, 'All 720 permutations must preserve risk level.');
  assert(result?.legalReferences.join('|') === invariant.legalReferences.join('|'), 'All 720 permutations must preserve legal references.');
  assert(result?.evidenceSha256 === invariant.evidenceSha256, 'All 720 permutations must preserve the evidence receipt.');
}

const burst: PrivacyObservation[] = Array.from({ length: 1_000 }, (_, index) => ({
  type: index % 3 === 0 ? 'BODY_SENSORS' : index % 3 === 1 ? 'MICROPHONE' : 'CAMERA',
  occurredAt: evaluatedAt - index,
  source: 'IMPORTED' as const,
}));
const burstStarted = performance.now();
const burstResult = evaluateTemporalCooccurrence({ packageName: 'test.burst', evaluatedAt, observations: burst, rules: gdprRules });
const burstElapsed = performance.now() - burstStarted;
assert(burstResult.some(({ ruleId }) => ruleId === biometricRule.id), '1,000-event burst must retain the combination.');
assert(burstElapsed <= 50, `1,000-event evaluation exceeded 50ms: ${burstElapsed.toFixed(3)}ms.`);

const researchRules = compileTemporalRuleMapping(getRegulationPack('GLOBAL_RESEARCH_BASELINE'));
const packSwitchEvents: PrivacyObservation[] = [
  { type: 'LOCATION', occurredAt: evaluatedAt - 500, source: 'IMPORTED' },
  { type: 'MICROPHONE', occurredAt: evaluatedAt - 400, source: 'IMPORTED' },
];
assert(evaluateTemporalCooccurrence({ packageName: 'test.switch', evaluatedAt, observations: packSwitchEvents, rules: researchRules }).length === 1, 'Research pack must own its sensor-fusion mapping.');
assert(evaluateTemporalCooccurrence({ packageName: 'test.switch', evaluatedAt, observations: packSwitchEvents, rules: gdprRules }).length === 0, 'GDPR must not inherit another pack mapping.');

const invalidPack: RegulationPack = {
  ...gdpr,
  temporalProfiles: [{ ...gdpr.temporalProfiles[0], windowMs: 0, requirements: [{ type: 'BODY_SENSORS', minCount: 0 }] }],
};
const invalidErrors = validateTemporalRuleMapping(invalidPack);
assert(invalidErrors.some((error) => error.includes('windowMs')), 'Invalid windows must fail closed.');
assert(invalidErrors.some((error) => error.includes('minCount')), 'Invalid occurrence thresholds must fail closed.');

const engine = new RulePackComplianceEngine(gdpr, '2026-08-20');
let finding;
const integrationTypes = ['BODY_SENSORS', 'CAMERA', 'MICROPHONE'] as const satisfies readonly PrivacyObservation['type'][];
for (let index = 0; index < integrationTypes.length; index += 1) {
  const type = integrationTypes[index];
  finding = engine.evaluate({
    packageName: 'test.integration',
    permissionType: 'MICROPHONE',
    accessCount: 1,
    windowStart: evaluatedAt - biometricRule.windowMs,
    windowEnd: evaluatedAt,
    source: 'IMPORTED',
    observationEvents: [{ type, occurredAt: evaluatedAt - 10_000 + index, source: 'IMPORTED' }],
  });
}
assert(finding?.signals.includes('TEMPORAL_COOCCURRENCE'), 'App engine must expose a temporal warning after the combination is complete.');
assert(finding?.communication.summary.includes('without assuming an order'), 'Notification must state order-agnostic evidence.');
assert(finding?.communication.recommendedAction.includes('does not block'), 'Notification must remain advisory and non-blocking.');

console.log(`Temporal mapping, exact-boundary, 720-permutation, pack-switch, fail-closed, integration, and 1,000-event ${burstElapsed.toFixed(3)}ms budget tests passed.`);
