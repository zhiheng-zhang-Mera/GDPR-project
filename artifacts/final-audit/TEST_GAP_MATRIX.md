# Test gap matrix

Derived from the Alien clone at `acffee1e`, after the finalisation changes
recorded in this directory. Priority applies the project's own rule: a test is
worth adding when it protects a thesis claim, a correctness property, a
regression risk, the evidence pipeline, experiment reproducibility, or a failure
mode — not when it increases a count.

Priority classes:
`CORE_THESIS_REQUIRED` · `IMPORTANT_ENGINEERING` · `NICE_TO_HAVE`

Runtime classes:
`CAN_RUN_HOST_ONLY` · `REQUIRES_ANDROID_RUNTIME` · `REQUIRES_PHYSICAL_DEVICE` ·
`REQUIRES_EMULATOR`

## 1. Coverage inventory

| ID | Suite | Type | Runtime | Assertions / cases | Status |
|---|---|---|---|---|---|
| JS_TS_UNIT, EVIDENCE_PIPELINE | `tests/runComplianceTests.ts` | TypeScript runner over compiled source | HOST | 34 assertion sites; 50-round and 1,000-round seeded corpora | PRESENT |
| JS_TS_UNIT, EVIDENCE_PIPELINE, REGRESSION | `tests/runExtendedComplianceTests.ts` | TypeScript runner | HOST | 31 assertion sites; adversarial input, replay, overlap, pack switch | PRESENT |
| JS_TS_UNIT, RULE_PACK, EVIDENCE_PIPELINE | `tests/runGovernanceAndPropertyTests.ts` | TypeScript runner | HOST | 100 assertion sites; 1,800 independent-oracle cases; trust-store and witness adversarial probes; metamorphic boundaries | PRESENT |
| JS_TS_UNIT, EVIDENCE_PIPELINE, REPRODUCIBILITY | `tests/runTemporalCooccurrenceTests.ts` | TypeScript runner | HOST | 32 assertion sites; 720 permutations; restart ledger; exact boundaries | PRESENT (strengthened) |
| EVIDENCE_PIPELINE, STATIC_ANALYSIS | `tests/runInformationFlowPolicyTests.ts` | TypeScript runner | HOST | 8 assertion sites; adversarial typed-flow fixtures | PRESENT |
| REPRODUCIBILITY, EVIDENCE_PIPELINE | `tests/runTemporalStressCampaign.ts` | TypeScript runner | HOST | 112,236 assertions; 6/6 rules matched; non-vacuity guard | ADDED |
| REPRODUCIBILITY, MUTATION | `scripts/verify-mutation-detection.js` | Node, temp-tree recompile | HOST | 9 mutants, 9 detected | ADDED |
| KOTLIN_JVM_UNIT | `android/app/src/test/.../ObservationMapperTest.kt` | JUnit 4 via `:app:testDebugUnitTest` | HOST | 24 tests | ADDED |
| STATIC_ANALYSIS, EVIDENCE_PIPELINE | `tests/runThesisNumberConsistencyTests.js` | Node | HOST | 8 check groups over 24 macros, 9 properties, 8 cross-refs | ADDED |
| STATIC_ANALYSIS, CORPUS | `scripts/verify-claim-paths.js` | Node | HOST | 180 cited paths across 54 documents | ADDED |
| STATIC_ANALYSIS, BUILD | `scripts/verify-delivery.js` | Node | HOST | 36 required files, 122 Markdown files, chapter-split and ARTIFACT byte equality | PRESENT |
| RULE_PACK, STATIC_ANALYSIS | `scripts/verify-safety-properties.js` | Node | HOST | 9 properties, catalogue consistency, mutant totals | PRESENT |
| RULE_PACK | `scripts/generate-mapping-review.js` | Node | HOST | 13 atomic review items | PRESENT |
| EVIDENCE_PIPELINE, REPRODUCIBILITY | `scripts/verify-thesis-evidence.js` | Node | HOST | 12 receipt-derived metrics, 4 pinned sources, 2 generated macro files | PRESENT (extended) |
| STATIC_ANALYSIS | `scripts/verify-claim-boundaries.js` | Node | HOST | legal-verdict tokens, high-risk prose qualification | PRESENT |
| STATIC_ANALYSIS | `scripts/verify-latex-quality.js` | Node | HOST | 11 TeX files, 9 labels, 56 citations, 86 bibliography entries | PRESENT |
| CORPUS, EVIDENCE_PIPELINE | `scripts/summarize-thesis-results.js` | Node | HOST | 4 generated summary files | PRESENT |
| UI_E2E, STATIC_ANALYSIS | `tests/runAccessibilityContractTests.js` | Node, source inspection | HOST | 5 files, 15 interactive touchables | PRESENT |
| STATIC_ANALYSIS | `tests/runReleasePrivacyContractTests.js` | Node, source + manifest | HOST | 38 source files | PRESENT |
| STATIC_ANALYSIS | `tests/runNativeControlledFixtureContractTests.js` | Node, source | HOST | debug-only gate contract | PRESENT |
| CORPUS, EVIDENCE_PIPELINE | `tests/runExperimentContractTests.js` | Node, script invocation | HOST | 20 check sites; 18 script syntax checks; corpus/runner/aggregation contracts | PRESENT |
| BUILD | `:app:compileDebugKotlin`, `:app:testDebugUnitTest` | Gradle | HOST | 24 tests, 43–46 s | ADDED |
| BUILD | `:app:assembleRelease`, `:app:bundleRelease` | Gradle | HOST | APK 62,969,819 B; AAB 31,811,673 B; 4 m 04 s | VERIFIED |
| LINT, TYPECHECK | `expo lint`, `tsc --noEmit` | Node | HOST | whole-project type check across app, component and library sources | PRESENT |
| FLOWDROID | `scripts/run-flowdroid-baseline.js` and adapters | Node + external JAR | REQUIRES_PHYSICAL_DEVICE / external tool | receipt interpretation only | PARTIAL (by design) |
| ANDROID_INSTRUMENTATION | — | — | REQUIRES_EMULATOR or DEVICE | none | ABSENT (justified) |
| UI_E2E (device) | `scripts/run-real-device-extended-qa.ps1` | PowerShell + ADB | REQUIRES_PHYSICAL_DEVICE | historical receipts retained | HISTORICAL |

