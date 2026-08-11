import {
  ComplianceRule,
  ComplianceStatus,
  PermissionAudit,
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
export type LegalReviewGateState = 'CURRENT' | 'EXPIRED' | 'NOT_PROVIDED' | 'NOT_APPLICABLE';

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

export interface LegalReviewAttestation {
  attestationId: string;
  reviewedPackVersion: string;
  reviewedSourcesSha256: string;
  reviewedAt: string;
  approvedAt: string;
  validUntil: string;
  reviewerId: string;
  reviewerQualification: string;
  approverId: string;
  scope: string;
}

export interface PackLegalReviewAssessment {
  state: LegalReviewGateState;
  assessedAt: string;
  validUntil?: string;
  attestationId?: string;
}

export interface PackGovernance {
  schemaVersion: 3;
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
  legalReviewAttestation?: LegalReviewAttestation;
  supersedes?: string;
  successor?: string;
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
  principles: string[];
  legalCaveat: string;
  findMissingEvidence: (audit: PermissionAudit) => string[];
  classify: (
    audit: PermissionAudit,
    signals: ('DAILY_TOTAL' | 'BURST_RATE' | 'CROSS_WINDOW')[],
    missingEvidence: string[],
  ) => ComplianceStatus;
}
