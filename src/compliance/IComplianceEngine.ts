import { ComplianceEvaluation, ComplianceFinding, PermissionAudit } from './types';

export interface IComplianceEngine {
  readonly regulation: string;
  evaluate(audit: PermissionAudit): ComplianceFinding;
  evaluateSafe(audit: unknown): ComplianceEvaluation;
}
