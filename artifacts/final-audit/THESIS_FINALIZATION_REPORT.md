# Thesis finalisation report — Alien host

Independent second-host submission-readiness and cross-host reproducibility
closure for the Privacy Lens GDPR/privacy thesis artifact.

## A. Final status

**`SUBMISSION_READY_WITH_MINOR_MANUAL_ITEMS`**

Every claim the thesis makes is supported by a real, re-runnable artifact on a
clean second host, every published number reproduces exactly or is honestly
classified as historical, and the canonical reproduction command is green with a
clean tree. One tracked deliverable — the rendered thesis PDF — is stale
relative to its own source because this host cannot drive the LaTeX package
installer, and closing it needs a working TeX distribution rather than a
judgement call.

The gate was not lowered to reach this verdict. The starting commit **failed**
the canonical reproduction command on this host, and the failure was fixed
rather than waived.

## B. Git state

| Field | Value |
|---|---|
| Repository | `https://github.com/zhiheng-zhang-Mera/GDPR-project.git` |
| Working branch | `dev/thesis-finalization-alien` |
| Starting SHA | `acffee1e29f1d450aeaa92113cda59cfd309417e` (branch `9-8-Finalize`) |
| Final SHA | `45c4d8b` (see the push record at the end of this section for the exact tip) |
| Remote SHA | pushed to `origin/dev/thesis-finalization-alien` |
| Working tree | clean |
| History | preserved; no rebase, no force-push, no amendment of published commits |
| Merge to main | not performed — no owner policy permits automatic promotion |

Six commits, each a logical unit:

| Commit | Kind | Subject |
|---|---|---|
| `06c1944` | fix | make thesis-core reproduction host-independent |
| `e2ae8b7` | test | bring the high-volume temporal stress campaign in-repo |
| `cacccfa` | test | cover the native bridge mapping on the JVM and pin thesis numbers |
| `6a4c8a5` | test | make the curated mutation score executable |
| `e9826b4` | chore | remove machine-specific SDK paths, document reproduction, split CI |
| `45c4d8b` | fix | close verification gaps found by an independent audit |

## C. Work completed

### Bugs fixed

| # | Defect | Impact | Fix |
|---|---|---|---|
| 1 | No `.gitattributes`, so `core.autocrlf=true` rewrote LF→CRLF on checkout and all three hash-pinned evidence receipts reported drift | `reproduce:thesis-core` failed on any text-converting checkout | `* -text`; verified the LF-normalised digest equals the manifest pin exactly |
| 2 | `test:compliance` did not pin `evaluatedAt`; the pack's 2026-09-11 source-review deadline had passed, so the fail-closed gate changed expected statuses | The suite passed on one date and failed on another; a latent time bomb | `evaluatedAt` forwarded through `GDPRComplianceEngine`; suites pin the pack's `lastReviewedAt` |
| 3 | `CLAIM-EVIDENCE-MATRIX.md` cited `src/compliance/evidenceAdmission.ts`, which does not exist | Silent loss of traceability in the governing claim record | Citation corrected; `verify:claim-paths` added |
| 4 | Chapter 5 said a fully contextualised record returns "no technical concern"; the fail-closed legal-review gate returns `INSUFFICIENT_EVIDENCE` | Thesis contradicted its own test suite | Prose corrected and the rationale explained |
| 5 | Chapter 5 reported the dashboard summary as one action + one gap + one no-concern; the fixtures produce one action + two gaps + zero no-concern | Wrong published count | Corrected |
| 6 | Chapter 5 cited a 150,010-assertion stress figure from a driver outside the repository | Cited result was not reproducible by anyone | In-repo campaign replaces it; figure becomes 112,236; original retained only as a superseded historical note |
| 7 | The 9/9 curated mutation score was metadata only | A headline claim rested on a division of two committed integers | `verify:mutation` executes it; the claim is now 9/9 *detected* |
| 8 | P5's 720-permutation loop compared each permutation against the engine's own reference, so it was self-consistent rather than order-invariant | A test that could not detect the property it claimed | Added an independently anchored canonical-ordering assertion; the mutant now dies |
| 9 | Ledger bounds were duplicated as literals in three places | Drift risk between engine and tests | Shared `temporalLedgerLimits.ts` |
| 10 | Seven offline scripts hard-coded the original host's Android SDK path | Non-portable; machine-specific path in live code | `scripts/lib/android-sdk-paths.js` resolves from flag → `ANDROID_HOME` → `ANDROID_SDK_ROOT` → platform default |
| 11 | The published PSS/timing percentiles rested on an unpinned per-sample file and could not be derived from the pinned aggregate | Published statistics had no verifiable genesis | File pinned; `verify-thesis-evidence` recomputes the median and quartiles from it |
| 12 | Device percentile macros were written to a file the thesis never inputs, while the prose hard-coded the same values | Two `generated-results.tex` files, one unused; no single source of truth | Macros keep full precision, are re-exported into the input file, and the prose cites them |
| 13 | `verify:formal-properties` printed "9/9 curated mutants detected" while executing no test | Misleading artifact documentation | Report reworded; it now states it is a structural check and names `verify:mutation` for execution |
| 14 | The 50 ms burst assertion was an absolute wall-clock bound inside a suite that `verify:mutation` runs ten times | A loaded runner would have produced a spurious "mutant detected" | Budget calibrated on the host with a floor and an explicit multiple |
| 15 | `count-thesis-words.ps1` hard-coded one host's TinyTeX path | Threw on any other host | Resolves `texcount` from PATH or the caller |
| 16 | `verify:claim-boundaries` and `verify:claim-paths` did not scan `README.md` or `ARTIFACT.md` | The two documents a reader sees first were unprotected | Both scanners extended; cited paths checked rose from 10 to 62 |

