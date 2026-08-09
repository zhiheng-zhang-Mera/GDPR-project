import { RegulationPack } from './types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isHttpsUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateRegulationPack(pack: RegulationPack): string[] {
  const errors: string[] = [];
  const governance = pack.governance;
  const legalState = governance.state === 'LEGALLY_REVIEWED' || governance.state === 'APPROVED_RELEASE';

  if (!pack.id.trim()) errors.push('id is required');
  if (!pack.versionLabel.trim()) errors.push('versionLabel is required');
  if (!ISO_DATE.test(governance.authoredAt)) errors.push('governance.authoredAt must use YYYY-MM-DD');
  if (!ISO_DATE.test(governance.lastReviewedAt)) errors.push('governance.lastReviewedAt must use YYYY-MM-DD');
  if (governance.effectiveFrom && !ISO_DATE.test(governance.effectiveFrom)) errors.push('governance.effectiveFrom must use YYYY-MM-DD');
  if (governance.locales.length === 0) errors.push('at least one reviewed locale is required');
  if (governance.changeTriggers.length === 0) errors.push('at least one change trigger is required');
  if (!governance.reviewAuthority.reviewer.trim()) errors.push('reviewAuthority.reviewer is required');
  if (!governance.reviewAuthority.scope.trim()) errors.push('reviewAuthority.scope is required');

  if (pack.kind === 'LEGAL_FRAMEWORK' && !isHttpsUrl(pack.sourceUrl)) errors.push('legal frameworks require an HTTPS official source');
  if (pack.kind === 'LEGAL_FRAMEWORK' && governance.state === 'NON_LEGAL_DEMONSTRATOR') errors.push('a legal framework cannot use the non-legal demonstrator state');
  if (pack.kind === 'RESEARCH_BASELINE' && governance.state !== 'NON_LEGAL_DEMONSTRATOR') errors.push('a research baseline must remain a non-legal demonstrator');
  if (legalState && governance.reviewAuthority.kind !== 'QUALIFIED_LEGAL') errors.push('legally reviewed or approved packs require a qualified legal reviewer');
  if (governance.state === 'APPROVED_RELEASE' && governance.releaseScope !== 'PRODUCTION') errors.push('approved release packs require production release scope');
  if ((governance.state === 'TECHNICAL_CANDIDATE' || governance.state === 'NON_LEGAL_DEMONSTRATOR') && governance.releaseScope !== 'CONTROLLED_EVALUATION') errors.push('candidate and demonstrator packs are limited to controlled evaluation');
  if ((governance.state === 'SUPERSEDED' || governance.state === 'REVOKED') && !governance.successor) errors.push('superseded or revoked packs require a successor or blocking identifier');

  for (const permission of ['LOCATION', 'MICROPHONE', 'CONTACTS'] as const) {
    const rule = pack.rules[permission];
    if (!rule || rule.permissionType !== permission) errors.push(`rules.${permission} is missing or mismatched`);
    if (!Number.isFinite(rule?.baseline) || rule.baseline < 0) errors.push(`rules.${permission}.baseline must be finite and non-negative`);
    if (!Number.isFinite(rule?.deviationMultiplier) || rule.deviationMultiplier <= 0) errors.push(`rules.${permission}.deviationMultiplier must be positive`);
  }

  return errors;
}

export function assertValidRegulationPack(pack: RegulationPack): RegulationPack {
  const errors = validateRegulationPack(pack);
  if (errors.length > 0) throw new Error(`Invalid regulation pack ${pack.id}: ${errors.join('; ')}`);
  return pack;
}

export function packGovernanceLabel(pack: RegulationPack): string {
  switch (pack.governance.state) {
    case 'TECHNICAL_CANDIDATE': return 'Engineering-reviewed candidate';
    case 'LEGALLY_REVIEWED': return 'Qualified legal review recorded';
    case 'APPROVED_RELEASE': return 'Approved production pack';
    case 'NON_LEGAL_DEMONSTRATOR': return 'Non-legal demonstration only';
    case 'SUPERSEDED': return 'Superseded pack';
    case 'REVOKED': return 'Revoked pack';
  }
}
