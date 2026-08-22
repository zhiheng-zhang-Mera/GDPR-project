# Verified open-source app-store experiment — 2026-08-22

## Scope and provenance

This folder contains sanitised reproducibility reports for the authorised Android installation experiment. The corpus comes from the official F-Droid repository and is therefore labelled `OPEN_SOURCE_APP_STORE`. It must not be described as a closed-source or commercial-app-store corpus. The tracked catalog records the F-Droid index and signer-index hashes; APK binaries, device UI trees, logs, account data, and Android build outputs are deliberately excluded from version control.

`fdroid-catalog-248-verified.json` contains 248 APK entries whose content SHA-256 and signing-certificate SHA-256 were both verified. Two catalog entries were rejected because their certificates did not match the signer index: `de.schildbach.wallet` and `me.hackerchick.catima`.

## Authorised device execution

`device-batch-aggregate.json` aggregates two non-overlapping execution receipts by receipt SHA-256. It reports 121 unique package identities: 112 install-launch-uninstall cycles completed with uninstall verification, 9 failures, and zero removal failures. Eight failures were installer timeouts and one was a pre-existing-package protection; a protected pre-existing package is never overwritten or uninstalled by the runner.

The initial 110-entry batch produced 102 verified removals. A 138-entry follow-up catalog reserved all 110 original package identities, then used an explicit `MAX_SUCCESSES_REACHED` bound to collect ten additional non-overlapping samples. The follow-up has 10/10 usable post-launch memory readings, with mean PSS 61,060 KB, and mean end-to-end wall-clock overhead of 27,386 ms. These are engineering measurements of the test workflow, not application performance benchmarks.

Across both receipts, the OEM runtime-permission UI was observed but not granted for 40 package runs, was not observed for 72, and was unavailable for the 9 failed runs. This is evidence that the runner preserved a dynamic-permission prompt boundary during the authorised workflow; it does not prove that a permission was requested, granted, or used by every application.

## Static review signals and robustness boundary

`dex-manifest-census-148.json` and `dex-manifest-census-verified-stage3.json` retain the earlier 148- and 298-APK snapshots. The final `dex-manifest-census-verified-final-495.json` snapshot scanned 495/495 signed, verified APKs with zero static failures. It found 54 declared multi-process cases, 74 sensitive-permission-plus-background-execution review signals, and 74 sensitive-permission-plus-network review signals. These are review prompts, not proof that a flow executed, that a controller collected data, or that the GDPR was breached.

The formal information-flow model is tested separately with adversarial fixtures for obfuscated node identifiers, reflection edges, dynamic runtime-permission evidence, and Binder/Worker cross-process paths. The fixture oracle produces TP=3, FP=0, TN=1, FN=0, precision=1.0000, recall=1.0000, and F1=1.0000 only for that controlled semantic conformance suite. It is not a field estimate.

For the open-source store corpus there is no independent, application-level legal ground truth. Consequently TP, FP, TN, FN, precision, recall, and F1 are `NOT_COMPUTABLE_WITHOUT_INDEPENDENT_GROUND_TRUTH`. Static FlowDroid/DroidBench receipts are retained as a baseline execution record under `testing-report/droidbench-2026-08-22` and `testing-report/academic-baseline-2026-08-22`; they are not converted into legal violations or used to claim an unsupported tool advantage.
