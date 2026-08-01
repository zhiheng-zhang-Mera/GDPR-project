import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';
import { PermissionAudit, SimulationConfig } from '../compliance/types';

const { PrivacyInspector } = NativeModules;

export interface AuditEvent extends PermissionAudit {
  destination?: string;
  eventType?: 'EXCESSIVE_COLLECTION' | 'UNAUTHORIZED_CROSS_BORDER' | 'SENSITIVE_LEAK_RISK';
  apiName?: string;
  frequency?: number;
  timestamp?: number;
}

export const PrivacyBridge = {
  initializePassiveAuditing: (onEventReceived: (event: AuditEvent) => void) => {
    if (Platform.OS !== 'android') return null;
    return DeviceEventEmitter.addListener('ON_PASSIVE_AUDIT_EVENT', onEventReceived);
  },

  scheduleDailyAudit: () => PrivacyInspector?.scheduleDailyAudit?.(),
  runAuditNow: () => PrivacyInspector?.runAuditNow?.(),
  scheduleSimulation: (config: SimulationConfig) =>
    PrivacyInspector?.scheduleSimulation?.(JSON.stringify(config)),
  scheduleRandomSimulation: () => PrivacyInspector?.scheduleRandomSimulation?.(),
  getLatestAudit: async (): Promise<unknown[]> => {
    const value = await PrivacyInspector?.getLatestAudit?.();
    return typeof value === 'string' ? JSON.parse(value) : [];
  },
  getLatestSimulation: async () => {
    const value = await PrivacyInspector?.getLatestSimulation?.();
    return {
      config: value?.config ? JSON.parse(value.config) : null,
      events: value?.events ? JSON.parse(value.events) : [],
      completedCalls: value?.completedCalls ?? 0,
      totalCalls: value?.totalCalls ?? 0,
    };
  },

  // Backwards-compatible entry point used by the existing experiment UI.
  invokeInterceptor: async (
    apiName: string,
    frequency: number | boolean,
    destination: string | boolean = 'local',
    eventType = 'EXCESSIVE_COLLECTION',
  ) => {
    const startedAt = Date.now();
    PrivacyInspector?.dispatchAuditLog?.(
      apiName,
      typeof frequency === 'number' ? frequency : frequency ? 1 : 0,
      typeof destination === 'string' ? destination : destination ? 'test-trap' : 'local',
      eventType,
    );
    return { latencyMs: Date.now() - startedAt };
  },
};
