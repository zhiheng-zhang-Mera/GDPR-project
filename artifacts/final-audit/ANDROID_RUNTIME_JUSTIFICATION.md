# Android runtime justification

## Decision

No Android emulator or AVD was created, and no Android Studio installation was
performed as part of this finalisation.

## Why no emulator was needed

The project's own permission gate allows an emulator only when all four of the
following hold at once:

1. a thesis-core claim has no credible runtime evidence;
2. that evidence cannot be substituted by JVM, Robolectric, existing device
   evidence, or static analysis;
3. instrumentation or runtime behaviour is materially important to the claim;
4. an emulator is the most reasonable way to obtain it.

Condition 1 is not met. Every claim that depends on Android runtime behaviour is
already backed by retained physical-device evidence on real hardware, not by
inference.

## Runtime evidence that already exists

| Claim area | Retained evidence | Device |
|---|---|---|
| Release APK installs, launches, and navigates | `testing-report/real-device-9-8-finalize-v1.15.0/` — `install-receipt.txt`, `cold-start-receipt.txt`, `installed-package.txt`, `overview.xml`, `findings.xml`, `settings.xml`, `findings.png`, `overview.png`, `settings.png`, `bounded-crash-buffer.txt` | OPPO PERM00, Android 12 / API 31 |
| Merged release manifest permission set | `merged-release-AndroidManifest.xml`, `source-AndroidManifest.xml`, `apk-permissions.txt`, `apk-badging.txt` for the same build | same |
| Debug-only controlled temporal fixture traverses the native bridge | `testing-report/real-device-8-21-controlled-temporal/README.md` (Findings count 15→16, `Controlled device demo` label, 30-minute order-agnostic combination, empty crash buffer) | same |
| Accessibility-oriented UI structure | `testing-report/real-device-8-24-v1.15.0-accessibility/` — UI trees, font-scale receipts, decision-pause screenshots, `enabled-accessibility-services.txt` | same |
| Decision-pause behaviour | `testing-report/real-device-8-10-v1.14.0-decision-pause/` — pre/post-collapse UI trees showing answers cleared | same |
| Bounded 233-package install/launch/uninstall campaign | `testing-report/fdroid-open-store-2026-08-22/device-batch-aggregate-final.json` | same |

These receipts are
`HISTORICAL_PHYSICAL_DEVICE_EVIDENCE`. They were produced on the original host's
handset and are **not** presented as Alien runs. Their continued applicability to
the current commit is assessed in
`artifacts/final-audit/CROSS_HOST_REPRODUCIBILITY_REPORT.md`.

## What was added instead, on the host

| Layer | What runs | Needs a device? |
|---|---|---|
| Pure native mapping logic | `android/app/src/test/java/.../ObservationMapperTest.kt`, 24 JUnit tests via `:app:testDebugUnitTest` | No — host JVM |
| Native compilation | `:app:compileDebugKotlin`, `:app:assembleRelease`, `:app:bundleRelease` | No |
| Native boundary contracts | `tests/runNativeControlledFixtureContractTests.js`, `tests/runReleasePrivacyContractTests.js` | No — source and manifest contracts |
| Accessibility source contracts | `tests/runAccessibilityContractTests.js` | No |
| Static analysis | Android lint, `tsc --noEmit`, ESLint | No |

The debug-only gate itself is enforced by `BuildConfig.DEBUG` in
`PrivacyInspectorModule.emitControlledTemporalFixture`, which a JVM test cannot
exercise without Robolectric because it reads a generated `BuildConfig` field.
That specific gate is instead covered by a source-level contract check and by the
fact that the release manifest and release source tree were inspected. Making it
Robolectric-testable would require adding Robolectric plus an Android runtime
shim; this is recorded as a residual test gap rather than done, because the
existing evidence already covers the claim it supports.

## Conclusion

Installing an emulator would not have moved any thesis-core claim from
unsupported to supported, and would have added a large, slow, unverified
dependency to the reproduction path. The gate was therefore not satisfied and no
emulator was installed. Consequently **no Android instrumentation test result is
claimed anywhere in this finalisation**.
