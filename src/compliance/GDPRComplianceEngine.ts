import { EU_GDPR_PACK } from '../regulations/packs/euGdpr';
import { LegalReviewTrustStoreAssessment } from '../regulations/types';
import { RulePackComplianceEngine } from './RulePackComplianceEngine';

/**
 * Compatibility entry point retained for integrations that explicitly target GDPR.
 *
 * `evaluatedAt` is forwarded to the pack engine so that a caller can pin the
 * date used by the source-review and legal-review gates. Production callers omit
 * it and keep fail-closed wall-clock behaviour; deterministic suites pass an
 * explicit date so a result never depends on when the suite happens to run.
 */
export class GDPRComplianceEngine extends RulePackComplianceEngine {
  constructor(evaluatedAt?: string, trustStore?: LegalReviewTrustStoreAssessment) {
    super(EU_GDPR_PACK, evaluatedAt, trustStore);
  }
}

export const GDPR_RULES = EU_GDPR_PACK.rules;
export { ComplianceInputError } from './RulePackComplianceEngine';
