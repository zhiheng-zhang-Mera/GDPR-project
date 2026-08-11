# Revision 24 multidisciplinary self-assessment

## Overall result

Strict publication-target score: **95/100**, compared with the 70/100 predecessor baseline and 94/100 for Revision 23. This is an internal expert-proxy rubric, not a university mark or publication decision.

| Perspective | Score | Finding |
|---|---:|---|
| Legal and governance | 29/30 | The thesis now distinguishes reviewer-key authorisation from legal correctness and specifies root separation, independent approval, revocation, expiry, rollback, fork, gap, and recovery boundaries. Qualified legal review remains absent. |
| Security and software | 24/25 | The signed canonical envelope and pure monotonic transition are implemented and adversarially tested. Client state and application-distributed roots are not hardware-backed or independently witnessed. |
| Interface and visual communication | 20/20 | Device evidence shows coherent hierarchy and legible warning states for the three-link evidence chain. This is a bounded expert visual check, not accessibility conformance. |
| User psychology | 13/15 | Reassurance remains blocked and the interface names what a signature cannot prove and how local history can fail. Participant evidence remains absent. |
| Research quality | 9/10 | Revision 24 maps requirements to implementation, adversarial tests, release hashes, device evidence, and residual threats; it cites primary NIST and TUF materials without claiming conformance. External replication remains absent. |

## Claim-to-evidence audit

- Canonical and order-independent envelope: fixed serializer plus anchor/revocation reordering test.
- Root and signature admission: decoded-length, identity, uniqueness, issuance-time validity, assessment-time validity, revocation, and mutation probes.
- Rollback resistance: exact sequence advancement, predecessor digest, older replay, same-sequence fork, gap, missing-history, and idempotence probes.
- Persistence boundary: strict stored-state parser, pure transition validator, persist-before-anchor exposure, and zero-anchor failure response.
- Interface communication: physical screenshot and UI XML expose unprovisioned production state and local-history loss conditions.
- Release identity: exact APK/AAB byte lengths and SHA-256 values, installed package version, target SDK, three short relaunches, and empty crash buffer.
- Thesis artifact: 99 A4 pages, 682,338 bytes, SHA-256 `276A974E7443562F3B220C19F1B0E9459C94C9FEF0F4B6747A4D91FB3A0B32B0`; LaTeX/BibTeX log clean and all pages rendered for visual inspection.

## Main residual threats

The largest validity gaps are external: qualified legal review; secure and independently controlled production roots; witnessed release receipts or a transparency mechanism; recovery after local state loss; production signing and distribution ownership; participant and assistive-technology studies; longer multi-OEM execution; and independent replication. No engineering score converts those missing observations into completed evidence.
