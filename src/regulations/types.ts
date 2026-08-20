import {
  ComplianceRule,
  ComplianceSignal,
  ComplianceStatus,
  PermissionAudit,
  PrivacyObservationType,
  RegulationId,
  SensitivePermission,
} from '../compliance/types';

export type RegulationPackKind = 'LEGAL_FRAMEWORK' | 'RESEARCH_BASELINE';

export type PackGovernanceState =
  | 'TECHNICAL_CANDIDATE'
  | 'LEGALLY_REVIEWED'
  | 'APPROVED_RELEASE'
  | 'NON_LEGAL_DEMONSTRATOR'
  | 'SUPERSEDED'
  | 'REVOKED';

export type RegulatorySourceStatus = 'BINDING_LAW' | 'FINAL_GUIDANCE' | 'CONSULTATION_MATERIAL';
export type RegulatorySourceLifecycle =
  | 'IN_FORCE'
  | 'FINAL'
  | 'CONSULTATION_OPEN'
  | 'CONSULTATION_CLOSED_PENDING_FINALISATION';
export type SourceReviewState = 'CURRENT' | 'REVIEW_DUE';
export type PackSourceReviewState = SourceReviewState | 'NOT_APPLICABLE';
export type SourceContentVerificationState =
  | 'VERIFIED'
  | 'MANIFEST_NOT_PROVIDED'
  | 'ARTIFACTS_NOT_AVAILABLE'
  | 'ARTIFACT_MISSING'
  | 'ARTIFACT_LENGTH_MISMATCH'
  | 'ARTIFACT_HASH_MISMATCH'
  | 'NOT_APPLICABLE';
export type LegalReviewGateState =
  | 'CURRENT'
  | 'EXPIRED'
  | 'NOT_PROVIDED'
  | 'SOURCE_BUNDLE_MISMATCH'
  | 'SOURCE_CONTENT_MANIFEST_MISMATCH'
  | 'SOURCE_CONTENT_UNVERIFIED'
  | 'SIGNER_NOT_TRUSTED'
  | 'SIGNER_REVOKED'
  | 'SIGNATURE_INVALID'
  | 'TRUST_STORE_UNVERIFIED'
  | 'NOT_APPLICABLE';

export type TrustStoreEnvelopeState =
  | 'CURRENT'
  | 'ENVELOPE_VERIFIED'
  | 'UNPROVISIONED'
  | 'INVALID'
  | 'ROOT_NOT_TRUSTED'
  | 'ROOT_REVOKED'
  | 'SIGNATURE_INVALID'
  | 'NOT_YET_VALID'
  | 'EXPIRED'
  | 'HISTORY_NOT_AVAILABLE'
  | 'ROLLBACK_DETECTED'
  | 'SEQUENCE_GAP'
  | 'CHAIN_MISMATCH'
  | 'WITNESS_POLICY_UNPROVISIONED'
  | 'WITNESS_POLICY_INVALID'
  | 'WITNESS_RECEIPTS_INVALID'
  | 'WITNESS_QUORUM_NOT_MET';

export interface RegulatorySource {
  title: string;
  versionLabel: string;
  url: string;
  authority: string;
  status: RegulatorySourceStatus;
  lifecycle: RegulatorySourceLifecycle;
  checkedAt: string;
  reviewDueAt: string;
  consultationClosedAt?: string;
}

export interface PackSourceReviewAssessment {
  state: PackSourceReviewState;
  assessedAt: string;
  nextDueAt?: string;
  overdueSourceTitles: string[];
}

export interface SourceContentManifestEntry {
  sourceUrl: string;
  contentUrl: string;
  artifactId: string;
  mediaType: 'application/pdf';
  byteLength: number;
  sha256: string;
  retrievedAt: string;
  retrievalMethod: 'HTTPS_DIRECT';
}

export interface SourceContentManifest {
  schema: 'privacy-lens.source-content-manifest.v1';
  packVersion: string;
  generatedAt: string;
  entries: readonly SourceContentManifestEntry[];
}

export type SourceContentArtifacts = Readonly<Record<string, Uint8Array>>;

export interface PackSourceContentAssessment {
  state: SourceContentVerificationState;
  assessedAt: string;
  manifestSha256?: string;
  verifiedArtifactCount: number;
  expectedArtifactCount: number;
  affectedArtifactIds: string[];
  reason?: string;
}

export interface LegalReviewAttestation {
  attestationId: string;
  reviewedPackVersion: string;
  reviewedSourcesSha256: string;
  reviewedSourceContentManifestSha256: string;
  reviewedAt: string;
  approvedAt: string;
  validUntil: string;
  reviewerId: string;
  reviewerQualification: string;
  approverId: string;
  scope: string;
  signatureAlgorithm: 'ED25519';
  signingKeyId: string;
  signatureBase64: string;
}

export interface LegalReviewTrustAnchor {
  keyId: string;
  algorithm: 'ED25519';
  publicKeyBase64: string;
  owner: string;
  validFrom: string;
  validUntil: string;
  revokedAt?: string;
}

