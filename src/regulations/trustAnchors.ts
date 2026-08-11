import { assessWitnessedTrustStoreEnvelope } from './trustStoreWitness';
import {
  LegalReviewTrustRootAnchor,
  LegalReviewTrustStoreEnvelope,
  LegalReviewTrustStoreReleaseIdentity,
  LegalReviewTrustStoreRollbackState,
  LegalReviewTrustStoreWitnessPolicy,
  LegalReviewTrustStoreWitnessReceipt,
} from './types';

// Deliberately empty until an independently governed offline root and signed
// production trust-store envelope are provisioned. Test roots and envelopes are
// injected explicitly and must never be promoted into this module.
export const LEGAL_REVIEW_TRUST_ROOT_ANCHORS: readonly LegalReviewTrustRootAnchor[] = [];
export const LEGAL_REVIEW_TRUST_STORE_ENVELOPE: LegalReviewTrustStoreEnvelope | undefined = undefined;
export const LEGAL_REVIEW_TRUST_STORE_ROLLBACK_STATE: LegalReviewTrustStoreRollbackState | undefined = undefined;
export const LEGAL_REVIEW_TRUST_STORE_WITNESS_POLICY: LegalReviewTrustStoreWitnessPolicy | undefined = undefined;
export const LEGAL_REVIEW_TRUST_STORE_WITNESS_RECEIPTS: readonly LegalReviewTrustStoreWitnessReceipt[] = [];
export const LEGAL_REVIEW_TRUST_STORE_RELEASE_IDENTITY: LegalReviewTrustStoreReleaseIdentity = {
  applicationId: 'com.zhihengzhang.privacylens',
  versionName: '1.14.0',
  versionCode: 15,
  releaseChannel: 'CONTROLLED_RESEARCH',
};

export function assessProductionLegalReviewTrustStore(asOfDate = new Date().toISOString().slice(0, 10)) {
  return assessWitnessedTrustStoreEnvelope(
    LEGAL_REVIEW_TRUST_STORE_ENVELOPE,
    LEGAL_REVIEW_TRUST_ROOT_ANCHORS,
    LEGAL_REVIEW_TRUST_STORE_WITNESS_POLICY,
    LEGAL_REVIEW_TRUST_STORE_WITNESS_RECEIPTS,
    LEGAL_REVIEW_TRUST_STORE_RELEASE_IDENTITY,
    asOfDate,
    LEGAL_REVIEW_TRUST_STORE_ROLLBACK_STATE,
  );
}

export const LEGAL_REVIEW_TRUST_STORE_POLICY = {
  policyVersion: 'privacy-lens.trust-store-policy.v3',
  state: 'UNPROVISIONED',
  provisioningMode: 'OFFLINE_TWO_PERSON_RELEASE',
  revocationMode: 'SIGNED_MONOTONIC_OFFLINE_ENVELOPE',
  rollbackMode: 'SEQUENCE_AND_PREDECESSOR_DIGEST',
  witnessMode: 'OFFLINE_ED25519_THRESHOLD_RECEIPTS',
  requiredEvidence: ['verified reviewer identity', 'documented qualification', 'independent release-custodian approval', 'root-key custody and recovery record', 'persisted highest accepted sequence and digest', 'at least two independent release-witness receipts'],
  limitation: 'The envelope and witness-quorum mechanisms are implemented and adversarially tested, but no production root, reviewer key, signed envelope, witness policy, witness receipt, or rollback state is provisioned in this research build.',
} as const;
