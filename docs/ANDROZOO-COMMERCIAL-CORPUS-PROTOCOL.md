# AndroZoo Google-Play corpus protocol

This protocol is the lawful acquisition path for the unresolved commercial-app portion of the experiment. It does not authorize store scraping, credential sharing, or redistribution.

AndroZoo's official metadata lists APKs observed in `play.google.com`, and its access conditions require an institution-backed personal API key, research use, and no redistribution. Its metadata does **not** establish that an APK is proprietary, paid, revenue-generating, currently listed, privacy-invasive, or GDPR-noncompliant. Therefore the corpus is named `APP_STORE_COMMERCIAL` only after an accountable operator has reviewed and approved the commercial-app inclusion criterion in an access record.

## Operator inputs (not committed)

1. Obtain AndroZoo access under its published conditions. The API key must be supplied only through `ANDROZOO_API_KEY`; never put it in a catalog, log, Git, or command history.
2. Obtain `latest.csv.gz` under that access and preserve it outside Git.
3. Copy `experiments/android-store-100/androzoo-access-record.template.json` outside Git, complete it with an accountable approver and approval reference, and retain the supporting approval privately.
4. Run `node scripts/build-androzoo-play-catalog.js --metadata <latest.csv.gz> --access-record <approved-record.json> --output <catalog.json> --apk-dir <private-apk-directory> --count 100`.
5. First validate the plan without downloading: `node scripts/download-authorized-androzoo-corpus.js --catalog <catalog.json> --output <validation-receipt.json> --validation-only`. Then, with `ANDROZOO_API_KEY` set only in the process environment, run the same command without `--validation-only` to fetch and hash-verify the APKs.

The builder requires 100--500 unique package names, `play.google.com` market evidence, `vt_detection=0`, verified 64-character content hashes, and a valid access record. It emits no APK and does not claim a legal result. The downloader uses the AndroZoo API key without persisting it, verifies every content hash and manifest package name, and keeps all binaries outside version control before the existing install-launch-uninstall runner may be invoked.

## Scientific gates after acquisition

The approved 100-app catalog must receive independent, application-level labels under a preregistered taxonomy. Privacy Lens, FlowDroid, and every selected baseline must then run on the identical version-pinned APKs with identical timeout/inclusion rules. Report missing outputs and timeouts separately; calculate TP, FP, TN, FN, precision, recall, F1, memory, and elapsed time only from that same labelled corpus. Energy is excluded from the current authorised scope.
