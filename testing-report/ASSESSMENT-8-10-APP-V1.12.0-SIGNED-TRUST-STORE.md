# App 1.12.0 self-assessment - signed monotonic trust store

## Outcome

Strict publication-target score: **95/100**, up from 94/100 for 1.11.0.

| Dimension | Score | Evidence boundary |
|---|---:|---|
| Legal compliance engineering | 29/30 | A canonical Ed25519 trust-store envelope, independent issuer/approver identities, explicit revocations, offline-root separation, expiry, exact sequence advancement, predecessor binding, and fail-closed production provisioning are implemented. This is not qualified legal approval. |
| Software and security quality | 24/25 | Safe-integer and calendar validation, decoded key/signature lengths, unique valid roots, issuance-time root validity, rollback/fork/gap/freeze probes, and persistence-failure anchor removal passed. Local rollback state is not tamper-resistant. |
| Interface art and accessibility structure | 20/20 | The three-link evidence chain remained visually coherent on the recorded handset, with warning states readable without colour alone and no observed clipping in the captured view. This is not accessibility conformance. |
| User psychology and calibrated reliance | 13/15 | The interface avoids reassurance, explains that a signature is not legal correctness, and names local-history loss conditions. No participant study establishes comprehension or reliance. |
| Academic and reproducibility quality | 9/10 | The mechanism has a fixed canonical payload, pure rollback transition, reusable tests, exact release hashes, bounded device evidence, and explicit NIST/TUF influence boundaries. External replication remains absent. |

## Acceptance evidence

- TypeScript application compilation: PASS.
- Seeded compliance oracle: 1,000 cases, TP 800 / TN 200 / FP 0 / FN 0.
- Independent governance oracle: 1,800 cases PASS.
- Signed trust-store mutation, unknown root, malformed root, duplicate root, issuance validity, revocation, expiry/freeze, future activation, self-approval, rollback, same-sequence fork, predecessor mismatch, sequence gap, missing history, and idempotence probes: PASS.
- Accessibility source contracts: 5 files / 12 touchables PASS.
- Release privacy contracts: version 1.12.0 / 30 source files PASS.
- ESLint: PASS.
- Release APK: 62,929,891 bytes; SHA-256 `0B723DC0541B93BC27A4FFA5513D1B21F0794D39EAA49A2B719DDDD5C7491097`.
- Release AAB: 31,790,208 bytes; SHA-256 `CCF2E229344941D484DB5E582FE8BE44940F375641258AE9B7D63D4E74D3F8CF`.
- Physical installation: OPPO PERM00, versionCode 13, versionName 1.12.0, minSdk 24, targetSdk 36.
- Three short relaunches: live process in all 3; crash buffer empty.

## Claim boundary and next priority

The production offline-root list, trust-store envelope, legal attestation, and bundled source bytes remain deliberately unprovisioned, so the EU pack cannot clear the legal-review gate. AsyncStorage continuity can be lost after uninstall or app-data clearing and can be altered on a compromised device; disabled Android backup does not create hardware-backed monotonicity or a transparency log. The next legal-priority iteration should establish an externally controlled production ceremony, witnessed release receipts or transparency evidence, recovery semantics, and qualified legal review. Participant and assistive-technology studies remain the largest publication-validity gaps.
