# 8-10 Revision 19 review - legal-source lifecycle

Date: 2026-08-11

## Review question

Can the App--thesis system distinguish an official source's authority from its document lifecycle, retain the exact checked version, and fail closed on inconsistent metadata without presenting this engineering control as legal approval?

## Result

**PASS within the recorded engineering scope.** Privacy Lens 1.7.0 adds an explicit source-lifecycle contract, presents it in Settings, and preserves the legal-review boundary in the paper.

## Code-to-evidence trace

| Claim | Implementation | Acceptance evidence |
|---|---|---|
| Every source identifies the checked document | `RegulatorySource.versionLabel` | governance/property tests and source-register XML |
| Authority and lifecycle are independent | `status` plus `RegulatorySourceLifecycle` | incompatible combinations fail governance validation |
| Closed consultations do not become final guidance | `CONSULTATION_CLOSED_PENDING_FINALISATION` | Guidelines 1/2024 and 2026 DPIA cards/screenshots |
| Closure dates are temporally coherent | governance date validation | missing/invalid closure and review-date mutations |
| Users can inspect the classification | Settings source cards and accessibility labels | `source-register`, `consultation-lifecycle`, and `dpia-lifecycle` PNG/XML |
| Engineering does not claim legal approval | App and thesis boundary language | Revision 19 assessment and Chapters 4--7 |

## Acceptance summary

- TypeScript, ESLint, accessibility, release-privacy, 1,000-case, extended, and 1,800-case governance suites passed.
- Release APK/AAB and lint-vital tasks completed successfully offline.
- APK: 62,774,127 bytes; SHA-256 `BB4F33498D4871C8B2604BED0D2CB057C275076EFF1D31C64EF099835C36E886`.
- AAB: 31,703,211 bytes; SHA-256 `9A795039ADD0C6184BA6708869A90A35249FD4F23DFDCD11952D92988404F40D`.
- Version 1.7.0 / code 8 was installed on one OPPO PERM00.
- Required source version, status, lifecycle, closure, and check-date strings were present in the captured UI hierarchy.
- Five cold starts completed in 1,713--1,756 ms and the package crash buffer was empty.

## Claim boundary

The evidence establishes internal schema consistency, deterministic rejection rules, release incorporation, and bounded device presentation. It does not establish authenticity of retrieved content, completeness of legal research, the correctness or continuing currency of classifications, legal compliance, qualified reviewer approval, comprehension, or reliance.

## Next priority

Commission an independent qualified legal review and add signed source retrieval with content hashes, approval scope, review expiry, monitored change detection, deprecation, and correction records. This is more publication-relevant than another unreviewed expansion of legal rules.
