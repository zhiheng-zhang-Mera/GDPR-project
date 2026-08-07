import { IComplianceEngine } from './IComplianceEngine';
import {
  ComplianceFinding,
  ComplianceEvaluation,
  ComplianceErrorCode,
  ComplianceRule,
  PermissionAudit,
  RiskLevel,
  SensitivePermission,
} from './types';

const PERMISSIONS = new Set<SensitivePermission>(['LOCATION', 'MICROPHONE', 'CONTACTS']);
const DAY_MS = 86_400_000;
const BURST_LIMIT: Record<SensitivePermission, number> = { LOCATION: 12, MICROPHONE: 6, CONTACTS: 4 };
const LAWFUL_BASES = new Set(['CONSENT', 'CONTRACT', 'LEGAL_OBLIGATION', 'VITAL_INTERESTS', 'PUBLIC_TASK', 'LEGITIMATE_INTERESTS']);
const SOURCES = new Set(['SIMULATOR', 'NATIVE_BRIDGE', 'IMPORTED']);
const MAX_HISTORY_ENTRIES = 4_096;

export class ComplianceInputError extends Error {
  constructor(readonly code: ComplianceErrorCode, message: string) {
    super(message);
    this.name = 'ComplianceInputError';
  }
}

function reject(code: ComplianceErrorCode, message: string): ComplianceEvaluation {
  return { accepted: false, code, message, rejectedAt: Date.now() };
}

function parseAudit(value: unknown): PermissionAudit | ComplianceEvaluation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return reject('INVALID_PACKAGE', 'Audit must be an object.');
  const x = value as Record<string, unknown>;
  if (typeof x.packageName !== 'string' || !/^[A-Za-z0-9_.-]{1,255}$/.test(x.packageName)) return reject('INVALID_PACKAGE', 'Invalid packageName.');
  if (typeof x.permissionType !== 'string' || !PERMISSIONS.has(x.permissionType as SensitivePermission)) return reject('UNSUPPORTED_PERMISSION', 'Permission is not whitelisted.');
  if (x.source !== undefined && (typeof x.source !== 'string' || !SOURCES.has(x.source))) return reject('INVALID_SOURCE', 'Unknown audit source.');
  if (!Number.isSafeInteger(x.accessCount) || (x.accessCount as number) < 0) return reject('INVALID_COUNT', 'accessCount must be a safe non-negative integer.');
  if (!Number.isSafeInteger(x.windowStart) || !Number.isSafeInteger(x.windowEnd) ||
      (x.windowStart as number) >= (x.windowEnd as number) || (x.windowEnd as number) - (x.windowStart as number) > DAY_MS ||
      (x.windowEnd as number) > Date.now() + 300_000) return reject('INVALID_WINDOW', 'Invalid audit window.');
  if (x.accessTimestamps !== undefined && (!Array.isArray(x.accessTimestamps) || x.accessTimestamps.length !== x.accessCount ||
      x.accessTimestamps.some((t) => !Number.isSafeInteger(t) || t < (x.windowStart as number) || t > (x.windowEnd as number)))) {
    return reject('INVALID_TIMESTAMPS', 'Timestamps must match the count and window.');
  }
  if (x.processingContext !== undefined) {
    if (!x.processingContext || typeof x.processingContext !== 'object' || Array.isArray(x.processingContext)) return reject('INVALID_CONTEXT', 'processingContext must be an object.');
    const context = x.processingContext as Record<string, unknown>;
    for (const field of ['purpose', 'controllerIdentity', 'article9Condition'] as const) {
      if (context[field] !== undefined && typeof context[field] !== 'string') return reject('INVALID_CONTEXT', `${field} must be a string.`);
    }
    for (const field of ['consentWithdrawn', 'specialCategoryData', 'userInitiated'] as const) {
      if (context[field] !== undefined && typeof context[field] !== 'boolean') return reject('INVALID_CONTEXT', `${field} must be a boolean.`);
    }
    if (context.lawfulBasis !== undefined && (typeof context.lawfulBasis !== 'string' || !LAWFUL_BASES.has(context.lawfulBasis))) return reject('INVALID_CONTEXT', 'Unknown Article 6 lawful basis.');
    if (context.retentionDays !== undefined && (!Number.isSafeInteger(context.retentionDays) || (context.retentionDays as number) < 0)) return reject('INVALID_CONTEXT', 'retentionDays must be a safe non-negative integer.');
  }
  return x as unknown as PermissionAudit;
}

function peakPerMinute(values: number[] = []): number {
  const sorted = [...values].sort((a, b) => a - b);
  let left = 0;
  let peak = 0;
  for (let right = 0; right < sorted.length; right += 1) {
    while (sorted[right] - sorted[left] >= 60_000) left += 1;
    peak = Math.max(peak, right - left + 1);
  }
  return peak;
}

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