## 2. Gaps found and what was done

| Gap | Class | Priority | Action taken |
|---|---|---|---|
| `reproduce:thesis-core` failed on a clean Windows host: `core.autocrlf=true` rewrote evidence bytes so all three pinned hashes drifted | REPRODUCIBILITY | CORE_THESIS_REQUIRED + CAN_RUN_HOST_ONLY | **FIXED** — `.gitattributes` with `* -text` |
| `test:compliance` depended on the wall clock; the pack's 2026-09-11 source-review deadline had passed, so the fail-closed gate changed expected statuses | REPRODUCIBILITY | CORE_THESIS_REQUIRED + CAN_RUN_HOST_ONLY | **FIXED** — pinned evaluation date plus a forwarded `evaluatedAt` |
| The 150,010-assertion stress driver lived outside the repository, so the thesis figure could not be re-run | REPRODUCIBILITY, EVIDENCE_PIPELINE | CORE_THESIS_REQUIRED + CAN_RUN_HOST_ONLY | **FIXED** — `tests/runTemporalStressCampaign.ts` + determinism check + manifest pin |
| The curated 9/9 mutation score was metadata only; nothing applied a mutant | MUTATION | CORE_THESIS_REQUIRED + CAN_RUN_HOST_ONLY | **FIXED** — `scripts/verify-mutation-detection.js` |
| No Kotlin JVM tests existed for the native audit bridge | KOTLIN_JVM_UNIT | CORE_THESIS_REQUIRED + CAN_RUN_HOST_ONLY | **FIXED** — extracted `ObservationMapper` + 24 tests |
| Thesis prose contradicted the tests (legal-review gate, dashboard summary) | EVIDENCE_PIPELINE, STATIC_ANALYSIS | CORE_THESIS_REQUIRED + CAN_RUN_HOST_ONLY | **FIXED** — chapter 5 corrected; `test:thesis-numbers` prevents recurrence |
| `CLAIM-EVIDENCE-MATRIX.md` cited `src/compliance/evidenceAdmission.ts`, which does not exist | EVIDENCE_PIPELINE | IMPORTANT_ENGINEERING + CAN_RUN_HOST_ONLY | **FIXED** — citation corrected; `verify:claim-paths` added |
| P5's 720-permutation loop compared every permutation against a reference computed by the same engine, so it was self-consistent rather than order-invariant | EVIDENCE_PIPELINE | CORE_THESIS_REQUIRED + CAN_RUN_HOST_ONLY | **FIXED** — independently anchored canonical-ordering assertion |
| Ledger bounds were duplicated as literals in three places | REGRESSION | IMPORTANT_ENGINEERING + CAN_RUN_HOST_ONLY | **FIXED** — `temporalLedgerLimits.ts` |

