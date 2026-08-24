# Formal Evidence Model

This model formalises implemented types and output restrictions. It is not a legal evidence lattice, a legal adjudication model, or First-Order Temporal Logic.

## Typed domains

- `E_tech`: admitted technical predicates, including manifest capability, static source-to-sink reachability, tracker signature, and bounded runtime observation.
- `E_context`: contextual or organisational predicates such as purpose, lawful basis, notice, minimisation assessment, retention justification, Article 9 condition, and DPIA screening.
- `E_source`: closed provenance metadata identifying simulator, native bridge, imported static analysis, or authorised runtime trace.
- `E_time`: bounded intervals, timestamps, declared windows, and restart-time constraints.
- `E_policy`: stable constraint identifier, regulation-pack identifier/version, legal references, and permitted output.

Every symbol maps to `FormalEvidencePredicate`, `EvidenceSource`, temporal observation/ledger fields, or regulation-owned constraints in `src/regulations`.

## Rule and output relation

Let a compiled rule be `R = (A, C, O)`, where `A` is a finite set of technical antecedents, `C` is a finite set of required contextual predicates, and `O` is the sole permitted output `REVIEW_REQUIRED`. For admitted evidence `E`, the implemented evaluator emits an assessment iff `A` is contained in the supplied technical predicates. It reports `C \\ E_context` as `missingEvidence`.

The output type excludes `LEGAL_VIOLATION`, `LEGAL_COMPLIANCE`, and any reassuring non-match verdict. A non-match yields no assessment; it does not establish compliance. A match with complete contextual fields still yields a review prompt because the software has neither adjudicative authority nor a model of all legally relevant facts.

## Partial information ordering

For two evidence states with the same source, temporal scope, and policy identity, define `x <= y` only when every predicate present in `x` is also present in `y`. This is a partial information ordering used to reason about added evidence. The project does not define join, meet, legal top, or legal bottom, so it does not claim a lattice.

## Temporal predicates

Temporal matching is a bounded state-transition property over package-scoped multisets. A match requires the active compiled profile, its positive window, required observation multiplicities, compatible pack identity/version, admitted provenance, and timestamps within the evaluation boundary. The implementation calls these temporal predicates and invariants; it does not claim FOTL syntax or proof rules.

## Executable correspondence

| Formal element | Implementation | Executable evidence |
|---|---|---|
| `A`, `C`, `O` | `formalPolicy.ts` and pack `formalPolicyConstraints` | governance/property tests |
| Typed flow antecedent | `informationFlowPolicy.ts` graph reachability | information-flow adversarial fixtures |
| Prohibited legal output | literal TypeScript outcome `REVIEW_REQUIRED` and validators | mutation/negative policy fixtures |
| `E_source` admission | evidence and information-flow source unions | unsupported-source tests |
| `E_time` and multiset predicate | temporal profile compiler and co-occurrence engine | boundary, 720-permutation, restart and stress tests |
| Policy identity | regulation pack/compiler and finding fields | pack-switch/history tests |

These tests establish conformance between code and the declared model. They cannot prove that a legal mapping is correct, sufficient, or applicable to a particular controller or processing operation.
