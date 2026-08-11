import { RulePackComplianceEngine } from '../src/compliance/RulePackComplianceEngine';
import forgeEd25519 from 'node-forge/lib/ed25519';
import forgeUtil from 'node-forge/lib/util';
import { PermissionAudit, RegulationId, SensitivePermission } from '../src/compliance/types';
import { getRegulationPack, listRegulationPacks } from '../src/regulations/registry';
import { assessPackLegalReview, assessPackSourceReview, validateRegulationPack } from '../src/regulations/governance';
import { canonicalizeLegalReviewPayload, computeSourceBundleSha256 } from '../src/regulations/attestationCrypto';
import { assessPackSourceContent, computeSourceContentManifestSha256, sha256Bytes } from '../src/regulations/sourceContent';
import { assessTrustStoreEnvelope, canonicalizeTrustStoreEnvelope, computeTrustStoreEnvelopeSha256, validateRollbackStateTransition, validateTrustStoreEnvelope } from '../src/regulations/trustStoreEnvelope';
import { assessWitnessedTrustStoreEnvelope, canonicalizeTrustStoreWitnessReceipt, computeWitnessReceiptSetSha256 } from '../src/regulations/trustStoreWitness';
import { LegalReviewKeyRevocation, LegalReviewTrustAnchor, LegalReviewTrustRootAnchor, LegalReviewTrustStoreEnvelope, LegalReviewTrustStoreReleaseIdentity, LegalReviewTrustStoreWitnessAnchor, LegalReviewTrustStoreWitnessPolicy, LegalReviewTrustStoreWitnessReceipt, RegulationPack, SourceContentArtifacts } from '../src/regulations/types';

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
const testRootKeyPair = forgeEd25519.generateKeyPair({ seed: new Uint8Array(Array.from({ length: 32 }, (_, index) => 101 + index)) });
const TEST_ROOT_ANCHOR: LegalReviewTrustRootAnchor = {
  keyId: 'test-offline-root-key-1',
  algorithm: 'ED25519',
  publicKeyBase64: forgeUtil.encode64(bytesToBinary(testRootKeyPair.publicKey)),
  owner: 'Synthetic offline trust-store root fixture',
  validFrom: '2026-01-01',
  validUntil: '2035-01-01',
};
const witnessKeyPair1 = forgeEd25519.generateKeyPair({ seed: new Uint8Array(Array.from({ length: 32 }, (_, index) => 151 + index)) });
const witnessKeyPair2 = forgeEd25519.generateKeyPair({ seed: new Uint8Array(Array.from({ length: 32 }, (_, index) => 201 + index)) });
const TEST_WITNESS_ANCHORS: readonly LegalReviewTrustStoreWitnessAnchor[] = [
  { keyId: 'test-release-witness-1', algorithm: 'ED25519', publicKeyBase64: forgeUtil.encode64(bytesToBinary(witnessKeyPair1.publicKey)), owner: 'Synthetic independent witness one', validFrom: '2026-01-01', validUntil: '2035-01-01' },
  { keyId: 'test-release-witness-2', algorithm: 'ED25519', publicKeyBase64: forgeUtil.encode64(bytesToBinary(witnessKeyPair2.publicKey)), owner: 'Synthetic independent witness two', validFrom: '2026-01-01', validUntil: '2035-01-01' },
];
const TEST_WITNESS_POLICY: LegalReviewTrustStoreWitnessPolicy = { schema: 'privacy-lens.trust-store-witness-policy.v1', requiredWitnesses: 2, anchors: TEST_WITNESS_ANCHORS };
const TEST_RELEASE_IDENTITY: LegalReviewTrustStoreReleaseIdentity = { applicationId: 'com.zhihengzhang.privacylens', versionName: '1.14.0', versionCode: 15, releaseChannel: 'CONTROLLED_RESEARCH' };

function makeTrustStoreEnvelope(options: {
  sequence?: number;
  previousEnvelopeSha256?: string;
  validFrom?: string;
  validUntil?: string;
  anchors?: readonly LegalReviewTrustAnchor[];
  revocations?: readonly LegalReviewKeyRevocation[];
} = {}): LegalReviewTrustStoreEnvelope {
  const unsigned: LegalReviewTrustStoreEnvelope = {
    schema: 'privacy-lens.legal-review-trust-store.v1',
    sequence: options.sequence ?? 1,
    issuedAt: '2026-08-11',
    validFrom: options.validFrom ?? '2026-08-11',
    validUntil: options.validUntil ?? '2027-08-11',
    issuerId: 'test-trust-store-custodian',
    approverId: 'test-independent-release-approver',
    previousEnvelopeSha256: options.previousEnvelopeSha256,
    trustAnchors: options.anchors ?? [TEST_TRUST_ANCHOR],
    revocations: options.revocations ?? [],
    signatureAlgorithm: 'ED25519',
    signingRootKeyId: TEST_ROOT_ANCHOR.keyId,
    signatureBase64: 'A'.repeat(88),
  };
  const signature = forgeEd25519.sign({ message: canonicalizeTrustStoreEnvelope(unsigned), encoding: 'utf8', privateKey: testRootKeyPair.privateKey });
  return { ...unsigned, signatureBase64: forgeUtil.encode64(bytesToBinary(signature)) };
}

