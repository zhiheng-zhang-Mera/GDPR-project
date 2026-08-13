# Privacy Lens 1.14.0 Store-Readiness Gate

Assessment date: 13 August 2026

## Decision

**Repository and QA artifact status: FINAL HANDOFF CANDIDATE.**

**Public Play release status: OWNER ACTION REQUIRED.** Production signing, a stable hosted privacy policy, monitored support contact, Play declarations/listing, Play-delivered binary review, broader validation, and appropriate legal/security/accessibility review remain external.

## Verified engineering evidence

- Package `com.zhihengzhang.privacylens`, version code 15, version name 1.14.0, min SDK 24, target SDK 36.
- ARM64 QA APK and AAB were built; recorded SHA-256 digests are retained in the final device report.
- Local APK Signature Scheme v2 verification passed; the artifact used the Android Debug certificate and is not a production-signed release.
- The inspected release manifest contained no Internet or sensitive runtime permission. Operational WorkManager declarations remained.
- Android backup is disabled; the app has no account, analytics, advertising, or evidence-upload service.
- Compliance corpus, extended boundary suite, independent governance/property oracle, accessibility source contracts, privacy-release contracts, TypeScript, ESLint, and delivery checks passed for the referenced acceptance revision.
- A non-streaming install and the primary decision-pause flow passed on one OPPO PERM00 handset; the short cold-launch sample completed and the minimized crash buffer was empty.
- Final evidence: [App 1.14.0 device report](../testing-report/real-device-8-10-v1.14.0-decision-pause/SUMMARY.md).

## Claim boundaries

- The QA/debug certificate is not suitable for Play publication.
- One device and a short sample do not establish Android 7–16/OEM compatibility, accessibility conformance, long-duration WorkManager reliability, battery behavior, memory safety, or security assurance.
- Native bridge availability does not imply unrestricted cross-app AppOps history.
- Synthetic evaluation measures deterministic agreement, not population or legal accuracy.
- The legal-review gate intentionally remains closed because production roots, witnesses, and qualified legal-review attestations are unprovisioned.
- This repository does not provide a legal opinion, GDPR certification, participant study, or publication decision.

## Before Play upload

1. Create and protect an owner-controlled upload key; configure signing without committing secrets.
2. Publish [privacy-policy.md](privacy-policy.md) at a stable HTTPS URL and replace its placeholder contact with a monitored address.
3. Complete Data safety, content rating, support details, localized listing text, screenshots, and feature graphic against the exact shipped binary.
4. Build the final AAB from a clean checkout; record commit, dependency lock, hashes, signing-certificate digest, merged manifest, and toolchain versions.
5. Upload to an internal track, inspect Play pre-launch results, and test the Play-delivered split on a broader Android/device matrix including assistive technologies.
6. Obtain the legal, privacy, security, accessibility, ethics, and operational review appropriate to the intended deployment and claims.
7. Add an explicit license before inviting redistribution.
