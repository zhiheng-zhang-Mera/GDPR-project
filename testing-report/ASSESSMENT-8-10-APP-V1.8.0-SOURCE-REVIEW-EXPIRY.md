# 8-10 Iteration 6 Assessment — App 1.8.0 / Revision 20

Date: 2026-08-11
Priority: legal compliance → interface aesthetics → user psychology
Iteration focus: regulatory-source review expiry and fail-closed legal maintenance

## Answer-first result

Privacy Lens advances from **90/100 to 91/100** in this research rubric. The gain is narrow and evidence-backed: each governed regulatory source now has a project review deadline; an overdue source review forces `INSUFFICIENT_EVIDENCE`, records the overdue source titles, requests renewed regulatory-source review, and remains visible in the finding and settings UI.

The score is not a legal opinion, publication acceptance, production certification, or proof that the referenced legal material remains substantively correct.

## Weighted score

| Dimension | Weight | Score | Evidence-backed assessment |
|---|---:|---:|---|
| Legal compliance and governance | 30 | **26** | Versioned rule packs, lifecycle labels, source check dates, project review deadlines, and fail-closed expiry are implemented and tested. Human legal review, source-content hashing, authenticity verification, and jurisdictional deployment controls remain absent. |
| Software and evidence engineering | 25 | **23** | Deterministic engine paths, 1,800 governance/property cases, mutation checks, release build, lint, type-checking, accessibility contracts, and physical-device evidence passed. Long-duration and broad-device evidence remain absent. |
| Interface aesthetics and accessibility | 20 | **20** | The source lifecycle and review state are readable in both settings and finding cards; physical screenshots show stable hierarchy and no observed clipping on the sampled device. This is not multi-device visual acceptance. |
| User psychology and decision support | 15 | **13** | The UI distinguishes observation, uncertainty, evidence gap, bounded next action, and review recency without verdict language. No controlled user study establishes comprehension or behavioural benefit. |
| Academic readiness | 10 | **9** | The thesis records the mechanism, falsifiable test, hashes, score boundary, and limitations in a numbered successor revision. Independent peer review and empirical participant evidence remain missing. |
| **Total** | **100** | **91** | Research-candidate quality; not legal or production certification. |

## Acceptance evidence

- Compliance suite: 1,000 cases; TP 800, TN 200, FP 0, FN 0.
- Governance/property suite: 1,800 cases plus invalid/deadline mutation checks.
- Extended compliance, TypeScript, ESLint, accessibility contract, and release privacy contract: PASS.
- Android release: `assembleRelease`, `bundleRelease`, and `lintVitalRelease`: PASS offline.
- APK SHA-256: `08594A648AB1E050A683380DAA20B34D1022B45F631DE875E04E1A685D4EB909`.
- AAB SHA-256: `1C2B52EE6349F35AA6E5645808C12E6E33A550B052BD7ABD6759F9383A00F77B`.
- OPPO PERM00: five cold starts all `Status: ok`; median `TotalTime` 1,702 ms; no matching crash-buffer entry.
- UI XML assertions: all seven source-review/lifecycle/date assertions passed.

## What would falsify this iteration's claim

This iteration fails its central claim if an evaluated rule pack remains actionable after any of its governed sources passes `reviewDueAt`, if the renewal gap is omitted, if the overdue titles are not preserved, or if the user cannot inspect the source-review state from the finding.

## Residual risks and next priority

1. The review interval is a project governance choice, not an official legal deadline; qualified reviewers must approve and periodically renew it.
2. URLs and labels are not cryptographic proof of source authenticity or unchanged content.
3. No legal reviewer identity, approval signature, or four-eyes release gate exists.
4. The next legal-priority iteration should add an auditable reviewer attestation and separation-of-duties release gate before adding more visual polish.
