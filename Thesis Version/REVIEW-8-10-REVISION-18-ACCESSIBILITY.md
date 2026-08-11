# 8-10 Revision 18 review - cognitive accessibility

Date: 2026-08-11

## Review question

Does the current App--thesis system preserve its legal and human-agency structure when Android system text is enlarged, without promoting a one-device visual check into accessibility conformance?

## Result

**PASS within the recorded engineering scope.** Privacy Lens 1.6.0 introduces explicit large-text reflow and the paper reports both the successful evidence and its limits.

## Code-to-evidence trace

| Claim | Implementation | Acceptance evidence |
|---|---|---|
| Dense Overview content has a linear large-text order | `app/(tabs)/index.tsx` font-scale branch and stacked metrics | source contract, `overview-reflow-large-text` screenshot/XML |
| Findings summary and filters reflow | `app/(tabs)/privacy.tsx` font-scale branch | source contract, `findings-large-text` screenshot/XML |
| Package identity and status remain readable | `FindingCard.tsx` removes forced single-line truncation and separates status | `finding-card-large-text` screenshot/XML |
| Reasoning and caveat remain present | existing expanded-card structure retained | `finding-expanded-large-text` screenshot/XML |
| Navigation receives large-text space | `BottomNav.tsx` scale-aware height and padding | source contract and device matrix |
| Accessibility boundary is disclosed | Settings readable-structure fact | `settings-reading-large-text` screenshot/XML |
| Test does not alter the user's device state | recorded 0.9 -> 1.6 -> 0.9 transition | `font-scale.txt`, `device-acceptance.txt` |

## Acceptance summary

- TypeScript, ESLint, accessibility contracts, and release-privacy contracts passed.
- The 1,000-case, extended, and 1,800-case governance suites passed without decision-engine changes.
- Release APK/AAB and lint-vital tasks passed; hashes are recorded in the App assessment and thesis.
- Version 1.6.0 was installed on one OPPO PERM00.
- Selected Overview, Findings, expanded-card, and Settings states rendered at `font_scale=1.6` without observed clipping.
- The original `font_scale=0.9` was restored; 5/5 subsequent cold starts succeeded and the crash buffer was empty.

## Claim boundary

The evidence does not establish WCAG conformance, TalkBack traversal or announcements, switch access, keyboard access, magnification, localisation, landscape/foldable behaviour, multi-device consistency, or outcomes for users with disabilities. Those require dedicated protocols and participants rather than additional screenshots alone.

## Next priority

The next publication-relevant round should be externally validated: independent legal review first, then a consented accessibility/human-factors protocol using the actual distributed candidate. Internal visual iteration should continue only for defects revealed by those studies or a new device matrix.