### Tests and verification added

| Addition | What it establishes |
|---|---|
| `tests/runTemporalStressCampaign.ts` | 112,236 assertions: 40,000 oracle-checked multisets, 10,000 restart/resume cases, 20,000 malformed audits, bounded and forged snapshots, plus a non-vacuity guard that fails if any registered rule is never matched |
| `scripts/verify-stress-determinism.js` | Runs the full campaign twice and requires identical deterministic results; writes host-stamped receipts |
| `scripts/verify-mutation-detection.js` | Applies each of the nine registered weakenings in an isolated recompiled tree and requires the compiled suite to fail; aborts on anchor drift, non-unique anchors, or a non-green baseline |
| `android/app/src/test/.../ObservationMapperTest.kt` | 24 host-JVM tests over the native audit-bridge mapping and controlled-fixture validation |
| `tests/runThesisNumberConsistencyTests.js` | Checks thesis prose against pack sources, committed summaries, the pinned manifest, and 24 generated macros; forbids hard-coding a macro-owned value |
| `scripts/verify-claim-paths.js` | Fails when a governing document cites a path that does not exist |
| `tests/pinned-evaluation-date.ts` | One documented deterministic clock for the suites that previously read the wall clock |

### Source changes

- `src/compliance/GDPRComplianceEngine.ts` — forwards `evaluatedAt`.
- `src/compliance/temporalLedgerLimits.ts` — new; shared retention bounds.
- `src/compliance/RulePackComplianceEngine.ts` — reads the shared bounds.
- `android/.../ObservationMapper.kt` — new; pure mapping rules extracted from the bridge module, plus the controlled-fixture validator.
- `android/app/build.gradle` — JUnit test dependencies.
- `scripts/lib/android-sdk-paths.js` — new; portable SDK tool resolution.

### Thesis, README, CI, reproducibility

