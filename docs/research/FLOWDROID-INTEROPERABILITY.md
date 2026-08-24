# FlowDroid Interoperability Boundary

FlowDroid produces potential static source-to-sink paths under a particular version, Android platform set, source/sink definition, timeout, and APK. Privacy Lens consumes emitted XML and converts supported method definitions into a typed graph, then applies regulation-owned review constraints. It is therefore an interoperability layer, not an independent competing detector.

| Evidence | Supports | Cannot establish |
|---|---|---|
| Manifest permission | Declared capability | Runtime use |
| DEX/API reference | Packaged reference | Executed path |
| FlowDroid path | Potential static path under the recorded configuration | Actual transfer, recipient, purpose, or legality |
| Tracker signature | Embedded signature | Effective tracking |
| Authorised runtime trace | Bounded observed execution | General application behaviour |
| Policy prompt | Review obligation and missing context | GDPR violation or compliance |

The adapter records the input XML SHA-256 and, when supplied, the source receipt path and SHA-256. Every typed node retains the FlowDroid method definition and every edge retains `FLOWDROID_POTENTIAL_STATIC_FLOW`. Unsupported sources and sinks remain `unmappedResults`; they are not discarded as negatives.

The terminal taxonomy is preserved. `COMPLETED_WITH_RESULT_ARTIFACT` permits conversion. `COMPLETED_NO_RESULT_ARTIFACT`, timeout, and failure remain missing or failed tool evidence. Invariant: `MISSING_ARTIFACT != NO_TAINT_FOUND`. No Privacy Lens-versus-FlowDroid accuracy, F1, or superiority statement is valid without independent same-task ground truth.
