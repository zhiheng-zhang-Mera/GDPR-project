# Privacy Lens 1.4.0 - interface-priority acceptance record

Date: 2026-08-10

Branch: `8-10`

Iteration: Revision 16 / interface art and accessibility priority

## Decision

**Engineering and bounded visual acceptance: PASS. Strict publication-target score: 84/100, up from Revision 15's 79/100 and the user-defined 70/100 predecessor baseline.**

This decision permits the next internal iteration. It is not a legal opinion, participant-usability result, accessibility certification, production-signing approval, store approval, or broad Android reliability claim.

## Implemented changes

- Established a restrained editorial design system with named canvas, surface, ink, radius, and shadow tokens.
- Reworked the Overview hierarchy around an evidence-first proposition, explicit on-device/no-upload cues, a review snapshot, and a visible evidence-reach boundary.
- Added non-colour status structure: text markers, rails, icons, labels, and selected-state containers accompany colour.
- Added a governed source register to Settings, exposing `Binding law`, `Final guidance`, and `Consultation` status for every selected-pack source.
- Reworked Findings disclosure into a dedicated control with a minimum 44-pixel target instead of making the whole card interactive.
- Reset ledger scroll state when changing between empty and populated data, preventing inherited offset from hiding context.
- Forced the update timestamp to `en-GB`, preventing device-locale mixing in the English interface.
- Updated version name to `1.4.0` and version code to `5`.

## Automated acceptance

| Check | Result |
|---|---|
| Application TypeScript (`tsc --noEmit`) | PASS |
| Explicit ESLint run | PASS |
| Fresh compliance-test TypeScript build | PASS |
| Seeded decision campaign | PASS: 1,000 cases; TP=800, TN=200, FP=0, FN=0 |
| Extended malformed-input, temporal, replay, and pack boundaries | PASS |
| Governance and independent-oracle campaign | PASS: 1,800 cases |
| Accessibility source contract | PASS: 5 files; 12 static touchable templates |
| Added non-colour, target-size, source-register, and navigation assertions | PASS |
| Release privacy contract | PASS: version 1.4.0 across 23 source files |
| Android `assembleRelease`, `bundleRelease`, and `lintVitalRelease` | PASS |

Static source contracts confirm specified implementation properties. They do not substitute for screen-reader, motor-access, cognitive-usability, or participant testing.

## Release artefacts

- Application ID: `com.zhihengzhang.privacylens`
- Version: code `5`, name `1.4.0`
- minSdk / targetSdk: `24 / 36`
- Architecture: `arm64-v8a`
- APK: 59,407,715 bytes; SHA-256 `FB87A9B32E6F1A5FBC83F9EA35F0051D381524DBD0EE82DE3E7BCCA0CF58EBF7`
- AAB: 29,607,554 bytes; SHA-256 `7EE5B3A1DFE4C6AFA42DAEB41BC1424A44732EC4BD8637547D52751F13DB3061`
- Internet, network-state, and external-storage permissions: absent.
- Signing boundary: QA/debug identity; not an owner-controlled production upload key.

## Physical-device and visual evidence

Target: OPPO PERM00, serial `BICIPVNB5HS85H9T`.

- Final APK installation: PASS.
- Five force-stop/cold-start rounds: PASS.
- Median / mean `TotalTime`: 1,941 ms / 1,998.2 ms.
- Sampled TOTAL PSS range: 106,713-108,019 KB.
- Six synthetic findings persisted through the final run.
- Package-specific crash-buffer entry: false.
- Final visual matrix: Overview, populated Findings, pack-selection Settings, and source-register Settings.
- Evidence directory: `testing-report/real-device-8-10-v1.4.0-ui/`.

The matrix showed no obvious clipping, overlap, or blocked primary navigation in the captured states. The walkthrough also found and corrected the stale-ledger-offset and disclosure-focus defects before final capture.

## Accessibility boundary

An ADB attempt to set font scale to 1.3 was rejected by the OEM with `WRITE_SETTINGS` permission denial. No large-font result is therefore claimed. TalkBack, switch access, colour-vision simulation, landscape/tablet layouts, and multi-device/API matrices were not executed. The evidence supports a bounded visual and source-contract pass, not accessibility conformance.

## Strict score

| Dimension | Weight | Revision 15 | Revision 16 | Reason credit is capped |
|---|---:|---:|---:|---|
| Legal validity and governance | 30 | 24 | 24 | Legal controls retained; no independent qualified legal review |
| Software evidence | 25 | 22 | 23 | Fresh release/device evidence and state-defect fixes; QA signing and short single-device scope remain |
| Interface and accessibility | 20 | 15 | 19 | Strong hierarchy, source visibility, non-colour cues, and final visual matrix; no assistive-technology or successful large-font evidence |
| User psychology | 15 | 10 | 10 | Trust cues improved, but no human outcome was measured |
| Academic communication | 10 | 8 | 8 | Revision 16 traces claims and limits; no external replication or review |
| **Total** | **100** | **79** | **84** | **Five evidence-backed points; remaining points require external or human evidence.** |

## Next gate

The psychology-priority iteration may improve comprehension, calibrated reliance, agency, and recovery without manufacturing participant evidence. Any claimed human outcome requires a consented study rather than an expert-proxy score.
