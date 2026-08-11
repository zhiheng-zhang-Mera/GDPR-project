import { assessTrustStoreEnvelope } from './trustStoreEnvelope';
import { LegalReviewTrustRootAnchor, LegalReviewTrustStoreEnvelope, LegalReviewTrustStoreRollbackState } from './types';

// Deliberately empty until an independently governed offline root and signed
// production trust-store envelope are provisioned. Test roots and envelopes are
// injected explicitly and must never be promoted into this module.
export const LEGAL_REVIEW_TRUST_ROOT_ANCHORS: readonly LegalReviewTrustRootAnchor[] = [];
export const LEGAL_REVIEW_TRUST_STORE_ENVELOPE: LegalReviewTrustStoreEnvelope | undefined = undefined;
export const LEGAL_REVIEW_TRUST_STORE_ROLLBACK_STATE: LegalReviewTrustStoreRollbackState | undefined = undefined;

export function assessProductionLegalReviewTrustStore(asOfDate = new Date().toISOString().slice(0, 10)) {
  return assessTrustStoreEnvelope(LEGAL_REVIEW_TRUST_STORE_ENVELOPE, LEGAL_REVIEW_TRUST_ROOT_ANCHORS, asOfDate, LEGAL_REVIEW_TRUST_STORE_ROLLBACK_STATE);
}

export const LEGAL_REVIEW_TRUST_STORE_POLICY = {
  policyVersion: 'privacy-lens.trust-store-policy.v2',
  state: 'UNPROVISIONED',
  provisioningMode: 'OFFLINE_TWO_PERSON_RELEASE',
  revocationMode: 'SIGNED_MONOTONIC_OFFLINE_ENVELOPE',
  rollbackMode: 'SEQUENCE_AND_PREDECESSOR_DIGEST',
  requiredEvidence: ['verified reviewer identity', 'documented qualification', 'independent release-custodian approval', 'root-key custody and recovery record', 'persisted highest accepted sequence and digest'],
  limitation: 'The envelope mechanism is implemented and adversarially tested, but no production root, reviewer key, signed envelope, or rollback state is provisioned in this research build.',
} as const;