function makeWitnessReceipt(envelope: LegalReviewTrustStoreEnvelope, witnessIndex: 0 | 1, options: { envelopeSha256?: string; witnessedAt?: string; releaseIdentity?: LegalReviewTrustStoreReleaseIdentity; witnessKeyId?: string } = {}): LegalReviewTrustStoreWitnessReceipt {
  const witnessAnchor = TEST_WITNESS_ANCHORS[witnessIndex];
  const unsigned: LegalReviewTrustStoreWitnessReceipt = {
    schema: 'privacy-lens.trust-store-witness-receipt.v1',
    scope: 'TRUST_STORE_ENVELOPE',
    envelopeSha256: options.envelopeSha256 ?? computeTrustStoreEnvelopeSha256(envelope),
    sequence: envelope.sequence,
    witnessedAt: options.witnessedAt ?? '2026-08-11',
    witnessKeyId: options.witnessKeyId ?? witnessAnchor.keyId,
    releaseIdentity: options.releaseIdentity ?? TEST_RELEASE_IDENTITY,
    signatureAlgorithm: 'ED25519',
    signatureBase64: 'A'.repeat(88),
  };
  const keyPair = witnessIndex === 0 ? witnessKeyPair1 : witnessKeyPair2;
  const signature = forgeEd25519.sign({ message: canonicalizeTrustStoreWitnessReceipt(unsigned), encoding: 'utf8', privateKey: keyPair.privateKey });
  return { ...unsigned, signatureBase64: forgeUtil.encode64(bytesToBinary(signature)) };
}

function makeWitnessReceipts(envelope: LegalReviewTrustStoreEnvelope): readonly LegalReviewTrustStoreWitnessReceipt[] {
  return [makeWitnessReceipt(envelope, 0), makeWitnessReceipt(envelope, 1)];
}

const TEST_TRUST_STORE_ENVELOPE = makeTrustStoreEnvelope();
const TEST_ENVELOPE_ASSESSMENT = assessTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [TEST_ROOT_ANCHOR], '2026-08-11');
assert(TEST_ENVELOPE_ASSESSMENT.state === 'ENVELOPE_VERIFIED' && TEST_ENVELOPE_ASSESSMENT.trustAnchors.length === 1 && TEST_ENVELOPE_ASSESSMENT.nextRollbackState?.highestAcceptedSequence === 1, 'A valid initial signed trust-store envelope must verify without yet claiming witnessed release acceptance.');
const TEST_WITNESS_RECEIPTS = makeWitnessReceipts(TEST_TRUST_STORE_ENVELOPE);
const TEST_TRUST_STORE = assessWitnessedTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [TEST_ROOT_ANCHOR], TEST_WITNESS_POLICY, TEST_WITNESS_RECEIPTS, TEST_RELEASE_IDENTITY, '2026-08-11');
assert(TEST_TRUST_STORE.state === 'CURRENT' && TEST_TRUST_STORE.verifiedWitnessCount === 2 && TEST_TRUST_STORE.requiredWitnessCount === 2 && TEST_TRUST_STORE.trustAnchors.length === 1, 'A valid envelope must become current only after the independent witness threshold verifies.');
assert(validateTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE).length === 0, 'The valid trust-store fixture must pass structural validation.');

