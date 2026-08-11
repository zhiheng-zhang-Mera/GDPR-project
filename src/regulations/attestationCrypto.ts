import forgeEd25519 from 'node-forge/lib/ed25519';
import forgeMd from 'node-forge/lib/md';
import forgeUtil from 'node-forge/lib/util';
import { LegalReviewAttestation, RegulationPack } from './types';

const SOURCE_BUNDLE_SCHEMA = 'privacy-lens.source-record-bundle.v1';
const ATTESTATION_PAYLOAD_SCHEMA = 'privacy-lens.legal-review-attestation.v1';

export function canonicalizeSourceBundle(pack: RegulationPack): string {
  const sources = [...pack.sources]
    .sort((a, b) => a.url < b.url ? -1 : a.url > b.url ? 1 : 0)
    .map((source) => ({
      title: source.title,
      versionLabel: source.versionLabel,
      url: source.url,
      authority: source.authority,
      status: source.status,
      lifecycle: source.lifecycle,
      checkedAt: source.checkedAt,
      reviewDueAt: source.reviewDueAt,
      consultationClosedAt: source.consultationClosedAt ?? null,
    }));
  return JSON.stringify({ schema: SOURCE_BUNDLE_SCHEMA, packId: pack.id, packVersion: pack.versionLabel, sources });
}

export function sha256Hex(value: string): string {
  return forgeMd.sha256.create().update(value, 'utf8').digest().toHex().toLowerCase();
}

export function computeSourceBundleSha256(pack: RegulationPack): string {
  return sha256Hex(canonicalizeSourceBundle(pack));
}

export function canonicalizeLegalReviewPayload(pack: RegulationPack, attestation: LegalReviewAttestation): string {
  return JSON.stringify({
    schema: ATTESTATION_PAYLOAD_SCHEMA,
    attestationId: attestation.attestationId,
    packId: pack.id,
    reviewedPackVersion: attestation.reviewedPackVersion,
    reviewedSourcesSha256: attestation.reviewedSourcesSha256.toLowerCase(),
    reviewedAt: attestation.reviewedAt,
    approvedAt: attestation.approvedAt,
    validUntil: attestation.validUntil,
    reviewerId: attestation.reviewerId,
    reviewerQualification: attestation.reviewerQualification,
    approverId: attestation.approverId,
    scope: attestation.scope,
    signatureAlgorithm: attestation.signatureAlgorithm,
    signingKeyId: attestation.signingKeyId,
  });
}

export function verifyLegalReviewSignature(pack: RegulationPack, publicKeyBase64: string): boolean {
  const attestation = pack.governance.legalReviewAttestation;
  if (!attestation) return false;
  try {
    return forgeEd25519.verify({
      message: canonicalizeLegalReviewPayload(pack, attestation),
      encoding: 'utf8',
      signature: forgeUtil.decode64(attestation.signatureBase64),
      publicKey: forgeUtil.decode64(publicKeyBase64),
    });
  } catch {
    return false;
  }
}
