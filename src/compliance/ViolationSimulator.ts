import { GDPR_RULES } from './GDPRComplianceEngine';
import { PermissionAudit, SensitivePermission, SimulationConfig } from './types';

const PERMISSIONS: SensitivePermission[] = ['LOCATION', 'MICROPHONE', 'CONTACTS'];

export function createSimulationConfig(
  now = Date.now(),
  random: () => number = Math.random,
): SimulationConfig {
  const permissionType = PERMISSIONS[Math.floor(random() * PERMISSIONS.length)];
  const totalCalls = 50 + Math.floor(random() * 151);
  const triggerTimes = Array.from({ length: totalCalls }, () =>
    now + Math.floor(random() * 24 * 60 * 60 * 1000),
  ).sort((a, b) => a - b);
  const threshold = Math.ceil(
    GDPR_RULES[permissionType].baseline * GDPR_RULES[permissionType].deviationMultiplier,
  );

  return {
    id: `simulation-${now}-${permissionType}`,
    permissionType,
    totalCalls,
    triggerTimes,
    expectedViolation: totalCalls > threshold,
  };
}

export function simulationToAudit(
  config: SimulationConfig,
  packageName = 'com.gdpr.audit.simulator',
): PermissionAudit {
  return {
    packageName,
    permissionType: config.permissionType,
    accessCount: config.totalCalls,
    windowStart: config.triggerTimes[0] ?? Date.now(),
    windowEnd: config.triggerTimes.at(-1) ?? Date.now(),
    backgroundCount: config.totalCalls,
    foregroundCount: 0,
  };
}

export function createEvaluationConfig(
  roundIndex: number,
  now = Date.now(),
  random: () => number = Math.random,
): SimulationConfig {
  const violation = createSimulationConfig(now, random);
  if ((roundIndex + 1) % 5 !== 0) return violation;

  const threshold = Math.ceil(
    GDPR_RULES[violation.permissionType].baseline *
      GDPR_RULES[violation.permissionType].deviationMultiplier,
  );
  const totalCalls = Math.max(1, threshold - 1);
  return {
    ...violation,
    id: `${violation.id}-control`,
    totalCalls,
    triggerTimes: violation.triggerTimes.slice(0, totalCalls),
    expectedViolation: false,
  };
}