const SECOND_TEST_TRUST_ANCHOR: LegalReviewTrustAnchor = { ...TEST_TRUST_ANCHOR, keyId: 'test-ed25519-review-key-2', owner: 'Second synthetic reviewer fixture' };
const orderedTrustStore = makeTrustStoreEnvelope({ anchors: [TEST_TRUST_ANCHOR, SECOND_TEST_TRUST_ANCHOR], revocations: [{ keyId: TEST_TRUST_ANCHOR.keyId, revokedAt: '2026-08-10', reason: 'Synthetic first revocation', successorKeyId: SECOND_TEST_TRUST_ANCHOR.keyId }, { keyId: 'retired-test-key', revokedAt: '2026-08-09', reason: 'Synthetic historical revocation' }] });
const reorderedTrustStore = makeTrustStoreEnvelope({ anchors: [SECOND_TEST_TRUST_ANCHOR, TEST_TRUST_ANCHOR], revocations: [{ keyId: 'retired-test-key', revokedAt: '2026-08-09', reason: 'Synthetic historical revocation' }, { keyId: TEST_TRUST_ANCHOR.keyId, revokedAt: '2026-08-10', reason: 'Synthetic first revocation', successorKeyId: SECOND_TEST_TRUST_ANCHOR.keyId }] });
assert(canonicalizeTrustStoreEnvelope(orderedTrustStore) === canonicalizeTrustStoreEnvelope(reorderedTrustStore), 'Trust-store canonicalization must be independent of anchor and revocation input ordering.');
assert(computeWitnessReceiptSetSha256(TEST_WITNESS_RECEIPTS) === computeWitnessReceiptSetSha256([...TEST_WITNESS_RECEIPTS].reverse()), 'Witness receipt-set identity must be independent of receipt input ordering.');
assert(assessWitnessedTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [TEST_ROOT_ANCHOR], undefined, [], TEST_RELEASE_IDENTITY, '2026-08-11').state === 'WITNESS_POLICY_UNPROVISIONED', 'A verified envelope without a production witness policy must not become current.');
assert(assessWitnessedTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [TEST_ROOT_ANCHOR], { ...TEST_WITNESS_POLICY, requiredWitnesses: 1 }, TEST_WITNESS_RECEIPTS, TEST_RELEASE_IDENTITY, '2026-08-11').state === 'WITNESS_POLICY_INVALID', 'A one-party witness policy must fail the independent threshold requirement.');
assert(assessWitnessedTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [TEST_ROOT_ANCHOR], TEST_WITNESS_POLICY, [TEST_WITNESS_RECEIPTS[0]], TEST_RELEASE_IDENTITY, '2026-08-11').state === 'WITNESS_QUORUM_NOT_MET', 'One valid receipt must not satisfy a two-witness policy.');
assert(assessWitnessedTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [TEST_ROOT_ANCHOR], TEST_WITNESS_POLICY, [TEST_WITNESS_RECEIPTS[0], TEST_WITNESS_RECEIPTS[0]], TEST_RELEASE_IDENTITY, '2026-08-11').state === 'WITNESS_RECEIPTS_INVALID', 'Duplicate witness identities must not count twice.');
const tamperedWitnessReceipt = { ...TEST_WITNESS_RECEIPTS[1], signatureBase64: `${TEST_WITNESS_RECEIPTS[1].signatureBase64[0] === 'A' ? 'B' : 'A'}${TEST_WITNESS_RECEIPTS[1].signatureBase64.slice(1)}` };
assert(assessWitnessedTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [TEST_ROOT_ANCHOR], TEST_WITNESS_POLICY, [TEST_WITNESS_RECEIPTS[0], tamperedWitnessReceipt], TEST_RELEASE_IDENTITY, '2026-08-11').state === 'WITNESS_RECEIPTS_INVALID', 'A mutated witness signature must fail the entire receipt set.');
const wrongEnvelopeReceipt = makeWitnessReceipt(TEST_TRUST_STORE_ENVELOPE, 1, { envelopeSha256: 'f'.repeat(64) });
assert(assessWitnessedTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [TEST_ROOT_ANCHOR], TEST_WITNESS_POLICY, [TEST_WITNESS_RECEIPTS[0], wrongEnvelopeReceipt], TEST_RELEASE_IDENTITY, '2026-08-11').state === 'WITNESS_RECEIPTS_INVALID', 'A correctly signed receipt for another envelope digest must fail.');
const wrongReleaseReceipt = makeWitnessReceipt(TEST_TRUST_STORE_ENVELOPE, 1, { releaseIdentity: { ...TEST_RELEASE_IDENTITY, versionName: '1.12.0' } });
assert(assessWitnessedTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [TEST_ROOT_ANCHOR], TEST_WITNESS_POLICY, [TEST_WITNESS_RECEIPTS[0], wrongReleaseReceipt], TEST_RELEASE_IDENTITY, '2026-08-11').state === 'WITNESS_RECEIPTS_INVALID', 'A correctly signed receipt for another application release must fail.');
const futureWitnessReceipt = makeWitnessReceipt(TEST_TRUST_STORE_ENVELOPE, 1, { witnessedAt: '2026-08-12' });
assert(assessWitnessedTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [TEST_ROOT_ANCHOR], TEST_WITNESS_POLICY, [TEST_WITNESS_RECEIPTS[0], futureWitnessReceipt], TEST_RELEASE_IDENTITY, '2026-08-11').state === 'WITNESS_RECEIPTS_INVALID', 'A future-dated witness receipt must fail.');
assert(assessWitnessedTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [TEST_ROOT_ANCHOR], { ...TEST_WITNESS_POLICY, anchors: [{ ...TEST_WITNESS_ANCHORS[0], keyId: TEST_ROOT_ANCHOR.keyId }, TEST_WITNESS_ANCHORS[1]] }, TEST_WITNESS_RECEIPTS, TEST_RELEASE_IDENTITY, '2026-08-11').state === 'WITNESS_POLICY_INVALID', 'Witness identities must remain separate from the offline root and reviewer keys.');
assert(assessWitnessedTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [TEST_ROOT_ANCHOR], { ...TEST_WITNESS_POLICY, anchors: [TEST_WITNESS_ANCHORS[0], { ...TEST_WITNESS_ANCHORS[1], publicKeyBase64: TEST_WITNESS_ANCHORS[0].publicKeyBase64 }] }, TEST_WITNESS_RECEIPTS, TEST_RELEASE_IDENTITY, '2026-08-11').state === 'WITNESS_POLICY_INVALID', 'One public key under multiple identifiers must not satisfy witness independence.');
assert(assessWitnessedTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [TEST_ROOT_ANCHOR], { ...TEST_WITNESS_POLICY, anchors: [TEST_WITNESS_ANCHORS[0], { ...TEST_WITNESS_ANCHORS[1], owner: TEST_WITNESS_ANCHORS[0].owner.toUpperCase() }] }, TEST_WITNESS_RECEIPTS, TEST_RELEASE_IDENTITY, '2026-08-11').state === 'WITNESS_POLICY_INVALID', 'One owner under case variants must not count as two independent witnesses.');
assert(assessWitnessedTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [TEST_ROOT_ANCHOR], { ...TEST_WITNESS_POLICY, anchors: [TEST_WITNESS_ANCHORS[0], { ...TEST_WITNESS_ANCHORS[1], publicKeyBase64: TEST_TRUST_ANCHOR.publicKeyBase64 }] }, TEST_WITNESS_RECEIPTS, TEST_RELEASE_IDENTITY, '2026-08-11').state === 'WITNESS_POLICY_INVALID', 'Witness public-key material must remain separate from reviewer keys.');
assert(assessWitnessedTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [TEST_ROOT_ANCHOR], { ...TEST_WITNESS_POLICY, anchors: [TEST_WITNESS_ANCHORS[0], { ...TEST_WITNESS_ANCHORS[1], revokedAt: '2026-08-11' }] }, TEST_WITNESS_RECEIPTS, TEST_RELEASE_IDENTITY, '2026-08-11').state === 'WITNESS_RECEIPTS_INVALID', 'A revoked witness must not satisfy the release threshold.');
assert(assessWitnessedTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [TEST_ROOT_ANCHOR], { ...TEST_WITNESS_POLICY, anchors: [TEST_WITNESS_ANCHORS[0], { ...TEST_WITNESS_ANCHORS[1], revokedAt: '2025-12-31' }] }, TEST_WITNESS_RECEIPTS, TEST_RELEASE_IDENTITY, '2026-08-11').state === 'WITNESS_POLICY_INVALID', 'A witness revocation outside its validity interval must invalidate the policy.');
assert(assessWitnessedTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [TEST_ROOT_ANCHOR], TEST_WITNESS_POLICY, TEST_WITNESS_RECEIPTS, { ...TEST_RELEASE_IDENTITY, versionName: 'release fourteen' }, '2026-08-11').state === 'WITNESS_POLICY_INVALID', 'A malformed expected release version must invalidate the witness policy assessment.');

