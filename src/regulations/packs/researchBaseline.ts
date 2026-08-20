import { RegulationPack } from '../types';

export const GLOBAL_RESEARCH_BASELINE_PACK: RegulationPack = {
  id: 'GLOBAL_RESEARCH_BASELINE',
  name: 'General privacy research baseline',
  shortName: 'Research baseline',
  jurisdiction: 'Region-neutral demonstration',
  kind: 'RESEARCH_BASELINE',
  versionLabel: 'Prototype baseline 1.0',
  sources: [],
  description: 'A non-legal rule pack for demonstrating regional policy switching without implying local-law coverage.',
  governance: {
    schemaVersion: 6,
    state: 'NON_LEGAL_DEMONSTRATOR',
    authoredAt: '2026-08-09',
    lastReviewedAt: '2026-08-10',
    reviewAuthority: {
      kind: 'PROJECT_ENGINEERING',
      reviewer: 'Privacy Lens project author',
      scope: 'Non-legal research demonstration and pack-switching verification.',
    },
    releaseScope: 'CONTROLLED_EVALUATION',
    locales: ['en'],
    changeTriggers: ['research parameter change', 'schema change', 'fixture correction', 'localisation change'],
  },
  rules: {
    LOCATION: { permissionType: 'LOCATION', baseline: 36, deviationMultiplier: 1.5, legalReference: 'Research baseline: necessity and proportionality', rationale: 'Frequent location access warrants a purpose and necessity review.' },
    MICROPHONE: { permissionType: 'MICROPHONE', baseline: 12, deviationMultiplier: 1.5, legalReference: 'Research baseline: sensitive sensor access', rationale: 'Repeated microphone access warrants a human review of purpose and user expectation.' },
    CONTACTS: { permissionType: 'CONTACTS', baseline: 6, deviationMultiplier: 1.5, legalReference: 'Research baseline: data minimisation', rationale: 'Contacts access should remain limited to a documented user-facing purpose.' },
  },
  temporalProfiles: [
    {
      id: 'RESEARCH_SENSOR_FUSION',
      title: 'Region-neutral sensor-fusion research prompt',
      windowMs: 20 * 60 * 1_000,
      requirements: [
        { type: 'LOCATION', minCount: 1 },
        { type: 'MICROPHONE', minCount: 1 },
      ],
      legalReferences: ['Research baseline: combined-observation proportionality'],
      rationale: 'A location-and-microphone combination is used only to demonstrate that temporal mappings change with the active pack.',
      riskLevel: 'MEDIUM',
      notificationPriority: 'STANDARD',
    },
  ],
  principles: ['Purpose clarity', 'Data minimisation', 'User expectation', 'Human accountability'],
  legalCaveat: 'This region-neutral research baseline is not law, legal advice, or a compliance determination.',
  findMissingEvidence: ({ processingContext: context }) => {
    const missing: string[] = [];
    if (!context?.purpose?.trim()) missing.push('specified purpose');
    if (!context?.controllerIdentity?.trim()) missing.push('responsible operator');
    if (!Number.isInteger(context?.retentionDays) || (context?.retentionDays ?? -1) < 0) missing.push('retention period');
    return missing;
  },
  classify: (_audit, signals, missing) => {
    if (missing.length > 0) return 'INSUFFICIENT_EVIDENCE';
    if (signals.length > 0) return 'REVIEW_REQUIRED';
    return 'NO_TECHNICAL_CONCERN';
  },
};
