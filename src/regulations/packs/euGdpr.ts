import { RegulationPack } from '../types';

export const EU_GDPR_PACK: RegulationPack = {
  id: 'EU_GDPR',
  name: 'European Union General Data Protection Regulation',
  shortName: 'EU GDPR',
  jurisdiction: 'European Union / EEA',
  kind: 'LEGAL_FRAMEWORK',
  versionLabel: 'Regulation (EU) 2016/679',
  sourceUrl: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj',
  description: 'Technical prompts for necessity, lawful-basis and accountability review.',
  governance: {
    schemaVersion: 1,
    state: 'TECHNICAL_CANDIDATE',
    authoredAt: '2026-08-09',
    lastReviewedAt: '2026-08-09',
    effectiveFrom: '2018-05-25',
    reviewAuthority: {
      kind: 'PROJECT_ENGINEERING',
      reviewer: 'Privacy Lens project author',
      scope: 'Technical traceability against official GDPR and final EDPB sources; not independent legal approval.',
    },
    releaseScope: 'CONTROLLED_EVALUATION',
    locales: ['en'],
    changeTriggers: ['GDPR amendment', 'authoritative interpretation', 'mapping correction', 'review expiry', 'localisation change'],
  },
  rules: {
    LOCATION: {
      permissionType: 'LOCATION',
      baseline: 24,
      deviationMultiplier: 1.5,
      legalReference: 'GDPR Art. 5(1)(c), Art. 6',
      rationale: 'Location access should be necessary, proportionate, and supported by a documented lawful basis.',
    },
    MICROPHONE: {
      permissionType: 'MICROPHONE',
      baseline: 8,
      deviationMultiplier: 1.5,
      legalReference: 'GDPR Art. 5(1)(c), Art. 6; Art. 9 when special-category data is involved',
      rationale: 'Microphone access needs purpose and lawful-basis evidence; content may require additional review when special-category data is involved.',
    },
    CONTACTS: {
      permissionType: 'CONTACTS',
      baseline: 4,
      deviationMultiplier: 1.5,
      legalReference: 'GDPR Art. 5(1)(b)-(c), Art. 6',
      rationale: 'Contacts access should be limited to an explicit purpose and supported by a documented lawful basis.',
    },
  },
  principles: [
    'Art. 5(1)(a) lawfulness, fairness and transparency',
    'Art. 5(1)(b) purpose limitation',
    'Art. 5(1)(c) data minimisation',
    'Art. 5(2) accountability',
    'Art. 6 lawfulness of processing',
  ],
  legalCaveat: 'This automated warning supports accountability review and is not a determination of GDPR infringement.',
  findMissingEvidence: ({ processingContext: context }) => {
    const missing: string[] = [];
    if (!context?.purpose?.trim()) missing.push('specified purpose');
    if (!context?.lawfulBasis) missing.push('Article 6 lawful basis');
    if (!context?.controllerIdentity?.trim()) missing.push('controller identity');
    if (!Number.isInteger(context?.retentionDays) || (context?.retentionDays ?? -1) < 0) missing.push('retention period');
    if (context?.specialCategoryData && !context.article9Condition?.trim()) missing.push('Article 9 condition');
    return missing;
  },
  classify: (audit, signals, missing) => {
    const context = audit.processingContext;
    if (context?.consentWithdrawn && context.lawfulBasis === 'CONSENT' && audit.accessCount > 0) return 'LIKELY_NON_COMPLIANT';
    if (missing.length > 0) return 'INSUFFICIENT_EVIDENCE';
    if (signals.length > 0) return 'REVIEW_REQUIRED';
    return 'NO_TECHNICAL_CONCERN';
  },
};
