import { IComplianceEngine } from './IComplianceEngine';
import {
  ComplianceFinding,
  ComplianceRule,
  PermissionAudit,
  RiskLevel,
  SensitivePermission,
} from './types';

export const GDPR_RULES: Record<SensitivePermission, ComplianceRule> = {
  LOCATION: {
    permissionType: 'LOCATION',
    baseline: 24,
    deviationMultiplier: 1.5,
    gdprArticle: 'GDPR Art. 5(1)(c), Art. 6',
    rationale: 'Location access must be necessary, proportionate, and supported by a lawful basis.',
  },
  MICROPHONE: {
    permissionType: 'MICROPHONE',
    baseline: 8,
    deviationMultiplier: 1.5,
    gdprArticle: 'GDPR Art. 5(1)(c), Art. 6, Art. 9',
    rationale: 'Repeated microphone access can expose special-category health or biometric data.',
  },
  CONTACTS: {
    permissionType: 'CONTACTS',
    baseline: 4,
    deviationMultiplier: 1.5,
    gdprArticle: 'GDPR Art. 5(1)(c), Art. 6',
    rationale: 'Contacts should only be read when required for an explicit user-facing purpose.',
  },
};

function riskFor(ratio: number): RiskLevel {
  if (ratio >= 4) return 'CRITICAL';
  if (ratio >= 2) return 'HIGH';
  if (ratio >= 1) return 'MEDIUM';
  return 'LOW';
}

export class GDPRComplianceEngine implements IComplianceEngine {
  readonly regulation = 'GDPR';

  constructor(private readonly rules = GDPR_RULES) {}

  evaluate(audit: PermissionAudit): ComplianceFinding {
    const rule = this.rules[audit.permissionType];
    const threshold = Math.max(1, Math.ceil(rule.baseline * rule.deviationMultiplier));
    const excess = Math.max(0, audit.accessCount - threshold);
    const ratio = excess / threshold;
    const isActive = excess > 0;

    return {
      id: `${audit.packageName}:${audit.permissionType}`,
      packageName: audit.packageName,
      permissionType: audit.permissionType,
      violationCount: excess,
      threshold,
      riskLevel: isActive ? riskFor(ratio) : 'LOW',
      isActive,
      gdprArticle: rule.gdprArticle,
      rationale: rule.rationale,
      detectedAt: audit.windowEnd,
    };
  }
}
