# Verified open-source app-store experiment — 2026-08-22

## Scope and provenance

This folder contains sanitised reproducibility reports for the authorised Android installation experiment. The corpus comes from the official F-Droid repository and is therefore labelled `OPEN_SOURCE_APP_STORE`. It must not be described as a closed-source or commercial-app-store corpus. The tracked catalog records the F-Droid index and signer-index hashes; APK binaries, device UI trees, logs, account data, and Android build outputs are deliberately excluded from version control.

`fdroid-catalog-248-verified.json` contains 248 APK entries whose content SHA-256 and signing-certificate SHA-256 were both verified. Two catalog entries were rejected because their certificates did not match the signer index: `de.schildbach.wallet` and `me.hackerchick.catima`.

## Authorised device execution

`device-batch-aggregate-final.json` aggregates three non-overlapping execution receipts by receipt SHA-256. It reports 233 unique package identities: 203 install-launch-uninstall cycles completed with uninstall verification, 30 failures, and zero removal failures. Failures comprise 26 installer timeouts, two no-launchable-activity cases, one package-manager rejection, and one pre-existing-package protection; a protected pre-existing package is never overwritten or uninstalled by the runner.

The final expanded 112-entry batch produced 91 verified removals, mean post-launch PSS 60,953 KB over 88 observed readings, and mean end-to-end workflow overhead 24,554 ms. Across all three receipts, PSS was observed for 98 completed samples (mean 60,964 KB), and wall-clock overhead for 101 (mean 24,834 ms). These are engineering measurements of the test workflow, not application performance benchmarks.

Across all receipts, the OEM runtime-permission UI was observed but not granted for 48 package runs, was not observed for 155, and was unavailable for the 30 failed runs. A catalog-bound observer separately dismissed 31 exact notification prompts by selecting only the denial control, never a grant control. This is evidence that the runner preserved a dynamic-permission prompt boundary during the authorised workflow; it does not prove that a permission was requested, granted, or used by every application.

## Static review signals and robustness boundary

`dex-manifest-census-148.json` and `dex-manifest-census-verified-stage3.json` retain the earlier 148- and 298-APK snapshots. The final `dex-manifest-census-verified-final-495.json` snapshot scanned 495/495 signed, verified APKs with zero static failures. It found 54 declared multi-process cases, 74 sensitive-permission-plus-background-execution review signals, and 74 sensitive-permission-plus-network review signals. These are review prompts, not proof that a flow executed, that a controller collected data, or that the GDPR was breached.

The formal information-flow model is tested separately with adversarial fixtures for obfuscated node identifiers, reflection edges, dynamic runtime-permission evidence, and Binder/Worker cross-process paths. The fixture oracle produces TP=3, FP=0, TN=1, FN=0, precision=1.0000, recall=1.0000, and F1=1.0000 only for that controlled semantic conformance suite. It is not a field estimate.

For the open-source store corpus there is no independent, application-level legal ground truth. Consequently TP, FP, TN, FN, precision, recall, and F1 are `NOT_COMPUTABLE_WITHOUT_INDEPENDENT_GROUND_TRUTH`. Static FlowDroid/DroidBench receipts are retained as a baseline execution record under `testing-report/droidbench-2026-08-22` and `testing-report/academic-baseline-2026-08-22`; they are not converted into legal violations or used to claim an unsupported tool advantage.