const tamperedTrustStore = { ...TEST_TRUST_STORE_ENVELOPE, signatureBase64: `${TEST_TRUST_STORE_ENVELOPE.signatureBase64[0] === 'A' ? 'B' : 'A'}${TEST_TRUST_STORE_ENVELOPE.signatureBase64.slice(1)}` };
assert(assessTrustStoreEnvelope(tamperedTrustStore, [TEST_ROOT_ANCHOR], '2026-08-11').state === 'SIGNATURE_INVALID', 'A modified trust-store signature must fail closed.');
assert(assessTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [], '2026-08-11').state === 'ROOT_NOT_TRUSTED', 'An unknown trust-store root must fail closed.');
assert(assessTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [TEST_ROOT_ANCHOR, TEST_ROOT_ANCHOR], '2026-08-11').state === 'ROOT_NOT_TRUSTED', 'Duplicate matching offline roots must fail closed as ambiguous.');
assert(assessTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [{ ...TEST_ROOT_ANCHOR, publicKeyBase64: 'A'.repeat(44) }], '2026-08-11').state === 'ROOT_NOT_TRUSTED', 'A structurally invalid offline root must fail closed before signature verification.');
assert(assessTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [{ ...TEST_ROOT_ANCHOR, validFrom: '2026-08-12' }], '2026-08-12').state === 'ROOT_NOT_TRUSTED', 'The offline root must have been valid when the envelope was issued, not only when assessed.');
assert(assessTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [{ ...TEST_ROOT_ANCHOR, revokedAt: '2026-08-11' }], '2026-08-11').state === 'ROOT_REVOKED', 'A revoked trust-store root must fail closed.');
assert(assessTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [TEST_ROOT_ANCHOR], '2027-08-12').state === 'EXPIRED', 'An expired trust-store envelope must fail closed against freeze attacks.');
assert(assessTrustStoreEnvelope(makeTrustStoreEnvelope({ validFrom: '2026-08-12' }), [TEST_ROOT_ANCHOR], '2026-08-11').state === 'NOT_YET_VALID', 'A future trust-store envelope must not activate early.');
const selfApprovedTrustStore = { ...TEST_TRUST_STORE_ENVELOPE, approverId: TEST_TRUST_STORE_ENVELOPE.issuerId };
assert(assessTrustStoreEnvelope(selfApprovedTrustStore, [TEST_ROOT_ANCHOR], '2026-08-11').state === 'INVALID', 'Trust-store self-approval must fail before signature assessment.');
assert(validateTrustStoreEnvelope(makeTrustStoreEnvelope({ anchors: [{ ...TEST_TRUST_ANCHOR, keyId: TEST_ROOT_ANCHOR.keyId }] })).some((error) => error.includes('must differ from the offline root')), 'An offline root identifier cannot also be a reviewer trust-anchor identifier.');
assert(validateTrustStoreEnvelope(makeTrustStoreEnvelope({ revocations: [{ keyId: TEST_TRUST_ANCHOR.keyId, revokedAt: '2027-08-12', reason: 'Invalid post-expiry fixture' }] })).some((error) => error.includes('cannot follow envelope expiry')), 'A revocation after envelope expiry must be rejected as incoherent.');

