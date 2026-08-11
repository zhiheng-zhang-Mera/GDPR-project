import { RulePackComplianceEngine } from '../src/compliance/RulePackComplianceEngine';
import { PermissionAudit, RegulationId, SensitivePermission } from '../src/compliance/types';
import { getRegulationPack, listRegulationPacks } from '../src/regulations/registry';
import { validateRegulationPack } from '../src/regulations/governance';
import { RegulationPack } from '../src/regulations/types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function expectedDailySignal(pack: RegulationPack, permission: SensitivePermission, count: number): boolean {
  const rule = pack.rules[permission];
  const threshold = Math.max(1, Math.ceil(rule.baseline * rule.deviationMultiplier));
  return count > threshold;
}

function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

const now = 1_700_000_000_000;
const permissions: SensitivePermission[] = ['LOCATION', 'MICROPHONE', 'CONTACTS'];
const validContext = {
  purpose: 'Property-test feature',
  lawfulBasis: 'CONTRACT' as const,
  controllerIdentity: 'Property-test controller',
  retentionDays: 1,
  transparencyNoticeReference: 'property-notice',
  dataMinimisationAssessmentReference: 'property-minimisation',
  retentionJustification: 'one-day property-test evidence',
  contractNecessityReference: 'property-contract-necessity',
  dpiaRequired: false,
};

for (const pack of listRegulationPacks()) {
  assert(validateRegulationPack(pack).length === 0, `${pack.id} must pass governance validation.`);
  const random = lcg(pack.id === 'EU_GDPR' ? 0x8e9d_2026 : 0x51a7_2026);
  for (const permission of permissions) {
    const threshold = Math.max(1, Math.ceil(pack.rules[permission].baseline * pack.rules[permission].deviationMultiplier));
    for (let round = 0; round < 300; round += 1) {
      const count = Math.floor(random() * (threshold * 4 + 1));
      const audit: PermissionAudit = {
        packageName: `property.${pack.id.toLowerCase()}.${permission.toLowerCase()}.${round}`,
        permissionType: permission,
        accessCount: count,
        windowStart: now - 60_000,
        windowEnd: now,
        source: 'IMPORTED',
        processingContext: validContext,
      };
      const finding = new RulePackComplianceEngine(pack).evaluate(audit);
      assert(finding.signals.includes('DAILY_TOTAL') === expectedDailySignal(pack, permission, count), `Independent daily oracle disagreed for ${pack.id}/${permission}/${count}.`);
      assert(finding.threshold === threshold, `Threshold projection disagreed for ${pack.id}/${permission}.`);
      assert(finding.regulationId === pack.id, 'Pack identity must survive evaluation.');
    }

    const at = new RulePackComplianceEngine(pack).evaluate({ packageName: `boundary.at.${permission}`, permissionType: permission, accessCount: threshold, windowStart: now - 60_000, windowEnd: now, source: 'IMPORTED', processingContext: validContext });
    const above = new RulePackComplianceEngine(pack).evaluate({ packageName: `boundary.above.${permission}`, permissionType: permission, accessCount: threshold + 1, windowStart: now - 60_000, windowEnd: now, source: 'IMPORTED', processingContext: validContext });
    assert(!at.signals.includes('DAILY_TOTAL') && above.signals.includes('DAILY_TOTAL'), `Strict daily boundary failed for ${pack.id}/${permission}.`);
  }
}

const base = getRegulationPack('GLOBAL_RESEARCH_BASELINE');
const fractionalPack: RegulationPack = {
  ...base,
  rules: {
    ...base.rules,
    CONTACTS: { ...base.rules.CONTACTS, baseline: 5, deviationMultiplier: 1.5 },
  },
};
const fractionalEngine = new RulePackComplianceEngine(fractionalPack);
const fractionalAt = fractionalEngine.evaluate({ packageName: 'mutation.ceil.at', permissionType: 'CONTACTS', accessCount: 8, windowStart: now - 60_000, windowEnd: now, source: 'IMPORTED', processingContext: validContext });
const fractionalAbove = fractionalEngine.evaluate({ packageName: 'mutation.ceil.above', permissionType: 'CONTACTS', accessCount: 9, windowStart: now - 60_000, windowEnd: now, source: 'IMPORTED', processingContext: validContext });
assert(fractionalAt.threshold === 8 && !fractionalAt.signals.includes('DAILY_TOTAL'), 'Ceiling and strict-comparison mutation probe failed at the boundary.');
assert(fractionalAbove.signals.includes('DAILY_TOTAL'), 'Strict-comparison mutation probe failed above the boundary.');

