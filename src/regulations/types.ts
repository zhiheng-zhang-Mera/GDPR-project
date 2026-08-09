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

export interface PackGovernance {
  schemaVersion: 1;
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
