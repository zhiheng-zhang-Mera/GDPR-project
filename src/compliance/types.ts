export type SensitivePermission = 'LOCATION' | 'MICROPHONE' | 'CONTACTS';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

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
}

export type ComplianceErrorCode =
  | 'INVALID_PACKAGE'
  | 'UNSUPPORTED_PERMISSION'
  | 'INVALID_COUNT'
  | 'INVALID_WINDOW'
  | 'INVALID_TIMESTAMPS';

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
  gdprArticle: string;
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
