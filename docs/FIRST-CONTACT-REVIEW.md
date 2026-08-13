# First-Contact Delivery Review / 初次接触项目审查

Review date: 13 August 2026

Perspective: a developer or reviewer with no prior project history

Baseline: sanitized remote branch `8-10`

## Review method

The reviewer attempted to answer, in order:

1. What is this product, and what does it refuse to claim?
2. Which version and artifact are current?
3. Can a new developer identify prerequisites and one verification command?
4. Can a reviewer trace screen output to native evidence, evaluation, governance, and local persistence?
5. Are screenshots current and visibly representative?
6. Does the repository contain local-machine debris, stale binaries, dangerous template tools, disconnected code, or contradictory privacy behavior?
7. Can a release owner distinguish engineering readiness from owner-controlled legal/store work?

This was followed by deterministic test, TypeScript, ESLint, delivery-structure, Markdown-link, and screenshot inspection.

## Findings and implemented improvements

| Finding from a newcomer perspective | Risk | Implemented improvement |
|---|---|---|
| README described version 1.1.0 while code was 1.14.0. | Newcomers would build or cite the wrong state. | Rewrote the bilingual README around 1.14.0 and added cross-file version verification. |
| README pointed to old UI evidence and showed legacy research/health screens. | Product scope and visual quality were misrepresented. | Replaced three stale images with final 1.14.0 physical-device Overview, Findings, and Decision-pause screenshots. |
| A disconnected Express backend accepted identifiers and synchronized logs while product docs said there was no evidence upload. | Contradictory architecture and accidental future exposure. | Removed the unused backend and documented the offline architecture boundary. |
| `.idea`, `.vs`, a duplicate ZIP, and an obsolete 1.0.0 x86 APK were tracked. | Local state, repository weight, and artifact identity were unclear. | Removed them, expanded `.gitignore`, and documented that APK/AAB outputs belong in controlled release handling. |
| The Expo starter reset script could delete core application directories. | A newcomer could destroy the project by using an irrelevant command. | Removed the script and its package command. |
| Unused starter hooks, colors, mock health data, and React image assets remained. | Search results implied features and themes that no longer existed. | Removed files with no live references; retained only active brand assets and privacy theme. |
| Build/test instructions required several manual commands and did not check delivery structure. | Verification was easy to run partially. | Added `npm run verify`, `verify:delivery`, version checks, forbidden-path checks, and local Markdown-link checks. |
| Privacy policy incorrectly said the app declared Internet access. | Public privacy documentation contradicted final manifest evidence. | Corrected the policy: the app has no Internet permission and delegates official links to an installed browser. |
| Thesis PDFs had no local index identifying the current document. | Reviewers could open an obsolete revision. | Added an append-only PDF archive index naming Revision 26 as current. |
| Critical fail-closed and local-persistence boundaries were implicit. | Maintainers could weaken them during refactoring. | Added focused comments to governance validation, legal-review assessment, orchestration, legacy migration, ledger persistence, and rollback storage. |
| Android settings honored `NODE_BINARY`, but the app Gradle file still hard-coded `node` in five process calls. | Gradle failed for valid Node installations not exposed on `PATH`. | Unified all Node process calls and React Native executable arguments on `NODE_BINARY` with a `node` fallback. |

## Remaining owner decisions

The repository still has no explicit license. This is now visible in README and the delivery checklist rather than silently implying redistribution rights. Selecting a license changes legal rights and requires the owner’s decision.

Production signing, hosted privacy policy/contact, Play declarations, independent legal/key governance, broader accessibility/device/security testing, and any participant study also remain owner-controlled. They are not defects that code cleanup can truthfully close.

## Review conclusion

The repository now presents one coherent product, current version, current screenshot set, verification entry point, architecture, evidence boundaries, user guide, project manual, and release checklist. Remaining gaps are explicitly external decisions or validation scopes rather than hidden repository ambiguity.
