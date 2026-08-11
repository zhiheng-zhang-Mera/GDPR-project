# Privacy Lens 1.14.0 decision-pause acceptance

- Date: 2026-08-11
- Branch: `8-10`
- Device: OPPO PERM00 (`BICIPVNB5HS85H9T`), ARM64 physical handset
- Scope boundary: one device and a short interactive sample; not broad compatibility, accessibility conformance, participant evidence, or long-run reliability.

## Release artifacts

- APK: 59,583,635 bytes; SHA-256 `B4D633DD30E9813077AE082F0CB0444C5138179CE9366A6C19B4B1E36F9B2BA5`.
- AAB: 29,702,994 bytes; SHA-256 `B4823D63CF9855469DC647EDFFA9B9316535BCABE4A0F17E4CBDCB0A9420AE24`.
- APK package: `com.zhihengzhang.privacylens`, version code 15, version name 1.14.0, min SDK 24, target SDK 36.
- Local APK Signature Scheme v2 verification passed. The local QA build uses the repository debug certificate; production upload signing remains owner-controlled and incomplete.
- Declared permissions are WAKE_LOCK, RECEIVE_BOOT_COMPLETED, FOREGROUND_SERVICE, and the app-scoped non-exported dynamic-receiver permission. No Internet or sensitive runtime permission appeared in `aapt` output.

## Device flow

Non-streaming installation succeeded. UI-tree coordinates, not screenshot estimates, drove every tap.

1. Findings displayed the existing observation, missing-evidence, proportional-action, and legal-caveat chain.
2. The new Decision pause rendered three interpretation radio controls, three context checkboxes, a session-only disclosure, and live feedback without observed overlap or clipping in the inspected viewport.
3. Selecting `A GDPR violation` produced: `Not established: this card cannot prove a GDPR violation or developer intent.`
4. Selecting `A technical signal that needs context` and all three context checks produced: `Prepared for proportionate review—not proof of a violation.`
5. After collapsing and reopening the card, all three radio `selected` values and all three checkbox `checked` values were false; initial feedback returned. This supports the implemented in-component reset, not a forensic claim that no system could observe screen interaction.

## Short launch sample

| Round | State | Total time | Wait time |
|---:|---|---:|---:|
| 1 | COLD / ok | 808 ms | 818 ms |
| 2 | COLD / ok | 1,230 ms | 1,235 ms |
| 3 | COLD / ok | 734 ms | 740 ms |

The final process was live (`PID 8847`) and the crash buffer was empty. These observations do not establish battery behavior, background-work duration, memory safety, or reliability across devices.

## Engineering checks

- Fixed-seed compliance corpus: TP 800, TN 200, FP 0, FN 0.
- Independent governance oracle and adversarial probes: 1,800 cases passed.
- Decision-readiness state and invariant probes passed.
- Accessibility source contracts: five files, 14 touchables.
- Release privacy contracts: version 1.14.0, 32 source files.
- Application and compliance TypeScript passed.
- ESLint passed with zero warnings after direct invocation.
- Synthetic study analyzer accepted the 12-row `SIMULATED_PIPELINE_ONLY` dry run and printed an explicit non-participant warning.
