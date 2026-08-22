# DroidBench FlowDroid baseline — 2026-08-22

`flowdroid-curated-summary.json` joins a pinned DroidBench revision (`a57fa6f42f278591695672f1aa8b37c275139370`) to seven immutable FlowDroid receipts. Expected source-to-sink outcomes are transcribed from the upstream case descriptions and are public benchmark labels, not GDPR or real-app legal labels.

Only three receipts emitted a FlowDroid XML result and could be scored. They produce TP=2, FP=1, TN=0, FN=0, precision=0.666667, recall=1.000000, and F1=0.800000. Four completed executions emitted no result artifact and are explicitly `unresolved`; they are not silently converted to zero-flow predictions.

This baseline reports FlowDroid alone. Privacy Lens does not yet have an APK-to-typed-flow extractor operating on the same cases, so this evidence cannot establish a comparative advantage, a Privacy Lens accuracy score, or commercial-app/GDPR performance.

The three emitted XML artifacts are also converted under `typed-flow/` into the portable Privacy Lens information-flow graph schema. Two carry a `DEVICE_IDENTIFIER` source to an `SMS` sink; the third carries a `DEVICE_IDENTIFIER` source to a `LOG` sink. `SMS` remains a distinct sink type. This adapter is an interoperability and legal-review-context layer on top of FlowDroid output, not an independent detector or a legal conclusion.