const illegalApproval: RegulationPack = {
  ...getRegulationPack('EU_GDPR'),
  governance: {
    ...getRegulationPack('EU_GDPR').governance,
    state: 'APPROVED_RELEASE',
    releaseScope: 'PRODUCTION',
  },
};
assert(validateRegulationPack(illegalApproval).some((error) => error.includes('qualified legal reviewer')), 'Governance validator must reject an engineering-only approval mutation.');

const missingSource: RegulationPack = { ...getRegulationPack('EU_GDPR'), sourceUrl: 'http://example.invalid' };
assert(validateRegulationPack(missingSource).some((error) => error.includes('HTTPS official source')), 'Governance validator must reject a non-HTTPS legal source mutation.');

const invalidDate: RegulationPack = {
  ...getRegulationPack('EU_GDPR'),
  governance: { ...getRegulationPack('EU_GDPR').governance, lastReviewedAt: '2026-02-30' },
};
assert(validateRegulationPack(invalidDate).some((error) => error.includes('valid YYYY-MM-DD')), 'Governance validator must reject impossible calendar dates.');

const missingBindingLaw: RegulationPack = {
  ...getRegulationPack('EU_GDPR'),
  sources: getRegulationPack('EU_GDPR').sources.map((source) => ({ ...source, status: 'FINAL_GUIDANCE' as const })),
};
assert(validateRegulationPack(missingBindingLaw).some((error) => error.includes('binding-law source')), 'A legal pack must retain a binding-law source rather than guidance alone.');

const euSources = getRegulationPack('EU_GDPR').sources;
assert(euSources.some(({ status }) => status === 'CONSULTATION_MATERIAL'), 'Non-final EDPB materials must remain explicitly labelled as consultation material.');
assert(euSources.filter(({ status }) => status === 'CONSULTATION_MATERIAL').every(({ lifecycle }) => lifecycle === 'CONSULTATION_CLOSED_PENDING_FINALISATION'), 'Closed non-final EDPB materials must retain a pending-finalisation lifecycle.');
assert(euSources.every(({ versionLabel }) => versionLabel.trim().length > 0), 'Every legal source record must pin a visible document version.');

const lifecycleMismatch: RegulationPack = {
  ...getRegulationPack('EU_GDPR'),
  sources: getRegulationPack('EU_GDPR').sources.map((source, index) => index === 0 ? { ...source, lifecycle: 'FINAL' as const } : source),
};
assert(validateRegulationPack(lifecycleMismatch).some((error) => error.includes('binding law must use the IN_FORCE lifecycle')), 'Binding-law lifecycle mismatches must fail governance validation.');

const unversionedSource: RegulationPack = {
  ...getRegulationPack('EU_GDPR'),
  sources: getRegulationPack('EU_GDPR').sources.map((source, index) => index === 1 ? { ...source, versionLabel: '' } : source),
};
assert(validateRegulationPack(unversionedSource).some((error) => error.includes('versionLabel is required')), 'Unversioned legal sources must fail governance validation.');

const closedWithoutDate: RegulationPack = {
  ...getRegulationPack('EU_GDPR'),
  sources: getRegulationPack('EU_GDPR').sources.map((source, index) => index === 3 ? { ...source, consultationClosedAt: undefined } : source),
};
assert(validateRegulationPack(closedWithoutDate).some((error) => error.includes('consultationClosedAt must be a valid')), 'Closed consultations must record a valid closure date.');

const uncheckedAfterReview: RegulationPack = {
  ...getRegulationPack('EU_GDPR'),
  sources: getRegulationPack('EU_GDPR').sources.map((source, index) => index === 4 ? { ...source, checkedAt: '2026-08-12' } : source),
};
assert(validateRegulationPack(uncheckedAfterReview).some((error) => error.includes('checkedAt cannot follow governance.lastReviewedAt')), 'Source checks recorded after the pack review must fail validation.');

let unknownRejected = false;
try {
  getRegulationPack('FORGED' as RegulationId);
} catch {
  unknownRejected = true;
}
assert(unknownRejected, 'Unknown regulation packs must fail closed instead of silently loading the default pack.');

console.log('Governance validation, 1,800 independent-oracle cases, metamorphic boundaries, and representative mutation probes passed.');