const trustStoreSequence2 = makeTrustStoreEnvelope({ sequence: 2, previousEnvelopeSha256: TEST_TRUST_STORE.envelopeSha256 });
const TRUST_STORE_SEQUENCE_2 = assessTrustStoreEnvelope(trustStoreSequence2, [TEST_ROOT_ANCHOR], '2026-08-12', TEST_TRUST_STORE.nextRollbackState);
assert(TRUST_STORE_SEQUENCE_2.state === 'ENVELOPE_VERIFIED' && TRUST_STORE_SEQUENCE_2.nextRollbackState?.highestAcceptedSequence === 2, 'The next signed envelope must advance exactly one sequence and bind its predecessor digest before witness evaluation.');
assert(assessTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [TEST_ROOT_ANCHOR], '2026-08-12', TRUST_STORE_SEQUENCE_2.nextRollbackState).state === 'ROLLBACK_DETECTED', 'An older valid signed envelope must be rejected as rollback.');
const forkedSequence2 = makeTrustStoreEnvelope({ sequence: 2, previousEnvelopeSha256: TEST_TRUST_STORE.envelopeSha256, anchors: [{ ...TEST_TRUST_ANCHOR, owner: 'Changed same-sequence fixture' }] });
assert(assessTrustStoreEnvelope(forkedSequence2, [TEST_ROOT_ANCHOR], '2026-08-12', TRUST_STORE_SEQUENCE_2.nextRollbackState).state === 'ROLLBACK_DETECTED', 'A different envelope reusing the accepted sequence must be rejected.');
const wrongPredecessor = makeTrustStoreEnvelope({ sequence: 2, previousEnvelopeSha256: 'f'.repeat(64) });
assert(assessTrustStoreEnvelope(wrongPredecessor, [TEST_ROOT_ANCHOR], '2026-08-12', TEST_TRUST_STORE.nextRollbackState).state === 'CHAIN_MISMATCH', 'A mismatched predecessor digest must fail closed.');
const sequenceGap = makeTrustStoreEnvelope({ sequence: 3, previousEnvelopeSha256: TEST_TRUST_STORE.envelopeSha256 });
assert(assessTrustStoreEnvelope(sequenceGap, [TEST_ROOT_ANCHOR], '2026-08-12', TEST_TRUST_STORE.nextRollbackState).state === 'SEQUENCE_GAP', 'Skipped trust-store envelope sequences must fail closed.');
assert(assessTrustStoreEnvelope(trustStoreSequence2, [TEST_ROOT_ANCHOR], '2026-08-12').state === 'HISTORY_NOT_AVAILABLE', 'A non-initial envelope without persisted rollback state must fail closed.');
assert(assessTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [TEST_ROOT_ANCHOR], '2026-08-12', TEST_TRUST_STORE.nextRollbackState).state === 'ENVELOPE_VERIFIED', 'Reassessing the exact highest accepted envelope must remain idempotently envelope-verified before witness evaluation.');
assert(validateRollbackStateTransition(undefined, TRUST_STORE_SEQUENCE_2.nextRollbackState!)?.includes('first accepted') === true, 'Persistent rollback state must reject initial sequence 2.');
assert(validateRollbackStateTransition(TEST_TRUST_STORE.nextRollbackState, { highestAcceptedSequence: 3, acceptedEnvelopeSha256: computeTrustStoreEnvelopeSha256(sequenceGap) })?.includes('skip') === true, 'Persistent rollback state must reject sequence gaps independently of envelope assessment.');
assert(validateRollbackStateTransition(TEST_TRUST_STORE.nextRollbackState, { highestAcceptedSequence: 1, acceptedEnvelopeSha256: 'f'.repeat(64) })?.includes('different envelope') === true, 'Persistent rollback state must reject same-sequence replacement.');

