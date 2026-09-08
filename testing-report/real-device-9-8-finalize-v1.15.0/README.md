# Privacy Lens v1.15.0 final OPPO receipt

Date: 8 September 2026 (Australia/Sydney)

Scope: bounded release-build, package-inspection, installation, cold-start, three-destination interaction, and screenshot evidence for one connected OPPO PERM00 device running Android 12 (API 31). This is not multi-device reliability, accessibility conformance, legal validation, production signing, or store acceptance.

## Build and identity

- Package: `com.zhihengzhang.privacylens`
- Version: `1.15.0` (`versionCode` 16)
- Minimum/target SDK: 24/36
- Gradle result: `assembleRelease bundleRelease` completed successfully; see `release-build.log`.
- APK SHA-256: `1B027F258130D675186455133F848B349105F52060CF7C5C1281EC61D8FC6599`
- AAB SHA-256: `39BD8DFB5D35F1CF9998A4E9C8249C4776CE4B0FF733CE30A70528A0FA0A944C`

## Permission reconciliation

The source manifest, merged release manifest, APK permission table, and installed-package dump agree on the operational permission set: `WAKE_LOCK`, `RECEIVE_BOOT_COMPLETED`, `FOREGROUND_SERVICE`, and the package-scoped `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`. `INTERNET`, `ACCESS_NETWORK_STATE`, legacy external-storage permissions, and dangerous runtime permissions are absent. The evidence supports this evaluated binary only.

## Physical interaction

The APK reinstalled successfully. A cold launcher start completed with `Status: ok`, `LaunchState: COLD`, and `TotalTime: 2538` ms. UI hierarchy bounds from the running application were used to select Findings and Settings; screenshots and XML dumps retain the resulting Overview, Findings, and Settings states. The crash buffer and filtered AndroidRuntime/ReactNativeJS error capture were empty after the bounded flow.

Persisted controlled-demonstration findings from the earlier research run remained visible. They are labelled as controlled-device evidence and are not represented as newly acquired third-party telemetry.

## Files

- `release-build.log`: release Gradle receipt.
- `install-receipt.txt`, `cold-start-receipt.txt`: install and launcher outcomes.
- `overview.png`, `findings.png`, `settings.png`: final physical-device renders.
- matching `.xml` files: UIAutomator hierarchies used for inspection and coordinate derivation.
- `source-AndroidManifest.xml`, `merged-release-AndroidManifest.xml`, `apk-permissions.txt`, `installed-package.txt`: permission reconciliation.
- `adb-devices.txt`, `device-properties.txt`: bounded device identity and configuration.
- `bounded-crash-buffer.txt`, `bounded-filtered-errors.txt`: bounded post-flow error captures.