export interface LegalReviewTrustRootAnchor {
  keyId: string;
  algorithm: 'ED25519';
  publicKeyBase64: string;
  owner: string;
  validFrom: string;
  validUntil: string;
  revokedAt?: string;
}

export interface LegalReviewKeyRevocation {
  keyId: string;
  revokedAt: string;
  reason: string;
  successorKeyId?: string;
}

export interface LegalReviewTrustStoreEnvelope {
  schema: 'privacy-lens.legal-review-trust-store.v1';
  sequence: number;
  issuedAt: string;
  validFrom: string;
  validUntil: string;
  issuerId: string;
  approverId: string;
  previousEnvelopeSha256?: string;
  trustAnchors: readonly LegalReviewTrustAnchor[];
  revocations: readonly LegalReviewKeyRevocation[];
  signatureAlgorithm: 'ED25519';
  signingRootKeyId: string;
  signatureBase64: string;
}

export interface LegalReviewTrustStoreRollbackState {
  highestAcceptedSequence: number;
  acceptedEnvelopeSha256: string;
}

export interface LegalReviewTrustStoreWitnessAnchor {
  keyId: string;
  algorithm: 'ED25519';
  publicKeyBase64: string;
  owner: string;
  validFrom: string;
  validUntil: string;
  revokedAt?: string;
}

export interface LegalReviewTrustStoreWitnessPolicy {
  schema: 'privacy-lens.trust-store-witness-policy.v1';
  requiredWitnesses: number;
  anchors: readonly LegalReviewTrustStoreWitnessAnchor[];
}

export interface LegalReviewTrustStoreReleaseIdentity {
  applicationId: string;
  versionName: string;
  versionCode: number;
  releaseChannel: 'CONTROLLED_RESEARCH' | 'PRODUCTION';
}

export interface LegalReviewTrustStoreWitnessReceipt {
  schema: 'privacy-lens.trust-store-witness-receipt.v1';
  scope: 'TRUST_STORE_ENVELOPE';
  envelopeSha256: string;
  sequence: number;
  witnessedAt: string;
  witnessKeyId: string;
  releaseIdentity: LegalReviewTrustStoreReleaseIdentity;
  signatureAlgorithm: 'ED25519';
  signatureBase64: string;
}

export interface LegalReviewTrustStoreAssessment {
  state: TrustStoreEnvelopeState;
  assessedAt: string;
  sequence?: number;
  envelopeSha256?: string;
  validUntil?: string;
  signingRootKeyId?: string;
  witnessPolicyProvisioned?: boolean;
  requiredWitnessCount?: number;
  verifiedWitnessCount?: number;
  witnessReceiptSetSha256?: string;
  releaseIdentity?: LegalReviewTrustStoreReleaseIdentity;
  trustAnchors: readonly LegalReviewTrustAnchor[];
  nextRollbackState?: LegalReviewTrustStoreRollbackState;
  reason?: string;
}

export interface PackLegalReviewAssessment {
  state: LegalReviewGateState;
  assessedAt: string;
  validUntil?: string;
  attestationId?: string;
  signingKeyId?: string;
  sourceContentState?: SourceContentVerificationState;
  trustStoreState?: TrustStoreEnvelopeState;
  requiredWitnessCount?: number;
  verifiedWitnessCount?: number;
  witnessReceiptSetSha256?: string;
  reason?: string;
}

export interface PackGovernance {
  schemaVersion: 6;
  state: PackGovernanceState;
  authoredAt: string;
  lastReviewedAt: string;
  effectiveFrom?: string;
  reviewAuthority: {
    kind: 'PROJECT_ENGINEERING' | 'QUALIFIED_LEGAL';
    reviewer: string;
    scope: string;
  };
  releaseScope: 'CONTROLLED_EVALUATION' | 'PRODUCTION';
  locales: readonly string[];
  changeTriggers: readonly string[];
  sourceContentManifest?: SourceContentManifest;
  legalReviewAttestation?: LegalReviewAttestation;
  supersedes?: string;
  successor?: string;
}

export interface RegulationTemporalRequirement {
  type: PrivacyObservationType;
  minCount: number;
}

/** Regulation-owned mapping from legal concern to a dynamic event window. */
export interface RegulationTemporalProfile {
  id: string;
  title: string;
  windowMs: number;
  requirements: readonly RegulationTemporalRequirement[];
  legalReferences: readonly string[];
  rationale: string;
  riskLevel: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  notificationPriority: 'STANDARD' | 'URGENT';
}

export interface RegulationPack {
  id: RegulationId;
  name: string;
  shortName: string;
  jurisdiction: string;
  kind: RegulationPackKind;
  versionLabel: string;
  sourceUrl?: string;
  sources: readonly RegulatorySource[];
  description: string;
  governance: PackGovernance;
  rules: Record<SensitivePermission, ComplianceRule>;
  temporalProfiles: readonly RegulationTemporalProfile[];
  principles: string[];
  legalCaveat: string;
  findMissingEvidence: (audit: PermissionAudit) => string[];
  classify: (
    audit: PermissionAudit,
    signals: ComplianceSignal[],
    missingEvidence: string[],
  ) => ComplianceStatus;
}