## 3. Remaining gaps

| Gap | Class | Priority | Runtime | Why not closed |
|---|---|---|---|---|
| `BuildConfig.DEBUG` gate on `emitControlledTemporalFixture` is not executed in a JVM test | ROBOLECTRIC | IMPORTANT_ENGINEERING | REQUIRES_ANDROID_RUNTIME (Robolectric) | Reading a generated `BuildConfig` field needs Robolectric plus an Android shim. The gate is covered by a source-level contract check and by release-manifest inspection, and the device receipt confirms debug-only behaviour. Adding Robolectric would add a large unverified dependency to gain coverage of one boolean. |
| `PermissionAuditWorker`, `AuditScheduler`, and the simulator workers have no automated test | ROBOLECTRIC | IMPORTANT_ENGINEERING | REQUIRES_ANDROID_RUNTIME | Their bodies call `AppOpsManager`, `WorkManager`, and `SharedPreferences`. The mapping logic they depend on is now tested; the platform calls themselves have no host substitute. Risk is low because the workers only read state and forward it. |
| No Android instrumentation or UI-automation test | ANDROID_INSTRUMENTATION, UI_E2E | NICE_TO_HAVE | REQUIRES_EMULATOR / DEVICE | An emulator would not move any claim from unsupported to supported. See `ANDROID_RUNTIME_JUSTIFICATION.md`. |
| `parseAudit` Unicode and extreme-input coverage is representative, not exhaustive | JS_TS_UNIT | NICE_TO_HAVE | HOST | The package-name character class is conservative and the existing `__proto__`, empty, over-length, and unsafe-number cases cover the realistic attack shapes. Exhaustive Unicode enumeration would add count without new discrimination. |
| FlowDroid cannot be re-invoked here | FLOWDROID | IMPORTANT_ENGINEERING | external JAR + restricted corpus | The JAR and corpus are not redistributable. The adapter and receipt interpretation are tested; the invocation is not reproducible from this repository by design. |
| Mutation coverage is limited to the 9 curated mutants | MUTATION | NICE_TO_HAVE | HOST | The thesis states this boundary explicitly. Broad mutation generation would need confidence scoring and triage that the current claim does not require. |
| Device campaign and UI session cannot be re-run | CORPUS, UI_E2E | — | REQUIRES_PHYSICAL_DEVICE | Hardware, corpus APKs, and OEM behaviour are outside the repository. Retained as `HISTORICAL_PHYSICAL_DEVICE_EVIDENCE`. |

## 4. Priority-ordered result

Every gap classified `CORE_THESIS_REQUIRED + CAN_RUN_HOST_ONLY` has been
implemented and is green on this host. The remaining gaps are either
`REQUIRES_ANDROID_RUNTIME`, `REQUIRES_EMULATOR`, `REQUIRES_PHYSICAL_DEVICE`, or
depend on restricted external materials — that is, they are blocked by
acquisition authority rather than by effort.

No test was added for the purpose of raising a coverage number. Every added
suite names the claim it protects, and the mutation harness exists specifically
because a suite that is green but cannot fail is worse than no suite.