- `Thesis/Final/chapter-05.tex` — corrected status and summary statements; the stress campaign and executable mutation detection are described accurately, including the corrective history; device statistics now cite generated macros.
- `Thesis/Final/generated-results.tex` — 24 macros, all manifest-derived.
- `docs/research/thesis-evidence-manifest.json` — `stressCampaign` block; `validTimingTelemetryN`; the redacted device samples added as a pinned source.
- `docs/research/schemas/evidence-manifest.schema.json` — schema for the new block.
- `docs/research/CLAIM-EVIDENCE-MATRIX.md` — corrected citation.
- `testing-report/final-thesis-evidence-2026-08-21.md` — status note marking the out-of-repo figure historical and superseded.
- `README.md` — per-command reproduction tables labelled HOST-ONLY / OPTIONAL / ANDROID DEVICE REQUIRED, generated-output provenance, thesis-to-artifact mapping, known limitations, troubleshooting, and a Chinese mirror.
- `ARTIFACT.md` — records the heavier reproduction commands, the executable mutation claim, and the corrected verifier semantics.
- `.github/workflows/continuous-verification.yml` — three jobs: the unchanged core gate, a research-reproduction job (mutation + stress, with receipt upload), and a host-only Android unit-test job. No emulator job.
- `.gitignore` — ignores generated receipt directories.

### Figures and tables

No figure was removed, added, or re-plotted. Every figure and table caption was
checked for a matching `\label`/`\ref` pair (8 cross-references, all resolve),
and `verify:latex` confirms there are no stale markers, missing figure paths, or
duplicate long paragraphs across 11 TeX files. Numeric tables were reconciled to
their artifacts by `test:thesis-numbers`. No chart is generated by a script in
this repository, so there was no source-data→script→figure chain to repair.

## D. Tests

Observed on the Alien host at the final revision. All exit 0.

| Suite | Passed | Failed | Skipped | Notes |
|---|---|---|---|---|
| `test:compliance` (5 runners) | yes | 0 | 0 | seeded corpus, adversarial, governance (1,800 oracle cases), temporal, information flow |
| `test:stress-campaign` (reduced) | 3,262 assertions | 0 | 0 | 0.4 s |
| `test:accessibility` | 5 files / 15 touchables | 0 | 0 | |
| `test:release-privacy` | 38 source files | 0 | 0 | plus the debug-only fixture gate |
| `test:experiments` | 20 check sites | 0 | 0 | 33.9 s |
| `test:thesis-numbers` | 24 macros / 9 properties / 8 refs | 0 | 0 | |
| `test:android-unit` (`:app:testDebugUnitTest`) | 24 | 0 | 0 | 45.9 s; JVM only, no device |
| `verify:delivery` | 36 files / 113 Markdown | 0 | 0 | |
| `verify:formal-properties` | 9 properties | 0 | 0 | structural catalogue check only |
| `verify:mutation` | 9 mutants detected | 0 | 0 | 77.4 s |
| `verify:thesis-evidence` | 12 metrics / 4 pinned sources | 0 | 0 | |
| `verify:claim-boundaries` | narrative + production tokens | 0 | 0 | |
| `verify:claim-paths` | 62 paths / 45 documents | 0 | 0 | |
| `verify:latex` | 11 TeX / 9 labels / 56 citations | 0 | 0 | source quality only |
| `verify:generated-results` | 4 summary files | 0 | 0 | |
| `verify:mapping-review` | 13 items | 0 | 0 | |
| `reproduce:thesis-stress` | 112,236 × 2 runs, identical | 0 | 0 | 26.2 s |
| `reproduce:thesis-core` | full chain | 0 | 0 | 103.5–105.2 s, four consecutive runs |
| `npm run verify` | full chain incl. mutation | 0 | 0 | 181.3 s |

**Skipped tests: none.** Nothing was disabled to reach a green run, and no
assertion was weakened.

Not run, with reasons:

| Not run | Reason |
|---|---|
| Android instrumentation / UI automation | Requires an emulator or device; would not move any claim. See `ANDROID_RUNTIME_JUSTIFICATION.md` |
| Robolectric tests | No Robolectric tests exist; adding the dependency to cover one `BuildConfig.DEBUG` read was not judged worthwhile, and is recorded as a residual gap |
| 233-package device campaign | Requires the handset and non-redistributed corpus APKs |
| FlowDroid invocation | Requires the JAR and restricted APKs |
| LaTeX PDF render | This host's MiKTeX blocks on a package-install prompt. See `ALIEN_CLEAN_BUILD_REPORT.md` §5 |
| GitHub Actions itself | CI YAML is edited but cannot be executed from this host; see item I-2 |

## E. Experiments