function asciiBytes(value: string): Uint8Array {
  return Uint8Array.from(Array.from(value, (character) => character.charCodeAt(0)));
}

const legalPackFixture = getRegulationPack('EU_GDPR');
const TEST_SOURCE_ARTIFACTS: SourceContentArtifacts = Object.fromEntries(legalPackFixture.sources.map((source, index) => [`test-source-${index}.pdf`, asciiBytes(`synthetic-offline-source-${index}:${source.url}`)]));

function makeLegallyAttestedPack(validUntil = '2027-02-11'): RegulationPack {
  const original = getRegulationPack('EU_GDPR');
  const pack: RegulationPack = {
    ...original,
    governance: {
      ...original.governance,
      sourceContentManifest: {
        schema: 'privacy-lens.source-content-manifest.v1',
        packVersion: original.versionLabel,
        generatedAt: '2026-08-11',
        entries: original.sources.map((source, index) => {
          const artifactId = `test-source-${index}.pdf`;
          const bytes = TEST_SOURCE_ARTIFACTS[artifactId];
          return { sourceUrl: source.url, contentUrl: source.url, artifactId, mediaType: 'application/pdf' as const, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes), retrievedAt: '2026-08-11', retrievalMethod: 'HTTPS_DIRECT' as const };
        }),
      },
    },
  };
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
        reviewedSourceContentManifestSha256: computeSourceContentManifestSha256(pack)!,
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
const reorderedManifestPack: RegulationPack = { ...attestedPack, governance: { ...attestedPack.governance, sourceContentManifest: { ...attestedPack.governance.sourceContentManifest!, entries: [...attestedPack.governance.sourceContentManifest!.entries].reverse() } } };
assert(computeSourceContentManifestSha256(reorderedManifestPack) === computeSourceContentManifestSha256(attestedPack), 'Canonical source-content manifests must be independent of input ordering and host locale.');
assert(validateRegulationPack(attestedPack, TEST_TRUST_STORE).length === 0, 'A synthetic signed two-person legal-review attestation fixture must pass schema validation with an explicitly witnessed trust-store release.');
assert(assessPackSourceContent(getRegulationPack('EU_GDPR')).state === 'ARTIFACTS_NOT_AVAILABLE', 'The production pack must distinguish recorded digests from locally verified source bytes.');
assert(assessPackSourceContent(attestedPack, TEST_SOURCE_ARTIFACTS).state === 'VERIFIED', 'All synthetic offline source bytes must verify against the test manifest.');
assert(assessPackLegalReview(getRegulationPack('EU_GDPR'), '2026-08-11').state === 'NOT_PROVIDED', 'The real project pack must disclose that independent legal review is not recorded.');
assert(assessPackLegalReview(getRegulationPack('GLOBAL_RESEARCH_BASELINE'), '2026-08-11').state === 'NOT_APPLICABLE', 'A non-legal research pack must not imply legal attestation.');
assert(assessPackLegalReview(attestedPack, '2026-08-11', TEST_TRUST_STORE, TEST_SOURCE_ARTIFACTS).state === 'CURRENT', 'A current signed attestation with verified source bytes and a witnessed trust-store release must be recognised on its assessed date.');
assert(assessPackLegalReview(attestedPack, '2026-08-11', TEST_ENVELOPE_ASSESSMENT, TEST_SOURCE_ARTIFACTS).state === 'TRUST_STORE_UNVERIFIED', 'A root-signed envelope alone must not bypass the independent witness requirement.');
const laterTrustStore = assessWitnessedTrustStoreEnvelope(TEST_TRUST_STORE_ENVELOPE, [TEST_ROOT_ANCHOR], TEST_WITNESS_POLICY, TEST_WITNESS_RECEIPTS, TEST_RELEASE_IDENTITY, '2027-02-12');
assert(assessPackLegalReview(attestedPack, '2027-02-12', laterTrustStore, TEST_SOURCE_ARTIFACTS).state === 'EXPIRED', 'An attestation must expire after its recorded validity date.');

const selfApprovedPack: RegulationPack = {
  ...attestedPack,
  governance: { ...attestedPack.governance, legalReviewAttestation: { ...attestedPack.governance.legalReviewAttestation!, approverId: 'TEST-QUALIFIED-REVIEWER' } },
};
assert(validateRegulationPack(selfApprovedPack, TEST_TRUST_STORE).some((error) => error.includes('different identities')), 'Case-insensitive reviewer self-approval must fail the four-eyes project gate.');

