import { RegulationId } from '../compliance/types';
import { EU_GDPR_PACK } from './packs/euGdpr';
import { GLOBAL_RESEARCH_BASELINE_PACK } from './packs/researchBaseline';
import { assertValidRegulationPack } from './governance';
import { RegulationPack } from './types';

const PACKS: Record<RegulationId, RegulationPack> = {
  EU_GDPR: assertValidRegulationPack(EU_GDPR_PACK),
  GLOBAL_RESEARCH_BASELINE: assertValidRegulationPack(GLOBAL_RESEARCH_BASELINE_PACK),
};

export const DEFAULT_REGULATION_ID: RegulationId = 'EU_GDPR';

export function listRegulationPacks(): RegulationPack[] {
  return Object.values(PACKS);
}

export function getRegulationPack(id: RegulationId): RegulationPack {
  const pack = PACKS[id];
  if (!pack) throw new Error(`Unknown regulation pack: ${String(id)}`);
  return pack;
}

export function isRegulationId(value: unknown): value is RegulationId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PACKS, value);
}
