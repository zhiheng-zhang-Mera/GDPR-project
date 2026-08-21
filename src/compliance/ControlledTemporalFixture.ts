import { PermissionAudit, PrivacyObservation, SensitivePermission } from './types';
import { compileTemporalRuleMapping } from '../regulations/temporalRuleMapping';
import { RegulationPack } from '../regulations/types';

const SENSITIVE_TYPES = new Set<SensitivePermission>(['LOCATION', 'MICROPHONE', 'CONTACTS']);

/**
 * Creates a labelled, deterministic debug fixture from the mounted pack. No
 * GDPR window, combination, or legal reference is encoded here: a different
 * valid pack necessarily produces a different fixture.
 */
export function createControlledTemporalFixture(pack: RegulationPack, evaluatedAt = Date.now()): PermissionAudit {
  const rule = compileTemporalRuleMapping(pack)[0];
  if (!rule) throw new Error(`Pack ${pack.id} has no temporal profile.`);
  const eventCount = rule.requirements.reduce((sum, requirement) => sum + requirement.minCount, 0);
  const spacing = Math.max(1, Math.floor(rule.windowMs / (eventCount + 2)));
  let position = 1;
  const observationEvents: PrivacyObservation[] = rule.requirements.flatMap((requirement) =>
    Array.from({ length: requirement.minCount }, () => ({
      type: requirement.type,
      occurredAt: evaluatedAt - rule.windowMs + spacing * position++,
      count: 1,
      source: 'NATIVE_BRIDGE' as const,
    })),
  ).reverse();
  const permissionType = rule.requirements.find(({ type }) => SENSITIVE_TYPES.has(type as SensitivePermission))?.type as SensitivePermission | undefined;
  return {
    packageName: 'com.zhihengzhang.privacylens.controlled-demo',
    permissionType: permissionType ?? 'LOCATION',
    accessCount: 1,
    windowStart: evaluatedAt - rule.windowMs,
    windowEnd: evaluatedAt,
    source: 'NATIVE_BRIDGE',
    evidenceKind: 'CONTROLLED_DEMO',
    controlledDemo: true,
    observationEvents,
  };
}
