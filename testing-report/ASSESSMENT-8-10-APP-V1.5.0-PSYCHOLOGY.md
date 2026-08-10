# Privacy Lens 1.5.0 - human-factors-priority acceptance record

Date: 2026-08-10

Branch: `8-10`

Iteration: Revision 17 / user psychology, comprehension, and agency priority

## Decision

**Engineering and bounded human-factors-design acceptance: PASS. Strict publication-target score: 87/100, up from Revision 16's 84/100 and the user-defined 70/100 predecessor baseline.**

This result confirms implemented and rendered safeguards. It is not evidence that participants understood them, trusted the product appropriately, felt less anxiety, chose better actions, or would adopt the product.

## Implemented safeguards

- Added a repeated three-stage interpretation path: notice the signal, check what is missing, then choose a proportionate next step.
- Applied the same sequence to expanded findings as `What was observed`, `What is not established`, and `Your proportionate next step`.
- Added an explicit anti-impulsivity instruction: do not change access or confront a developer from one card alone.
- Added a cancellable confirmation before a synthetic demonstration that explains what it adds, what it does not inspect, and how it can be cleared.
- Preserved synthetic-source labels, legal caveats, provenance, local-data control, and non-verdict status language.

## Acceptance evidence

| Check | Result |
|---|---|
| TypeScript and ESLint | PASS |
| Accessibility and human-factors source contract | PASS: 5 files, 12 touchable templates |
| Release privacy contract | PASS: version 1.5.0 across 23 source files |
| Existing 1,000-case, extended, and 1,800-case governance suites | PASS before release build |
| ARM64 `assembleRelease`, `bundleRelease`, and `lintVitalRelease` | PASS |
| Installed package identity | PASS: version code 6, version name 1.5.0 |
| Overview reading-path render | PASS |
| Expanded reasoning and complete agency/caveat render | PASS |
| Pre-demonstration confirmation render | PASS |
| Five-round final device restart | PASS |

## Release artefacts

- APK: 59,411,247 bytes; SHA-256 `2ACE6B241FA515748A2473D68A0B23E51ABE90FDB071289EBEBBCA58B9871C9A`
- AAB: 29,609,558 bytes; SHA-256 `A91F77AE8B8F7A38E0F41A5D5EB178F2828355791C1FD147776ECEC2E9DCABB2`
- Application ID: `com.zhihengzhang.privacylens`
- minSdk / targetSdk: `24 / 36`
- Signing boundary: QA/debug identity, not owner-controlled production signing.

## Physical-device evidence

Target: OPPO PERM00, serial `BICIPVNB5HS85H9T`.

- Median / mean `TotalTime`: 1,226 ms / 1,450.8 ms.
- Sampled TOTAL PSS range: 98,347-100,743 KB.
- Package-specific crash-buffer entry: false.
- Evidence directory: `testing-report/real-device-8-10-v1.5.0-psychology/`.

The device matrix contains the final reading path, expanded reasoning, agency warning, legal caveat, and synthetic-demo confirmation. It covers one handset and selected states only.

## Strict score

| Dimension | Weight | Revision 16 | Revision 17 | Boundary |
|---|---:|---:|---:|---|
| Legal validity and governance | 30 | 24 | 24 | No independent qualified legal review |
| Software evidence | 25 | 23 | 23 | Current release/device evidence; QA signing and short single-device scope remain |
| Interface and accessibility | 20 | 19 | 19 | Strong rendered structure; assistive-technology and large-font evidence remain absent |
| User psychology | 15 | 10 | 13 | Implemented expectation, uncertainty, agency, and reversibility support; no participant outcomes |
| Academic communication | 10 | 8 | 8 | Versioned claim chain; no external replication or peer review |
| **Total** | **100** | **84** | **87** | **Remaining 13 points depend mainly on external, participant, accessibility, and publication evidence.** |

## Human-study gate

The next legitimate psychology gain requires a consented protocol measuring signal-versus-verdict comprehension, missing-context recall, proportional action choice, synthetic-source recall, calibrated reliance, task success, accessibility barriers, and willingness to continue. Internal screenshots cannot answer those questions.
