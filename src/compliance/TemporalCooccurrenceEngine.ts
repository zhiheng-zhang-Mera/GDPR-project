import forgeMd from 'node-forge/lib/md';
import { PrivacyObservation, PrivacyObservationType, RegulationId, RiskLevel } from './types';

export const SUPPORTED_OBSERVATION_TYPES = new Set<PrivacyObservationType>([
  'LOCATION',
  'MICROPHONE',
  'CONTACTS',
  'ACTIVITY_RECOGNITION',
  'BODY_SENSORS',
  'CAMERA',
  'CLIPBOARD_READ',
  'DEVICE_IDENTIFIER',
  'MEDIA_IMAGES',
  'MEDIA_LOCATION',
  'APP_BACKGROUNDED',
  'DATA_TRANSFER',
]);

export interface TemporalRequirement {
  type: PrivacyObservationType;
  minCount: number;
}

export interface CompiledTemporalRule {
  id: string;
  title: string;
  regulationId: RegulationId;
  regulationName: string;
  packVersion: string;
  windowMs: number;
  requirements: readonly TemporalRequirement[];
  legalReferences: readonly string[];
  rationale: string;
  riskLevel: RiskLevel;
  notificationPriority: 'STANDARD' | 'URGENT';
}

export interface TemporalMatchEvidence {
  ruleId: string;
  title: string;
  regulationId: RegulationId;
  regulationName: string;
  packVersion: string;
  windowStart: number;
  windowEnd: number;
  windowMs: number;
  requiredTypes: PrivacyObservationType[];
  observedCounts: Partial<Record<PrivacyObservationType, number>>;
  legalReferences: string[];
  rationale: string;
  riskLevel: RiskLevel;
  notificationPriority: 'STANDARD' | 'URGENT';
  evidenceSha256: string;
}

export interface TemporalEvaluationInput {
  packageName: string;
  evaluatedAt: number;
  observations: readonly PrivacyObservation[];
  rules: readonly CompiledTemporalRule[];
}

function sha256Hex(value: string): string {
  return forgeMd.sha256.create().update(value, 'utf8').digest().toHex().toLowerCase();
}

function canonicalObservation(event: PrivacyObservation) {
  return {
    type: event.type,
    occurredAt: event.occurredAt,
    count: event.count ?? 1,
    channel: event.channel ?? null,
    context: event.context ?? null,
    destination: event.destination ?? null,
    source: event.source ?? null,
  };
}

function compareObservation(left: PrivacyObservation, right: PrivacyObservation): number {
  return left.occurredAt - right.occurredAt ||
    left.type.localeCompare(right.type) ||
    (left.source ?? '').localeCompare(right.source ?? '') ||
    (left.channel ?? '').localeCompare(right.channel ?? '') ||
    (left.context ?? '').localeCompare(right.context ?? '') ||
    (left.destination ?? '').localeCompare(right.destination ?? '') ||
    (left.count ?? 1) - (right.count ?? 1);
}

/**
 * Pure, order-agnostic bag-of-events evaluator. The caller owns acquisition,
 * persistence, and scheduling; this function neither blocks an operation nor
 * performs I/O. Equal inputs, rule packs, and evaluation times produce equal
 * findings and evidence receipts regardless of input permutation.
 */
export function evaluateTemporalCooccurrence(input: TemporalEvaluationInput): TemporalMatchEvidence[] {
  const canonicalEvents = [...input.observations]
    .filter((event) => event.occurredAt <= input.evaluatedAt)
    .sort(compareObservation);

  return [...input.rules]
    .sort((left, right) => left.id.localeCompare(right.id))
    .flatMap((rule) => {
      const windowStart = input.evaluatedAt - rule.windowMs;
      const inWindow = canonicalEvents.filter((event) => event.occurredAt >= windowStart);
      const observedCounts: Partial<Record<PrivacyObservationType, number>> = {};
      for (const event of inWindow) {
        observedCounts[event.type] = (observedCounts[event.type] ?? 0) + (event.count ?? 1);
      }
      if (!rule.requirements.every(({ type, minCount }) => (observedCounts[type] ?? 0) >= minCount)) return [];

      const relevantTypes = new Set(rule.requirements.map(({ type }) => type));
      const relevantEvents = inWindow.filter(({ type }) => relevantTypes.has(type));
      const receiptPayload = JSON.stringify({
        schema: 'privacy-lens.temporal-evidence.v1',
        packageName: input.packageName,
        evaluatedAt: input.evaluatedAt,
        rule: {
          id: rule.id,
          regulationId: rule.regulationId,
          packVersion: rule.packVersion,
          windowMs: rule.windowMs,
          requirements: [...rule.requirements].sort((a, b) => a.type.localeCompare(b.type)),
        },
        observations: relevantEvents.map(canonicalObservation),
      });
      return [{
        ruleId: rule.id,
        title: rule.title,
        regulationId: rule.regulationId,
        regulationName: rule.regulationName,
        packVersion: rule.packVersion,
        windowStart,
        windowEnd: input.evaluatedAt,
        windowMs: rule.windowMs,
        requiredTypes: rule.requirements.map(({ type }) => type),
        observedCounts,
        legalReferences: [...rule.legalReferences],
        rationale: rule.rationale,
        riskLevel: rule.riskLevel,
        notificationPriority: rule.notificationPriority,
        evidenceSha256: sha256Hex(receiptPayload),
      }];
    });
}
