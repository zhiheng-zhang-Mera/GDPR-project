import { RulePackComplianceEngine } from '../src/compliance/RulePackComplianceEngine';
import { evaluateTemporalCooccurrence } from '../src/compliance/TemporalCooccurrenceEngine';
import { PrivacyObservation } from '../src/compliance/types';
import { getRegulationPack } from '../src/regulations/registry';
import { compileTemporalRuleMapping, validateTemporalRuleMapping } from '../src/regulations/temporalRuleMapping';
import { RegulationPack } from '../src/regulations/types';
import { createControlledTemporalFixture } from '../src/compliance/ControlledTemporalFixture';
import { compileFormalPolicyModel, evaluateFormalPolicy, validateFormalPolicyConstraints } from '../src/regulations/formalPolicy';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function permutations<T>(values: T[]): T[][] {
  if (values.length <= 1) return [values];
  return values.flatMap((value, index) => permutations([...values.slice(0, index), ...values.slice(index + 1)]).map((tail) => [value, ...tail]));
}

const gdpr = getRegulationPack('EU_GDPR');
const gdprRules = compileTemporalRuleMapping(gdpr);
const gdprFormalModel = compileFormalPolicyModel(gdpr);
const staticLocationReview = evaluateFormalPolicy(gdprFormalModel, new Set(['MANIFEST_LOCATION']));
assert(staticLocationReview.length === 1 && staticLocationReview[0].constraintId === 'LOCATION_ACCOUNTABILITY_CONTEXT', 'A loadable GDPR policy model must activate from a static location capability.');
assert(staticLocationReview[0].missingEvidence.includes('LAWFUL_BASIS'), 'Static capability evidence must request, not invent, a lawful basis.');
assert(staticLocationReview[0].outcome === 'REVIEW_REQUIRED', 'The formal policy layer must remain advisory.');
assert(evaluateFormalPolicy(gdprFormalModel, new Set(['MANIFEST_CAMERA'])).length === 0, 'A non-matching capability must not create a reassuring or adverse legal result.');
assert(validateFormalPolicyConstraints([{ ...gdpr.formalPolicyConstraints[0], id: 'bad' }]).some((error) => error.includes('stable identifier')), 'Malformed formal constraints must fail closed.');
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
assert(engine.evaluateFormalEvidence(new Set(['MANIFEST_LOCATION'])).some(({ constraintId }) => constraintId === 'LOCATION_ACCOUNTABILITY_CONTEXT'), 'The mounted app engine must expose the active pack formal model.');
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

// The controlled native fixture is generated from the mounted data, rather
// than hard-coding GDPR combinations in a test-only code path.
for (const packId of ['EU_GDPR', 'GLOBAL_RESEARCH_BASELINE'] as const) {
  const fixture = createControlledTemporalFixture(getRegulationPack(packId), evaluatedAt);
  const fixtureFinding = new RulePackComplianceEngine(getRegulationPack(packId), '2026-08-20').evaluate(fixture);
  assert(fixtureFinding.signals.includes('TEMPORAL_COOCCURRENCE'), `${packId} controlled fixture must traverse the ordinary temporal engine.`);
  assert(fixtureFinding.evidence.evidenceKind === 'CONTROLLED_DEMO' && fixtureFinding.evidence.source === 'NATIVE_BRIDGE', `${packId} fixture must remain visibly controlled and on-device bridged.`);
}

const firstFixture = createControlledTemporalFixture(gdpr, evaluatedAt);
const firstEvents = firstFixture.observationEvents!.slice(0, -1);
const finalEvent = firstFixture.observationEvents!.at(-1)!;
const beforeRestart = new RulePackComplianceEngine(gdpr, '2026-08-20');
beforeRestart.evaluate({ ...firstFixture, observationEvents: firstEvents });
const snapshot = beforeRestart.exportTemporalLedger(evaluatedAt);
const afterRestart = new RulePackComplianceEngine(gdpr, '2026-08-20');
assert(afterRestart.restoreTemporalLedger(snapshot, evaluatedAt), 'Same-pack in-window ledger state must restore after a process restart.');
const restoredFinding = afterRestart.evaluate({ ...firstFixture, observationEvents: [finalEvent] });
const directEngine = new RulePackComplianceEngine(gdpr, '2026-08-20');
const directFinding = directEngine.evaluate(firstFixture);
assert(restoredFinding.temporalEvidence?.[0]?.evidenceSha256 && restoredFinding.temporalEvidence?.[0]?.evidenceSha256 === directFinding.temporalEvidence?.[0]?.evidenceSha256, 'Restarted ledger must produce the same evidence receipt as uninterrupted evaluation.');
assert(!new RulePackComplianceEngine(getRegulationPack('GLOBAL_RESEARCH_BASELINE'), '2026-08-20').restoreTemporalLedger(snapshot, evaluatedAt), 'A temporal ledger must not cross regulation-pack boundaries.');
assert(!afterRestart.restoreTemporalLedger({ ...snapshot, entries: [{ ...snapshot.entries[0], dedupeKey: 'forged' }] }, evaluatedAt), 'A forged dedupe key must fail closed.');
assert(!afterRestart.restoreTemporalLedger(snapshot, evaluatedAt + gdprRules.reduce((max, rule) => Math.max(max, rule.windowMs), 0) + 1), 'An expired temporal ledger must not restore.');

console.log(`Temporal mapping, controlled fixtures for two packs, restart ledger, exact-boundary, 720-permutation, pack-switch, fail-closed, integration, and 1,000-event ${burstElapsed.toFixed(3)}ms budget tests passed.`);
