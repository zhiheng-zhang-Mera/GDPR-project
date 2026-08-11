# 8-10 Iteration 9 Assessment - App 1.11.0 / Revision 23 candidate

Date: 2026-08-11

Priority: legal compliance -> interface aesthetics -> user psychology

## Answer-first result

Privacy Lens advances from **93/100 to 94/100** under the project's stable research rubric. The legal gate no longer treats a signed inventory of titles and URLs as sufficient: a legal pack must carry a one-to-one source-content manifest, the signed attestation must bind that manifest, and the positive path requires every supplied offline artifact to match its recorded byte length and SHA-256 digest.

The production app deliberately supplies no official-document bytes, contains no reviewer trust anchor, and has no independent legal attestation. It therefore displays **Source digests recorded; bytes not verified here**, **Independent legal review not recorded**, and **Unprovisioned** key governance. This is stronger failure transparency, not a compliance approval.

## Weighted score

| Dimension | Weight | Score | Evidence-backed assessment |
|---|---:|---:|---|
| Legal compliance and governance | 30 | **29** | Six official-source PDFs were retrieved and hashed; a fixed-schema content manifest covers every source; the signed payload binds both record and content-manifest digests; missing, truncated, same-length-mutated, reordered, unsigned, unknown-key, revoked-key, and expired cases fail closed. A detailed onboarding, custody, rotation, revocation, rollback, and publication procedure is recorded. No genuine qualified review, independently governed key, live revocation, publisher signature, or jurisdiction-specific deployment opinion exists. |
| Software and evidence engineering | 25 | **23** | TypeScript, ESLint, 1,000 seeded cases, 1,800 independent-oracle cases, content-verifier positive and negative probes, release privacy/accessibility contracts, APK/AAB, hashes, lintVitalRelease, and physical-device checks pass. Reproducible external retrieval, multi-device, long-run, and third-party cryptographic audit evidence remain absent. |
| Interface aesthetics and accessibility | 20 | **20** | The sampled device clearly renders the legal gate, three-stage evidence chain, six-source register, digest summaries, wrapped failure chips, and expanded reasoning without observed clipping or overlap. This is not WCAG or multi-device evidence. |
| User psychology and decision support | 15 | **13** | The interface separates recorded digest, locally verified bytes, independent review, and key governance; it preserves synthetic provenance and the instruction not to change access or confront a developer on the card alone. No participant study establishes comprehension, calibrated trust, anxiety reduction, or behavioural benefit. |
| Academic readiness | 10 | **9** | The iteration adds an executable threat-model boundary, falsification probes, reusable verifier, source register refinement, publishable governance procedure, release hashes, and bounded device evidence. Independent review, external replication, peer review, and empirical user evidence remain missing. |
| **Total** | **100** | **94** | Stronger research candidate; not legal, security, accessibility, journal, or production certification. |

## Official-source status check

- [EUR-Lex GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj): in force; the manifest pins the English Official Journal PDF retrieved on 2026-08-11.
- [EDPB Guidelines 05/2020 on consent](https://www.edpb.europa.eu/documents/guideline/guidelines-052020-on-consent-under-regulation-2016679_en): final guidance.
- [EDPB-endorsed WP29 guidelines](https://www.edpb.europa.eu/endorsed-wp29-guidelines_en): WP260 rev.01 transparency and WP248 rev.01 DPIA remain separately registered final guidance.
- [EDPB Guidelines 1/2024](https://www.edpb.europa.eu/public-consultations/guidelines-12024-on-processing-of-personal-data-based-on-article-61f-gdpr_en): Version 1.0 remains closed for feedback and pending finalisation in this pack.
- [2026 EDPB DPIA template](https://www.edpb.europa.eu/public-consultations/template-for-data-protection-impact-assessment_en): consultation closed; the official page states that finalisation follows consultation, so the pack does not promote it to final guidance.

## Acceptance evidence

- Compliance suite: 1,000 fixed-seed cases; TP 800, TN 200, FP 0, FN 0.
- Governance/property suite: 1,800 independent-oracle cases plus manifest coverage, canonical-order invariance, source mutation, missing artifact, length mismatch, same-length hash mismatch, signature mutation, unknown/revoked signer, expiry, and self-approval probes.
- Offline verifier: all six official PDFs VERIFIED; one-byte mutation rejected with HASH_MISMATCH and exit code 1.
- TypeScript, ESLint, extended compliance, accessibility source contract, and release privacy contract: PASS.
- Android `assembleRelease`, `bundleRelease`, Metro (1,079 modules), and `lintVitalRelease`: PASS.
- APK SHA-256: `5386EEA1C9E8B7930830C89E2A21186E8042684A767784D7D9E637724EBCA9E6`.
- AAB SHA-256: `865CAE741AF7C807E4390D07894333DEE1A454A388549D89E1E6D305DA1F794D`.
- OPPO PERM00: five cold starts all `Status: ok`; median `TotalTime` 1,811 ms; crash buffer empty after the UI flow.

## What would falsify this iteration's claim

The central engineering claim fails if a reassuring no-concern result can pass without all manifest bytes, after a byte-length or same-length content mutation, after a manifest digest changes, without a trusted current key, after revocation or expiry, or if the source-content gap disappears from stored findings and the user-facing evidence chain.

## Residual risks and next priority

1. The app does not bundle source bytes; runtime production evaluation therefore remains deliberately blocked.
2. Direct HTTPS retrieval plus hashing does not establish publisher signature, legally controlling language, or immunity from a compromised retrieval channel.
3. The production trust store is empty; reviewer identity and qualification are not established.
4. Revocation is static and requires an application release; there is no independently signed offline revocation list, transparency log, or rollback counter.
5. The next legal-priority iteration should implement and test a signed trust-store/revocation-list envelope with monotonic version and rollback rejection, while retaining the offline/no-network package boundary.
