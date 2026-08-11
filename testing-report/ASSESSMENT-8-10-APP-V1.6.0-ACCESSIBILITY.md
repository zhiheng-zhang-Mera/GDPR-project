# Privacy Lens 1.6.0 - cognitive-accessibility acceptance record

Date: 2026-08-11

Branch: `8-10`

Iteration: Revision 18 / large-text reflow and readable-structure priority

## Decision

**Engineering and bounded cognitive-accessibility acceptance: PASS. Strict publication-target score: 89/100, up from Revision 17's 87/100 and the user-defined 70/100 predecessor baseline.**

This result establishes source-level reflow safeguards and rendered evidence at the tested system font scale. It is not WCAG conformance, an assistive-technology audit, a participant outcome, or a multi-device accessibility claim.

## Implemented safeguards

- Added a large-text layout mode at system `fontScale >= 1.4` for the dense Overview and Findings regions.
- Reflowed Overview metrics, Findings ledger summaries, and filters from horizontal rows into vertical reading order.
- Moved finding status to its own row and removed forced package-name truncation.
- Increased bottom-navigation height and vertical breathing room under large text.
- Added a settings disclosure describing system-text scaling, reflow, and non-colour status semantics.
- Preserved the Revision 17 signal--missing-context--proportionate-action path, legal caveats, provenance, and user agency.

## Acceptance evidence

| Check | Result |
|---|---|
| TypeScript and ESLint | PASS |
| Accessibility source contract | PASS: 5 files, 12 interactive touchables |
| Release privacy contract | PASS: version 1.6.0 across 23 source files |
| 1,000-case compliance suite | PASS: TP 800, TN 200, FP 0, FN 0 |
| Extended compliance suite | PASS |
| Governance and property suite | PASS: 1,800 independent-oracle cases |
| ARM64 `assembleRelease`, `bundleRelease`, `lintVitalRelease` | PASS |
| Installed package identity | PASS: version code 7, version name 1.6.0 |
| System font-scale transition | PASS: 0.9 -> 1.6 -> 0.9 |
| Large-text Overview, Findings, expanded card, and Settings renders | PASS in inspected states |
| Five restored-state cold starts | PASS: 5/5; crash buffer empty |

## Release artefacts

- APK: 62,772,235 bytes; SHA-256 `501279E40AA82725A555BD34B92C87A30AC30543CFD5F081EE88807481BA8CB9`
- AAB: 31,702,694 bytes; SHA-256 `AFA6AD4BAAC40AFCFA60B365AB8252C086D2073E30FEC779838A28823306D4C7`
- Application ID: `com.zhihengzhang.privacylens`
- minSdk / targetSdk: `24 / 36`
- Signing boundary: QA/debug identity, not owner-controlled production signing.

## Physical-device evidence

Target: one OPPO PERM00, serial `BICIPVNB5HS85H9T`.

- Maximum available system text setting produced `font_scale=1.6`.
- Captures show vertical metric, ledger, and filter reflow; untruncated package identity; own-row status; expanded reasoning; and the readable-structure disclosure.
- The original `font_scale=0.9` was restored after capture.
- Five subsequent cold starts completed in 1,203--1,819 ms with an empty crash buffer.
- Evidence directory: `testing-report/real-device-8-10-v1.6.0-large-text/`.

The matrix covers selected states on one handset. It does not cover TalkBack, switch access, keyboard traversal, magnification, multiple languages, landscape, foldables, or users who rely on assistive technology.

## Strict score

| Dimension | Weight | Revision 17 | Revision 18 | Boundary |
|---|---:|---:|---:|---|
| Legal validity and governance | 30 | 24 | 24 | No independent qualified legal review |
| Software evidence | 25 | 23 | 23 | Current release/device evidence; QA signing and short single-device scope remain |
| Interface and accessibility | 20 | 19 | 20 | Maximum-font reflow is implemented and rendered; no assistive-technology or participant conformance evidence |
| User psychology | 15 | 13 | 13 | Prior expectation, uncertainty, agency, and reversibility support retained; no participant outcomes |
| Academic communication | 10 | 8 | 9 | Versioned code-to-render claim chain renewed; no external replication or peer review |
| **Total** | **100** | **87** | **89** | **Remaining 11 points require predominantly independent, participant, legal, and publication evidence.** |

## Publication gate

The next legitimate score gain is external rather than cosmetic: independent GDPR-pack legal review, consented participant and assistive-technology sessions, multi-device and long-duration replication, production-signing controls, and peer review. The 1.6.0 evidence justifies a stronger accessibility-oriented engineering claim, not a claim of accessibility conformance or publication acceptance.