const mismatchedAttestationPack: RegulationPack = {
  ...attestedPack,
  governance: { ...attestedPack.governance, legalReviewAttestation: { ...attestedPack.governance.legalReviewAttestation!, reviewedPackVersion: 'different-pack-version', reviewedSourcesSha256: 'not-a-sha256' } },
};
assert(validateRegulationPack(mismatchedAttestationPack, TEST_TRUST_STORE).some((error) => error.includes('must match pack.versionLabel')), 'An attestation for another pack version must fail validation.');
assert(validateRegulationPack(mismatchedAttestationPack, TEST_TRUST_STORE).some((error) => error.includes('SHA-256 hex digest')), 'A malformed reviewed-source digest must fail validation.');

const changedSourcePack: RegulationPack = { ...attestedPack, sources: attestedPack.sources.map((source, index) => index === 0 ? { ...source, versionLabel: `${source.versionLabel}-changed` } : source) };
assert(assessPackLegalReview(changedSourcePack, '2026-08-11', TEST_TRUST_STORE, TEST_SOURCE_ARTIFACTS).state === 'SOURCE_BUNDLE_MISMATCH', 'A source-record change after signing must invalidate the source bundle before reassurance.');
const changedManifestPack: RegulationPack = { ...attestedPack, governance: { ...attestedPack.governance, sourceContentManifest: { ...attestedPack.governance.sourceContentManifest!, entries: attestedPack.governance.sourceContentManifest!.entries.map((entry, index) => index === 0 ? { ...entry, sha256: 'f'.repeat(64) } : entry) } } };
assert(assessPackLegalReview(changedManifestPack, '2026-08-11', TEST_TRUST_STORE, TEST_SOURCE_ARTIFACTS).state === 'SOURCE_CONTENT_MANIFEST_MISMATCH', 'A content-manifest change after signing must fail before source-byte verification.');
const missingArtifactId = attestedPack.governance.sourceContentManifest!.entries[0].artifactId;
const incompleteArtifacts = Object.fromEntries(Object.entries(TEST_SOURCE_ARTIFACTS).filter(([artifactId]) => artifactId !== missingArtifactId));
assert(assessPackSourceContent(attestedPack, incompleteArtifacts).state === 'ARTIFACT_MISSING', 'A missing offline artifact must remain distinct from a digest mismatch.');
assert(assessPackLegalReview(attestedPack, '2026-08-11', TEST_TRUST_STORE, incompleteArtifacts).state === 'SOURCE_CONTENT_UNVERIFIED', 'A signed attestation must not clear when an offline source artifact is missing.');
const originalBytes = TEST_SOURCE_ARTIFACTS[missingArtifactId];
const sameLengthMutation = { ...TEST_SOURCE_ARTIFACTS, [missingArtifactId]: Uint8Array.from(originalBytes, (byte, index) => index === 0 ? byte ^ 1 : byte) };
assert(assessPackSourceContent(attestedPack, sameLengthMutation).state === 'ARTIFACT_HASH_MISMATCH', 'A same-length source mutation must fail the SHA-256 check.');
const lengthMutation = { ...TEST_SOURCE_ARTIFACTS, [missingArtifactId]: originalBytes.slice(1) };
assert(assessPackSourceContent(attestedPack, lengthMutation).state === 'ARTIFACT_LENGTH_MISMATCH', 'A truncated source artifact must expose a distinct length mismatch.');
const badSignaturePack: RegulationPack = { ...attestedPack, governance: { ...attestedPack.governance, legalReviewAttestation: { ...attestedPack.governance.legalReviewAttestation!, signatureBase64: `${attestedPack.governance.legalReviewAttestation!.signatureBase64[0] === 'A' ? 'B' : 'A'}${attestedPack.governance.legalReviewAttestation!.signatureBase64.slice(1)}` } } };
assert(assessPackLegalReview(badSignaturePack, '2026-08-11', TEST_TRUST_STORE, TEST_SOURCE_ARTIFACTS).state === 'SIGNATURE_INVALID', 'A modified Ed25519 signature must fail closed.');
const unprovisionedTrustStore = assessTrustStoreEnvelope(undefined, [], '2026-08-11');
assert(assessPackLegalReview(attestedPack, '2026-08-11', unprovisionedTrustStore, TEST_SOURCE_ARTIFACTS).state === 'TRUST_STORE_UNVERIFIED', 'A structurally valid review signature must not be trusted without a verified production trust-store envelope.');
const revokedTrustStoreEnvelope = makeTrustStoreEnvelope({ revocations: [{ keyId: TEST_TRUST_ANCHOR.keyId, revokedAt: '2026-08-10', reason: 'Synthetic compromise fixture' }] });
const revokedTrustStore = assessWitnessedTrustStoreEnvelope(revokedTrustStoreEnvelope, [TEST_ROOT_ANCHOR], TEST_WITNESS_POLICY, makeWitnessReceipts(revokedTrustStoreEnvelope), TEST_RELEASE_IDENTITY, '2026-08-11');
assert(assessPackLegalReview(attestedPack, '2026-08-11', revokedTrustStore, TEST_SOURCE_ARTIFACTS).state === 'SIGNER_REVOKED', 'A reviewer key revoked by a verified trust-store envelope must fail closed.');

