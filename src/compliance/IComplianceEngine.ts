import { ComplianceFinding, PermissionAudit } from './types';

export interface IComplianceEngine {
  readonly regulation: string;
  evaluate(audit: PermissionAudit): ComplianceFinding;
}
