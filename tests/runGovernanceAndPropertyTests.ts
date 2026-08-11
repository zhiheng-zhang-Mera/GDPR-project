import { RulePackComplianceEngine } from '../src/compliance/RulePackComplianceEngine';
import forgeEd25519 from 'node-forge/lib/ed25519';
import forgeUtil from 'node-forge/lib/util';
import { PermissionAudit, RegulationId, SensitivePermission } from '../src/compliance/types';
import { getRegulationPack, listRegulationPacks } from '../src/regulations/registry';
import { assessPackLegalReview, assessPackSourceReview, validateRegulationPack } from '../src/regulations/governance';
import { canonicalizeLegalReviewPayload, computeSourceBundleSha256 } from '../src/regulations/attestationCrypto';
import { LegalReviewTrustAnchor, RegulationPack } from '../src/regulations/types';

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

function bytesToBinary(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
}

const testKeyPair = forgeEd25519.generateKeyPair({ seed: new Uint8Array(Array.from({ length: 32 }, (_, index) => index + 1)) });
const TEST_TRUST_ANCHOR: LegalReviewTrustAnchor = {
  keyId: 'test-ed25519-review-key-1',
  algorithm: 'ED25519',
  publicKeyBase64: forgeUtil.encode64(bytesToBinary(testKeyPair.publicKey)),
  owner: 'Synthetic governance-test fixture',
  validFrom: '2026-01-01',
  validUntil: '2030-01-01',
};
const TEST_TRUST_ANCHORS = [TEST_TRUST_ANCHOR] as const;

function makeLegallyAttestedPack(validUntil = '2027-02-11'): RegulationPack {
  const pack = getRegulationPack('EU_GDPR');
  const unsigned: RegulationPack = {
    ...pack,
    governance: {
      ...pack.governance,
      state: 'LEGALLY_REVIEWED',
      reviewAuthority: { kind: 'QUALIFIED_LEGAL', reviewer: 'test-qualified-reviewer', scope: 'Synthetic governance fixture; not a real legal approval.' },
      legalReviewAttestation: {
        attestationId: 'test-attestation-eu-gdpr-v1',
        reviewedPackVersion: pack.versionLabel,
        reviewedSourcesSha256: computeSourceBundleSha256(pack),
        reviewedAt: '2026-08-10',
        approvedAt: '2026-08-11',
        validUntil,
        reviewerId: 'test-qualified-reviewer',
        reviewerQualification: 'Synthetic qualified-reviewer fixture',
        approverId: 'test-independent-approver',
        scope: 'Synthetic full-pack review fixture for governance tests only.',
        signatureAlgorithm: 'ED25519',
        signingKeyId: TEST_TRUST_ANCHOR.keyId,
        signatureBase64: 'A'.repeat(88),
      },
    },
  };
  const signature = forgeEd25519.sign({ message: canonicalizeLegalReviewPayload(unsigned, unsigned.governance.legalReviewAttestation!), encoding: 'utf8', privateKey: testKeyPair.privateKey });
  return { ...unsigned, governance: { ...unsigned.governance, legalReviewAttestation: { ...unsigned.governance.legalReviewAttestation!, signatureBase64: forgeUtil.encode64(bytesToBinary(signature)) } } };
}

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
assert(validateRegulationPack(illegalApproval).some((error) => error.includes('legal-review attestation')), 'A legal state without a version-bound attestation must fail governance validation.');

const attestedPack = makeLegallyAttestedPack();
const reorderedSourcePack: RegulationPack = { ...attestedPack, sources: [...attestedPack.sources].reverse() };
assert(computeSourceBundleSha256(reorderedSourcePack) === computeSourceBundleSha256(attestedPack), 'Canonical source-record hashing must be independent of input ordering and host locale.');
assert(validateRegulationPack(attestedPack, TEST_TRUST_ANCHORS).length === 0, 'A synthetic signed two-person legal-review attestation fixture must pass schema validation with an explicitly injected test trust anchor.');
assert(assessPackLegalReview(getRegulationPack('EU_GDPR'), '2026-08-11').state === 'NOT_PROVIDED', 'The real project pack must disclose that independent legal review is not recorded.');
assert(assessPackLegalReview(getRegulationPack('GLOBAL_RESEARCH_BASELINE'), '2026-08-11').state === 'NOT_APPLICABLE', 'A non-legal research pack must not imply legal attestation.');
assert(assessPackLegalReview(attestedPack, '2026-08-11', TEST_TRUST_ANCHORS).state === 'CURRENT', 'A current signed attestation must be recognised on its assessed date.');
assert(assessPackLegalReview(attestedPack, '2027-02-12', TEST_TRUST_ANCHORS).state === 'EXPIRED', 'An attestation must expire after its recorded validity date.');

