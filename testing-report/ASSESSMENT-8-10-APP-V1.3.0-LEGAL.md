# Privacy Lens 1.3.0 - legal-priority acceptance record

Date: 2026-08-10

Branch: `8-10`

Iteration: Revision 15 / legal compliance priority

## Decision

**Engineering acceptance: PASS. Strict publication-target score: 79/100, up from the user-defined 70/100 predecessor baseline.**

This decision authorises the next internal design iteration. It is not a legal opinion, a finding of GDPR compliance, a participant study, store approval, production signing, or evidence of long-duration Android reliability.

## What changed

- Replaced the verdict-like current status with `POTENTIAL_CONFLICT`; the former `LIKELY_NON_COMPLIANT` value is accepted only as a migration input and rendered as legacy wording.
- Added purpose-specific evidence gaps for consent, contract necessity, legal mandate, vital interests, and the legitimate-interests three-part assessment.
- Added cross-cutting checks for transparency notice references, data-minimisation assessment, retention justification, and Article 35 DPIA screening/outcome/reference.
- Added a typed legal-source register that distinguishes binding law, final guidance, and consultation material. Draft EDPB material cannot masquerade as final guidance.
- Hardened governance validation for real calendar dates, review chronology, duplicate sources, HTTPS official links, binding-law presence, and primary-source registration.
- Updated EU GDPR pack metadata to governance schema 2 with a 2026-08-10 review date and explicit limitations.
- Bumped the app to version name `1.3.0`, version code `4`, and made Gradle's Node executable respect `NODE_BINARY` for reproducible Windows release builds.

## Source-authority boundary

The registered primary anchors are the consolidated GDPR text and official EDPB pages. The consent and endorsed WP29 materials are recorded as final guidance. The Article 6(1)(f) and 2026 DPIA-template pages are explicitly recorded as consultation material, not binding or final authority. Source registration establishes provenance and status; it does not establish that the implemented interpretation is legally correct.

## Automated acceptance

| Check | Result |
|---|---|
| Application TypeScript (`tsc --noEmit`) | PASS |
| ESLint | PASS |
| Fresh compliance-test TypeScript build | PASS |
| Seeded decision campaign | PASS: 1,000 cases; TP=800, TN=200, FP=0, FN=0 |
| Extended malformed-input, temporal, replay, and pack boundaries | PASS |
| Governance and independent-oracle campaign | PASS: 1,800 cases |
| Lawful-basis evidence gaps | PASS: all six Article 6 bases exercised |
| DPIA reference and source-status mutations | PASS |
| Accessibility source contract | PASS: 5 files, 12 interactive touchables |
| Release privacy contract | PASS: version 1.3.0 across 23 source files |
| Android `lintVitalRelease` | PASS as part of release assembly |
| LaTeX Revision 15 build and 81-page render | PASS |

The generated campaigns are deterministic regression evidence. They do not estimate real-world prevalence, legal accuracy, or user outcomes.

## Android release evidence

- Application ID: `com.zhihengzhang.privacylens`
- Version: code `4`, name `1.3.0`
- minSdk / targetSdk: `24 / 36`
- Architecture built: `arm64-v8a`
- APK: 59,397,535 bytes; SHA-256 `9F2D1051D15DCC936E8F5B703100FA0EAF52C13D293A225B0CAA6FAC31EC4A6A`
- AAB: 29,602,702 bytes; SHA-256 `64944C4E7F3AF9E6B25DDEFADF17376F7ED0A4B3141E15DD78D98D34A09D2294`
- APK Signature Scheme v2: verified; one Android debug QA signer.
- Final requested permissions: foreground service, wake lock, boot completed, and the application-scoped dynamic-receiver protection permission.
- `INTERNET`, `ACCESS_NETWORK_STATE`, and external-storage permissions: absent.

The debug-signed AAB is not suitable for a production Play upload. Production signing remains an owner-controlled release action.

## Physical-device evidence

Target: OPPO PERM00, serial `BICIPVNB5HS85H9T`.

- APK installation: PASS.
- Five cold restart rounds: PASS.
- Median / mean `TotalTime`: 1,813 ms / 1,886.8 ms.
- Sampled TOTAL PSS range: 96,341-96,819 KB.
- Package-specific crash-buffer entry: false.
- Captured overview screenshot and UI hierarchy: no obvious clipping, overlap, or blocked primary navigation.
- Evidence directory: `testing-report/real-device-8-10-v1.3.0-legal/`.

This is a short single-device acceptance window. It does not prove leak freedom, battery efficiency, WorkManager timing, broad OEM compatibility, unrestricted third-party AppOps visibility, or accessibility conformance.

## Strict score and next gate

| Dimension | Weight | Score | Reason credit is capped |
|---|---:|---:|---|
| Legal validity and governance | 30 | 24 | Stronger primary-source/status/evidence controls; no qualified independent legal review or implemented case-law update process |
| Software evidence | 25 | 22 | Reproducible tests, release build, package inspection, and device run; QA signing and short single-device scope remain |
| Interface and accessibility | 20 | 15 | Stable rendered workflow and source contracts; no TalkBack/font-scale/multi-device acceptance yet |
| User-psychology evidence | 15 | 10 | Calibrated wording and local-first trust cues; no participant task study |
| Academic communication | 10 | 8 | Revision 15 aligns claims and evidence; no external replication or peer review |
| **Total** | **100** | **79** | **Next iteration may proceed; 100 is not claimable from current evidence.** |

## Residual blockers to 100

1. Qualified independent legal review of the exact pack version and translations.
2. A controlled legal update workflow covering case law, EDPB finalisation, corrections, revocation, and cryptographic provenance.
3. Production upload signing and internal-track/store review.
4. TalkBack, large-font, multi-OEM/API, long-duration, battery, and scheduling evidence.
5. Participant-based comprehension, calibrated trust, task success, and willingness-to-use evaluation.
6. External research replication and peer review.
