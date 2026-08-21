# Testing evidence index

This directory preserves versioned engineering evidence. Each report must state its device, duration, tested flow, result, and claim boundary.

- Final App 1.14.0 device acceptance: [`real-device-8-10-v1.14.0-decision-pause/`](real-device-8-10-v1.14.0-decision-pause/)
- Current final thesis evidence: [`final-thesis-evidence-2026-08-21.md`](final-thesis-evidence-2026-08-21.md)
- Current controlled temporal device acceptance: [`real-device-8-21-controlled-temporal/`](real-device-8-21-controlled-temporal/)
- Decision-pause synthetic analysis dry run: [`decision-pause-study-v1.14.0/`](decision-pause-study-v1.14.0/)
- Earlier reports are retained as implementation history, not as current release claims.

## Historical emulator and adversarial baselines

The original two-iteration index remains relevant to the evidence chain:

- [`version-1/`](version-1/) contains the release APK baseline report, Chinese multi-round interpretation, logical stress results, thesis fragment, and UIAutomator evidence associated with commit `ba0a443b1da253bab9bd9b6fa5536d9c4cedcc05`.
- [`version-2/`](version-2/) contains the Chinese attack report, machine-readable adversarial results, and the second-version thesis fragment for temporal evasion, forged windows, runtime type confusion, permission-key mutation, combined attacks, and APK event fuzzing.

Those releases were evaluated on `emulator-5554`, Android 16 / API 36. Emulator timing and frame data are not physical-device battery, long-duration WorkManager, or broad compatibility evidence. The corresponding generated APK was intentionally not committed.

Do not add full logcat, JobScheduler dumps, raw device dumps, intermediate screenshots, secrets, or unnecessary identifiers. Prefer a minimized crash buffer, package/version facts, final UI hierarchy, final screenshots, hashes, and a written limitation statement.
