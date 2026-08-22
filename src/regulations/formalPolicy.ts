import { FormalEvidencePredicate, FormalPolicyConstraint, RegulationPack } from './types';

const ID = /^[A-Z][A-Z0-9_]{2,63}$/;
const PREDICATES = new Set<FormalEvidencePredicate>([
  'MANIFEST_LOCATION', 'MANIFEST_MICROPHONE', 'MANIFEST_CONTACTS', 'MANIFEST_CAMERA', 'MANIFEST_BODY_SENSORS',
  'TRACKER_SIGNATURE', 'NETWORK_DESTINATION', 'OBSERVED_LOCATION', 'OBSERVED_BODY_SENSORS', 'OBSERVED_MICROPHONE',
  'PROCESSING_PURPOSE', 'LAWFUL_BASIS', 'TRANSPARENCY_NOTICE', 'MINIMISATION_ASSESSMENT',
  'RETENTION_JUSTIFICATION', 'ARTICLE_9_CONDITION', 'DPIA_SCREENING',
]);

export interface FormalPolicyAssessment {
  constraintId: string;
  title: string;
  legalReferences: string[];
  matched: boolean;
  missingEvidence: FormalEvidencePredicate[];
  rationale: string;
  outcome: 'REVIEW_REQUIRED';
}

/** Validate the loadable law-to-logic layer independently of acquisition. */
export function validateFormalPolicyConstraints(constraints: readonly FormalPolicyConstraint[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const [index, constraint] of constraints.entries()) {
    const path = `formalPolicyConstraints.${index}`;
    if (!ID.test(constraint.id)) errors.push(`${path}.id must be an uppercase stable identifier`);
    if (ids.has(constraint.id)) errors.push(`${path}.id duplicates another constraint`);
    ids.add(constraint.id);
    if (!constraint.title.trim()) errors.push(`${path}.title is required`);
    if (!constraint.rationale.trim()) errors.push(`${path}.rationale is required`);
    if (constraint.outcome !== 'REVIEW_REQUIRED') errors.push(`${path}.outcome must remain REVIEW_REQUIRED`);
    if (constraint.legalReferences.length === 0 || constraint.legalReferences.some((value) => !value.trim())) errors.push(`${path}.legalReferences must contain non-empty references`);
    if (constraint.whenAll.length === 0) errors.push(`${path}.whenAll must not be empty`);
    for (const predicate of [...constraint.whenAll, ...constraint.requiresAll]) {
      if (!PREDICATES.has(predicate)) errors.push(`${path} contains an unsupported predicate`);
    }
  }
  return errors;
}

/**
 * Compiles a regulation-owned declarative model. It intentionally has no APK,
 * network, Android, or UI dependency, so the same model can be loaded by a
 * mobile evaluator or a reproducible offline batch runner.
 */
export function compileFormalPolicyModel(pack: RegulationPack): FormalPolicyConstraint[] {
  const errors = validateFormalPolicyConstraints(pack.formalPolicyConstraints);
  if (errors.length > 0) throw new Error(`Invalid formal policy model ${pack.id}: ${errors.join('; ')}`);
  return pack.formalPolicyConstraints.map((constraint) => ({
    ...constraint,
    legalReferences: [...constraint.legalReferences],
    whenAll: [...constraint.whenAll],
    requiresAll: [...constraint.requiresAll],
  }));
}

/**
 * Returns review prompts only. Missing contextual evidence never becomes an
 * asserted violation, and a non-match never becomes a compliance finding.
 */
export function evaluateFormalPolicy(
  constraints: readonly FormalPolicyConstraint[],
  suppliedEvidence: ReadonlySet<FormalEvidencePredicate>,
): FormalPolicyAssessment[] {
  return constraints
    .filter((constraint) => constraint.whenAll.every((predicate) => suppliedEvidence.has(predicate)))
    .map((constraint) => ({
      constraintId: constraint.id,
      title: constraint.title,
      legalReferences: [...constraint.legalReferences],
      matched: true,
      missingEvidence: constraint.requiresAll.filter((predicate) => !suppliedEvidence.has(predicate)),
      rationale: constraint.rationale,
      outcome: constraint.outcome,
    }));
}
