import { LegalReviewTrustAnchor } from './types';

// Deliberately empty until an independently governed production key is provisioned.
// Test keys are injected explicitly and must never be promoted into this store.
export const LEGAL_REVIEW_TRUST_ANCHORS: readonly LegalReviewTrustAnchor[] = [];

export const LEGAL_REVIEW_TRUST_STORE_POLICY = {
  policyVersion: 'privacy-lens.trust-store-policy.v1',
  state: 'UNPROVISIONED',
  provisioningMode: 'OFFLINE_TWO_PERSON_RELEASE',
  revocationMode: 'BUNDLED_STATIC_DENYLIST',
  requiredEvidence: ['verified reviewer identity', 'documented qualification', 'independent release-custodian approval', 'key-custody and rotation record'],
  limitation: 'No production reviewer key or independently signed revocation list is provisioned in this research build.',
} as const;
