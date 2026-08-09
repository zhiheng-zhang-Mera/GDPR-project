import { EU_GDPR_PACK } from '../regulations/packs/euGdpr';
import { RulePackComplianceEngine } from './RulePackComplianceEngine';

/** Compatibility entry point retained for integrations that explicitly target GDPR. */
export class GDPRComplianceEngine extends RulePackComplianceEngine {
  constructor() {
    super(EU_GDPR_PACK);
  }
}

export const GDPR_RULES = EU_GDPR_PACK.rules;
export { ComplianceInputError } from './RulePackComplianceEngine';
