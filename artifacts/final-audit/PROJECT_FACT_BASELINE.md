# Project fact baseline

Recorded on the Alien host from a fresh clone at
`acffee1e29f1d450aeaa92113cda59cfd309417e` (branch `9-8-Finalize`) before any
source modification. This is the factual ground truth the rest of the
finalisation is measured against. See `ENVIRONMENT_BASELINE.md` for host and
toolchain facts.

## 1. What the project is

**Privacy Lens** (`privacy-lens`, version 1.15.0) is an offline, local-first
Android research prototype that turns bounded permission-audit evidence into
human review prompts. It is built on React Native 0.81.5 / Expo 54 with a
TypeScript core and a Kotlin native bridge.

Its governing semantic constraint is that a technical observation must not
acquire legal meaning it does not contain. Nothing in the product may emit
"compliant" or "infringing"; the strongest adversarial output is a review
obligation with explicit missing evidence.

## 2. Core research question

> How can heterogeneous Android privacy evidence be transformed into useful,
> reproducible review prompts while preventing malformed, missing, synthetic, or
> legally incomplete evidence from becoming an unsupported legal conclusion?

Four sub-questions are stated in `Thesis/Final/chapter-01.tex` §Research
Questions:

| RQ | Concern | Evaluated by |
|---|---|---|
| RQ1 | Deterministic admission and fail-closed rejection of malformed, replayed, overlapping, provenance-incompatible evidence | Compliance, adversarial, permutation, restart, and stress suites |
| RQ2 | Representing and presenting provenance, temporal scope, rule identity, and missing context without encoding a verdict | Policy fixtures, presentation contracts, recorded device runs |
| RQ3 | Isolating jurisdiction-dependent logic behind versioned regulation packs while preserving traceability | Pack registry, compiler, cross-pack and historical-identity fixtures |
| RQ4 | Which claims the combined evidence actually supports | Claim–evidence matrix and evidence manifest |

## 3. Implemented components

### TypeScript core (`src/`, 30 tracked files)

| Path | Role |
|---|---|
| `src/compliance/RulePackComplianceEngine.ts` | The evaluator. Validates input, maintains window and temporal history, computes signals, and assembles a typed finding. |
| `src/compliance/GDPRComplianceEngine.ts` | Compatibility entry point that mounts the EU GDPR pack. |
| `src/compliance/TemporalCooccurrenceEngine.ts` | Pure order-agnostic bag-of-events evaluator over regulation-owned temporal profiles. |
| `src/compliance/types.ts` | Admitted input, observation, context, and finding vocabulary. |
| `src/compliance/temporalLedgerLimits.ts` | Published retention bounds shared by the engine and its tests. |
| `src/compliance/ControlledTemporalFixture.ts` | Builds a debug-only fixture from the mounted pack. |
| `src/compliance/DashboardModel.ts` | Status presentation, filtering, and summary projection. |
| `src/compliance/DecisionReadiness.ts` | Decision-pause readiness logic. |
| `src/compliance/Evaluation.ts` | Confusion-matrix metrics. |
| `src/compliance/ViolationSimulator.ts` | Seeded, bounded record generation. |
| `src/compliance/ViolationRepository.ts` | Local finding storage. |
| `src/regulations/registry.ts` | Closed allowlist of loadable packs. |
| `src/regulations/packs/euGdpr.ts` | The evaluated EU GDPR pack. |
| `src/regulations/packs/researchBaseline.ts` | Deliberately non-legal demonstrator pack. |
| `src/regulations/governance.ts` | Pack validation and the fail-closed source/legal review gates. |
| `src/regulations/temporalRuleMapping.ts` | Compiles pack temporal profiles into evaluator rules. |
| `src/regulations/formalPolicy.ts` | Typed formal policy model and evaluation. |
| `src/regulations/informationFlowPolicy.ts` | Typed source-to-sink policy constraints. |
| `src/regulations/attestationCrypto.ts` | Ed25519 attestation signing and verification. |
| `src/regulations/trustAnchors.ts`, `trustStoreEnvelope.ts`, `trustStoreWitness.ts`, `TrustStoreStateRepository.ts` | Trust-store envelope, witness quorum, rollback, and freeze protection. |
| `src/regulations/sourceContent.ts`, `manifests/euGdprSourceContent.ts` | Offline source-byte manifest and verification. |
| `src/context/PrivacyContext.tsx` | Orchestration and local persistence boundary. |
| `src/services/PrivacyBridge.ts` | Native bridge client with fail-closed receipt interpretation. |
| `src/utils/auditLogger.ts` | Local audit logging. |

