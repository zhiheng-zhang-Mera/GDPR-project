import forgeEd25519 from 'node-forge/lib/ed25519';
import forgeMd from 'node-forge/lib/md';
import forgeUtil from 'node-forge/lib/util';
import {
  LegalReviewTrustAnchor,
  LegalReviewTrustRootAnchor,
  LegalReviewTrustStoreAssessment,
  LegalReviewTrustStoreEnvelope,
  LegalReviewTrustStoreRollbackState,
} from './types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SHA256 = /^[A-Fa-f0-9]{64}$/;
const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

function isBase64WithDecodedLength(value: string, byteLength: number): boolean {
  if (!BASE64.test(value)) return false;
  try {
    return forgeUtil.decode64(value).length === byteLength;
  } catch {
    return false;
  }
}

function isIsoCalendarDate(value: string | undefined): value is string {
  if (!value || !ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function sha256Hex(value: string): string {
  return forgeMd.sha256.create().update(value, 'utf8').digest().toHex().toLowerCase();
}

export function canonicalizeTrustStoreEnvelope(envelope: LegalReviewTrustStoreEnvelope): string {
  const trustAnchors = [...envelope.trustAnchors]
    .sort((a, b) => a.keyId < b.keyId ? -1 : a.keyId > b.keyId ? 1 : 0)
    .map((anchor) => ({
      keyId: anchor.keyId,
      algorithm: anchor.algorithm,
      publicKeyBase64: anchor.publicKeyBase64,
      owner: anchor.owner,
      validFrom: anchor.validFrom,
      validUntil: anchor.validUntil,
    }));
  const revocations = [...envelope.revocations]
    .sort((a, b) => a.keyId < b.keyId ? -1 : a.keyId > b.keyId ? 1 : 0)
    .map((revocation) => ({
      keyId: revocation.keyId,
      revokedAt: revocation.revokedAt,
      reason: revocation.reason,
      successorKeyId: revocation.successorKeyId ?? null,
    }));
  return JSON.stringify({
    schema: envelope.schema,
    sequence: envelope.sequence,
    issuedAt: envelope.issuedAt,
    validFrom: envelope.validFrom,
    validUntil: envelope.validUntil,
    issuerId: envelope.issuerId,
    approverId: envelope.approverId,
    previousEnvelopeSha256: envelope.previousEnvelopeSha256?.toLowerCase() ?? null,
    trustAnchors,
    revocations,
    signatureAlgorithm: envelope.signatureAlgorithm,
    signingRootKeyId: envelope.signingRootKeyId,
  });
}

export function computeTrustStoreEnvelopeSha256(envelope: LegalReviewTrustStoreEnvelope): string {
  return sha256Hex(JSON.stringify({ payload: canonicalizeTrustStoreEnvelope(envelope), signatureBase64: envelope.signatureBase64 }));
}

export function verifyTrustStoreEnvelopeSignature(envelope: LegalReviewTrustStoreEnvelope, publicKeyBase64: string): boolean {
  try {
    return forgeEd25519.verify({
      message: canonicalizeTrustStoreEnvelope(envelope),
      encoding: 'utf8',
      signature: forgeUtil.decode64(envelope.signatureBase64),
      publicKey: forgeUtil.decode64(publicKeyBase64),
    });
  } catch {
    return false;
  }
}

export function validateTrustStoreEnvelope(envelope: LegalReviewTrustStoreEnvelope): string[] {
  const errors: string[] = [];
  if (envelope.schema !== 'privacy-lens.legal-review-trust-store.v1') errors.push('trust-store envelope schema is unsupported');
  if (!Number.isSafeInteger(envelope.sequence) || envelope.sequence <= 0) errors.push('trust-store sequence must be a positive safe integer');
  if (!isIsoCalendarDate(envelope.issuedAt)) errors.push('trust-store issuedAt must be a valid YYYY-MM-DD date');
  if (!isIsoCalendarDate(envelope.validFrom)) errors.push('trust-store validFrom must be a valid YYYY-MM-DD date');
  if (!isIsoCalendarDate(envelope.validUntil)) errors.push('trust-store validUntil must be a valid YYYY-MM-DD date');
  if (isIsoCalendarDate(envelope.issuedAt) && isIsoCalendarDate(envelope.validFrom) && envelope.validFrom < envelope.issuedAt) errors.push('trust-store validFrom cannot precede issuedAt');
  if (isIsoCalendarDate(envelope.validFrom) && isIsoCalendarDate(envelope.validUntil) && envelope.validUntil <= envelope.validFrom) errors.push('trust-store validity must extend beyond validFrom');
  if (!envelope.issuerId.trim()) errors.push('trust-store issuerId is required');
  if (!envelope.approverId.trim()) errors.push('trust-store approverId is required');
  if (envelope.issuerId.trim().toLowerCase() === envelope.approverId.trim().toLowerCase()) errors.push('trust-store issuer and approver must be different identities');
  if (envelope.sequence === 1 && envelope.previousEnvelopeSha256 !== undefined) errors.push('trust-store sequence 1 must not declare a predecessor');
  if (envelope.sequence > 1 && !SHA256.test(envelope.previousEnvelopeSha256 ?? '')) errors.push('trust-store sequence above 1 requires a predecessor SHA-256 digest');
  if (envelope.signatureAlgorithm !== 'ED25519') errors.push('trust-store signatureAlgorithm must be ED25519');
  if (!envelope.signingRootKeyId.trim()) errors.push('trust-store signingRootKeyId is required');
  if (!isBase64WithDecodedLength(envelope.signatureBase64, 64)) errors.push('trust-store signatureBase64 must encode a 64-byte Ed25519 signature');
  if (envelope.trustAnchors.length === 0) errors.push('trust-store envelope must contain at least one reviewer trust anchor');

  const keyIds = new Set<string>();
  for (const [index, anchor] of envelope.trustAnchors.entries()) {
    if (!anchor.keyId.trim()) errors.push(`trust-store trustAnchors.${index}.keyId is required`);
    if (anchor.keyId === envelope.signingRootKeyId) errors.push(`trust-store trustAnchors.${index}.keyId must differ from the offline root key`);
    if (keyIds.has(anchor.keyId)) errors.push(`trust-store trustAnchors.${index}.keyId duplicates another anchor`);
    if (anchor.algorithm !== 'ED25519') errors.push(`trust-store trustAnchors.${index}.algorithm must be ED25519`);
    if (!isBase64WithDecodedLength(anchor.publicKeyBase64, 32)) errors.push(`trust-store trustAnchors.${index}.publicKeyBase64 must encode a 32-byte Ed25519 key`);
    if (!anchor.owner.trim()) errors.push(`trust-store trustAnchors.${index}.owner is required`);
    if (!isIsoCalendarDate(anchor.validFrom) || !isIsoCalendarDate(anchor.validUntil) || anchor.validUntil <= anchor.validFrom) errors.push(`trust-store trustAnchors.${index} validity is invalid`);
    if (anchor.revokedAt !== undefined) errors.push(`trust-store trustAnchors.${index}.revokedAt must be represented in revocations`);
    keyIds.add(anchor.keyId);
  }

  const revokedIds = new Set<string>();
  for (const [index, revocation] of envelope.revocations.entries()) {
    if (!revocation.keyId.trim()) errors.push(`trust-store revocations.${index}.keyId is required`);
    if (revokedIds.has(revocation.keyId)) errors.push(`trust-store revocations.${index}.keyId duplicates another revocation`);
    if (!isIsoCalendarDate(revocation.revokedAt)) errors.push(`trust-store revocations.${index}.revokedAt must be a valid YYYY-MM-DD date`);
    if (isIsoCalendarDate(revocation.revokedAt) && isIsoCalendarDate(envelope.validUntil) && revocation.revokedAt > envelope.validUntil) errors.push(`trust-store revocations.${index}.revokedAt cannot follow envelope expiry`);
    if (!revocation.reason.trim()) errors.push(`trust-store revocations.${index}.reason is required`);
    if (revocation.successorKeyId !== undefined && !revocation.successorKeyId.trim()) errors.push(`trust-store revocations.${index}.successorKeyId cannot be blank`);
    if (revocation.successorKeyId === revocation.keyId) errors.push(`trust-store revocations.${index}.successorKeyId must differ from the revoked key`);
    revokedIds.add(revocation.keyId);
  }
  return errors;
}

function isValidRootAnchor(root: LegalReviewTrustRootAnchor): boolean {
  return Boolean(
    root.keyId.trim()
    && root.algorithm === 'ED25519'
    && isBase64WithDecodedLength(root.publicKeyBase64, 32)
    && root.owner.trim()
    && isIsoCalendarDate(root.validFrom)
    && isIsoCalendarDate(root.validUntil)
    && root.validUntil > root.validFrom
    && (root.revokedAt === undefined || isIsoCalendarDate(root.revokedAt)),
  );
}

export function validateRollbackStateTransition(current: LegalReviewTrustStoreRollbackState | undefined, next: LegalReviewTrustStoreRollbackState): string | undefined {
  if (!Number.isSafeInteger(next.highestAcceptedSequence) || next.highestAcceptedSequence <= 0 || !SHA256.test(next.acceptedEnvelopeSha256)) return 'The next rollback state is malformed.';
  if (!current) return next.highestAcceptedSequence === 1 ? undefined : 'The first accepted trust-store sequence must be 1.';
  if (next.highestAcceptedSequence < current.highestAcceptedSequence) return 'The next rollback state would decrease the accepted sequence.';
  if (next.highestAcceptedSequence === current.highestAcceptedSequence && next.acceptedEnvelopeSha256.toLowerCase() !== current.acceptedEnvelopeSha256.toLowerCase()) return 'A different envelope cannot replace the accepted sequence.';
  if (next.highestAcceptedSequence > current.highestAcceptedSequence + 1) return 'The next rollback state would skip an intermediate sequence.';
  return undefined;
}

function effectiveAnchors(envelope: LegalReviewTrustStoreEnvelope): readonly LegalReviewTrustAnchor[] {
  const revocations = new Map(envelope.revocations.map((entry) => [entry.keyId, entry.revokedAt]));
  return envelope.trustAnchors.map((anchor) => ({ ...anchor, revokedAt: revocations.get(anchor.keyId) }));
}

export function assessTrustStoreEnvelope(
  envelope: LegalReviewTrustStoreEnvelope | undefined,
  rootAnchors: readonly LegalReviewTrustRootAnchor[],
  asOfDate = new Date().toISOString().slice(0, 10),
  previousState?: LegalReviewTrustStoreRollbackState,
): LegalReviewTrustStoreAssessment {
  if (!isIsoCalendarDate(asOfDate)) throw new Error(`Invalid trust-store assessment date: ${asOfDate}`);
  const empty = { assessedAt: asOfDate, trustAnchors: [] as readonly LegalReviewTrustAnchor[] };
  if (!envelope) return { ...empty, state: 'UNPROVISIONED', reason: 'No signed production trust-store envelope is provisioned.' };
  const errors = validateTrustStoreEnvelope(envelope);
  if (errors.length > 0) return { ...empty, state: 'INVALID', sequence: envelope.sequence, reason: errors.join('; ') };
  const envelopeSha256 = computeTrustStoreEnvelopeSha256(envelope);
  const base = { ...empty, sequence: envelope.sequence, envelopeSha256, validUntil: envelope.validUntil, signingRootKeyId: envelope.signingRootKeyId };
  const matchingRoots = rootAnchors.filter(({ keyId }) => keyId === envelope.signingRootKeyId);
  const root = matchingRoots.length === 1 ? matchingRoots[0] : undefined;
  if (!root || !isValidRootAnchor(root) || root.algorithm !== envelope.signatureAlgorithm || envelope.issuedAt < root.validFrom || envelope.issuedAt > root.validUntil || asOfDate < root.validFrom || asOfDate > root.validUntil) return { ...base, state: 'ROOT_NOT_TRUSTED', reason: 'Exactly one structurally valid offline root must match and be valid both when the envelope was issued and when it is assessed.' };
  if (root.revokedAt && asOfDate >= root.revokedAt) return { ...base, state: 'ROOT_REVOKED', reason: `The offline trust-store root was revoked on ${root.revokedAt}.` };
  if (!verifyTrustStoreEnvelopeSignature(envelope, root.publicKeyBase64)) return { ...base, state: 'SIGNATURE_INVALID', reason: 'The trust-store envelope signature is invalid.' };

  if (!previousState && envelope.sequence !== 1) return { ...base, state: 'HISTORY_NOT_AVAILABLE', reason: 'A non-initial trust-store envelope requires the previously accepted sequence and digest.' };
  if (previousState) {
    if (!Number.isSafeInteger(previousState.highestAcceptedSequence) || previousState.highestAcceptedSequence <= 0 || !SHA256.test(previousState.acceptedEnvelopeSha256)) return { ...base, state: 'INVALID', reason: 'The persisted rollback state is malformed.' };
    if (envelope.sequence < previousState.highestAcceptedSequence) return { ...base, state: 'ROLLBACK_DETECTED', reason: `Envelope sequence ${envelope.sequence} is older than accepted sequence ${previousState.highestAcceptedSequence}.` };
    if (envelope.sequence === previousState.highestAcceptedSequence && envelopeSha256 !== previousState.acceptedEnvelopeSha256.toLowerCase()) return { ...base, state: 'ROLLBACK_DETECTED', reason: 'A different envelope reuses the highest accepted sequence.' };
    if (envelope.sequence > previousState.highestAcceptedSequence + 1) return { ...base, state: 'SEQUENCE_GAP', reason: 'The trust-store chain skipped one or more required intermediate envelopes.' };
    if (envelope.sequence === previousState.highestAcceptedSequence + 1 && envelope.previousEnvelopeSha256?.toLowerCase() !== previousState.acceptedEnvelopeSha256.toLowerCase()) return { ...base, state: 'CHAIN_MISMATCH', reason: 'The envelope predecessor digest does not match the previously accepted envelope.' };
  }
  if (asOfDate < envelope.validFrom) return { ...base, state: 'NOT_YET_VALID', reason: `The trust-store envelope is not valid before ${envelope.validFrom}.` };
  if (asOfDate > envelope.validUntil) return { ...base, state: 'EXPIRED', reason: `The trust-store envelope expired on ${envelope.validUntil}.` };
  const trustAnchors = effectiveAnchors(envelope);
  return {
    ...base,
    state: 'ENVELOPE_VERIFIED',
    trustAnchors,
    nextRollbackState: { highestAcceptedSequence: envelope.sequence, acceptedEnvelopeSha256: envelopeSha256 },
  };
}

export function trustStoreEnvelopeLabel(state: LegalReviewTrustStoreAssessment['state']): string {
  switch (state) {
    case 'CURRENT': return 'Signed trust store current';
    case 'ENVELOPE_VERIFIED': return 'Envelope verified; witnesses pending';
    case 'UNPROVISIONED': return 'Production trust store unprovisioned';
    case 'INVALID': return 'Trust-store envelope invalid';
    case 'ROOT_NOT_TRUSTED': return 'Trust-store root not trusted';
    case 'ROOT_REVOKED': return 'Trust-store root revoked';
    case 'SIGNATURE_INVALID': return 'Trust-store signature invalid';
    case 'NOT_YET_VALID': return 'Trust store not yet valid';
    case 'EXPIRED': return 'Trust-store envelope expired';
    case 'HISTORY_NOT_AVAILABLE': return 'Rollback history unavailable';
    case 'ROLLBACK_DETECTED': return 'Trust-store rollback detected';
    case 'SEQUENCE_GAP': return 'Trust-store sequence gap';
    case 'CHAIN_MISMATCH': return 'Trust-store predecessor mismatch';
    case 'WITNESS_POLICY_UNPROVISIONED': return 'Production witness policy unprovisioned';
    case 'WITNESS_POLICY_INVALID': return 'Witness policy invalid';
    case 'WITNESS_RECEIPTS_INVALID': return 'Witness receipts invalid';
    case 'WITNESS_QUORUM_NOT_MET': return 'Witness quorum not met';
  }
}