function assessCompliance(audit: PermissionAudit, signals: ComplianceFinding['signals']): ComplianceFinding['compliance'] {
  const context = audit.processingContext;
  const missingEvidence: string[] = [];
  if (!context?.purpose?.trim()) missingEvidence.push('specified purpose');
  if (!context?.lawfulBasis) missingEvidence.push('Article 6 lawful basis');
  if (!context?.controllerIdentity?.trim()) missingEvidence.push('controller identity');
  if (!Number.isInteger(context?.retentionDays) || (context?.retentionDays ?? -1) < 0) missingEvidence.push('retention period');
  if (context?.specialCategoryData && !context.article9Condition?.trim()) missingEvidence.push('Article 9 condition');

  let status: ComplianceFinding['compliance']['status'];
  if (context?.consentWithdrawn && context.lawfulBasis === 'CONSENT' && audit.accessCount > 0) status = 'LIKELY_NON_COMPLIANT';
  else if (missingEvidence.length > 0) status = 'INSUFFICIENT_EVIDENCE';
  else if (signals.length > 0) status = 'REVIEW_REQUIRED';
  else status = 'NO_TECHNICAL_CONCERN';

  return {
    status,
    applicablePrinciples: ['Art. 5(1)(a) transparency', 'Art. 5(1)(b) purpose limitation', 'Art. 5(1)(c) data minimisation', 'Art. 5(2) accountability', 'Art. 6 lawfulness'],
    missingEvidence,
    legalCaveat: 'This automated warning supports accountability review and is not a determination of GDPR infringement.',
  };
}

function communicate(finding: Pick<ComplianceFinding, 'permissionType' | 'signals' | 'riskLevel' | 'compliance'>): ComplianceFinding['communication'] {
  const urgent = finding.compliance.status === 'LIKELY_NON_COMPLIANT' || finding.riskLevel === 'CRITICAL';
  const silent = finding.compliance.status === 'NO_TECHNICAL_CONCERN';
  const reason = finding.signals.length > 0 ? finding.signals.join(', ') : 'no technical anomaly';
  return {
    title: `${finding.permissionType} compliance review`,
    summary: `${finding.compliance.status.replaceAll('_', ' ')}: ${reason}.`,
    recommendedAction: finding.compliance.missingEvidence.length > 0
      ? `Obtain: ${finding.compliance.missingEvidence.join(', ')}.`
      : urgent ? 'Pause processing where appropriate and request human compliance review.' : 'Review purpose, necessity, and proportionality before taking action.',
    notificationPriority: urgent ? 'URGENT' : silent ? 'SILENT' : 'STANDARD',
  };
}

export class GDPRComplianceEngine implements IComplianceEngine {
  readonly regulation = 'GDPR';
  private readonly history = new Map<string, { start: number; end: number; count: number }[]>();

  constructor(private readonly rules = GDPR_RULES) {}

  evaluate(audit: PermissionAudit): ComplianceFinding {
    const result = this.evaluateSafe(audit);
    if (!result.accepted) throw new ComplianceInputError(result.code, result.message);
    return result.finding;
  }

  evaluateSafe(value: unknown): ComplianceEvaluation {
    const parsed = parseAudit(value);
    if ('accepted' in parsed) return parsed;
    const audit = parsed;
    const rule = Object.prototype.hasOwnProperty.call(this.rules, audit.permissionType) ? this.rules[audit.permissionType] : undefined;
    if (!rule) return reject('UNSUPPORTED_PERMISSION', 'No owned rule exists.');
    const threshold = Math.max(1, Math.ceil(rule.baseline * rule.deviationMultiplier));
    const excess = Math.max(0, audit.accessCount - threshold);
    const peak = peakPerMinute(audit.accessTimestamps);
    const key = `${audit.packageName}:${audit.permissionType}`;
    const previous = this.history.get(key) ?? [];
    const watermark = Math.max(audit.windowEnd, ...previous.map((entry) => entry.end));
    const entries = previous.filter((entry) => entry.end > watermark - DAY_MS &&
      !(entry.start === audit.windowStart && entry.end === audit.windowEnd));
    const completedNonOverlapping = entries.filter((entry) => entry.end <= audit.windowStart);
    entries.push({ start: audit.windowStart, end: audit.windowEnd, count: audit.accessCount });
    entries.sort((a, b) => a.end - b.end || a.start - b.start);
    this.history.set(key, entries.slice(-MAX_HISTORY_ENTRIES));
    const rollingCount = completedNonOverlapping.reduce((sum, entry) => sum + entry.count, audit.accessCount);
    const signals: ComplianceFinding['signals'] = [];
    if (excess > 0) signals.push('DAILY_TOTAL');
    if (peak > BURST_LIMIT[audit.permissionType]) signals.push('BURST_RATE');
    if ((audit.source ?? 'SIMULATOR') !== 'SIMULATOR' && completedNonOverlapping.length > 0 && rollingCount > threshold) signals.push('CROSS_WINDOW');
    const ratio = Math.max(excess / threshold, peak / BURST_LIMIT[audit.permissionType] - 1, rollingCount / threshold - 1);
    const isActive = signals.length > 0;

    const compliance = assessCompliance(audit, signals);
    const finding: ComplianceFinding = {
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
      signals,
      evidence: { dailyCount: audit.accessCount, peakCallsPerMinute: peak, rollingCount, source: audit.source ?? 'SIMULATOR' },
      compliance,
      communication: undefined as never,
    };
    finding.communication = communicate(finding);
    return { accepted: true, finding };
  }
}
