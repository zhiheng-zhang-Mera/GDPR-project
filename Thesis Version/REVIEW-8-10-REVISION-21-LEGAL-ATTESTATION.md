# 8-10 Revision 21 Review — Legal Attestation Gate

Date: 2026-08-11

## Change claim

Revision 21 claims that Privacy Lens can represent and enforce an internally consistent legal-review attestation before showing a reassuring no-concern result. It does not claim that the current pack has received qualified review, that an entered attestation is authentic, or that two-person approval is a statutory GDPR rule.

## Claim-to-evidence map

| Claim | Implementation witness | Test / observed witness | Boundary |
|---|---|---|---|
| Attestation is bound to evaluated material | pack version and source-digest fields | mismatch and malformed-digest mutations | digest bytes not recomputed |
| Reviewer and approver are distinct | case-insensitive separation check | self-approval mutation | identities not authenticated |
| Attestation has temporal scope | reviewed, approved, valid-until dates | current and expired fixed-date paths | interval remains governance policy |
| Missing review blocks reassurance | runtime legal-review assessment | real EU complete-context path becomes insufficient evidence | not a legal verdict |
| Conservative signals remain visible | preliminary classification retained | review-required fixture retains legal gap | signal is not infringement proof |
| Users can inspect the gate | Settings and FindingCard disclosure | physical UI-tree and screenshots | one OPPO device |

## Adversarial review

The strongest counterexample is a fabricated but well-formed attestation. Revision 21 would accept its internal structure because it has no identity provider, signature verification, credential registry, canonical source-bundle construction, or revocation service. A second counterexample is a digest that names bytes never retrieved by the application. The control prevents accidental or obvious governance bypass, but does not establish external trust.

## Acceptance result

- Fixed-seed compliance: TP 800, TN 200, FP 0, FN 0.
- Governance/property: 1,800 cases plus attestation mutations — PASS.
- Extended compliance, TypeScript, ESLint, accessibility, and release privacy — PASS.
- Release APK/AAB and vital lint — PASS.
- Physical settings, finding, expanded evidence, five cold starts, and empty crash buffer — PASS within the recorded sample.
- Qualified legal review, source authentication, participant comprehension, accessibility conformance, long-run stability, and production signing — NOT ESTABLISHED.

## Score decision

Revision 21 receives **92/100**, up one point from Revision 20. The point is awarded for the executable gate, not for legal correctness or a review that has not occurred.
