export type SensitivePermission = 'LOCATION' | 'MICROPHONE' | 'CONTACTS';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type LawfulBasis = 'CONSENT' | 'CONTRACT' | 'LEGAL_OBLIGATION' | 'VITAL_INTERESTS' | 'PUBLIC_TASK' | 'LEGITIMATE_INTERESTS';
export type ComplianceStatus =
  | 'INSUFFICIENT_EVIDENCE'
  | 'REVIEW_REQUIRED'
  | 'POTENTIAL_CONFLICT'
  | 'LIKELY_NON_COMPLIANT'
  | 'NO_TECHNICAL_CONCERN';
export type RegulationId = 'EU_GDPR' | 'GLOBAL_RESEARCH_BASELINE';

export interface ProcessingContext {
  purpose: string;
  lawfulBasis: LawfulBasis;
  controllerIdentity: string;
  retentionDays: number;
  transparencyNoticeReference?: string;
  dataMinimisationAssessmentReference?: string;
  retentionJustification?: string;
  consentEvidenceReference?: string;
  contractNecessityReference?: string;
  legalMandateReference?: string;
  vitalInterestsAssessmentReference?: string;
  legitimateInterestsAssessmentReference?: string;
  dpiaRequired?: boolean;
  dpiaReference?: string;
  consentWithdrawn?: boolean;
  specialCategoryData?: boolean;
  article9Condition?: string;
  userInitiated?: boolean;
}

export interface PermissionAudit {
  packageName: string;
  permissionType: SensitivePermission;
  accessCount: number;
  windowStart: number;
  windowEnd: number;
  foregroundCount?: number;
  backgroundCount?: number;
  accessTimestamps?: number[];
  source?: 'SIMULATOR' | 'NATIVE_BRIDGE' | 'IMPORTED';
  processingContext?: ProcessingContext;
}

export type ComplianceErrorCode =
  | 'INVALID_PACKAGE'
  | 'UNSUPPORTED_PERMISSION'
  | 'INVALID_COUNT'
  | 'INVALID_SOURCE'
  | 'INVALID_WINDOW'
  | 'INVALID_TIMESTAMPS'
  | 'INVALID_CONTEXT';

export interface ComplianceRejection {
  accepted: false;
  code: ComplianceErrorCode;
  message: string;
  rejectedAt: number;
}

export interface ComplianceAcceptance {
  accepted: true;
  finding: ComplianceFinding;
}

export type ComplianceEvaluation = ComplianceAcceptance | ComplianceRejection;

export interface ComplianceRule {
  permissionType: SensitivePermission;
  baseline: number;
  deviationMultiplier: number;
  legalReference: string;
  rationale: string;
}

export interface ComplianceFinding {
  id: string;
  packageName: string;
  permissionType: SensitivePermission;
  violationCount: number;
  threshold: number;
  riskLevel: RiskLevel;
  isActive: boolean;
  regulationId: RegulationId;
  regulationName: string;
  legalReference: string;
  /** @deprecated Compatibility alias for pre-1.1 stored findings. */
  gdprArticle: string;
  rationale: string;
  detectedAt: number;
  signals: ('DAILY_TOTAL' | 'BURST_RATE' | 'CROSS_WINDOW')[];
  evidence: {
    dailyCount: number;
    peakCallsPerMinute: number;
    rollingCount: number;
    source: NonNullable<PermissionAudit['source']>;
  };
  compliance: {
    status: ComplianceStatus;
    applicablePrinciples: string[];
    missingEvidence: string[];
    legalCaveat: string;
    sourceReview: {
      state: 'CURRENT' | 'REVIEW_DUE' | 'NOT_APPLICABLE' | 'NOT_RECORDED';
      assessedAt: string;
      nextDueAt?: string;
      overdueSourceTitles: string[];
    };
    legalReview: {
      state: 'CURRENT' | 'EXPIRED' | 'NOT_PROVIDED' | 'NOT_APPLICABLE' | 'NOT_RECORDED';
      assessedAt: string;
      validUntil?: string;
      attestationId?: string;
    };
  };
  communication: {
    title: string;
    summary: string;
    recommendedAction: string;
    notificationPriority: 'SILENT' | 'STANDARD' | 'URGENT';
  };
}

export interface SimulationConfig {
  id: string;
  permissionType: SensitivePermission;
  totalCalls: number;
  triggerTimes: number[];
  expectedViolation: boolean;
}

export interface EvaluationMetrics {
  truePositive: number;
  falsePositive: number;
  trueNegative: number;
  falseNegative: number;
  precision: number;
  recall: number;
}
