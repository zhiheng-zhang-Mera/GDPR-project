import {
  ComplianceRule,
  ComplianceStatus,
  PermissionAudit,
  RegulationId,
  SensitivePermission,
} from '../compliance/types';

export type RegulationPackKind = 'LEGAL_FRAMEWORK' | 'RESEARCH_BASELINE';

export interface RegulationPack {
  id: RegulationId;
  name: string;
  shortName: string;
  jurisdiction: string;
  kind: RegulationPackKind;
  versionLabel: string;
  sourceUrl?: string;
  description: string;
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