const unreviewedNoConcern = new RulePackComplianceEngine(getRegulationPack('EU_GDPR'), '2026-08-11').evaluate({ packageName: 'legal.review.missing', permissionType: 'CONTACTS', accessCount: 0, windowStart: now - 60_000, windowEnd: now, source: 'IMPORTED', processingContext: validContext });
assert(unreviewedNoConcern.compliance.status === 'INSUFFICIENT_EVIDENCE', 'A legal pack without current independent attestation must not emit a reassuring no-concern result.');
assert(unreviewedNoConcern.compliance.legalReview.state === 'NOT_PROVIDED' && unreviewedNoConcern.compliance.missingEvidence.includes('current cryptographically verified independent qualified legal-review attestation'), 'The finding must preserve and explain the missing signed legal-review gate.');

const attestedNoConcern = new RulePackComplianceEngine(attestedPack, '2026-08-11', TEST_TRUST_STORE, TEST_SOURCE_ARTIFACTS).evaluate({ packageName: 'legal.review.current', permissionType: 'CONTACTS', accessCount: 0, windowStart: now - 60_000, windowEnd: now, source: 'IMPORTED', processingContext: validContext });
assert(attestedNoConcern.compliance.status === 'NO_TECHNICAL_CONCERN' && attestedNoConcern.compliance.legalReview.state === 'CURRENT' && attestedNoConcern.compliance.sourceContent.state === 'VERIFIED', 'A consistent current attestation may clear the project reassurance gate only with verified source bytes, without establishing legal compliance.');

const contentUnavailableNoConcern = new RulePackComplianceEngine(attestedPack, '2026-08-11', TEST_TRUST_STORE).evaluate({ packageName: 'legal.content.unavailable', permissionType: 'CONTACTS', accessCount: 0, windowStart: now - 60_000, windowEnd: now, source: 'IMPORTED', processingContext: validContext });
assert(contentUnavailableNoConcern.compliance.status === 'INSUFFICIENT_EVIDENCE' && contentUnavailableNoConcern.compliance.sourceContent.state === 'ARTIFACTS_NOT_AVAILABLE' && contentUnavailableNoConcern.compliance.missingEvidence.includes('offline verification of every recorded official-source artifact'), 'Recorded digests without supplied bytes must block reassurance and remain visible in the finding.');

const unreviewedSignal = new RulePackComplianceEngine(getRegulationPack('EU_GDPR'), '2026-08-11').evaluate({ packageName: 'legal.review.signal', permissionType: 'CONTACTS', accessCount: 7, windowStart: now - 60_000, windowEnd: now, source: 'IMPORTED', processingContext: validContext });
assert(unreviewedSignal.compliance.status === 'REVIEW_REQUIRED' && unreviewedSignal.compliance.missingEvidence.includes('current cryptographically verified independent qualified legal-review attestation'), 'The gate must preserve a conservative technical review signal while disclosing absent signed legal attestation.');

const missingSource: RegulationPack = { ...getRegulationPack('EU_GDPR'), sourceUrl: 'http://example.invalid' };
assert(validateRegulationPack(missingSource).some((error) => error.includes('HTTPS official source')), 'Governance validator must reject a non-HTTPS legal source mutation.');

const missingContentManifest: RegulationPack = { ...getRegulationPack('EU_GDPR'), governance: { ...getRegulationPack('EU_GDPR').governance, sourceContentManifest: undefined } };
assert(validateRegulationPack(missingContentManifest).some((error) => error.includes('require an offline source-content manifest')), 'Legal packs without a source-content manifest must fail governance validation.');

const duplicateManifestArtifact: RegulationPack = {
  ...getRegulationPack('EU_GDPR'),
  governance: {
    ...getRegulationPack('EU_GDPR').governance,
    sourceContentManifest: {
      ...getRegulationPack('EU_GDPR').governance.sourceContentManifest!,
      entries: getRegulationPack('EU_GDPR').governance.sourceContentManifest!.entries.map((entry, index, entries) => index === 1 ? { ...entry, artifactId: entries[0].artifactId } : entry),
    },
  },
};
assert(validateRegulationPack(duplicateManifestArtifact).some((error) => error.includes('artifactId duplicates')), 'Duplicate artifact identifiers must fail manifest validation.');

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
  sources: getRegulationPack('EU_GDPR').sources.map((source) => source.title.startsWith('Guidelines 1/2024') ? { ...source, consultationClosedAt: undefined } : source),
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

console.log('Governance validation, 1,800 independent-oracle cases, source-content verification, signed trust-store rollback/freeze/chain probes, independent witness threshold/identity/signature probes, metamorphic boundaries, and representative mutations passed.');
