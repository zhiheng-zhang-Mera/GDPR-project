import { PackSourceReviewAssessment, RegulationPack, RegulatorySource, RegulatorySourceLifecycle, SourceReviewState } from './types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isIsoCalendarDate(value: string | undefined): value is string {
  if (!value || !ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

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
  if (!isIsoCalendarDate(governance.authoredAt)) errors.push('governance.authoredAt must be a valid YYYY-MM-DD date');
  if (!isIsoCalendarDate(governance.lastReviewedAt)) errors.push('governance.lastReviewedAt must be a valid YYYY-MM-DD date');
  if (governance.effectiveFrom && !isIsoCalendarDate(governance.effectiveFrom)) errors.push('governance.effectiveFrom must be a valid YYYY-MM-DD date');
  if (isIsoCalendarDate(governance.authoredAt) && isIsoCalendarDate(governance.lastReviewedAt) && governance.lastReviewedAt < governance.authoredAt) errors.push('governance.lastReviewedAt cannot precede authoredAt');
  if (governance.locales.length === 0) errors.push('at least one reviewed locale is required');
  if (governance.changeTriggers.length === 0) errors.push('at least one change trigger is required');
  if (!governance.reviewAuthority.reviewer.trim()) errors.push('reviewAuthority.reviewer is required');
  if (!governance.reviewAuthority.scope.trim()) errors.push('reviewAuthority.scope is required');

  if (pack.kind === 'LEGAL_FRAMEWORK' && !isHttpsUrl(pack.sourceUrl)) errors.push('legal frameworks require an HTTPS official source');
  if (pack.kind === 'LEGAL_FRAMEWORK' && !pack.sources.some(({ status }) => status === 'BINDING_LAW')) errors.push('legal frameworks require a binding-law source record');
  if (pack.kind === 'LEGAL_FRAMEWORK' && !pack.sources.some(({ url }) => url === pack.sourceUrl)) errors.push('the primary sourceUrl must be present in source records');
  if (pack.kind === 'LEGAL_FRAMEWORK' && governance.state === 'NON_LEGAL_DEMONSTRATOR') errors.push('a legal framework cannot use the non-legal demonstrator state');
  if (pack.kind === 'RESEARCH_BASELINE' && governance.state !== 'NON_LEGAL_DEMONSTRATOR') errors.push('a research baseline must remain a non-legal demonstrator');
  if (legalState && governance.reviewAuthority.kind !== 'QUALIFIED_LEGAL') errors.push('legally reviewed or approved packs require a qualified legal reviewer');
  if (governance.state === 'APPROVED_RELEASE' && governance.releaseScope !== 'PRODUCTION') errors.push('approved release packs require production release scope');
  if ((governance.state === 'TECHNICAL_CANDIDATE' || governance.state === 'NON_LEGAL_DEMONSTRATOR') && governance.releaseScope !== 'CONTROLLED_EVALUATION') errors.push('candidate and demonstrator packs are limited to controlled evaluation');
  if ((governance.state === 'SUPERSEDED' || governance.state === 'REVOKED') && !governance.successor) errors.push('superseded or revoked packs require a successor or blocking identifier');

  const sourceUrls = new Set<string>();
  for (const [index, source] of pack.sources.entries()) {
    if (!source.title.trim()) errors.push(`sources.${index}.title is required`);
    if (!source.versionLabel.trim()) errors.push(`sources.${index}.versionLabel is required`);
    if (!source.authority.trim()) errors.push(`sources.${index}.authority is required`);
    if (!isHttpsUrl(source.url)) errors.push(`sources.${index}.url must use HTTPS`);
    if (!isIsoCalendarDate(source.checkedAt)) errors.push(`sources.${index}.checkedAt must be a valid YYYY-MM-DD date`);
    if (!isIsoCalendarDate(source.reviewDueAt)) errors.push(`sources.${index}.reviewDueAt must be a valid YYYY-MM-DD date`);
    if (isIsoCalendarDate(source.checkedAt) && isIsoCalendarDate(governance.lastReviewedAt) && source.checkedAt > governance.lastReviewedAt) errors.push(`sources.${index}.checkedAt cannot follow governance.lastReviewedAt`);
    if (isIsoCalendarDate(source.checkedAt) && isIsoCalendarDate(source.reviewDueAt) && source.reviewDueAt <= source.checkedAt) errors.push(`sources.${index}.reviewDueAt must follow checkedAt`);
    if (source.status === 'BINDING_LAW' && source.lifecycle !== 'IN_FORCE') errors.push(`sources.${index} binding law must use the IN_FORCE lifecycle`);
    if (source.status === 'FINAL_GUIDANCE' && source.lifecycle !== 'FINAL') errors.push(`sources.${index} final guidance must use the FINAL lifecycle`);
    if (source.status === 'CONSULTATION_MATERIAL' && source.lifecycle !== 'CONSULTATION_OPEN' && source.lifecycle !== 'CONSULTATION_CLOSED_PENDING_FINALISATION') errors.push(`sources.${index} consultation material must use a consultation lifecycle`);
    if (source.lifecycle === 'CONSULTATION_CLOSED_PENDING_FINALISATION') {
      if (!isIsoCalendarDate(source.consultationClosedAt)) errors.push(`sources.${index}.consultationClosedAt must be a valid YYYY-MM-DD date for a closed consultation`);
      if (isIsoCalendarDate(source.consultationClosedAt) && isIsoCalendarDate(source.checkedAt) && source.checkedAt < source.consultationClosedAt) errors.push(`sources.${index}.checkedAt cannot precede consultationClosedAt`);
    } else if (source.consultationClosedAt !== undefined) {
      errors.push(`sources.${index}.consultationClosedAt is only valid for a closed consultation`);
    }
    if (sourceUrls.has(source.url)) errors.push(`sources.${index}.url duplicates another source`);
    sourceUrls.add(source.url);
  }

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

export function sourceLifecycleLabel(lifecycle: RegulatorySourceLifecycle): string {
  switch (lifecycle) {
    case 'IN_FORCE': return 'In force';
    case 'FINAL': return 'Final';
    case 'CONSULTATION_OPEN': return 'Consultation open';
    case 'CONSULTATION_CLOSED_PENDING_FINALISATION': return 'Consultation closed; finalisation pending';
  }
}

export function sourceReviewState(source: RegulatorySource, asOfDate = new Date().toISOString().slice(0, 10)): SourceReviewState {
  if (!isIsoCalendarDate(asOfDate)) throw new Error(`Invalid source-review assessment date: ${asOfDate}`);
  return asOfDate > source.reviewDueAt ? 'REVIEW_DUE' : 'CURRENT';
}

export function sourceReviewLabel(state: SourceReviewState): string {
  return state === 'CURRENT' ? 'Source review current' : 'Source review due';
}

export function assessPackSourceReview(pack: RegulationPack, asOfDate = new Date().toISOString().slice(0, 10)): PackSourceReviewAssessment {
  if (!isIsoCalendarDate(asOfDate)) throw new Error(`Invalid pack source-review assessment date: ${asOfDate}`);
  if (pack.sources.length === 0) return { state: 'NOT_APPLICABLE', assessedAt: asOfDate, overdueSourceTitles: [] };
  const overdueSourceTitles = pack.sources.filter((source) => sourceReviewState(source, asOfDate) === 'REVIEW_DUE').map(({ title }) => title);
  const nextDueAt = [...pack.sources].map(({ reviewDueAt }) => reviewDueAt).sort()[0];
  return { state: overdueSourceTitles.length > 0 ? 'REVIEW_DUE' : 'CURRENT', assessedAt: asOfDate, nextDueAt, overdueSourceTitles };
}