### Kotlin native layer (`android/`, 60 tracked files, 8 Kotlin sources)

| Path | Role |
|---|---|
| `MainActivity.kt`, `MainApplication.kt` | React Native host |
| `privacy/PrivacyInspectorModule.kt` | Bridge methods: scheduling, audit retrieval, passive event dispatch, controlled fixture |
| `privacy/ObservationMapper.kt` | Pure mapping rules for the passive audit bridge, plus controlled-fixture validation. No Android dependency. |
| `privacy/PermissionAuditWorker.kt` | Read-only AppOps capability audit |
| `privacy/AuditScheduler.kt` | WorkManager scheduling |
| `privacy/SimulatedPermissionEventWorker.kt`, `ViolationSimulatorWorker.kt` | Simulator workers |
| `privacy/PrivacyInspectorPackage.kt` | React package registration |

### Product shell

`app/(tabs)/` holds three destinations (Overview, Findings, Settings);
`components/privacy/` holds shared finding and navigation components;
`constants/` holds theme tokens.

## 4. Key pipelines

### Evidence pipeline

```text
native bridge / imported record / labelled simulator
  -> admission validation            (identifiers, safe integers, window, source, context)
  -> temporal preparation            (replay replacement, non-overlapping history, bounded ledger)
  -> regulation-pack evaluation      (thresholds, burst, cross-window, temporal co-occurrence)
  -> finding construction            (evidence, signals, rationale, missing evidence, caveats, pack identity)
  -> fail-closed governance gates    (source review, source content, legal review, trust store, witness)
  -> local persistence and projection
  -> Overview / Findings / Settings presentation
```

The admission boundary is `parseAudit` in `RulePackComplianceEngine.ts`. The
governance gates are in `governance.ts` and are applied inside
`evaluateSafe`, which is why an unprovisioned legal-review chain turns a
technically clean record into `INSUFFICIENT_EVIDENCE` rather than reassurance.

### Fail-closed governance chain

`assessPackSourceReview` → `assessPackSourceContent` → `assessPackLegalReview` →
`assessWitnessedTrustStoreEnvelope` → rollback/freeze checks. A reassuring
result requires all layers to pass; the repository ships no production trust
root, no qualified legal attestation, and no source bytes, so reassurance is
structurally unavailable. This is by design, not a defect.

### Experiment pipeline

`experiments/` holds corpus definitions and schemas; `scripts/` holds the
runners; `testing-report/` holds receipts. The F-Droid census and the bounded
device campaign are the two external-engineering evidence sets.

## 5. Data inputs

| Input | Location | Redistributed? |
|---|---|---|
| F-Droid static census (495 APKs) | `testing-report/fdroid-open-store-2026-08-22/dex-manifest-census-verified-final-495.json` | No — census only; APKs excluded |
| Device batch aggregate (233 packages) | `testing-report/fdroid-open-store-2026-08-22/device-batch-aggregate-final.json` | Yes — aggregate receipt |
| Device sample metrics | `experiments/thesis-results/device-metrics-redacted.json` | Yes — redacted |
| FlowDroid receipt | `testing-report/academic-baseline-2026-08-22/flowdroid-wps-rerun/flowdroid-receipt.json` | Yes — receipt, no JAR |
| DroidBench ground truth | `experiments/baselines/droidbench-ground-truth.json` | Yes |
| Mapping-review packet | `experiments/mapping-review/v1/mapping-items.csv` | Yes |
| Physical-device UI/log evidence | `testing-report/real-device-*/` | Yes |

The three hash-pinned inputs are declared in
`docs/research/thesis-evidence-manifest.json`.

## 6. Outputs

| Output | Generated by |
|---|---|
| `output/thesis-results/{fdroid,device,flowdroid,missingness}-summary.json` | `scripts/summarize-thesis-results.js` |
| `output/thesis-results/generated-results.tex` | `scripts/summarize-thesis-results.js` |
| `Thesis/Final/generated-results.tex` | `scripts/verify-thesis-evidence.js --write` |
| `release/submission-final/tex/*` | Byte-identical mirror of `Thesis/Final/*` (enforced by `verify-delivery.js`) |
| `output/pdf/Privacy-Lens-Thesis-Final.pdf`, `release/submission-final/Privacy-Lens-Thesis-Final.pdf` | LaTeX render (external toolchain) |
| `artifacts/reproduction/<host>/temporal-stress-*.json` | `npm run reproduce:thesis-stress` (untracked) |
| `artifacts/mutation/mutation-verification.json` | `npm run verify:mutation` (untracked) |

