import { IComplianceEngine } from './IComplianceEngine';
import { ComplianceErrorCode, ComplianceEvaluation, ComplianceFinding, PermissionAudit, SensitivePermission } from './types';
import { LegalReviewTrustStoreAssessment, RegulationPack, SourceContentArtifacts } from '../regulations/types';
import { assessPackLegalReview, assessPackSourceReview } from '../regulations/governance';
import { assessPackSourceContent } from '../regulations/sourceContent';

const DAY_MS = 86_400_000;
const BURST_LIMIT: Record<SensitivePermission, number> = { LOCATION: 12, MICROPHONE: 6, CONTACTS: 4 };
const PERMISSIONS = new Set(['LOCATION', 'MICROPHONE', 'CONTACTS']);
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
  if (typeof x.permissionType !== 'string' || !PERMISSIONS.has(x.permissionType)) return reject('UNSUPPORTED_PERMISSION', 'Permission is not whitelisted.');
  if (x.source !== undefined && (typeof x.source !== 'string' || !SOURCES.has(x.source))) return reject('INVALID_SOURCE', 'Unknown audit source.');
  if (!Number.isSafeInteger(x.accessCount) || (x.accessCount as number) < 0) return reject('INVALID_COUNT', 'accessCount must be a safe non-negative integer.');
  if (!Number.isSafeInteger(x.windowStart) || !Number.isSafeInteger(x.windowEnd) || (x.windowStart as number) >= (x.windowEnd as number) ||
      (x.windowEnd as number) - (x.windowStart as number) > DAY_MS || (x.windowEnd as number) > Date.now() + 300_000) return reject('INVALID_WINDOW', 'Invalid audit window.');
  if (x.accessTimestamps !== undefined && (!Array.isArray(x.accessTimestamps) || x.accessTimestamps.length !== x.accessCount ||
      x.accessTimestamps.some((time) => !Number.isSafeInteger(time) || time < (x.windowStart as number) || time > (x.windowEnd as number)))) return reject('INVALID_TIMESTAMPS', 'Timestamps must match the count and window.');
  if (x.processingContext !== undefined) {
    if (!x.processingContext || typeof x.processingContext !== 'object' || Array.isArray(x.processingContext)) return reject('INVALID_CONTEXT', 'processingContext must be an object.');
    const context = x.processingContext as Record<string, unknown>;
    for (const field of [
      'purpose',
      'controllerIdentity',
      'article9Condition',
      'transparencyNoticeReference',
      'dataMinimisationAssessmentReference',
      'retentionJustification',
      'consentEvidenceReference',
      'contractNecessityReference',
      'legalMandateReference',
      'vitalInterestsAssessmentReference',
      'legitimateInterestsAssessmentReference',
      'dpiaReference',
    ] as const) if (context[field] !== undefined && typeof context[field] !== 'string') return reject('INVALID_CONTEXT', `${field} must be a string.`);
    for (const field of ['consentWithdrawn', 'specialCategoryData', 'userInitiated', 'dpiaRequired'] as const) if (context[field] !== undefined && typeof context[field] !== 'boolean') return reject('INVALID_CONTEXT', `${field} must be a boolean.`);
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

function riskFor(ratio: number): ComplianceFinding['riskLevel'] {
  if (ratio >= 4) return 'CRITICAL';
  if (ratio >= 2) return 'HIGH';
  if (ratio >= 1) return 'MEDIUM';
  return 'LOW';
}

function humanSummary(status: ComplianceFinding['compliance']['status'], signals: ComplianceFinding['signals']): string {
  const statusLabel: Record<typeof status, string> = {
    POTENTIAL_CONFLICT: 'Potential legal conflict needs urgent human review',
    LIKELY_NON_COMPLIANT: 'Legacy potential conflict needs urgent human review',
    REVIEW_REQUIRED: 'Review required',
    INSUFFICIENT_EVIDENCE: 'More evidence is needed',
    NO_TECHNICAL_CONCERN: 'No technical concern from this check',
  };
  const signalLabel = {
    DAILY_TOTAL: 'daily volume exceeded the configured prompt threshold',
    BURST_RATE: 'a short burst exceeded the configured prompt threshold',
    CROSS_WINDOW: 'combined activity across completed windows exceeded the prompt threshold',
  } as const;
  const detail = signals.length > 0 ? signals.map((signal) => signalLabel[signal]).join('; ') : 'no threshold signal was observed';
  return `${statusLabel[status]} · ${detail}.`;
}

export class RulePackComplianceEngine implements IComplianceEngine {
  readonly regulation: string;
  private readonly history = new Map<string, { start: number; end: number; count: number }[]>();

  private readonly sourceReview: ReturnType<typeof assessPackSourceReview>;
  private readonly sourceContent: ReturnType<typeof assessPackSourceContent>;
  private readonly legalReview: ReturnType<typeof assessPackLegalReview>;

  constructor(readonly pack: RegulationPack, evaluatedAt = new Date().toISOString().slice(0, 10), trustStore?: LegalReviewTrustStoreAssessment, sourceArtifacts?: SourceContentArtifacts) {
    this.regulation = pack.shortName;
    this.sourceReview = assessPackSourceReview(pack, evaluatedAt);
    this.sourceContent = assessPackSourceContent(pack, sourceArtifacts, evaluatedAt);
    this.legalReview = assessPackLegalReview(pack, evaluatedAt, trustStore, sourceArtifacts);
  }

  evaluate(audit: PermissionAudit): ComplianceFinding {
    const result = this.evaluateSafe(audit);
    if (!result.accepted) throw new ComplianceInputError(result.code, result.message);
    return result.finding;
  }

  evaluateSafe(value: unknown): ComplianceEvaluation {
    const parsed = parseAudit(value);
    if ('accepted' in parsed) return parsed;
    const audit = parsed;
    const rule = this.pack.rules[audit.permissionType];
    if (!rule) return reject('UNSUPPORTED_PERMISSION', 'No owned rule exists.');
    const threshold = Math.max(1, Math.ceil(rule.baseline * rule.deviationMultiplier));
    const excess = Math.max(0, audit.accessCount - threshold);
    const peak = peakPerMinute(audit.accessTimestamps);
    const key = `${audit.packageName}:${audit.permissionType}`;
    const previous = this.history.get(key) ?? [];
    const watermark = Math.max(audit.windowEnd, ...previous.map((entry) => entry.end));
    const entries = previous.filter((entry) => entry.end > watermark - DAY_MS && !(entry.start === audit.windowStart && entry.end === audit.windowEnd));
    const completed = entries.filter((entry) => entry.end <= audit.windowStart);
    entries.push({ start: audit.windowStart, end: audit.windowEnd, count: audit.accessCount });
    entries.sort((a, b) => a.end - b.end || a.start - b.start);
    this.history.set(key, entries.slice(-MAX_HISTORY_ENTRIES));
    const rollingCount = completed.reduce((sum, entry) => sum + entry.count, audit.accessCount);
    const signals: ComplianceFinding['signals'] = [];
    if (excess > 0) signals.push('DAILY_TOTAL');
    if (peak > BURST_LIMIT[audit.permissionType]) signals.push('BURST_RATE');
    if ((audit.source ?? 'SIMULATOR') !== 'SIMULATOR' && completed.length > 0 && rollingCount > threshold) signals.push('CROSS_WINDOW');
    const ratio = Math.max(excess / threshold, peak / BURST_LIMIT[audit.permissionType] - 1, rollingCount / threshold - 1);
    const missingEvidence = this.pack.findMissingEvidence(audit);
    const preliminaryStatus = this.pack.classify(audit, signals, missingEvidence);
    const legalReviewNeedsAttestation = this.legalReview.state !== 'CURRENT' && this.legalReview.state !== 'NOT_APPLICABLE';
    const sourceContentNeedsVerification = this.sourceContent.state !== 'VERIFIED' && this.sourceContent.state !== 'NOT_APPLICABLE';
    if (this.sourceReview.state === 'REVIEW_DUE') missingEvidence.push('renewed regulatory-source review');
    if (sourceContentNeedsVerification) missingEvidence.push('offline verification of every recorded official-source artifact');
    if (legalReviewNeedsAttestation) missingEvidence.push('current cryptographically verified independent qualified legal-review attestation');
    const status = this.sourceReview.state === 'REVIEW_DUE' || ((sourceContentNeedsVerification || legalReviewNeedsAttestation) && preliminaryStatus === 'NO_TECHNICAL_CONCERN') ? 'INSUFFICIENT_EVIDENCE' : preliminaryStatus;
    const caveats = [this.pack.legalCaveat];
    if (this.sourceReview.state === 'REVIEW_DUE') caveats.push('One or more regulatory sources are past the project review date; refresh and review the pack before relying on its mapping.');
    if (sourceContentNeedsVerification) caveats.push(`Official-document digests are recorded but the evaluated source bytes did not verify (${this.sourceContent.state}); the project blocks a reassuring no-concern result.`);
    if (legalReviewNeedsAttestation) caveats.push(`No current cryptographically verified independent qualified legal-review attestation is available for this pack version (${this.legalReview.state}); the project blocks a reassuring no-concern result.`);
    const legalReference = rule.legalReference;
    const finding: ComplianceFinding = {
      id: `${audit.packageName}:${audit.permissionType}`,
      packageName: audit.packageName,
      permissionType: audit.permissionType,
      violationCount: excess,
      threshold,
      riskLevel: signals.length ? riskFor(ratio) : 'LOW',
      isActive: signals.length > 0,
      regulationId: this.pack.id,
      regulationName: this.pack.shortName,
      legalReference,
      gdprArticle: legalReference,
      rationale: rule.rationale,
      detectedAt: audit.windowEnd,
      signals,
      evidence: { dailyCount: audit.accessCount, peakCallsPerMinute: peak, rollingCount, source: audit.source ?? 'SIMULATOR' },
      compliance: {
        status,
        applicablePrinciples: this.pack.principles,
        missingEvidence,
        legalCaveat: caveats.join(' '),
        sourceReview: this.sourceReview,
        sourceContent: this.sourceContent,
        legalReview: this.legalReview,
      },
      communication: undefined as never,
    };
    const urgent = status === 'POTENTIAL_CONFLICT' || status === 'LIKELY_NON_COMPLIANT' || finding.riskLevel === 'CRITICAL';
    const silent = status === 'NO_TECHNICAL_CONCERN';
    finding.communication = {
      title: `${finding.permissionType} privacy review`,
      summary: humanSummary(status, signals),
      recommendedAction: missingEvidence.length ? `Obtain: ${missingEvidence.join(', ')}.` : urgent ? 'Pause processing where appropriate and request human review.' : 'Review purpose, necessity, and proportionality before taking action.',
      notificationPriority: urgent ? 'URGENT' : silent ? 'SILENT' : 'STANDARD',
    };
    return { accepted: true, finding };
  }
}