const selfApprovedPack: RegulationPack = {
  ...attestedPack,
  governance: { ...attestedPack.governance, legalReviewAttestation: { ...attestedPack.governance.legalReviewAttestation!, approverId: 'TEST-QUALIFIED-REVIEWER' } },
};
assert(validateRegulationPack(selfApprovedPack, TEST_TRUST_ANCHORS).some((error) => error.includes('different identities')), 'Case-insensitive reviewer self-approval must fail the four-eyes project gate.');

const mismatchedAttestationPack: RegulationPack = {
  ...attestedPack,
  governance: { ...attestedPack.governance, legalReviewAttestation: { ...attestedPack.governance.legalReviewAttestation!, reviewedPackVersion: 'different-pack-version', reviewedSourcesSha256: 'not-a-sha256' } },
};
assert(validateRegulationPack(mismatchedAttestationPack, TEST_TRUST_ANCHORS).some((error) => error.includes('must match pack.versionLabel')), 'An attestation for another pack version must fail validation.');
assert(validateRegulationPack(mismatchedAttestationPack, TEST_TRUST_ANCHORS).some((error) => error.includes('SHA-256 hex digest')), 'A malformed reviewed-source digest must fail validation.');

const changedSourcePack: RegulationPack = { ...attestedPack, sources: attestedPack.sources.map((source, index) => index === 0 ? { ...source, versionLabel: `${source.versionLabel}-changed` } : source) };
assert(assessPackLegalReview(changedSourcePack, '2026-08-11', TEST_TRUST_ANCHORS).state === 'SOURCE_BUNDLE_MISMATCH', 'A source-record change after signing must invalidate the source bundle before reassurance.');
const badSignaturePack: RegulationPack = { ...attestedPack, governance: { ...attestedPack.governance, legalReviewAttestation: { ...attestedPack.governance.legalReviewAttestation!, signatureBase64: `${attestedPack.governance.legalReviewAttestation!.signatureBase64[0] === 'A' ? 'B' : 'A'}${attestedPack.governance.legalReviewAttestation!.signatureBase64.slice(1)}` } } };
assert(assessPackLegalReview(badSignaturePack, '2026-08-11', TEST_TRUST_ANCHORS).state === 'SIGNATURE_INVALID', 'A modified Ed25519 signature must fail closed.');
assert(assessPackLegalReview(attestedPack, '2026-08-11').state === 'SIGNER_NOT_TRUSTED', 'A structurally valid signature must not be trusted without an application-controlled trust anchor.');
const revokedAnchor = { ...TEST_TRUST_ANCHOR, revokedAt: '2026-08-10' };
assert(assessPackLegalReview(attestedPack, '2026-08-11', [revokedAnchor]).state === 'SIGNER_REVOKED', 'A revoked signing key must fail closed.');

const unreviewedNoConcern = new RulePackComplianceEngine(getRegulationPack('EU_GDPR'), '2026-08-11').evaluate({ packageName: 'legal.review.missing', permissionType: 'CONTACTS', accessCount: 0, windowStart: now - 60_000, windowEnd: now, source: 'IMPORTED', processingContext: validContext });
assert(unreviewedNoConcern.compliance.status === 'INSUFFICIENT_EVIDENCE', 'A legal pack without current independent attestation must not emit a reassuring no-concern result.');
assert(unreviewedNoConcern.compliance.legalReview.state === 'NOT_PROVIDED' && unreviewedNoConcern.compliance.missingEvidence.includes('current cryptographically verified independent qualified legal-review attestation'), 'The finding must preserve and explain the missing signed legal-review gate.');

const attestedNoConcern = new RulePackComplianceEngine(attestedPack, '2026-08-11', TEST_TRUST_ANCHORS).evaluate({ packageName: 'legal.review.current', permissionType: 'CONTACTS', accessCount: 0, windowStart: now - 60_000, windowEnd: now, source: 'IMPORTED', processingContext: validContext });
assert(attestedNoConcern.compliance.status === 'NO_TECHNICAL_CONCERN' && attestedNoConcern.compliance.legalReview.state === 'CURRENT', 'A consistent current attestation may clear the project reassurance gate without establishing legal compliance.');

