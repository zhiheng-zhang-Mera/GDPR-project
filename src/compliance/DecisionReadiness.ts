export type FindingInterpretation = 'TECHNICAL_SIGNAL' | 'LEGAL_VIOLATION' | 'DEVELOPER_INTENT';

export type DecisionReadinessState =
  | 'UNDERSTANDING_NOT_CHECKED'
  | 'MISINTERPRETATION_CORRECTED'
  | 'CONTEXT_CHECKS_INCOMPLETE'
  | 'READY_FOR_PROPORTIONATE_REVIEW';

export interface DecisionReadinessInput {
  interpretation?: FindingInterpretation;
  provenanceChecked: boolean;
  gapsChecked: boolean;
  proportionalityChecked: boolean;
}

export interface DecisionReadinessAssessment {
  state: DecisionReadinessState;
  ready: boolean;
  feedback: string;
}

/**
 * Pure, local decision-support logic. It does not persist answers, transmit
 * telemetry, or change the underlying compliance finding.
 */
export function assessDecisionReadiness(input: DecisionReadinessInput): DecisionReadinessAssessment {
  if (!input.interpretation) {
    return {
      state: 'UNDERSTANDING_NOT_CHECKED',
      ready: false,
      feedback: 'Choose what this card establishes before preparing an action.',
    };
  }

  if (input.interpretation !== 'TECHNICAL_SIGNAL') {
    return {
      state: 'MISINTERPRETATION_CORRECTED',
      ready: false,
      feedback: 'Not established: this card cannot prove a GDPR violation or developer intent.',
    };
  }

  if (!input.provenanceChecked || !input.gapsChecked || !input.proportionalityChecked) {
    return {
      state: 'CONTEXT_CHECKS_INCOMPLETE',
      ready: false,
      feedback: 'Correct interpretation. Complete the context checks before acting.',
    };
  }

  return {
    state: 'READY_FOR_PROPORTIONATE_REVIEW',
    ready: true,
    feedback: 'Prepared for proportionate review—not proof of a violation.',
  };
}
