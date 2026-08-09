import { RegulationId } from '../compliance/types';
import { EU_GDPR_PACK } from './packs/euGdpr';
import { GLOBAL_RESEARCH_BASELINE_PACK } from './packs/researchBaseline';
import { RegulationPack } from './types';

const PACKS: Record<RegulationId, RegulationPack> = {
  EU_GDPR: EU_GDPR_PACK,
  GLOBAL_RESEARCH_BASELINE: GLOBAL_RESEARCH_BASELINE_PACK,
};

export const DEFAULT_REGULATION_ID: RegulationId = 'EU_GDPR';

export function listRegulationPacks(): RegulationPack[] {
  return Object.values(PACKS);
}

export function getRegulationPack(id: RegulationId): RegulationPack {
  return PACKS[id] ?? PACKS[DEFAULT_REGULATION_ID];
}

export function isRegulationId(value: unknown): value is RegulationId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PACKS, value);
}
