# ARM64 physical-device validation — 2026-08-03

## Scope

- Device: OPPO PERM00 (OPPO K7x), Android 12 / API 31, ARM64.
- Display: 1080 x 2400 physical pixels; density 480, override 408.
- Package: `com.anonymous.mymobileapp`, version 1.0.0, target SDK 36.
- Release APK: 32,776,480 bytes; SHA-256 `2F0B165738CBD3F84B99ADCB9C2405044D8B9524F5A1231DCDD0104E85D6E804`.
- The device was USB-powered, charging, at 22% battery and 34.3 C at baseline. This run is not a battery-drain experiment.

## Build reconciliation

The ARM64 release build initially failed because `src/context/PrivacyContext.tsx` imports `@react-native-community/netinfo`, while the package manifest did not declare it. Adding version `^11.4.1` resolved the mismatch. The release APK compiled with the default React Native New Architecture, installed, and launched without Metro.

## Results

| Test | Result |
| --- | --- |
| Explicit cold starts | 1,194 ms; 993 ms; 995 ms `TotalTime` |
| Median / mean cold start | 995 ms / 1,060.7 ms |
| 50-round controlled corpus | TP 40, TN 10, FP 0, FN 0 |
| Controlled precision / recall | 100.0% / 100.0% |
| Pre-run PSS samples | 122,616; 125,993; 125,897 KB |
| Post-run PSS samples | 141,669; 139,256; 138,193 KB |
| Pre/post mean PSS | 124,835 / 139,706 KB |
| Peak PSS | 141,669 KB (about 138.35 MiB) |
| Rendered / janky frames | 39 / 3 (7.69%, Android definition) |
| Frame p50 / p90 / p95 / p99 | 11 / 22 / 34 / 65 ms |
| Captured crash or ANR | none |

The short release workflow stayed below the 150 MB PSS design target. Its 11.9% mean PSS increase is not a long-duration leak test. Precision and recall apply only to the controlled simulator oracle, not to legal compliance or unknown third-party applications.

## Native audit and scheduling boundary

`PermissionAuditWorker` checks location, microphone, and contacts operation modes for the application's own UID/package and stores a capability snapshot in SharedPreferences. It does not collect unrestricted third-party AppOps histories. JobScheduler inspection showed the unique 24-hour periodic WorkManager target and queued one-time simulation work. This proves registration, not 24-hour completion, Doze/reboot recovery, or OEM scheduling accuracy.

## Raw evidence

- `cold-starts.csv`: launch timings.
- `memory-50-round.csv`: PSS samples.
- `gfxinfo-50-round.txt` and `gfxinfo-50-round-framestats.txt`: rendering statistics.
- `screen-after-50-round.png` and `ui-after-50-round.xml`: controlled result.
- `screen-after-native-audit.png` and `ui-after-native-audit.xml`: audit interaction state.
- `jobscheduler.txt`: WorkManager/JobScheduler registration snapshot.
- `logcat-50-round.txt` and `logcat-native-audit.txt`: captured logs.

Large or invalid preliminary captures are intentionally excluded from publication. The dependency audit in the temporary release build reported 25 transitive findings (1 low, 15 moderate, 7 high, 2 critical); no forced upgrade was applied because it could introduce breaking changes without regression evidence.
