# 7-31-editing Enhancement and Validation Report

## Implemented changes

- Added fail-closed runtime validation with structured rejection codes.
- Added explicit permission whitelisting and own-property rule lookup.
- Rejected non-finite, negative, fractional, malformed-window, and inconsistent timestamp inputs.
- Added provenance and evidence fields to accepted findings.
- Added minute-scale burst detection and 24-hour cross-window accumulation.
- Kept independent simulator samples outside persistent cross-window state.
- Added regression coverage for malformed inputs, prototype keys, burst timing, split windows, and threshold boundaries.

## Logical validation

TypeScript compilation passed. The original compliance suite passed, including the 50-round baseline. The new security and temporal regression suite also passed. ESLint reported no errors and four array-style warnings.

## Android build

The x86_64 Release APK built successfully with Android compile/target SDK 36, Hermes, and release optimisation. APK size: 34,335,476 bytes.

## Cross-model emulator validation

The preceding Pixel 7/API 36 instance was explicitly stopped. A new Pixel 4 profile using the API 35 Google Play x86_64 image was created under `D:\AndroidAVD` and verified as `GDPR_Pixel_4_API_35_D`, API 35, 1080x2280.

- Installation: passed.
- Cold launch: passed; `TotalTime=2912 ms`, `WaitTime=2998 ms`.
- UI hierarchy: application package and navigation nodes present.
- Initial PSS after launch: 106,812 KB.
- Controlled Monkey: 10,000 events, 50% touch/50% motion, seed 73102, 5 ms throttle; all events injected in 46.651 s.
- Crash buffer: empty after the run.
- Immediate post-stress PSS: 170,470 KB (about 166.5 MB).
- Ten-second idle PSS: 150,823 KB (about 147.3 MB).
- Frame evidence: 503 frames, 210 janky (41.75%); P50 32 ms, P90 97 ms, P95 150 ms, P99 200 ms.

## Interpretation

The code repair closes the previously demonstrated prototype-key, invalid-count, and invalid-window acceptance paths in targeted regression tests, and adds first-order detection for burst and split-window attacks. It does not prove complete robustness. The Pixel 4 test demonstrates cross-profile install and process survival, but also reveals model-sensitive startup and rendering costs. The immediate PSS exceeded the provisional 150 MB target, while the idle value fell just below it. The jank rate is unsuitable for a normal-use performance claim because Monkey is an extreme workload, but it is high enough to justify deterministic UI profiling and render reduction.

## Remaining high-priority work

1. Persist rolling temporal state across process death with integrity and retention controls.
2. Calibrate temporal thresholds from an independently sampled corpus.
3. Run the complete adversarial corpus against the repaired engine.
4. Profile deterministic UI paths with Perfetto and remove unnecessary rerenders.
5. Implement an authorised native acquisition adapter and WorkManager schedule.
6. Perform multi-day physical ARM-device scheduling, battery, and log-completeness tests.
