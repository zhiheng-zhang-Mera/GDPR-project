# 8-10 Iteration 8 Assessment - App 1.10.0 / Revision 22

Date: 2026-08-11
Priority: legal compliance -> interface aesthetics -> user psychology
Iteration focus: cryptographically verifiable source-record bundle and signer lifecycle

## Answer-first result

Privacy Lens advances from **92/100 to 93/100** in the project's research rubric. A claimed legal-review attestation can clear the reassurance gate only when its canonical source-record digest matches, its Ed25519 signature verifies, the signing key is present and currently valid in the application trust store, the key is not revoked, and the attestation itself is current. Distinct failure states remain visible and fail closed.

The real EU pack still has no attestation and the production trust store is deliberately empty. The app therefore continues to display **Independent legal review not recorded** instead of fabricating legal authority. Cryptography authenticates a payload against a configured key; it does not establish legal correctness, reviewer qualification, GDPR compliance, or publication acceptance.

## Weighted score

| Dimension | Weight | Score | Evidence-backed assessment |
|---|---:|---:|---|
| Legal compliance and governance | 30 | **28** | Canonical source-record hashing, pack/version binding, Ed25519 verification, application-controlled trust anchors, key validity and revocation, attestation expiry, distinct reviewer/approver, and fail-closed reassurance are implemented and mutation-tested. The real pack remains unattested; identity proofing, external key governance, live revocation, jurisdiction-specific deployment review, and source-content hashing remain absent. |
| Software and evidence engineering | 25 | **23** | TypeScript, ESLint, 1,000 seeded cases, 1,800 independent-oracle cases, adversarial signature/trust mutations, release privacy and accessibility contracts, release APK/AAB, hashes, and physical-device checks passed. Long-run, broad-device, independent-oracle and cryptographic third-party audit evidence remain absent. |
| Interface aesthetics and accessibility | 20 | **20** | The sampled device renders the legal gate, cryptographic requirements, source hierarchy, failure chip, three-step explanation, and bounded next action without observed clipping. This is not WCAG certification or multi-device visual evidence. |
| User psychology and decision support | 15 | **13** | The UI withholds reassurance, names the precise evidence gap, preserves conservative signals, labels synthetic data, and advises proportionate action. No participant study establishes comprehension, anxiety reduction, trust calibration, or behavioural benefit. |
| Academic readiness | 10 | **9** | The mechanism, threat model, counterexamples, mutation tests, artifact hashes, device evidence, score rationale, and limits are preserved in a numbered successor revision. Independent legal review, peer review, external replication, and empirical user evidence remain missing. |
| **Total** | **100** | **93** | Stronger research candidate; not legal, security, publication, or production certification. |

## Acceptance evidence

- Compliance suite: 1,000 fixed-seed cases; TP 800, TN 200, FP 0, FN 0.
- Governance/property suite: 1,800 cases plus source mutation, signature mutation, unknown signer, revoked signer, expiry, self-approval, malformed digest, and input-order invariance probes.
- TypeScript, ESLint, extended compliance, accessibility source contract, and release privacy contract: PASS.
- Android `assembleRelease`, `bundleRelease`, Metro (1,077 modules), and `lintVitalRelease`: PASS.
- APK SHA-256: `4DAA5D59E7BDD3A5B7287AE345B6775A9B13604286146E37179D35E3DFE44253`.
- AAB SHA-256: `A5BEB2946C52EC90B5A239DEB6F0E6E3B2DBCD7781FD2C7D8C2129EC6467AB6D`.
- Final APK on OPPO PERM00: five cold starts all `Status: ok`; median `TotalTime` 1,805 ms; empty crash buffer.
- Final-build UI XML and screenshots verify the cryptographic gate text; same-version finding evidence verifies the propagated gap and bounded next action.

## What would falsify this iteration's claim

The central claim fails if a reassuring no-concern result can pass after a signed source record changes, a signature changes, a signer is unknown or revoked, an attestation expires, or the test trust anchor is removed; if source ordering changes the digest; or if a failed gate disappears from the finding and UI.

## Residual risks and next priority

1. The source digest covers canonical source-record metadata, not retrieved official document bytes.
2. Production has no independently provisioned trust anchor or real qualified legal-review attestation.
3. Bundled revocation is static and cannot provide emergency server-side revocation or transparency logging.
4. Signature verification authenticates possession of a private key, not the signer's identity, qualification, independence, or legal reasoning.
5. The next legal-priority iteration should define an offline signed source-content manifest and external key-provisioning/revocation procedure before further aesthetic expansion.
