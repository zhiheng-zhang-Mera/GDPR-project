# 8-10 Iteration 7 Assessment — App 1.9.0 / Revision 21

Date: 2026-08-11
Priority: legal compliance → interface aesthetics → user psychology
Iteration focus: auditable legal-review attestation and separation of duties

## Answer-first result

Privacy Lens advances from **91/100 to 92/100** in this research rubric. A legal pack now has a typed, version-bound attestation contract covering the reviewed pack version, source-bundle digest, reviewer identity and qualification, distinct approver, scope, approval time, and validity window. An absent or expired attestation blocks a reassuring `NO_TECHNICAL_CONCERN` result while preserving bounded review signals and their evidence.

The current EU pack deliberately has no attestation. The application therefore displays **Independent legal review not recorded** and does not fabricate legal approval. The four-eyes rule is a project governance control, not a claim about a statutory GDPR requirement. This score is not legal advice, certification, publication acceptance, or production approval.

## Weighted score

| Dimension | Weight | Score | Evidence-backed assessment |
|---|---:|---:|---|
| Legal compliance and governance | 30 | **27** | Versioned packs, governed sources, expiry, a pack/source-bound attestation schema, qualification statement, distinct reviewer/approver, and fail-closed reassurance are implemented and tested. No qualified reviewer has attested the real EU pack; identity authentication, signed approvals, digest recomputation, and deployment-jurisdiction controls remain absent. |
| Software and evidence engineering | 25 | **23** | Deterministic paths, 1,800 governance/property cases, adversarial attestation mutations, release build, lint, type checks, accessibility contracts, hashing, and physical-device checks passed. Independent oracle diversity, long-run reliability, and broad-device evidence remain absent. |
| Interface aesthetics and accessibility | 20 | **20** | The gate, warning chip, expanded evidence, dates, bounded action, and non-certification statement form a readable hierarchy in the sampled physical-device captures. This is not multi-device visual or accessibility-conformance evidence. |
| User psychology and decision support | 15 | **13** | Reassurance is withheld without hiding useful signals; observation, synthetic provenance, uncertainty, missing evidence, and proportional next action remain distinct. No participant study establishes comprehension, anxiety reduction, or behavioural benefit. |
| Academic readiness | 10 | **9** | The mechanism, counterexamples, tests, artifact hashes, physical evidence, score rationale, and legal boundary are preserved in a numbered successor revision. Independent legal/peer review and empirical replication remain missing. |
| **Total** | **100** | **92** | Stronger research candidate; not legal or production certification. |

## Acceptance evidence

- Compliance suite: 1,000 fixed-seed cases; TP 800, TN 200, FP 0, FN 0.
- Governance/property suite: 1,800 cases plus missing-attestation, expiry, version mismatch, malformed digest, and self-approval mutations.
- Extended compliance, TypeScript, ESLint, accessibility contract, and release privacy contract: PASS.
- Android `assembleRelease`, `bundleRelease`, and `lintVitalRelease`: PASS offline.
- APK SHA-256: `83A52E6CDE02E82D452F607380F3FEE66E7F3928A342CE4CC800FD44235D7F69`.
- AAB SHA-256: `D199F57482070A035AC25C3E6202D6939BEA20F375DBF37475A6914097F5F689`.
- OPPO PERM00: five cold starts all `Status: ok`; median `TotalTime` 1,733 ms; zero crash-buffer lines.
- Physical UI-tree and screenshots verify the settings gate, finding chip, assessed date, missing attestation, and bounded next action.

## What would falsify this iteration's claim

The central claim fails if a legal pack can reach a reassuring no-concern state while its attestation is absent, expired, version-mismatched, digest-malformed, or self-approved; if a valid current attestation cannot reach the normal classification path; or if the legal-review gap disappears from stored and rendered evidence.

## Residual risks and next priority

1. The attestation format validates internal consistency but does not authenticate the reviewer, qualification, approval, or source content.
2. `reviewedSourcesSha256` is supplied metadata; the application does not retrieve and recompute a canonical source bundle.
3. The current EU pack remains a technical candidate without independent qualified legal review.
4. A future legal-priority iteration should add signed attestations and deterministic source-bundle hashing before further aesthetic work.
