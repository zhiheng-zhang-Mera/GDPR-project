# 8-10 Revision 20 Review — Source-Review Expiry

Date: 2026-08-11

## Change claim

Revision 20 claims only that Privacy Lens can enforce a project-defined regulatory-source review schedule in its evaluated code path. It does not claim that a source is authentic, unchanged, correctly classified, or legally sufficient.

## Claim-to-evidence map

| Claim | Implementation witness | Test / observed witness | Boundary |
|---|---|---|---|
| Every governed source has a forward review deadline | `RegulatorySource.reviewDueAt`; registry validation | missing, malformed, and non-forward deadline mutations | maintainer-authored date |
| Current and overdue states are deterministic | `sourceReviewState`; `assessPackSourceReview` | fixed-date current / due assertions | no automated retrieval |
| Overdue legal sources fail closed | dated engine assessment; forced `INSUFFICIENT_EVIDENCE` | 2026-09-12 expiry test | not a legal verdict |
| Renewal need and overdue identities survive | finding source-review record and missing-evidence list | finding assertions for both consultation sources | no reviewer workflow yet |
| Users can inspect currency | Settings source cards and FindingCard disclosure | seven physical UI-tree assertions and screenshots | one OPPO device |
| Current source changes ship in a release | version 1.8.0/code 9 APK and AAB | offline Gradle release build, hashes, install | debug QA signature |

## Adversarial review

The strongest counterexample is an authority changing a page before the configured deadline. Revision 20 would still report the review as current because it does not retrieve, hash, or compare source content. A malicious maintainer could also choose an excessively distant deadline. The expiry mechanism therefore enforces internal governance timing but does not establish external currency.

Another counterexample is reviewer capture: the same developer can author the rule, choose the deadline, and release it. The next legal-priority control must separate these roles and bind approval to immutable pack and source-content hashes.

## Acceptance result

- Source and deterministic suites: PASS.
- 1,800 governance/property cases and deadline mutations: PASS.
- TypeScript, ESLint, accessibility contract, and release privacy contract: PASS.
- Release APK/AAB and vital lint: PASS.
- Physical version/package/UI/cold-start/crash-buffer sample: PASS.
- Legal validity, participant comprehension, accessibility conformance, long-run stability, production signing: NOT ESTABLISHED.

## Score decision

Revision 20 receives **91/100**, up one point from Revision 19. The point is awarded to legal governance for executable fail-closed expiry. No additional credit is awarded for legal correctness, human outcomes, or accessibility conformance because the required independent evidence does not exist.