const unreviewedSignal = new RulePackComplianceEngine(getRegulationPack('EU_GDPR'), '2026-08-11').evaluate({ packageName: 'legal.review.signal', permissionType: 'CONTACTS', accessCount: 7, windowStart: now - 60_000, windowEnd: now, source: 'IMPORTED', processingContext: validContext });
assert(unreviewedSignal.compliance.status === 'REVIEW_REQUIRED' && unreviewedSignal.compliance.missingEvidence.includes('current cryptographically verified independent qualified legal-review attestation'), 'The gate must preserve a conservative technical review signal while disclosing absent signed legal attestation.');

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
assert(euSources.every(({ reviewDueAt, checkedAt }) => reviewDueAt > checkedAt), 'Every legal source must schedule a future review after its check date.');
assert(assessPackSourceReview(getRegulationPack('EU_GDPR'), '2026-08-11').state === 'CURRENT', 'The recorded EU source inventory must be current on its review date.');
assert(assessPackSourceReview(getRegulationPack('EU_GDPR'), '2026-09-12').state === 'REVIEW_DUE', 'The EU source inventory must become review-due after the earliest scheduled deadline.');
assert(assessPackSourceReview(getRegulationPack('GLOBAL_RESEARCH_BASELINE'), '2026-09-12').state === 'NOT_APPLICABLE', 'The non-legal research pack must not imply a legal-source review.');

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

const missingReviewDeadline: RegulationPack = {
  ...getRegulationPack('EU_GDPR'),
  sources: getRegulationPack('EU_GDPR').sources.map((source, index) => index === 0 ? { ...source, reviewDueAt: '' } : source),
};
assert(validateRegulationPack(missingReviewDeadline).some((error) => error.includes('reviewDueAt must be a valid')), 'Legal sources without a valid review deadline must fail governance validation.');

const nonFutureReviewDeadline: RegulationPack = {
  ...getRegulationPack('EU_GDPR'),
  sources: getRegulationPack('EU_GDPR').sources.map((source, index) => index === 0 ? { ...source, reviewDueAt: source.checkedAt } : source),
};
assert(validateRegulationPack(nonFutureReviewDeadline).some((error) => error.includes('reviewDueAt must follow checkedAt')), 'A source review deadline that does not follow its check date must fail governance validation.');

const currentReviewFinding = new RulePackComplianceEngine(getRegulationPack('EU_GDPR'), '2026-08-11').evaluate({ packageName: 'source.review.current', permissionType: 'CONTACTS', accessCount: 0, windowStart: now - 60_000, windowEnd: now, source: 'IMPORTED', processingContext: validContext });
assert(currentReviewFinding.compliance.sourceReview.state === 'CURRENT', 'A finding must preserve the current source-review assessment used for evaluation.');

const overdueReviewFinding = new RulePackComplianceEngine(getRegulationPack('EU_GDPR'), '2026-09-12').evaluate({ packageName: 'source.review.overdue', permissionType: 'CONTACTS', accessCount: 0, windowStart: now - 60_000, windowEnd: now, source: 'IMPORTED', processingContext: validContext });
assert(overdueReviewFinding.compliance.status === 'INSUFFICIENT_EVIDENCE', 'An overdue legal-source review must fail closed to insufficient evidence.');
assert(overdueReviewFinding.compliance.sourceReview.state === 'REVIEW_DUE' && overdueReviewFinding.compliance.missingEvidence.includes('renewed regulatory-source review'), 'An overdue finding must preserve the review-due state and renewal gap.');
assert(overdueReviewFinding.compliance.sourceReview.overdueSourceTitles.length === 2, 'The overdue assessment must identify both short-cycle consultation sources.');

let unknownRejected = false;
try {
  getRegulationPack('FORGED' as RegulationId);
} catch {
  unknownRejected = true;
}
assert(unknownRejected, 'Unknown regulation packs must fail closed instead of silently loading the default pack.');

console.log('Governance validation, 1,800 independent-oracle cases, metamorphic boundaries, and representative mutation probes passed.');
