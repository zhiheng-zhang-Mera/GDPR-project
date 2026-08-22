import { RegulationPack } from '../types';
import { EU_GDPR_SOURCE_CONTENT_MANIFEST } from '../manifests/euGdprSourceContent';

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
      title: 'WP29 Guidelines on transparency under Regulation 2016/679',
      versionLabel: 'WP260 rev.01, endorsed by the EDPB',
      url: 'https://ec.europa.eu/newsroom/article29/redirection/document/51025',
      authority: 'European Data Protection Board',
      status: 'FINAL_GUIDANCE',
      lifecycle: 'FINAL',
      checkedAt: '2026-08-11',
      reviewDueAt: '2027-02-11',
    },
    {
      title: 'WP29 Guidelines on Data Protection Impact Assessment',
      versionLabel: 'WP248 rev.01, endorsed by the EDPB',
      url: 'https://ec.europa.eu/newsroom/just/document.cfm?doc_id=47711',
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
    schemaVersion: 6,
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
    changeTriggers: ['GDPR amendment', 'authoritative interpretation', 'consultation-material finalisation', 'source-content digest change', 'mapping correction', 'review expiry', 'localisation change'],
    sourceContentManifest: EU_GDPR_SOURCE_CONTENT_MANIFEST,
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
  temporalProfiles: [
    {
      id: 'WEARABLE_LOCATION_HEALTH',
      title: 'Wearable activity, precise location, and body-sensor co-occurrence',
      windowMs: 30 * 60 * 1_000,
      requirements: [
        { type: 'LOCATION', minCount: 1 },
        { type: 'ACTIVITY_RECOGNITION', minCount: 1 },
        { type: 'BODY_SENSORS', minCount: 1 },
      ],
      legalReferences: ['GDPR Art. 5(1)(c)', 'GDPR Art. 9'],
      rationale: 'The combination can support a richer health-and-location inference than any single observation, so necessity and special-category safeguards warrant review.',
      riskLevel: 'HIGH',
      notificationPriority: 'STANDARD',
    },
    {
      id: 'MULTIMODAL_BIOMETRIC_CAPTURE',
      title: 'Body-sensor, microphone, and camera co-occurrence',
      windowMs: 15 * 60 * 1_000,
      requirements: [
        { type: 'BODY_SENSORS', minCount: 1 },
        { type: 'MICROPHONE', minCount: 1 },
        { type: 'CAMERA', minCount: 1 },
      ],
      legalReferences: ['GDPR Art. 9(1)', 'GDPR Art. 9(2)(a)'],
      rationale: 'Concurrent physiological, acoustic, and visual observations may enable sensitive multimodal inference and merit a contextual consent review.',
      riskLevel: 'CRITICAL',
      notificationPriority: 'URGENT',
    },
    {
      id: 'CROSS_DOMAIN_PROFILING',
      title: 'Clipboard, device identifier, and media-image co-occurrence',
      windowMs: 10 * 60 * 1_000,
      requirements: [
        { type: 'CLIPBOARD_READ', minCount: 1 },
        { type: 'DEVICE_IDENTIFIER', minCount: 1 },
        { type: 'MEDIA_IMAGES', minCount: 1 },
      ],
      legalReferences: ['GDPR Art. 5(1)(b)', 'GDPR Art. 22'],
      rationale: 'Cross-domain observations can be combined for profiling beyond the user-facing purpose and therefore warrant purpose-limitation review.',
      riskLevel: 'HIGH',
      notificationPriority: 'STANDARD',
    },
    {
      id: 'POST_BACKGROUND_MEDIA_ACCESS',
      title: 'Media-location access after the app entered background',
      windowMs: 5 * 60 * 1_000,
      requirements: [
        { type: 'APP_BACKGROUNDED', minCount: 1 },
        { type: 'MEDIA_LOCATION', minCount: 1 },
      ],
      legalReferences: ['GDPR Art. 5(1)(a)', 'GDPR Art. 7'],
      rationale: 'A near-term background transition and media-location access may conflict with user expectations and should be explained before any conclusion is drawn.',
      riskLevel: 'HIGH',
      notificationPriority: 'STANDARD',
    },
    {
      id: 'HIGH_FREQUENCY_LOCATION',
      title: 'High-frequency location observation',
      windowMs: 60 * 60 * 1_000,
      requirements: [{ type: 'LOCATION', minCount: 20 }],
      legalReferences: ['GDPR Art. 5(1)(c)', 'GDPR Art. 25'],
      rationale: 'Repeated location observations within the regulation-owned window may indicate disproportionate collection and warrant a minimisation review.',
      riskLevel: 'HIGH',
      notificationPriority: 'STANDARD',
    },
  ],
  formalPolicyConstraints: [
    {
      id: 'LOCATION_ACCOUNTABILITY_CONTEXT',
      title: 'Location capability requires accountable processing context',
      legalReferences: ['GDPR Art. 5(1)(a)', 'GDPR Art. 5(1)(c)', 'GDPR Art. 6', 'GDPR Arts. 13-14'],
      whenAll: ['MANIFEST_LOCATION'],
      requiresAll: ['PROCESSING_PURPOSE', 'LAWFUL_BASIS', 'TRANSPARENCY_NOTICE', 'MINIMISATION_ASSESSMENT', 'RETENTION_JUSTIFICATION'],
      rationale: 'A declared location capability is not proof of processing, but it is sufficient to request purpose, lawful-basis, transparency, minimisation, and retention evidence before any reassuring conclusion.',
      outcome: 'REVIEW_REQUIRED',
    },
    {
      id: 'SENSITIVE_MULTIMODAL_CONTEXT',
      title: 'Observed sensor combination requires special-category review context',
      legalReferences: ['GDPR Art. 5(1)(c)', 'GDPR Art. 9', 'GDPR Art. 25', 'GDPR Art. 35'],
      whenAll: ['OBSERVED_BODY_SENSORS', 'OBSERVED_MICROPHONE'],
      requiresAll: ['PROCESSING_PURPOSE', 'LAWFUL_BASIS', 'ARTICLE_9_CONDITION', 'MINIMISATION_ASSESSMENT', 'DPIA_SCREENING'],
      rationale: 'The formal antecedent requires observed, time-scoped evidence; capability declarations alone cannot activate this special-category review prompt.',
      outcome: 'REVIEW_REQUIRED',
    },
    {
      id: 'TRACKER_TRANSPARENCY_CONTEXT',
      title: 'Tracker signature requires transparency and purpose review',
      legalReferences: ['GDPR Art. 5(1)(a)-(b)', 'GDPR Art. 6', 'GDPR Arts. 13-14'],
      whenAll: ['TRACKER_SIGNATURE'],
      requiresAll: ['PROCESSING_PURPOSE', 'LAWFUL_BASIS', 'TRANSPARENCY_NOTICE', 'RETENTION_JUSTIFICATION'],
      rationale: 'A third-party SDK signature is a static indicator, not proof that a transfer occurred; it opens an evidence request rather than a legal finding.',
      outcome: 'REVIEW_REQUIRED',
    },
  ],
  informationFlowPolicyConstraints: [
    {
      id: 'SENSITIVE_DATA_TO_NETWORK_REVIEW',
      title: 'Sensitive Android data reaching an external-transfer sink',
      sources: ['LOCATION', 'MICROPHONE', 'CONTACTS', 'CAMERA', 'BODY_SENSORS', 'DEVICE_IDENTIFIER'],
      sinks: ['NETWORK', 'SMS'],
      legalReferences: ['GDPR Art. 5(1)(a)-(c)', 'GDPR Art. 6', 'GDPR Arts. 13-14', 'GDPR Art. 25'],
      requiresAll: ['PROCESSING_PURPOSE', 'LAWFUL_BASIS', 'TRANSPARENCY_NOTICE', 'MINIMISATION_ASSESSMENT', 'RETENTION_JUSTIFICATION'],
      rationale: 'A typed source-to-network or SMS reachability result can support an accountability review, but cannot establish the purpose, recipient, transfer, or legality of processing.',
      outcome: 'REVIEW_REQUIRED',
    },
    {
      id: 'SENSITIVE_CROSS_PROCESS_FLOW_REVIEW',
      title: 'Sensitive Android data crossing an IPC boundary',
      sources: ['LOCATION', 'MICROPHONE', 'CONTACTS', 'BODY_SENSORS', 'DEVICE_IDENTIFIER'],
      sinks: ['IPC', 'NETWORK'],
      legalReferences: ['GDPR Art. 5(1)(b)-(c)', 'GDPR Art. 25', 'GDPR Art. 32'],
      requiresAll: ['PROCESSING_PURPOSE', 'MINIMISATION_ASSESSMENT', 'RETENTION_JUSTIFICATION'],
      rationale: 'A Binder, provider, worker, or other process boundary is retained as evidence for review; it is not evidence that a disclosure was unlawful.',
      outcome: 'REVIEW_REQUIRED',
    },
  ],
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
