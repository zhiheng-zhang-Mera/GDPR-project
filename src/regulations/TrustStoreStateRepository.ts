import AsyncStorage from '@react-native-async-storage/async-storage';
import { assessTrustStoreEnvelope, validateRollbackStateTransition } from './trustStoreEnvelope';
import { LEGAL_REVIEW_TRUST_ROOT_ANCHORS, LEGAL_REVIEW_TRUST_STORE_ENVELOPE } from './trustAnchors';
import { LegalReviewTrustStoreAssessment, LegalReviewTrustStoreRollbackState } from './types';

const ROLLBACK_STATE_KEY = '@privacy_lens_trust_store_rollback_v1';
const SHA256 = /^[A-Fa-f0-9]{64}$/;

function parseRollbackState(value: string | null): LegalReviewTrustStoreRollbackState | undefined {
  if (value === null) return undefined;
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Stored trust-store rollback state is not an object.');
  const candidate = parsed as Record<string, unknown>;
  if (!Number.isSafeInteger(candidate.highestAcceptedSequence) || (candidate.highestAcceptedSequence as number) <= 0) throw new Error('Stored trust-store sequence is invalid.');
  if (typeof candidate.acceptedEnvelopeSha256 !== 'string' || !SHA256.test(candidate.acceptedEnvelopeSha256)) throw new Error('Stored trust-store digest is invalid.');
  return { highestAcceptedSequence: candidate.highestAcceptedSequence as number, acceptedEnvelopeSha256: candidate.acceptedEnvelopeSha256.toLowerCase() };
}

export async function loadTrustStoreRollbackState(): Promise<LegalReviewTrustStoreRollbackState | undefined> {
  return parseRollbackState(await AsyncStorage.getItem(ROLLBACK_STATE_KEY));
}

export async function persistTrustStoreRollbackState(current: LegalReviewTrustStoreRollbackState | undefined, next: LegalReviewTrustStoreRollbackState): Promise<void> {
  const error = validateRollbackStateTransition(current, next);
  if (error) throw new Error(error);
  await AsyncStorage.setItem(ROLLBACK_STATE_KEY, JSON.stringify({ highestAcceptedSequence: next.highestAcceptedSequence, acceptedEnvelopeSha256: next.acceptedEnvelopeSha256.toLowerCase() }));
}

export async function assessAndPersistProductionTrustStore(asOfDate = new Date().toISOString().slice(0, 10)): Promise<LegalReviewTrustStoreAssessment> {
  let previousState: LegalReviewTrustStoreRollbackState | undefined;
  try {
    previousState = await loadTrustStoreRollbackState();
  } catch (error) {
    return { state: 'INVALID', assessedAt: asOfDate, trustAnchors: [], reason: error instanceof Error ? error.message : 'Stored trust-store rollback state could not be read.' };
  }
  const assessment = assessTrustStoreEnvelope(LEGAL_REVIEW_TRUST_STORE_ENVELOPE, LEGAL_REVIEW_TRUST_ROOT_ANCHORS, asOfDate, previousState);
  if (assessment.state !== 'CURRENT' || !assessment.nextRollbackState) return assessment;
  try {
    await persistTrustStoreRollbackState(previousState, assessment.nextRollbackState);
    return assessment;
  } catch (error) {
    return { ...assessment, state: 'INVALID', trustAnchors: [], nextRollbackState: undefined, reason: error instanceof Error ? error.message : 'Trust-store rollback state could not be persisted.' };
  }
}