| Experiment | Input | Command | Result | Artifact | Reproduced? |
|---|---|---|---|---|---|
| Seeded conformance corpus | fixed LCG seed, 1,000 cases | `npm run test:compliance` | `(TP,TN,FP,FN)=(800,200,0,0)`, P=R=1.0000 | suite output | Yes, exactly |
| 50-round corpus | seed, 50 cases | same | 40 TP / 10 TN | suite output | Yes, exactly |
| Independent-oracle governance | 1,800 generated cases | same | pass | suite output | Yes, exactly |
| Order invariance | 720 permutations of 6 events | same | pass | suite output | Yes, exactly |
| Information-flow fixtures | 4 adversarial typed graphs | same | `(3,0,1,0)`, F1 1.0000 | suite output | Yes, exactly |
| Temporal stress campaign | seed `0x5eed2026` | `npm run reproduce:thesis-stress` | 112,236 assertions, 6/6 rules, 22,246 matches, two runs identical | `artifacts/reproduction/<host>/` | Yes, twice |
| Curated mutation detection | 9 registered weakenings | `npm run verify:mutation` | 9/9 detected, baseline green | `artifacts/mutation/mutation-verification.json` | Yes |
| F-Droid static census | pinned 495-APK census | `npm run verify:thesis-evidence` | 495 / 125 / 74 / 74 / 54 | `output/thesis-results/fdroid-summary.json` | Derived from pinned bytes; crawl not re-run |
| Device campaign aggregate | pinned aggregate + redacted samples | `npm run test:thesis-numbers` | 233 / 203 / 30; PSS 98; timing 101; percentiles recomputed | `output/thesis-results/` | Derived; campaign not re-run |
| FlowDroid interpretation | pinned receipt | `npm run test:experiments` | 0 XML artifacts retained as missing | `output/thesis-results/flowdroid-summary.json` | Adapter yes; invocation no |
| Release build | source at HEAD | `gradlew assembleRelease bundleRelease` | APK 62,969,819 B; AAB 31,811,673 B; 4 m 04 s | `android/app/build/outputs/` | Yes, built from scratch here |
| Packaged permission set | the Alien APK | `aapt2 dump badging` + merged manifest | exactly 4 permissions; no dangerous/Internet/storage; backup off | build output | Yes — independently re-derived |

No result was cherry-picked. The stress campaign was run twice and both runs are
reported; the mutation harness was run six times during development and its
survivors are recorded rather than hidden.

## F. Cross-host reproduction

Detailed in `CROSS_HOST_REPRODUCIBILITY_REPORT.md`. Summary:

**WHAT_REPRODUCED.** Every deterministic semantic result, the full verification
chain, the seeded confusion matrix, the temporal stress campaign, the
information-flow fixture matrix, mutation detection, all receipt-derived census
and device metrics, the published percentiles, the packaged permission set from a
from-scratch release build, and the 24 native JVM tests. The three pinned
evidence files are byte-identical to the committed blobs (git SHA-1 verified),
so the comparison is meaningful.

**WHAT_DIFFERED.** (a) The starting commit failed the canonical command on this
host for two independent reasons — wall-clock coupling and CRLF conversion.
(b) Release binary hashes differ from any other host, which is expected and was
never claimed comparable. (c) The stress campaign's assertion total is 112,236
rather than the cited 150,010, because the original driver was outside the
repository and could not be re-run. (d) The thesis PDF could not be re-rendered.

**WHY.** (a) Both were latent defects, not host quirks: the wall-clock defect
would fire on every host after the pack's review deadline, and the CRLF defect
fires on any checkout that converts line endings. (b) Release builds embed
environment-dependent inputs. (c) The cited figure was not derivable from any
committed artifact. (d) This host's MiKTeX installer blocks on an interactive
prompt.

**WHETHER_DIFFERENCE_MATTERS.** (a) Mattered a great deal and is fixed and
re-verified. (b) Does not matter; no comparison was claimed. (c) Matters, and is
resolved by replacing the citation with the reproducible figure rather than by
adjusting any result — the original is retained as a labelled historical note.
(d) Matters for the deliverable, and is the principal manual item below.

## G. Thesis claim coverage

