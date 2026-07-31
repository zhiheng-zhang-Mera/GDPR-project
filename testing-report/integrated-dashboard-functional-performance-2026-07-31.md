# Integrated Dashboard Functional and Performance Evaluation

## Scope and method

This round evaluates the integrated GDPR accountability dashboard after the code and interaction redesign. Historical compliance, HCI, security and performance concerns are retained as separate evidence dimensions. The release APK targets SDK 36 and was exercised on two Android 15/API 35 AVDs with different hardware profiles. UI actions were derived from UIAutomator bounds; screenshots and XML trees are stored beside this report.

The controlled evaluator used 50 rounds (40 positive cases and 10 controls). Stress inputs used deterministic Monkey seeds. Frame statistics were reset before the evaluated flow. Results are emulator engineering evidence, not population estimates or proof of legal compliance.

## Code and build verification

- Compliance, adversarial boundary, temporal detection, GDPR accountability, communication and dashboard presentation tests passed.
- Dashboard tests confirm four distinct states, action/evidence filtering, and non-colour status labels.
- Release APK built successfully at 34,269,632 bytes. `lintVitalAnalyzeRelease` was skipped because Android telemetry could not create a spool file on the full C drive; all remaining release tasks, including `lintVitalRelease`, packaging and assembly, completed.
- Whole-project TypeScript checking still exposes pre-existing errors in Projects, ConsentModal and health-chart components. No new dashboard file appeared in that error set.

## Functional results

| Device profile | API / display | Cold start | Controlled evaluation | Dashboard state | Stress outcome |
|---|---:|---:|---|---|---|
| Pixel 4 | API 35, 1080x2280 | 2,432 ms | TP 40, FP 0, FN 0, precision 100%, recall 100% | All 3; Action 2; Evidence 0 | App survived; system Google Play service crashed near Monkey event 3,000/5,000 |
| Pixel 7 | API 35, 1080x2400, 420 dpi | 4,396 ms | TP 40, FP 0, FN 0, precision 100%, recall 100% | All 3; Action 2; Evidence 0 | 2,000/2,000 events injected; no app-process crash |

The dashboard correctly exposes technical evidence, legal status, missing evidence, caveat and recommended action. It no longer claims that the absence of a technical signal establishes compliance. The release keeps the historical Today, History, Projects, Privacy, Settings, Task and Survey destinations.

## HCI and accessibility observations

- Primary controls are at least 52dp high; filter targets are 48dp high.
- Status is communicated by text and marker in addition to colour.
- A persistent notice distinguishes warning from legal verdict and discloses Android/deployment evidence limitations.
- Progressive disclosure keeps the first scan focused on status and action while retaining detailed technical and legal evidence.
- The Pixel 7 screenshot confirms readable reflow at 1080x2400. Seven bottom destinations remain visually dense and should be evaluated with participants before any navigation hierarchy is declared optimal.

## Performance results

| Measure | Pixel 4 | Pixel 7 |
|---|---:|---:|
| Initial PSS | 116,284 KB | 118,072 KB |
| Post-stress PSS | 146,148 KB | 136,122 KB |
| PSS change | +29,864 KB (+25.68%) | +18,050 KB (+15.29%) |
| Frames / janky | 56 / 13 | 955 / 600 |
| Janky-frame rate | 23.21% | 62.83% |
| p50 / p90 / p95 / p99 | 32 / 81 / 117 / 600 ms | 34 / 77 / 97 / 150 ms |

The dashboard redesign improves semantic clarity but does not establish smooth rendering. Pixel 7 stress data shows sustained jank despite a lower p99 than Pixel 4's short interaction sample. The frame samples are not directly interchangeable because the first device's system service failure shortened the run. Future work should profile JavaScript list updates and the seven-tab navigation with Perfetto/Simpleperf on physical devices.

## Validity and environment limitations

The API 36 AVD could not start because its configured system image is absent. A new D-drive Pixel 7/API 35 AVD was therefore created from the installed image, producing a controlled cross-model rather than cross-OS comparison. The Pixel 4 Play image exhibited unrelated `com.google.android.gms` crashes. These events were not counted as application crashes. Two emulator profiles and deterministic synthetic cases are insufficient for statistical generalisation; participant HCI testing, physical-device profiling and independent legal review remain required.

## Evidence files

- `ui-api35-privacy.png`, `ui-api35-evaluated.png`
- `ui-pixel7-privacy.png`
- `ui-api35-privacy.xml`, `ui-api35-evaluated.xml`
- `ui-pixel7-privacy.xml`, `ui-pixel7-evaluated.xml`

