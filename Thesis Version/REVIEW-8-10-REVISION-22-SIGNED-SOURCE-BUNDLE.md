# 8-10 Revision 22 Review - Signed Source-Record Bundle

Date: 2026-08-11

## Review conclusion

Revision 22 is internally consistent with Privacy Lens 1.10.0 and is ready for local version control. The manuscript accurately describes the canonical source-record bundle, Ed25519 verification, application trust anchors, signer validity and revocation, typed failure states, empty production trust store, test-only injected key, release artifacts and bounded device sample.

The review found no claim that cryptography establishes GDPR compliance, reviewer qualification, legal correctness or source-content authenticity. The text consistently treats the two-person approval rule as project governance rather than statute.

## Claim-to-evidence checks

| Claim | Implementation or evidence | Result |
|---|---|---|
| Source-record changes after signing fail closed | Canonical digest recomputation and mutation probe | PASS |
| Signature changes fail closed | Ed25519 verification and signature mutation probe | PASS |
| Unknown and revoked signers fail closed | Trust-anchor lookup, validity/revocation assessment and probes | PASS |
| Host ordering does not change the digest | Fixed field order, code-unit URL sorting and reverse-order probe | PASS |
| Production does not inherit test authority | Empty production trust store; explicit test injection | PASS |
| Failed legal review reaches decision UI | Final settings XML plus finding XML/screenshots | PASS |
| Final artifacts match manuscript | APK/AAB sizes and SHA-256 values rechecked | PASS |
| Reliability claim remains bounded | Five final-artifact cold starts on one OPPO; empty crash buffer | PASS with boundary |

## Manuscript QA focus

- Revision number and input files advance to Revision 22 without overwriting Revision 21.
- Abstract, architecture, implementation, evaluation, limitations and conclusion use the same threat-model vocabulary.
- SHA-256 values use `seqsplit` to avoid margin overflow.
- All cryptographic claims are relative to configured keys.
- Source-record metadata is never presented as downloaded source content.
- The 93/100 score is labelled as an internal research rubric, not venue acceptance.

## Residual blockers to stronger claims

1. No real independent qualified legal-review attestation or production trust anchor exists.
2. No independently governed key lifecycle or live revocation/transparency mechanism exists.
3. Official source bytes are not retrieved or hashed.
4. No participant, professional-review, broad-device, assistive-technology or long-duration study exists.
5. The local commit is not cloud publication; push remains subject to explicit evidence-scope confirmation.
