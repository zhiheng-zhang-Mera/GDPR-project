# Revision 16 interface and evidence-communication review

Date reviewed: 2026-08-10

Scope: Overview, Findings, Settings pack selection, Settings source register, bottom navigation, accessibility source contracts, and Revision 16 thesis claims.

## Result

**PASS WITH ASSISTIVE-TECHNOLOGY AND PARTICIPANT HOLD.**

## Final visual matrix

| State | Evidence | Review result |
|---|---|---|
| Overview after final restarts | `testing-report/real-device-8-10-v1.4.0-ui/screen-after-restarts.png` | Primary action, local-only boundary, evidence reach, snapshot, and navigation visible without obvious clipping |
| Populated Findings | `testing-report/real-device-8-10-v1.4.0-ui/final-findings.png` | Source and pack chips, text status marker, rail, and disclosure control remain legible |
| Settings pack selection | `testing-report/real-device-8-10-v1.4.0-ui/final-settings-top.png` | Selected pack and non-legal candidate caveat have clear hierarchy |
| Settings source register | `testing-report/real-device-8-10-v1.4.0-ui/final-settings-sources.png` | Binding law, final guidance, and consultation status are visible next to each source |

## Defects found and closed

1. Empty-to-populated ledger transition could retain a prior scroll offset and hide the top context. The ledger now remounts on population-state change.
2. Whole-card disclosure could transfer focus and scroll the heading out of view. Disclosure now uses a dedicated minimum-size control before the detail region.
3. The English interface inherited a Chinese-locale date fragment from the device. The display now uses explicit `en-GB` formatting.

## Preserved legal and trust controls

- No automatic legal-compliance or infringement verdict was introduced.
- Evidence gaps, synthetic source, selected pack, source status, limitations, and local-data controls remain visible.
- Status is not encoded by colour alone.
- The Research Baseline remains explicitly non-legal.

## Unresolved evidence

- OEM shell permission denial prevented the planned 1.3 font-scale run.
- TalkBack, switch access, colour-vision simulation, landscape/tablet, multiple OEM/API versions, and participant tasks remain untested.
- The visual matrix covers four selected final states on one handset, not the complete state space.
