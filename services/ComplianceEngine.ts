import { Alert, DeviceEventEmitter } from 'react-native';
import { GDPRComplianceEngine } from '../src/compliance/GDPRComplianceEngine';
import { saveFinding } from '../src/compliance/ViolationRepository';
import { PermissionAudit, SensitivePermission } from '../src/compliance/types';

const engine = new GDPRComplianceEngine();

const EVENT_PERMISSION: Record<string, SensitivePermission> = {
  EXCESSIVE_COLLECTION: 'LOCATION',
  UNAUTHORIZED_CROSS_BORDER: 'CONTACTS',
  SENSITIVE_LEAK_RISK: 'MICROPHONE',
};

export class ComplianceEngine {
  static async processAudit(audit: PermissionAudit) {
    const finding = engine.evaluate(audit);
    const state = await saveFinding(finding);
    DeviceEventEmitter.emit('ON_NEW_LOG_STREAM', finding);

    if (finding.isActive && state.shouldNotify) {
      Alert.alert(
        `${finding.riskLevel} privacy warning`,
        `${finding.packageName} exceeded the ${finding.permissionType} baseline by ${finding.violationCount} calls.\n\n${finding.gdprArticle}\n${finding.rationale}`,
      );
    }
    return finding;
  }

  static processAuditEvent(
    eventType: keyof typeof EVENT_PERMISSION,
    apiName: string,
    _contextData: string,
    frequency = 1,
  ) {
    const now = Date.now();
    return this.processAudit({
      packageName: apiName,
      permissionType: EVENT_PERMISSION[eventType],
      accessCount: frequency,
      windowStart: now - 24 * 60 * 60 * 1000,
      windowEnd: now,
    });
  }
}
