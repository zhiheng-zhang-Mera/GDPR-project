# Privacy Lens 1.1.0 release-candidate evidence

Date: 2026-08-09 (Asia/Shanghai)

## Acceptance result

The application code is suitable for an initial store-submission candidate, subject to the owner-controlled actions listed in `docs/store-readiness.md`. This result is an engineering and usability assessment; it is not an independent legal opinion, Play Console approval, or evidence of unrestricted cross-application observation.

## Automated verification

- TypeScript application check: PASS (`tsc --noEmit`).
- ESLint: PASS (`eslint .`).
- Deterministic compliance evaluation: PASS, 1,000 seeded rounds; TP 800, TN 200, FP 0, FN 0, precision 1.0000, recall 1.0000.
- Extended security, temporal-isolation, accountability, presentation, simulator-boundary, metric, and regulation-pack tests: PASS.
- Android release build: PASS (`assembleRelease` and `bundleRelease`, targetSdk 36).

## Release artifacts

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `android/app/build/outputs/apk/release/app-release.apk` | 62,762,819 | `4A5BCED7FBF6A7A5A0E337BFAADB003A3C7FE89FDAFBF9BADCBE6BC4CBFF51B5` |
| `android/app/build/outputs/bundle/release/app-release.aab` | 31,700,025 | `E4090FEEF4EFBD0B697F863D80D28F289C3554BA89394A1435EACA2C226ACF78` |

These locally generated artifacts use the repository's QA signing fallback when release-key environment variables are absent. A production upload key remains an owner action.

## Physical-device verification

- Device: OPPO PERM00, Android Debug Bridge serial `BICIPVNB5HS85H9T`.
- Final package: `com.zhihengzhang.privacylens`, versionName 1.1.0, versionCode 2, minSdk 24, targetSdk 36.
- Release APK streamed installation: PASS.
- Cold launcher start: PASS.
- Recent filtered AndroidRuntime and ReactNativeJS fatal-error scan: no matching fatal output.
- Final release screenshot: `ui-round-2026-08-09/final-release-overview.png`.
- Populated synthetic-demo and Settings evidence is retained in the same folder. Synthetic records remain labelled and are not treated as device observations.

## Permission verification

The merged release manifest and installed-package `dumpsys` request Internet, wake-lock, network-state, boot-rescheduling, foreground-service compatibility, and an app-scoped signature permission. `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` are absent. No sensitive runtime permission is requested.

## Claim boundary

The result supports a bounded claim: the candidate installs, launches, renders coherently, preserves evidence provenance, switches registered rule packs, and passes the recorded deterministic checks on the tested device. It does not prove 24-hour scheduling, broad OEM compatibility, access to unrestricted third-party AppOps data, legal compliance, accessibility conformance, or store acceptance.
