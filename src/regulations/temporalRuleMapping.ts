import { CompiledTemporalRule, SUPPORTED_OBSERVATION_TYPES } from '../compliance/TemporalCooccurrenceEngine';
import { RegulationPack } from './types';

const MAX_WINDOW_MS = 30 * 24 * 60 * 60 * 1_000;
const ID = /^[A-Z][A-Z0-9_]{2,63}$/;

/**
 * Validates the plug-in seam between a regulation pack and the generic
 * temporal detector. The pack owns legal meaning, window lengths, event
 * combinations, and thresholds; the detector owns only bag-of-events logic.
 */
export function validateTemporalRuleMapping(pack: RegulationPack): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const [index, profile] of pack.temporalProfiles.entries()) {
    const path = `temporalProfiles.${index}`;
    if (!ID.test(profile.id)) errors.push(`${path}.id must be an uppercase stable identifier`);
    if (ids.has(profile.id)) errors.push(`${path}.id duplicates another temporal profile`);
    ids.add(profile.id);
    if (!profile.title.trim()) errors.push(`${path}.title is required`);
    if (!Number.isSafeInteger(profile.windowMs) || profile.windowMs <= 0 || profile.windowMs > MAX_WINDOW_MS) errors.push(`${path}.windowMs must be a positive safe integer no greater than 30 days`);
    if (profile.requirements.length === 0) errors.push(`${path}.requirements must not be empty`);
    const types = new Set<string>();
    for (const [requirementIndex, requirement] of profile.requirements.entries()) {
      const requirementPath = `${path}.requirements.${requirementIndex}`;
      if (!SUPPORTED_OBSERVATION_TYPES.has(requirement.type)) errors.push(`${requirementPath}.type is not supported by an installed observation adapter`);
      if (types.has(requirement.type)) errors.push(`${requirementPath}.type duplicates another requirement`);
      types.add(requirement.type);
      if (!Number.isSafeInteger(requirement.minCount) || requirement.minCount <= 0) errors.push(`${requirementPath}.minCount must be a positive safe integer`);
    }
    if (profile.legalReferences.length === 0 || profile.legalReferences.some((reference) => !reference.trim())) errors.push(`${path}.legalReferences must contain reviewed non-empty references`);
    if (!profile.rationale.trim()) errors.push(`${path}.rationale is required`);
  }
  return errors;
}

export function compileTemporalRuleMapping(pack: RegulationPack): CompiledTemporalRule[] {
  const errors = validateTemporalRuleMapping(pack);
  if (errors.length > 0) throw new Error(`Invalid temporal mapping ${pack.id}: ${errors.join('; ')}`);
  return pack.temporalProfiles.map((profile) => ({
    ...profile,
    regulationId: pack.id,
    regulationName: pack.shortName,
    packVersion: pack.versionLabel,
    requirements: profile.requirements.map((requirement) => ({ ...requirement })),
    legalReferences: [...profile.legalReferences],
  }));
}
