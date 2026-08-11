import { RegulationPack } from '../types';

export const EU_GDPR_PACK: RegulationPack = {
  id: 'EU_GDPR',
  name: 'European Union General Data Protection Regulation',
  shortName: 'EU GDPR',
  jurisdiction: 'European Union / EEA',
  kind: 'LEGAL_FRAMEWORK',
  versionLabel: 'Regulation (EU) 2016/679',
  sourceUrl: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj',
  sources: [
    {
      title: 'Regulation (EU) 2016/679',
      versionLabel: 'Official Journal text, OJ L 119, 4 May 2016',
      url: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj',
      authority: 'European Union',
      status: 'BINDING_LAW',
      lifecycle: 'IN_FORCE',
      checkedAt: '2026-08-11',
      reviewDueAt: '2027-02-11',
    },
    {
      title: 'Guidelines 05/2020 on consent under Regulation 2016/679',
      versionLabel: 'Version 1.1, adopted 4 May 2020',
      url: 'https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en',
      authority: 'European Data Protection Board',
      status: 'FINAL_GUIDANCE',
      lifecycle: 'FINAL',
      checkedAt: '2026-08-11',
      reviewDueAt: '2027-02-11',
    },
    {
      title: 'EDPB-endorsed WP29 transparency and DPIA guidelines',
      versionLabel: 'WP260 rev.01 and WP248 rev.01',
      url: 'https://www.edpb.europa.eu/endorsed-wp29-guidelines_en',
      authority: 'European Data Protection Board',
      status: 'FINAL_GUIDANCE',
      lifecycle: 'FINAL',
      checkedAt: '2026-08-11',
      reviewDueAt: '2027-02-11',
    },
    {
      title: 'Guidelines 1/2024 on Article 6(1)(f) legitimate interests',
      versionLabel: 'Version 1.0; feedback closed 20 November 2024',
      url: 'https://www.edpb.europa.eu/public-consultations/guidelines-12024-on-processing-of-personal-data-based-on-article-61f-gdpr_en',
      authority: 'European Data Protection Board',
      status: 'CONSULTATION_MATERIAL',
      lifecycle: 'CONSULTATION_CLOSED_PENDING_FINALISATION',
      consultationClosedAt: '2024-11-20',
      checkedAt: '2026-08-11',
      reviewDueAt: '2026-09-11',
    },
    {
      title: '2026 EDPB DPIA template',
      versionLabel: 'Consultation draft; feedback closed 9 June 2026',
      url: 'https://www.edpb.europa.eu/our-work-tools/documents/public-consultations/2026/edpb-dpia-template_en',
      authority: 'European Data Protection Board',
      status: 'CONSULTATION_MATERIAL',
      lifecycle: 'CONSULTATION_CLOSED_PENDING_FINALISATION',
      consultationClosedAt: '2026-06-09',
      checkedAt: '2026-08-11',
      reviewDueAt: '2026-09-11',
    },
  ],
  description: 'Technical prompts for necessity, lawful-basis, transparency, minimisation, retention and DPIA evidence review.',
  governance: {
    schemaVersion: 2,
    state: 'TECHNICAL_CANDIDATE',
    authoredAt: '2026-08-09',
    lastReviewedAt: '2026-08-11',
    effectiveFrom: '2018-05-25',
    reviewAuthority: {
      kind: 'PROJECT_ENGINEERING',
      reviewer: 'Privacy Lens project author',
      scope: 'Technical traceability against the official GDPR, final EDPB guidance, and clearly labelled draft guidance; not independent legal approval.',
    },
    releaseScope: 'CONTROLLED_EVALUATION',
    locales: ['en'],
    changeTriggers: ['GDPR amendment', 'authoritative interpretation', 'consultation-material finalisation', 'mapping correction', 'review expiry', 'localisation change'],
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
    'Arts. 7, 13 and 14 consent evidence and transparency',
    'Arts. 25 and 35 data protection by design and DPIA screening',
  ],
  legalCaveat: 'This automated warning supports accountability review and is not a determination of GDPR infringement.',
  findMissingEvidence: ({ processingContext: context }) => {
    const missing: string[] = [];
    if (!context?.purpose?.trim()) missing.push('specified purpose');
    if (!context?.lawfulBasis) missing.push('Article 6 lawful basis');
    if (!context?.controllerIdentity?.trim()) missing.push('controller identity');
    if (!Number.isInteger(context?.retentionDays) || (context?.retentionDays ?? -1) < 0) missing.push('retention period');
    if (!context?.transparencyNoticeReference?.trim()) missing.push('Articles 13/14 transparency notice reference');
    if (!context?.dataMinimisationAssessmentReference?.trim()) missing.push('Article 5(1)(c) necessity and minimisation assessment');
    if (!context?.retentionJustification?.trim()) missing.push('Article 5(1)(e) retention justification');
    if (context?.lawfulBasis === 'CONSENT' && !context.consentEvidenceReference?.trim()) missing.push('Article 7 consent evidence');
    if (context?.lawfulBasis === 'CONTRACT' && !context.contractNecessityReference?.trim()) missing.push('Article 6(1)(b) contractual necessity assessment');
    if ((context?.lawfulBasis === 'LEGAL_OBLIGATION' || context?.lawfulBasis === 'PUBLIC_TASK') && !context.legalMandateReference?.trim()) missing.push('Article 6(3) legal mandate reference');
    if (context?.lawfulBasis === 'VITAL_INTERESTS' && !context.vitalInterestsAssessmentReference?.trim()) missing.push('Article 6(1)(d) vital-interests necessity assessment');
    if (context?.lawfulBasis === 'LEGITIMATE_INTERESTS' && !context.legitimateInterestsAssessmentReference?.trim()) missing.push('Article 6(1)(f) legitimate-interests three-part assessment');
    if (context?.specialCategoryData && !context.article9Condition?.trim()) missing.push('Article 9 condition');
    if (context?.dpiaRequired === undefined) missing.push('Article 35 DPIA screening outcome');
    if (context?.dpiaRequired && !context.dpiaReference?.trim()) missing.push('Article 35 DPIA reference');
    return missing;
  },
  classify: (audit, signals, missing) => {
    const context = audit.processingContext;
    if (context?.consentWithdrawn && context.lawfulBasis === 'CONSENT' && audit.accessCount > 0) return 'POTENTIAL_CONFLICT';
    if (missing.length > 0) return 'INSUFFICIENT_EVIDENCE';
    if (signals.length > 0) return 'REVIEW_REQUIRED';
    return 'NO_TECHNICAL_CONCERN';
  },
};
