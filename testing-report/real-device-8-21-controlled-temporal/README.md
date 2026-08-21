# Real-device controlled temporal fixture — 2026-08-21

## Scope

This record covers a debug-only, offline-bundled Android APK assembled from the 8-21 source and installed through ADB on one connected OPPO PERM00. It is an engineering integration check only. The fixture is synthetic, advisory, local, and never represents observed activity from another application.

## Evidence obtained

- Gradle assembled the isolated debug APK successfully with the JavaScript bundle embedded; all new build caches, package-store contents, Android user data, and captured artifacts were kept under `D:\GDPR\Dependencies`.
- The package resolved to `com.zhihengzhang.privacylens/.MainActivity`, installed successfully, launched successfully, and retained a live process after interaction.
- The real-device UI required an explicit `RUN CONTROLLED DEVICE DEMO` confirmation. Its copy stated that the active-pack fixture was synthetic, advisory, and unable to inspect or alter another App.
- Before the corrected fixture run, the Findings tab showed 15 items. After the run it showed 16 items, including `com.zhihengzhang.privacylens.controlled-demo` and the `Controlled device demo` provenance label.
- Opening the card showed the title `Wearable activity, precise location, and body-sensor co-occurrence` and the active 30-minute, order-agnostic `LOCATION ×1 + ACTIVITY RECOGNITION ×1 + BODY SENSORS ×1` temporal evidence.
- `adb logcat -b crash -d` was empty after launch, confirmation, execution, and evidence inspection.

## Artifacts retained locally

The UI XML and PNG screenshots are intentionally stored outside the source release at `D:\GDPR\Dependencies\logs`, including `device-controlled-confirm.png`, `device-fixed-findings.png`, and `device-controlled-evidence.png`. They are local acceptance evidence, not production telemetry.

## Limitation

This result verifies one debug-native bridge, temporal-engine, ledger, and presentation path on one device. It does not establish real sensor collection, another application's behaviour, a GDPR violation, legal compliance, cross-device support, or production-release readiness.
