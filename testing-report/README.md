# Testing reports

This directory preserves the reproducible outputs from the two Android GDPR
permission-audit test iterations executed against commit
`ba0a443b1da253bab9bd9b6fa5536d9c4cedcc05`.

## Version 1: correctness and release baseline

`version-1/` contains:

- `release-apk-baseline-report.md`: release APK size, startup, memory, frame, and
  50-round baseline observations.
- `integrated-multiround-test-report-zh.md`: complete Chinese interpretation of
  the progressively enlarged correctness tests.
- `logical-stress-results.json`: machine-readable Monte Carlo, boundary,
  temporal-invariance, malformed-input, and flood results.
- `thesis-test-fragment-v1.docx`: visually reviewed Chinese text prepared for
  insertion into the thesis.
- `release-ui.xml`, `privacy-ui.xml`, `post-eval-ui.xml`, and
  `apk-endurance-ui.xml`: UIAutomator evidence for the tested release flow.

## Version 2: uncovered attack directions

`version-2/` contains:

- `attack-v2-report-zh.md`: complete Chinese report for temporal evasion,
  forged windows, runtime type confusion, permission-key mutation, combined
  attacks, and APK event fuzzing.
- `attack-v2-results.json`: machine-readable results from the second-version
  adversarial harness.
- `thesis-test-fragment-v2.docx`: visually reviewed Chinese thesis fragment
  containing only the second-version attack iteration.

## Scope and caveats

- The release APK was tested on `emulator-5554`, Android 16 / API 36.
- Logical tests execute the compiled compliance engine directly.
- Emulator timing and frame data should not be presented as physical-device
  battery or long-duration WorkManager evidence.
- The APK itself is intentionally not committed because it is a generated
  28.68 MB build artifact. Rebuild it from this commit with the documented
  release, x86_64, R8, and resource-shrinking options.
- Temporary renders, local build directories, and profiler scratch files are
  excluded.

