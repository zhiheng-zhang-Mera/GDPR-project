import { computeSourceBundleSha256, currentSourceContentManifestSha256, verifyLegalReviewSignature } from './attestationCrypto';
import { assessPackSourceContent } from './sourceContent';
import { assessProductionLegalReviewTrustStore } from './trustAnchors';
import { LegalReviewGateState, LegalReviewTrustStoreAssessment, PackLegalReviewAssessment, PackSourceReviewAssessment, RegulationPack, RegulatorySource, RegulatorySourceLifecycle, SourceContentArtifacts, SourceContentVerificationState, SourceReviewState } from './types';
import { validateTemporalRuleMapping } from './temporalRuleMapping';
import { validateFormalPolicyConstraints } from './formalPolicy';
import { validateInformationFlowPolicyConstraints } from './informationFlowPolicy';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SHA256 = /^[A-Fa-f0-9]{64}$/;
const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

function isIsoCalendarDate(value: string | undefined): value is string {
  if (!value || !ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function isHttpsUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Checks whether a pack is structurally safe to load. Passing this function
 * means the recorded evidence is internally consistent; it is not a legal
 * opinion, a certification, or proof that the source material is current.
 */
export function validateRegulationPack(pack: RegulationPack, trustStore: LegalReviewTrustStoreAssessment = assessProductionLegalReviewTrustStore()): string[] {
  const errors: string[] = [];
  const governance = pack.governance;
  const legalState = governance.state === 'LEGALLY_REVIEWED' || governance.state === 'APPROVED_RELEASE';
  const attestation = governance.legalReviewAttestation;
  const trustAnchors = trustStore.state === 'CURRENT' ? trustStore.trustAnchors : [];

  if (!pack.id.trim()) errors.push('id is required');
  if (!pack.versionLabel.trim()) errors.push('versionLabel is required');
  if (governance.schemaVersion !== 6) errors.push('governance.schemaVersion must be 6');
  if (!isIsoCalendarDate(governance.authoredAt)) errors.push('governance.authoredAt must be a valid YYYY-MM-DD date');
  if (!isIsoCalendarDate(governance.lastReviewedAt)) errors.push('governance.lastReviewedAt must be a valid YYYY-MM-DD date');
  if (governance.effectiveFrom && !isIsoCalendarDate(governance.effectiveFrom)) errors.push('governance.effectiveFrom must be a valid YYYY-MM-DD date');
  if (isIsoCalendarDate(governance.authoredAt) && isIsoCalendarDate(governance.lastReviewedAt) && governance.lastReviewedAt < governance.authoredAt) errors.push('governance.lastReviewedAt cannot precede authoredAt');
  if (governance.locales.length === 0) errors.push('at least one reviewed locale is required');
  if (governance.changeTriggers.length === 0) errors.push('at least one change trigger is required');
  if (!governance.reviewAuthority.reviewer.trim()) errors.push('reviewAuthority.reviewer is required');
  if (!governance.reviewAuthority.scope.trim()) errors.push('reviewAuthority.scope is required');

  if (pack.kind === 'LEGAL_FRAMEWORK' && !isHttpsUrl(pack.sourceUrl)) errors.push('legal frameworks require an HTTPS official source');
  if (pack.kind === 'LEGAL_FRAMEWORK' && !pack.sources.some(({ status }) => status === 'BINDING_LAW')) errors.push('legal frameworks require a binding-law source record');
  if (pack.kind === 'LEGAL_FRAMEWORK' && !pack.sources.some(({ url }) => url === pack.sourceUrl)) errors.push('the primary sourceUrl must be present in source records');
  if (pack.kind === 'LEGAL_FRAMEWORK' && !governance.sourceContentManifest) errors.push('legal frameworks require an offline source-content manifest');
  if (pack.kind !== 'LEGAL_FRAMEWORK' && governance.sourceContentManifest) errors.push('source-content manifests are only valid for legal frameworks');
  if (pack.kind === 'LEGAL_FRAMEWORK' && governance.state === 'NON_LEGAL_DEMONSTRATOR') errors.push('a legal framework cannot use the non-legal demonstrator state');
  if (pack.kind === 'RESEARCH_BASELINE' && governance.state !== 'NON_LEGAL_DEMONSTRATOR') errors.push('a research baseline must remain a non-legal demonstrator');
  if (legalState && governance.reviewAuthority.kind !== 'QUALIFIED_LEGAL') errors.push('legally reviewed or approved packs require a qualified legal reviewer');
  if (legalState && !attestation) errors.push('legally reviewed or approved packs require a legal-review attestation');
  if (governance.state === 'APPROVED_RELEASE' && governance.releaseScope !== 'PRODUCTION') errors.push('approved release packs require production release scope');
  if ((governance.state === 'TECHNICAL_CANDIDATE' || governance.state === 'NON_LEGAL_DEMONSTRATOR') && governance.releaseScope !== 'CONTROLLED_EVALUATION') errors.push('candidate and demonstrator packs are limited to controlled evaluation');
  if ((governance.state === 'SUPERSEDED' || governance.state === 'REVOKED') && !governance.successor) errors.push('superseded or revoked packs require a successor or blocking identifier');

  const manifest = governance.sourceContentManifest;
  if (manifest) {
    if (manifest.schema !== 'privacy-lens.source-content-manifest.v1') errors.push('sourceContentManifest.schema is unsupported');
    if (manifest.packVersion !== pack.versionLabel) errors.push('sourceContentManifest.packVersion must match pack.versionLabel');
    if (!isIsoCalendarDate(manifest.generatedAt)) errors.push('sourceContentManifest.generatedAt must be a valid YYYY-MM-DD date');
    if (isIsoCalendarDate(manifest.generatedAt) && isIsoCalendarDate(governance.lastReviewedAt) && manifest.generatedAt > governance.lastReviewedAt) errors.push('sourceContentManifest.generatedAt cannot follow governance.lastReviewedAt');
    if (manifest.entries.length !== pack.sources.length) errors.push('sourceContentManifest must contain exactly one artifact for every source record');
    const sourceUrls = new Set(pack.sources.map(({ url }) => url));
    const manifestSourceUrls = new Set<string>();
    const artifactIds = new Set<string>();
    for (const [index, entry] of manifest.entries.entries()) {
      if (!sourceUrls.has(entry.sourceUrl)) errors.push(`sourceContentManifest.entries.${index}.sourceUrl must match a source record`);
      if (manifestSourceUrls.has(entry.sourceUrl)) errors.push(`sourceContentManifest.entries.${index}.sourceUrl duplicates another manifest entry`);
      if (!isHttpsUrl(entry.contentUrl)) errors.push(`sourceContentManifest.entries.${index}.contentUrl must use HTTPS`);
      if (!entry.artifactId.trim()) errors.push(`sourceContentManifest.entries.${index}.artifactId is required`);
      if (artifactIds.has(entry.artifactId)) errors.push(`sourceContentManifest.entries.${index}.artifactId duplicates another manifest entry`);
      if (entry.mediaType !== 'application/pdf') errors.push(`sourceContentManifest.entries.${index}.mediaType must be application/pdf`);
      if (!Number.isSafeInteger(entry.byteLength) || entry.byteLength <= 0) errors.push(`sourceContentManifest.entries.${index}.byteLength must be a positive safe integer`);
      if (!SHA256.test(entry.sha256)) errors.push(`sourceContentManifest.entries.${index}.sha256 must be a SHA-256 hex digest`);
      if (!isIsoCalendarDate(entry.retrievedAt)) errors.push(`sourceContentManifest.entries.${index}.retrievedAt must be a valid YYYY-MM-DD date`);
      if (isIsoCalendarDate(entry.retrievedAt) && isIsoCalendarDate(manifest.generatedAt) && entry.retrievedAt > manifest.generatedAt) errors.push(`sourceContentManifest.entries.${index}.retrievedAt cannot follow manifest.generatedAt`);
      if (entry.retrievalMethod !== 'HTTPS_DIRECT') errors.push(`sourceContentManifest.entries.${index}.retrievalMethod must be HTTPS_DIRECT`);
      manifestSourceUrls.add(entry.sourceUrl);
      artifactIds.add(entry.artifactId);
    }
    for (const sourceUrl of sourceUrls) if (!manifestSourceUrls.has(sourceUrl)) errors.push(`sourceContentManifest is missing source record ${sourceUrl}`);
  }

  if (attestation) {
    if (pack.kind !== 'LEGAL_FRAMEWORK') errors.push('legal-review attestations are only valid for legal frameworks');
    if (!legalState) errors.push('a legal-review attestation requires a legally reviewed or approved governance state');
    if (governance.reviewAuthority.kind !== 'QUALIFIED_LEGAL') errors.push('a legal-review attestation requires qualified legal review authority');
    if (!attestation.attestationId.trim()) errors.push('legalReviewAttestation.attestationId is required');
    if (attestation.reviewedPackVersion !== pack.versionLabel) errors.push('legalReviewAttestation.reviewedPackVersion must match pack.versionLabel');
    if (!SHA256.test(attestation.reviewedSourcesSha256)) errors.push('legalReviewAttestation.reviewedSourcesSha256 must be a SHA-256 hex digest');
    if (!SHA256.test(attestation.reviewedSourceContentManifestSha256)) errors.push('legalReviewAttestation.reviewedSourceContentManifestSha256 must be a SHA-256 hex digest');
    if (!isIsoCalendarDate(attestation.reviewedAt)) errors.push('legalReviewAttestation.reviewedAt must be a valid YYYY-MM-DD date');
    if (!isIsoCalendarDate(attestation.approvedAt)) errors.push('legalReviewAttestation.approvedAt must be a valid YYYY-MM-DD date');
    if (!isIsoCalendarDate(attestation.validUntil)) errors.push('legalReviewAttestation.validUntil must be a valid YYYY-MM-DD date');
    if (!attestation.reviewerId.trim()) errors.push('legalReviewAttestation.reviewerId is required');
    if (!attestation.reviewerQualification.trim()) errors.push('legalReviewAttestation.reviewerQualification is required');
    if (!attestation.approverId.trim()) errors.push('legalReviewAttestation.approverId is required');
    if (!attestation.scope.trim()) errors.push('legalReviewAttestation.scope is required');
    if (attestation.signatureAlgorithm !== 'ED25519') errors.push('legalReviewAttestation.signatureAlgorithm must be ED25519');
    if (!attestation.signingKeyId.trim()) errors.push('legalReviewAttestation.signingKeyId is required');
    if (!BASE64.test(attestation.signatureBase64) || attestation.signatureBase64.length !== 88) errors.push('legalReviewAttestation.signatureBase64 must encode a 64-byte Ed25519 signature');
    if (attestation.reviewerId.trim().toLowerCase() === attestation.approverId.trim().toLowerCase()) errors.push('legal-review reviewer and approver must be different identities');
    if (attestation.reviewerId !== governance.reviewAuthority.reviewer) errors.push('legal-review attestation reviewer must match reviewAuthority.reviewer');
    if (isIsoCalendarDate(attestation.reviewedAt) && isIsoCalendarDate(attestation.approvedAt) && attestation.approvedAt < attestation.reviewedAt) errors.push('legal-review approval cannot precede review');
    if (isIsoCalendarDate(attestation.approvedAt) && isIsoCalendarDate(attestation.validUntil) && attestation.validUntil <= attestation.approvedAt) errors.push('legal-review validity must extend beyond approval');
    if (isIsoCalendarDate(attestation.approvedAt) && isIsoCalendarDate(governance.lastReviewedAt) && attestation.approvedAt !== governance.lastReviewedAt) errors.push('legal-review approval must match governance.lastReviewedAt');
    if (SHA256.test(attestation.reviewedSourcesSha256) && attestation.reviewedSourcesSha256.toLowerCase() !== computeSourceBundleSha256(pack)) errors.push('legalReviewAttestation.reviewedSourcesSha256 must match the canonical source-record bundle');
    const manifestSha256 = currentSourceContentManifestSha256(pack);
    if (SHA256.test(attestation.reviewedSourceContentManifestSha256) && attestation.reviewedSourceContentManifestSha256.toLowerCase() !== manifestSha256) errors.push('legalReviewAttestation.reviewedSourceContentManifestSha256 must match the canonical source-content manifest');
    const anchor = trustAnchors.find(({ keyId }) => keyId === attestation.signingKeyId);
    if (!anchor) errors.push('legalReviewAttestation.signingKeyId is not in the application trust store');
    else {
      if (anchor.algorithm !== attestation.signatureAlgorithm) errors.push('legalReviewAttestation signature algorithm does not match its trust anchor');
      if (!isIsoCalendarDate(anchor.validFrom) || !isIsoCalendarDate(anchor.validUntil) || anchor.validUntil <= anchor.validFrom) errors.push('legal-review trust anchor validity is invalid');
      if (anchor.revokedAt && !isIsoCalendarDate(anchor.revokedAt)) errors.push('legal-review trust anchor revokedAt must be a valid YYYY-MM-DD date');
      if (isIsoCalendarDate(attestation.approvedAt) && (attestation.approvedAt < anchor.validFrom || attestation.approvedAt > anchor.validUntil)) errors.push('legal-review trust anchor was not valid at approval');
      if (!verifyLegalReviewSignature(pack, anchor.publicKeyBase64)) errors.push('legalReviewAttestation signature verification failed');
    }
  }

  const sourceUrls = new Set<string>();
  for (const [index, source] of pack.sources.entries()) {
    if (!source.title.trim()) errors.push(`sources.${index}.title is required`);
    if (!source.versionLabel.trim()) errors.push(`sources.${index}.versionLabel is required`);
    if (!source.authority.trim()) errors.push(`sources.${index}.authority is required`);
    if (!isHttpsUrl(source.url)) errors.push(`sources.${index}.url must use HTTPS`);
    if (!isIsoCalendarDate(source.checkedAt)) errors.push(`sources.${index}.checkedAt must be a valid YYYY-MM-DD date`);
    if (!isIsoCalendarDate(source.reviewDueAt)) errors.push(`sources.${index}.reviewDueAt must be a valid YYYY-MM-DD date`);
    if (isIsoCalendarDate(source.checkedAt) && isIsoCalendarDate(governance.lastReviewedAt) && source.checkedAt > governance.lastReviewedAt) errors.push(`sources.${index}.checkedAt cannot follow governance.lastReviewedAt`);
    if (isIsoCalendarDate(source.checkedAt) && isIsoCalendarDate(source.reviewDueAt) && source.reviewDueAt <= source.checkedAt) errors.push(`sources.${index}.reviewDueAt must follow checkedAt`);
    if (source.status === 'BINDING_LAW' && source.lifecycle !== 'IN_FORCE') errors.push(`sources.${index} binding law must use the IN_FORCE lifecycle`);
    if (source.status === 'FINAL_GUIDANCE' && source.lifecycle !== 'FINAL') errors.push(`sources.${index} final guidance must use the FINAL lifecycle`);
    if (source.status === 'CONSULTATION_MATERIAL' && source.lifecycle !== 'CONSULTATION_OPEN' && source.lifecycle !== 'CONSULTATION_CLOSED_PENDING_FINALISATION') errors.push(`sources.${index} consultation material must use a consultation lifecycle`);
    if (source.lifecycle === 'CONSULTATION_CLOSED_PENDING_FINALISATION') {
      if (!isIsoCalendarDate(source.consultationClosedAt)) errors.push(`sources.${index}.consultationClosedAt must be a valid YYYY-MM-DD date for a closed consultation`);
      if (isIsoCalendarDate(source.consultationClosedAt) && isIsoCalendarDate(source.checkedAt) && source.checkedAt < source.consultationClosedAt) errors.push(`sources.${index}.checkedAt cannot precede consultationClosedAt`);
    } else if (source.consultationClosedAt !== undefined) {
      errors.push(`sources.${index}.consultationClosedAt is only valid for a closed consultation`);
    }
    if (sourceUrls.has(source.url)) errors.push(`sources.${index}.url duplicates another source`);
    sourceUrls.add(source.url);
  }

  for (const permission of ['LOCATION', 'MICROPHONE', 'CONTACTS'] as const) {
    const rule = pack.rules[permission];
    if (!rule || rule.permissionType !== permission) errors.push(`rules.${permission} is missing or mismatched`);
    if (!Number.isFinite(rule?.baseline) || rule.baseline < 0) errors.push(`rules.${permission}.baseline must be finite and non-negative`);
    if (!Number.isFinite(rule?.deviationMultiplier) || rule.deviationMultiplier <= 0) errors.push(`rules.${permission}.deviationMultiplier must be positive`);
  }

  errors.push(...validateTemporalRuleMapping(pack));
  errors.push(...validateFormalPolicyConstraints(pack.formalPolicyConstraints));
  errors.push(...validateInformationFlowPolicyConstraints(pack.informationFlowPolicyConstraints));

  return errors;
}

export function assertValidRegulationPack(pack: RegulationPack, trustStore: LegalReviewTrustStoreAssessment = assessProductionLegalReviewTrustStore()): RegulationPack {
  const errors = validateRegulationPack(pack, trustStore);
  if (errors.length > 0) throw new Error(`Invalid regulation pack ${pack.id}: ${errors.join('; ')}`);
  return pack;
}

export function packGovernanceLabel(pack: RegulationPack): string {
  switch (pack.governance.state) {
    case 'TECHNICAL_CANDIDATE': return 'Engineering-reviewed candidate';
    case 'LEGALLY_REVIEWED': return 'Qualified legal review recorded';
    case 'APPROVED_RELEASE': return 'Approved production pack';
    case 'NON_LEGAL_DEMONSTRATOR': return 'Non-legal demonstration only';
    case 'SUPERSEDED': return 'Superseded pack';
    case 'REVOKED': return 'Revoked pack';
  }
}

export function sourceLifecycleLabel(lifecycle: RegulatorySourceLifecycle): string {
  switch (lifecycle) {
    case 'IN_FORCE': return 'In force';
    case 'FINAL': return 'Final';
    case 'CONSULTATION_OPEN': return 'Consultation open';
    case 'CONSULTATION_CLOSED_PENDING_FINALISATION': return 'Consultation closed; finalisation pending';
  }
}

export function sourceReviewState(source: RegulatorySource, asOfDate = new Date().toISOString().slice(0, 10)): SourceReviewState {
  if (!isIsoCalendarDate(asOfDate)) throw new Error(`Invalid source-review assessment date: ${asOfDate}`);
  return asOfDate > source.reviewDueAt ? 'REVIEW_DUE' : 'CURRENT';
}

export function sourceReviewLabel(state: SourceReviewState): string {
  return state === 'CURRENT' ? 'Source review current' : 'Source review due';
}

export function assessPackSourceReview(pack: RegulationPack, asOfDate = new Date().toISOString().slice(0, 10)): PackSourceReviewAssessment {
  if (!isIsoCalendarDate(asOfDate)) throw new Error(`Invalid pack source-review assessment date: ${asOfDate}`);
  if (pack.sources.length === 0) return { state: 'NOT_APPLICABLE', assessedAt: asOfDate, overdueSourceTitles: [] };
  const overdueSourceTitles = pack.sources.filter((source) => sourceReviewState(source, asOfDate) === 'REVIEW_DUE').map(({ title }) => title);
  const nextDueAt = [...pack.sources].map(({ reviewDueAt }) => reviewDueAt).sort()[0];
  return { state: overdueSourceTitles.length > 0 ? 'REVIEW_DUE' : 'CURRENT', assessedAt: asOfDate, nextDueAt, overdueSourceTitles };
}

export function sourceContentLabel(state: SourceContentVerificationState): string {
  switch (state) {
    case 'VERIFIED': return 'Offline source content verified';
    case 'MANIFEST_NOT_PROVIDED': return 'Source-content manifest not recorded';
    case 'ARTIFACTS_NOT_AVAILABLE': return 'Source digests recorded; bytes not verified here';
    case 'ARTIFACT_MISSING': return 'Offline source artifact missing';
    case 'ARTIFACT_LENGTH_MISMATCH': return 'Offline source length mismatch';
    case 'ARTIFACT_HASH_MISMATCH': return 'Offline source digest mismatch';
    case 'NOT_APPLICABLE': return 'Source-content verification not applicable';
  }
}

/**
 * Computes the fail-closed release gate shown in the UI. A reassuring result
 * requires source review, verified source bytes, a valid review attestation,
 * and a current witnessed trust store. Any missing layer remains visible.
 */
export function assessPackLegalReview(
  pack: RegulationPack,
  asOfDate = new Date().toISOString().slice(0, 10),
  trustStore: LegalReviewTrustStoreAssessment = assessProductionLegalReviewTrustStore(asOfDate),
  sourceArtifacts: SourceContentArtifacts = {},
): PackLegalReviewAssessment {
  if (!isIsoCalendarDate(asOfDate)) throw new Error(`Invalid legal-review assessment date: ${asOfDate}`);
  if (pack.kind !== 'LEGAL_FRAMEWORK') return { state: 'NOT_APPLICABLE', assessedAt: asOfDate };
  const attestation = pack.governance.legalReviewAttestation;
  if (!attestation) return { state: 'NOT_PROVIDED', assessedAt: asOfDate };
  const base = {
    assessedAt: asOfDate,
    validUntil: attestation.validUntil,
    attestationId: attestation.attestationId,
    signingKeyId: attestation.signingKeyId,
    requiredWitnessCount: trustStore.requiredWitnessCount,
    verifiedWitnessCount: trustStore.verifiedWitnessCount,
    witnessReceiptSetSha256: trustStore.witnessReceiptSetSha256,
  };
  if (attestation.reviewedSourcesSha256.toLowerCase() !== computeSourceBundleSha256(pack)) return { ...base, state: 'SOURCE_BUNDLE_MISMATCH', reason: 'The signed digest does not match the canonical source-record bundle.' };
  const manifestSha256 = currentSourceContentManifestSha256(pack);
  if (!manifestSha256 || attestation.reviewedSourceContentManifestSha256.toLowerCase() !== manifestSha256) return { ...base, state: 'SOURCE_CONTENT_MANIFEST_MISMATCH', reason: 'The signed source-content manifest digest does not match the current canonical manifest.' };
  const sourceContent = assessPackSourceContent(pack, sourceArtifacts, asOfDate);
  if (sourceContent.state !== 'VERIFIED') return { ...base, state: 'SOURCE_CONTENT_UNVERIFIED', sourceContentState: sourceContent.state, reason: sourceContent.reason ?? 'The offline source-content evidence did not verify.' };
  if (trustStore.state !== 'CURRENT') return { ...base, state: 'TRUST_STORE_UNVERIFIED', trustStoreState: trustStore.state, reason: trustStore.reason ?? 'The signed production trust store did not verify.' };
  const anchor = trustStore.trustAnchors.find(({ keyId }) => keyId === attestation.signingKeyId);
  if (!anchor || anchor.algorithm !== attestation.signatureAlgorithm || asOfDate < anchor.validFrom || asOfDate > anchor.validUntil) return { ...base, state: 'SIGNER_NOT_TRUSTED', reason: 'No currently valid application trust anchor matches the signing key.' };
  if (anchor.revokedAt && asOfDate >= anchor.revokedAt) return { ...base, state: 'SIGNER_REVOKED', reason: `The signing key was revoked on ${anchor.revokedAt}.` };
  if (!verifyLegalReviewSignature(pack, anchor.publicKeyBase64)) return { ...base, state: 'SIGNATURE_INVALID', reason: 'The Ed25519 signature could not be verified over the canonical attestation payload.' };
  return {
    ...base,
    state: asOfDate > attestation.validUntil ? 'EXPIRED' : 'CURRENT',
    sourceContentState: sourceContent.state,
    trustStoreState: trustStore.state,
  };
}

export function legalReviewLabel(state: LegalReviewGateState): string {
  switch (state) {
    case 'CURRENT': return 'Independent legal review current';
    case 'EXPIRED': return 'Independent legal review expired';
    case 'NOT_PROVIDED': return 'Independent legal review not recorded';
    case 'SOURCE_BUNDLE_MISMATCH': return 'Legal-review source bundle changed';
    case 'SOURCE_CONTENT_MANIFEST_MISMATCH': return 'Legal-review content manifest changed';
    case 'SOURCE_CONTENT_UNVERIFIED': return 'Legal-review source content unverified';
    case 'SIGNER_NOT_TRUSTED': return 'Legal-review signer not trusted';
    case 'SIGNER_REVOKED': return 'Legal-review signer revoked';
    case 'SIGNATURE_INVALID': return 'Legal-review signature invalid';
    case 'TRUST_STORE_UNVERIFIED': return 'Legal-review trust store unverified';
    case 'NOT_APPLICABLE': return 'Legal review not applicable';
  }
}
