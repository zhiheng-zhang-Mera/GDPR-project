import forgeEd25519 from 'node-forge/lib/ed25519';
import forgeMd from 'node-forge/lib/md';
import forgeUtil from 'node-forge/lib/util';
import {
  LegalReviewTrustRootAnchor,
  LegalReviewTrustStoreAssessment,
  LegalReviewTrustStoreEnvelope,
  LegalReviewTrustStoreReleaseIdentity,
  LegalReviewTrustStoreRollbackState,
  LegalReviewTrustStoreWitnessAnchor,
  LegalReviewTrustStoreWitnessPolicy,
  LegalReviewTrustStoreWitnessReceipt,
} from './types';
import { assessTrustStoreEnvelope } from './trustStoreEnvelope';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SHA256 = /^[A-Fa-f0-9]{64}$/;
const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const APPLICATION_ID = /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$/;
const VERSION_NAME = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

function isIsoCalendarDate(value: string | undefined): value is string {
  if (!value || !ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function isBase64WithDecodedLength(value: string, byteLength: number): boolean {
  if (!BASE64.test(value)) return false;
  try {
    return forgeUtil.decode64(value).length === byteLength;
  } catch {
    return false;
  }
}

function sha256Hex(value: string): string {
  return forgeMd.sha256.create().update(value, 'utf8').digest().toHex().toLowerCase();
}

function sameReleaseIdentity(left: LegalReviewTrustStoreReleaseIdentity, right: LegalReviewTrustStoreReleaseIdentity): boolean {
  return left.applicationId === right.applicationId
    && left.versionName === right.versionName
    && left.versionCode === right.versionCode
    && left.releaseChannel === right.releaseChannel;
}

function isValidReleaseIdentity(identity: LegalReviewTrustStoreReleaseIdentity): boolean {
  return APPLICATION_ID.test(identity.applicationId)
    && VERSION_NAME.test(identity.versionName)
    && Number.isSafeInteger(identity.versionCode)
    && identity.versionCode > 0
    && (identity.releaseChannel === 'CONTROLLED_RESEARCH' || identity.releaseChannel === 'PRODUCTION');
}

function isValidWitnessAnchor(anchor: LegalReviewTrustStoreWitnessAnchor): boolean {
  return Boolean(
    anchor.keyId.trim()
    && anchor.algorithm === 'ED25519'
    && isBase64WithDecodedLength(anchor.publicKeyBase64, 32)
    && anchor.owner.trim()
    && isIsoCalendarDate(anchor.validFrom)
    && isIsoCalendarDate(anchor.validUntil)
    && anchor.validUntil > anchor.validFrom
    && (anchor.revokedAt === undefined || (isIsoCalendarDate(anchor.revokedAt) && anchor.revokedAt >= anchor.validFrom && anchor.revokedAt <= anchor.validUntil)),
  );
}

export function canonicalizeTrustStoreWitnessReceipt(receipt: LegalReviewTrustStoreWitnessReceipt): string {
  return JSON.stringify({
    schema: receipt.schema,
    scope: receipt.scope,
    envelopeSha256: receipt.envelopeSha256.toLowerCase(),
    sequence: receipt.sequence,
    witnessedAt: receipt.witnessedAt,
    witnessKeyId: receipt.witnessKeyId,
    releaseIdentity: {
      applicationId: receipt.releaseIdentity.applicationId,
      versionName: receipt.releaseIdentity.versionName,
      versionCode: receipt.releaseIdentity.versionCode,
      releaseChannel: receipt.releaseIdentity.releaseChannel,
    },
    signatureAlgorithm: receipt.signatureAlgorithm,
  });
}

export function verifyTrustStoreWitnessReceipt(receipt: LegalReviewTrustStoreWitnessReceipt, publicKeyBase64: string): boolean {
  try {
    return forgeEd25519.verify({
      message: canonicalizeTrustStoreWitnessReceipt(receipt),
      encoding: 'utf8',
      signature: forgeUtil.decode64(receipt.signatureBase64),
      publicKey: forgeUtil.decode64(publicKeyBase64),
    });
  } catch {
    return false;
  }
}

export function computeWitnessReceiptSetSha256(receipts: readonly LegalReviewTrustStoreWitnessReceipt[]): string {
  const canonical = [...receipts]
    .sort((left, right) => left.witnessKeyId < right.witnessKeyId ? -1 : left.witnessKeyId > right.witnessKeyId ? 1 : 0)
    .map((receipt) => ({ payload: canonicalizeTrustStoreWitnessReceipt(receipt), signatureBase64: receipt.signatureBase64 }));
  return sha256Hex(JSON.stringify(canonical));
}

export function assessWitnessedTrustStoreEnvelope(
  envelope: LegalReviewTrustStoreEnvelope | undefined,
  rootAnchors: readonly LegalReviewTrustRootAnchor[],
  witnessPolicy: LegalReviewTrustStoreWitnessPolicy | undefined,
  witnessReceipts: readonly LegalReviewTrustStoreWitnessReceipt[],
  expectedReleaseIdentity: LegalReviewTrustStoreReleaseIdentity,
  asOfDate = new Date().toISOString().slice(0, 10),
  previousState?: LegalReviewTrustStoreRollbackState,
): LegalReviewTrustStoreAssessment {
  const envelopeAssessment = assessTrustStoreEnvelope(envelope, rootAnchors, asOfDate, previousState);
  if (envelopeAssessment.state !== 'ENVELOPE_VERIFIED' || !envelope || !envelopeAssessment.envelopeSha256) return {
    ...envelopeAssessment,
    witnessPolicyProvisioned: Boolean(witnessPolicy && witnessPolicy.anchors.length > 0),
    requiredWitnessCount: witnessPolicy?.requiredWitnesses ?? 2,
    verifiedWitnessCount: 0,
    releaseIdentity: expectedReleaseIdentity,
  };
  const fail = (state: LegalReviewTrustStoreAssessment['state'], reason: string, requiredWitnessCount?: number, verifiedWitnessCount = 0): LegalReviewTrustStoreAssessment => ({
    ...envelopeAssessment,
    state,
    trustAnchors: [],
    nextRollbackState: undefined,
    witnessPolicyProvisioned: Boolean(witnessPolicy && witnessPolicy.anchors.length > 0),
    requiredWitnessCount,
    verifiedWitnessCount,
    releaseIdentity: expectedReleaseIdentity,
    reason,
  });

  if (!witnessPolicy || witnessPolicy.anchors.length === 0) return fail('WITNESS_POLICY_UNPROVISIONED', 'No independently governed production witness policy is provisioned.');
  if (!isValidReleaseIdentity(expectedReleaseIdentity)) return fail('WITNESS_POLICY_INVALID', 'The expected release identity is malformed.', witnessPolicy.requiredWitnesses);
  if (witnessPolicy.schema !== 'privacy-lens.trust-store-witness-policy.v1'
    || !Number.isSafeInteger(witnessPolicy.requiredWitnesses)
    || witnessPolicy.requiredWitnesses < 2
    || witnessPolicy.requiredWitnesses > witnessPolicy.anchors.length) return fail('WITNESS_POLICY_INVALID', 'The witness policy schema or threshold is invalid.', witnessPolicy.requiredWitnesses);

  const protectedKeyIds = new Set([envelope.signingRootKeyId, ...envelope.trustAnchors.map(({ keyId }) => keyId)]);
  const protectedPublicKeys = new Set([
    ...rootAnchors.map(({ publicKeyBase64 }) => publicKeyBase64),
    ...envelope.trustAnchors.map(({ publicKeyBase64 }) => publicKeyBase64),
  ]);
  const anchorIds = new Set<string>();
  const anchorPublicKeys = new Set<string>();
  const anchorOwners = new Set<string>();
  for (const anchor of witnessPolicy.anchors) {
    const normalizedOwner = anchor.owner.trim().toLocaleLowerCase('en-US');
    if (!isValidWitnessAnchor(anchor)
      || anchorIds.has(anchor.keyId)
      || protectedKeyIds.has(anchor.keyId)
      || anchorPublicKeys.has(anchor.publicKeyBase64)
      || protectedPublicKeys.has(anchor.publicKeyBase64)
      || anchorOwners.has(normalizedOwner)) return fail('WITNESS_POLICY_INVALID', 'Witness anchors must use unique owners, identifiers, and public keys that are separate from root and reviewer keys.', witnessPolicy.requiredWitnesses);
    anchorIds.add(anchor.keyId);
    anchorPublicKeys.add(anchor.publicKeyBase64);
    anchorOwners.add(normalizedOwner);
  }

  const receiptIds = new Set<string>();
  for (const receipt of witnessReceipts) {
    const anchor = witnessPolicy.anchors.find(({ keyId }) => keyId === receipt.witnessKeyId);
    const structurallyValid = receipt.schema === 'privacy-lens.trust-store-witness-receipt.v1'
      && receipt.scope === 'TRUST_STORE_ENVELOPE'
      && SHA256.test(receipt.envelopeSha256)
      && receipt.envelopeSha256.toLowerCase() === envelopeAssessment.envelopeSha256
      && receipt.sequence === envelope.sequence
      && isIsoCalendarDate(receipt.witnessedAt)
      && receipt.witnessedAt >= envelope.issuedAt
      && receipt.witnessedAt <= envelope.validUntil
      && receipt.witnessedAt <= asOfDate
      && Boolean(receipt.witnessKeyId.trim())
      && !receiptIds.has(receipt.witnessKeyId)
      && sameReleaseIdentity(receipt.releaseIdentity, expectedReleaseIdentity)
      && receipt.signatureAlgorithm === 'ED25519'
      && isBase64WithDecodedLength(receipt.signatureBase64, 64);
    const trustedAtReceiptAndAssessment = anchor
      && receipt.witnessedAt >= anchor.validFrom
      && receipt.witnessedAt <= anchor.validUntil
      && asOfDate >= anchor.validFrom
      && asOfDate <= anchor.validUntil
      && (!anchor.revokedAt || asOfDate < anchor.revokedAt);
    if (!structurallyValid || !trustedAtReceiptAndAssessment || !verifyTrustStoreWitnessReceipt(receipt, anchor.publicKeyBase64)) return fail('WITNESS_RECEIPTS_INVALID', 'Every witness receipt must be unique, trusted, correctly signed, timely, and bound to the exact envelope and release identity.', witnessPolicy.requiredWitnesses, receiptIds.size);
    receiptIds.add(receipt.witnessKeyId);
  }
  if (receiptIds.size < witnessPolicy.requiredWitnesses) return fail('WITNESS_QUORUM_NOT_MET', `The release has ${receiptIds.size} valid witness receipt(s); ${witnessPolicy.requiredWitnesses} are required.`, witnessPolicy.requiredWitnesses, receiptIds.size);

  return {
    ...envelopeAssessment,
    state: 'CURRENT',
    witnessPolicyProvisioned: true,
    requiredWitnessCount: witnessPolicy.requiredWitnesses,
    verifiedWitnessCount: receiptIds.size,
    witnessReceiptSetSha256: computeWitnessReceiptSetSha256(witnessReceipts),
    releaseIdentity: expectedReleaseIdentity,
    reason: `${receiptIds.size} independent witness receipts verified for the exact envelope and release identity.`,
  };
}
