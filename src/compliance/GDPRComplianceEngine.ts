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
  if (!Number.isFinite(x.accessCount) || !Number.isInteger(x.accessCount) || (x.accessCount as number) < 0) return reject('INVALID_COUNT', 'accessCount must be a finite non-negative integer.');
  if (!Number.isFinite(x.windowStart) || !Number.isInteger(x.windowStart) || !Number.isFinite(x.windowEnd) || !Number.isInteger(x.windowEnd) ||
      (x.windowStart as number) >= (x.windowEnd as number) || (x.windowEnd as number) - (x.windowStart as number) > DAY_MS ||
      (x.windowEnd as number) > Date.now() + 300_000) return reject('INVALID_WINDOW', 'Invalid audit window.');
  if (x.accessTimestamps !== undefined && (!Array.isArray(x.accessTimestamps) || x.accessTimestamps.length !== x.accessCount ||
      x.accessTimestamps.some((t) => !Number.isFinite(t) || !Number.isInteger(t) || t < (x.windowStart as number) || t > (x.windowEnd as number)))) {
    return reject('INVALID_TIMESTAMPS', 'Timestamps must match the count and window.');
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

export class GDPRComplianceEngine implements IComplianceEngine {
  readonly regulation = 'GDPR';
  private readonly history = new Map<string, { at: number; count: number }[]>();

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
    const entries = (this.history.get(key) ?? []).filter((entry) => entry.at > audit.windowEnd - DAY_MS);
    entries.push({ at: audit.windowEnd, count: audit.accessCount });
    this.history.set(key, entries);
    const rollingCount = entries.reduce((sum, entry) => sum + entry.count, 0);
    const signals: ComplianceFinding['signals'] = [];
    if (excess > 0) signals.push('DAILY_TOTAL');
    if (peak > BURST_LIMIT[audit.permissionType]) signals.push('BURST_RATE');
    if ((audit.source ?? 'SIMULATOR') !== 'SIMULATOR' && entries.length > 1 && rollingCount > threshold) signals.push('CROSS_WINDOW');
    const ratio = Math.max(excess / threshold, peak / BURST_LIMIT[audit.permissionType] - 1, rollingCount / threshold - 1);
    const isActive = signals.length > 0;

    return { accepted: true, finding: {
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
    } };
  }
}