Full matrix in `CLAIM_EVIDENCE_MATRIX.md` (15 engineering claims, 10 experimental
claims, 8 unsupported-by-design claims).

| Status | Count | Notes |
|---|---|---|
| SUPPORTED | 15 engineering + 8 experimental | Every one traced to a re-runnable test or a hash-pinned receipt |
| PARTIALLY_SUPPORTED | 2 | (i) UI/accessibility claims are supported structurally and by historical device receipts, not by a current runtime or participant check; (ii) the controlled-fixture debug gate is supported by a source contract, not by an executed JVM test |
| UNSUPPORTED | 8 | All are stated as limitations or non-claims in the thesis; none is asserted as established |

Core claims that were previously unsupported and are now supported:

- The mutation score is now *executed* (9/9 detected) rather than declared.
- The high-volume stress claim now cites a reproducible in-repo campaign.
- The published device percentiles now have a pinned, recomputable genesis.
- The packaged-permission claim was re-derived here from an Alien-built APK.

No core claim remains unsupported. The two `PARTIALLY_SUPPORTED` items are
narrower than the claims they back: the thesis already scopes them to
"engineering and structural" evidence and explicitly disclaims runtime and
participant validation.

## H. Android coverage

| Layer | Status |
|---|---|
| HOST_TESTED | 24 JUnit tests for the pure audit-bridge mapping and controlled-fixture validation (`:app:testDebugUnitTest`, 45.9 s, no device) |
| HOST_TESTED | Kotlin compilation, debug and release; `assembleRelease` + `bundleRelease` green in 4 m 04 s |
| STATICALLY_VERIFIED | Release merged manifest, source manifest, APK badging, and the `BuildConfig.DEBUG` contract check; permission set independently re-derived on this host |
| ROBOLECTRIC_TESTED | **No.** No Robolectric tests exist. Adding it was judged not worthwhile for one generated-field read; recorded as a residual gap |
| HISTORICAL_DEVICE_EVIDENCE | OPPO PERM00 receipts under `testing-report/real-device-*` — install, cold start, three-destination navigation, controlled temporal fixture, decision pause, accessibility UI trees, bounded crash buffer. Retained as historical; explicitly **not** presented as Alien runs |
| NOT_RUNTIME_VERIFIED (on this host) | WorkManager scheduling and OEM runtime behaviour; `PermissionAuditWorker`/`AuditScheduler` platform calls; TalkBack and large-font behaviour |

**No emulator was installed, and none was needed.** The gate requires that a
thesis-core claim lack credible runtime evidence that JVM, Robolectric, existing
device evidence, or static analysis cannot substitute. Every runtime-dependent
claim already has retained physical-device receipts, so the gate was not
satisfied. Full argument in `ANDROID_RUNTIME_JUSTIFICATION.md`.

## I. Remaining manual work

