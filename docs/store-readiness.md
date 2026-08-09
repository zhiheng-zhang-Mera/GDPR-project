# Privacy Lens 1.1.0 Store-Readiness Gate

Assessment date: 9 August 2026

## Decision

**Code and artifact status: INITIAL SUBMISSION CANDIDATE.**

**Public listing status: OWNER ACTION REQUIRED.** A dedicated upload key, stable privacy-policy URL, monitored support contact, Play Console Data safety declaration, store screenshots/text, content rating, and internal-track review remain external owner-controlled steps.

## Passed engineering gates

- Product scope reduced to Overview, Findings, and Settings.
- Branded launcher, adaptive, monochrome, and splash assets generated and verified.
- Package ID changed to `com.zhihengzhang.privacylens`.
- min SDK 24; compile/target SDK 36; versionCode 2; versionName 1.1.0.
- ARM64 release APK and AAB built successfully.
- Storage permissions explicitly removed; no sensitive runtime permission; only Internet plus WorkManager operational declarations remain; Android backup disabled.
- No account, advertising, analytics SDK, evidence upload, or sensitive permission.
- EU GDPR and non-legal research packs load through a decoupled registry.
- Existing findings retain their producing pack.
- Input validation fails closed for unsafe package, permission, source, count, time-window, timestamp, and context values.
- TypeScript, ESLint, deterministic compliance tests, pack tests, Android lintVital, install, cold launch, primary navigation, demo flow, and crash/ANR scan passed.
- OPPO PERM00 screenshots and UI trees are retained in `testing-report/ui-round-2026-08-09/`.

## Claim boundaries

- Deterministic precision/recall demonstrates agreement with generated labels only.
- One physical device and a short session do not prove broad OEM compatibility, long-duration WorkManager reliability, battery performance, accessibility conformance, or memory-leak freedom.
- Native bridge availability does not imply unrestricted cross-app AppOps visibility.
- The output is not a legal decision.

## Before Play upload

1. Configure an owner-controlled upload key and remove QA/debug signing from the submission artifact.
2. Publish `docs/privacy-policy.md` at HTTPS and replace the placeholder contact.
3. Complete Data safety consistently with the shipped binary and policy.
4. Prepare localized store copy, screenshots, feature graphic, content rating, and support details.
5. Upload the AAB to an internal track, review Play pre-launch reports, and test the Play-delivered split APK on additional Android 7–16 devices.
6. Decide whether production use remains a research prototype or undergoes legal, security, privacy, accessibility, and operational review.
