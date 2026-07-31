import { ComplianceFinding, ComplianceStatus } from './types';

export type DashboardFilter = 'ALL' | 'ACTION' | 'EVIDENCE';

export const STATUS_PRESENTATION: Record<ComplianceStatus, { label: string; marker: string }> = {
  LIKELY_NON_COMPLIANT: { label: 'Likely conflict', marker: '!' },
  REVIEW_REQUIRED: { label: 'Review required', marker: '?' },
  INSUFFICIENT_EVIDENCE: { label: 'Evidence incomplete', marker: 'i' },
  NO_TECHNICAL_CONCERN: { label: 'No technical concern', marker: '✓' },
};

export function summarizeFindings(findings: ComplianceFinding[]) {
  return findings.reduce(
    (summary, finding) => {
      if (finding.compliance.status === 'LIKELY_NON_COMPLIANT' || finding.compliance.status === 'REVIEW_REQUIRED') summary.action += 1;
      if (finding.compliance.status === 'INSUFFICIENT_EVIDENCE') summary.evidence += 1;
      if (finding.compliance.status === 'NO_TECHNICAL_CONCERN') summary.noConcern += 1;
      return summary;
    },
    { total: findings.length, action: 0, evidence: 0, noConcern: 0 },
  );
}

export function filterFindings(findings: ComplianceFinding[], filter: DashboardFilter) {
  if (filter === 'ACTION') {
    return findings.filter(({ compliance }) =>
      compliance.status === 'LIKELY_NON_COMPLIANT' || compliance.status === 'REVIEW_REQUIRED');
  }
  if (filter === 'EVIDENCE') {
    return findings.filter(({ compliance }) => compliance.status === 'INSUFFICIENT_EVIDENCE');
  }
  return findings;
}