## 7. Existing tests and verification (at clone)

| Suite | Entry | What it establishes |
|---|---|---|
| Compliance (5 TypeScript runners) | `npm run test:compliance` | Admission, adversarial input, temporal/replay/overlap, restart ledger, governance and trust store, 1,800 independent-oracle cases, 720 permutations, information-flow fixtures |
| Temporal stress campaign | `npm run test:stress-campaign` | deterministic high-volume campaign over both packs |
| Accessibility source contracts | `npm run test:accessibility` | accessibility labels/non-colour contracts across app source |
| Release privacy contracts | `npm run test:release-privacy` | no Internet permission, backup disabled, debug-only fixture gate |
| Experiment contracts | `npm run test:experiments` | corpus/catalog/runner/aggregation/FlowDroid scoring contracts |
| Thesis numeric consistency | `npm run test:thesis-numbers` | thesis prose versus packs, receipts, manifest, macros |
| Delivery | `npm run verify:delivery` | required files, version agreement, chapter-split mirror equality |
| Formal properties | `npm run verify:formal-properties` | property catalogue self-consistency |
| Mutation detection | `npm run verify:mutation` | executable mutant detection (9/9) |
| Mapping review | `npm run verify:mapping-review` | 13-item packet integrity |
| Evidence manifest | `npm run verify:thesis-evidence` | pinned hashes, receipt-derived metrics, macro generation |
| Claim boundaries | `npm run verify:claim-boundaries` | no legal-verdict tokens; high-risk prose qualified |
| Claim paths | `npm run verify:claim-paths` | cited repository paths resolve |
| LaTeX quality | `npm run verify:latex` | inputs, labels, refs, citations, stale markers, duplicate paragraphs |
| Android JVM unit tests | `npm run test:android-unit` | native audit-bridge mapping and fixture validation |

There were **no Kotlin JVM tests and no instrumentation tests** at clone.

## 8. CI (at clone)

`.github/workflows/continuous-verification.yml` — a single job on
`ubuntu-latest`: checkout, `actions/setup-node@v5` with Node 20 and npm cache,
`npm ci`, `npm run reproduce:thesis-core`. No Android job, no matrix, no
artifact publication, no separate fast-path.

## 9. Android's role

Android supplies (a) the acquisition boundary, (b) a WorkManager scheduling
path, (c) the debug-only controlled-fixture bridge used to exercise the temporal
engine on a device, and (d) the release packaging that the device receipts
attest. The native layer is deliberately thin: it observes and forwards, and
makes no legal or even threshold decision. All evaluation is in TypeScript, so
the native surface is small and testable.

## 10. Claim classification

**Engineering-implementation claims** (verifiable from source):
fail-closed admission; deterministic threshold and burst semantics;
order-agnostic temporal evaluation; replay replacement and overlap
non-amplification; pack isolation and historical identity; typed policy output
restriction; accessibility source contracts; no sensitive runtime permission in
the evaluated build; backup disabled.

**Experimental-result claims** (verifiable from receipts, not re-runnable here):
1,000-case seeded conformance with `(TP,TN,FP,FN)=(800,200,0,0)`; the 495-APK
F-Droid static census; 233 bounded device workflows with 203 completed and 30
retained failures; PSS observed for 98 of 203 completions; one FlowDroid receipt
with zero XML artifacts; nine formal properties with nine curated mutants.

**Qualitative / discussion claims** (not empirically established):
usability and trust; participant comprehension; accessibility conformance;
legal validity of any mapping; multi-OEM behaviour; production readiness; store
acceptance. Chapter 6 states each of these as a limitation.

## 11. Baseline reproduction result

Running the documented canonical command on this fresh clone **failed** at the
first suite, before any Alien modification:

```text
$ npm ci                       -> exit 0, 971 packages
$ npm run reproduce:thesis-core -> exit 1 (test:compliance)
Error: Processing after withdrawal under consent must be escalated without
declaring an infringement.
```

Two independent causes were identified and are documented in
`CROSS_HOST_REPRODUCIBILITY_REPORT.md`. This is the single most important
baseline fact: the artifact did not reproduce on a clean second host at its
starting commit, and the failure was environmental rather than a research
result.