| ID | Item | WHY_MANUAL | IMPACT | EXACT_ACTION | ESTIMATED_IMPORTANCE |
|---|---|---|---|---|---|
| I-1 | Re-render the thesis PDFs | This host's MiKTeX package installer blocks on a dependency prompt with CPU idle and no way to answer it. `pdflatex` compiles a minimal document in 0.5 s but hangs on anything loading `geometry`. Not a code or research decision | **High.** The shipped PDF still contains the retracted 150,010 figure and the pre-correction chapter-5 statements, while the source and everything else are corrected | On a host with a working TeX Live or MiKTeX distribution: `cd Thesis/Final && pdflatex -interaction=nonstopmode main.tex && bibtex main && pdflatex main.tex && pdflatex main.tex`, then copy `Thesis/Final/main.pdf` over `output/pdf/Privacy-Lens-Thesis-Final.pdf` and `release/submission-final/Privacy-Lens-Thesis-Final.pdf`, and regenerate `release/submission-final/SHA256SUMS.txt`. Then commit and confirm `verify:delivery` still passes | Blocker for submission |
| I-2 | Observe CI on a real runner | GitHub Actions cannot be executed from this host. The workflow YAML is edited and locally equivalent commands all pass, but no runner has executed it | Medium. The three CI jobs are unvalidated as CI; a YAML or `setup-android` mistake would only show on push | Push the branch and watch the three jobs. The core job is unchanged from the previously working configuration; the research-reproduction and Android-units jobs are new | High |
| I-3 | Confirm the Docker/self-hosted Node 20 path | The declared engine range is `>=20 <25` and CI targets Node 20, but this host ran Node 24.14.1 only | Low. Every suite passes on 24.14.1, so the range is honest at the top end; the bottom end is untested here | Run `npm ci && npm run reproduce:thesis-core` under Node 20 | Medium |
| I-4 | Decide on the 24 npm advisories | Remediation choices (upgrade vs. accept vs. override) are a maintenance policy decision with no single correct answer, and changing transitive versions could alter resolved behaviour | Low to medium. The app requests no sensitive permission and performs no network I/O, which bounds exposure, but the advisories remain unreviewed | Triage with `npm audit` and either pin safe versions or record an accepted-risk note in `docs/` | Medium |
| I-5 | Independent legal mapping review | Requires a qualified legal reviewer. Structurally unavailable to any automated process; `manifest.independentReview.status` is `NOT_RUN` and the manifest enforces that | High for the legal-validity claim, which the thesis already declares unestablished | Commission the 13-item packet in `experiments/mapping-review/v1/` from an independent qualified reviewer and record agreement statistics | Owner decision |
| I-6 | Participant comprehension and accessibility study | Requires human participants and ethics approval | High for the human-validity claim, already declared unestablished | Execute the preregistered study in `docs/research/decision-pause-preregistration.md` | Owner decision |
| I-7 | Decide whether to add Robolectric for the `BuildConfig.DEBUG` gate | Adds a large test dependency to cover one boolean whose behaviour is already covered by a source contract and a device receipt. The cost/benefit trade-off is a maintainer preference | Low | `testImplementation("org.robolectric:robolectric:4.x")` and a `@RunWith(RobolectricTestRunner::class)` test asserting the release build rejects the controlled fixture | Nice to have |

Items deliberately **not** listed because they are ordinary engineering work
already completed in this branch: any test, script, documentation, CI, cleanup,
number calibration, or reproducibility change described in section C.

## J. Deliverables in this directory

| File | Contents |
|---|---|
| `THESIS_FINALIZATION_REPORT.md` | This report |
| `ENVIRONMENT_BASELINE.md` | Repo provenance and full host/toolchain inventory |
| `PROJECT_FACT_BASELINE.md` | What the project is, its pipelines, inputs, outputs, tests, and claim classes |
| `CLAIM_EVIDENCE_MATRIX.md` | Claim · location · required evidence · actual evidence · reproducible? · status |
| `TEST_GAP_MATRIX.md` | Coverage inventory, gaps found, gaps closed, gaps remaining |
| `ALIEN_CLEAN_BUILD_REPORT.md` | Every command, exit code, duration, and observed result |
| `CROSS_HOST_REPRODUCIBILITY_REPORT.md` | Environment independence, per-result comparison, difference classification |
| `THESIS_RESULT_CONSISTENCY_REPORT.md` | Number calibration, inconsistencies corrected, denominator audit |
| `ANDROID_RUNTIME_JUSTIFICATION.md` | Why no emulator was installed |

## K. Method note

The work followed `DO THE WORK → VERIFY THE WORK → RE-RUN THE WORK → DOCUMENT THE
EVIDENCE`. Three things are worth stating plainly:

1. **The starting commit did not reproduce.** The canonical command failed on a
   clean second host, and the two causes were latent defects rather than host
   quirks. Fixing them was the highest-value output of this exercise, and both
   fixes are verified by re-running the entire pipeline.
2. **An independent audit changed the work.** A reviewer with no prior context
   reproduced every published number exactly and then found ten further defects
   in the verification layer, including a test that could not fail, an unpinned
   source for published statistics, and a verifier whose output overstated what
   it did. All were fixed. The audit is also what established the severity of the
   stale PDF.
3. **Nothing was adjusted to match a prior result.** Where Alien could not
   reproduce something, it is classified as historical or insufficient evidence.
   The one superseded figure was replaced with the reproducible one and the
   original was labelled, not deleted and not matched.
