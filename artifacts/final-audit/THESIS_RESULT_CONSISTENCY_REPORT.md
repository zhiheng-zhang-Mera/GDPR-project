# Thesis result consistency report

Scope: `Thesis/Final/` (chapters 1–7, `main.tex`, `formal-evidence-model.tex`)
and the chapter-split mirror in `release/submission-final/tex/`.

Method: every numeric or factual claim was traced to a producing artifact. Where
the artifact is generated, the value is now emitted as a LaTeX macro and checked
by `npm run test:thesis-numbers`, which compares the prose against the pack
sources, the committed summaries, the pinned evidence manifest, and the generated
macro file, and fails if a chapter hard-codes a value that a macro owns.

## 1. Verified consistent (no change required)

### Pack and engine facts stated in chapter 4

| Thesis statement | Implementation | Verdict |
|---|---|---|
| EU baselines 24 / 8 / 4 for location, microphone, contacts | `src/regulations/packs/euGdpr.ts` rules | exact |
| Multiplier 1.5 for every EU rule | same | exact |
| Prompt thresholds 36 / 12 / 6 | `ceil(baseline × 1.5)` | exact |
| Burst limits 12 / 6 / 4 per 60 s | `BURST_LIMIT` in `RulePackComplianceEngine.ts` | exact |
| Research Baseline baselines 36 / 12 / 6 | `src/regulations/packs/researchBaseline.ts` | exact |
| History limit 4,096 entries | `MAX_RETAINED_WINDOW_SUMMARIES` | exact |
| Ledger bound 10,000 entries | `MAX_RESTORED_TEMPORAL_ENTRIES` | exact |
| Android minSdk 24, targetSdk 36, versionCode 16, versionName 1.15.0 | `android/app/build.gradle` | exact |

### Seeded corpus stated in chapters 1 and 5

| Thesis statement | Producing evidence | Verdict |
|---|---|---|
| 1,000 seeded cases | `runComplianceTests.ts` | exact |
| 800 expected signals, 200 controls | same | exact |
| `(TP,TN,FP,FN)=(800,200,0,0)` | same, printed at run time | exact |
| precision and recall 1.0000 | same | exact |

### Device and corpus figures stated in chapters 1, 5, 6, 7 and the abstract

| Thesis statement | Source | Verdict |
|---|---|---|
| F-Droid census 495 APKs | pinned census + manifest | exact |
| 54 multi-process applications | census receipt | exact |
| 74 sensitive-plus-background signals | census receipt | exact |
| 74 sensitive-plus-network signals | census receipt | exact |
| 233 distinct package identities | `device-batch-aggregate-final.json` | exact |
| 203 completed workflows | same | exact |
| 30 retained failures | same | exact |
| 26 installer timeouts, 2 no-launchable-activity, 1 package-manager rejection, 1 pre-existing-package protection | same; 26+2+1+1 = 30 | exact |
| PSS median 53,603.5 KB, IQR 47,884 to 64,831.25 | `device-summary.json` | exact |
| Timing median 23,960.5423 ms, IQR 21,494.4533 to 25,115.4851 ms | same | exact |
| Timing observed for 101 workflows | same | exact |
| Memory unavailable for 105 of 203 | `missingness-summary.json` | exact |
| Timing unavailable for 102 of 203 | same | exact |
| PSS observed for 98 | manifest + summary | exact |
| One FlowDroid receipt, zero XML artifacts | pinned receipt | exact |
| Mapping packet 13 atomic items | `generate-mapping-review.js` | exact |
| Nine safety properties, nine curated mutants | `safety-property-catalog.json` | exact, now executable |

All 17 generated macros agree with the evidence manifest, and the abstract
references the macros rather than literals.

## 2. Inconsistencies found and corrected

### 2.1 Chapter 5 described the wrong status for a fully contextualised record

**Stated:** "A low-count location record with purpose, contract basis, controller
identity, one-day retention, and user-initiated context returns no technical
concern and a silent priority."

**Actual:** the fail-closed governance chain requires a current cryptographically
verified legal-review attestation and verified offline source bytes. The
repository ships neither, so `evaluateSafe` forces `INSUFFICIENT_EVIDENCE` with a
`STANDARD` priority. `runComplianceTests.ts` asserts exactly this.

**Resolution:** chapter 5 now describes the observed behaviour and explains why
it is intended. The thesis was corrected; the engine was not.

### 2.2 Chapter 5 reported the wrong dashboard summary

**Stated:** "Summary totals show one action item, one evidence gap, and one
no-concern result."

**Actual:** the three accountability fixtures project to one action item, two
evidence gaps, and zero no-concern results. Both the insufficient-evidence and
the fully-documented-but-unattested records land in the evidence class.

**Resolution:** corrected to one action, two evidence gaps, zero no-concern.

### 2.3 Chapter 5 cited an unreproducible stress figure

**Stated:** a fixed-seed driver "was executed twice against the compiled
delivered source. Each execution completed 150,010 assertions in approximately
6.7 seconds."

**Problem:** the driver lived at `D:\GDPR\test-files\` outside the repository, so
no reproducer could re-run it, and the figure was not derivable from any
committed artifact.

**Resolution:** the campaign was reimplemented in-repo from the same
specification. The chapter now cites `\StressAssertionsN{}` = 112,236 and the
per-campaign counts, all pinned in `docs/research/thesis-evidence-manifest.json`
and reproduced twice with identical deterministic results. The original external
figure is retained only in `testing-report/final-thesis-evidence-2026-08-21.md`,
with a status note that it is superseded and no longer cited.

The in-repo campaign reports its own measured total. The original figure was
**not** reproduced or matched, and no attempt was made to reach it by inflating
the campaign.

### 2.4 Chapter 5 overstated the mutation evidence

**Stated:** "the curated mutation campaign detected all nine registered
non-equivalent weakenings."

**Problem:** at the time of the claim, nothing applied a mutant. The check
verified only that the catalogue was internally consistent.

**Resolution:** `npm run verify:mutation` now applies each weakening in an
isolated tree and requires detection. The first execution produced 4 survivors;
after correcting two equivalent/wrong-site mutations and strengthening two
suites, the score is a genuine 9/9. Chapter 5 records that corrective history
rather than presenting the score as always having been established.

## 3. Consistency problems found in governing documents

| Document | Problem | Resolution |
|---|---|---|
| `docs/research/CLAIM-EVIDENCE-MATRIX.md` | C-ADM-01 cited `src/compliance/evidenceAdmission.ts`, which does not exist | Citation now points at `tests/runExtendedComplianceTests.ts` and the real admission code in `RulePackComplianceEngine.ts`; `verify:claim-paths` prevents recurrence |
| `testing-report/final-thesis-evidence-2026-08-21.md` | Presented an out-of-repo driver as the supporting evidence | Status note added marking it historical and superseded |

## 4. Denominator and sample-count audit

Every percentage and ratio in the thesis was checked for an explicit
denominator.

| Figure | Denominator | Consistent? |
|---|---|---|
| precision / recall = 1.0000 | 800 positives, 200 controls | yes, stated |
| PSS observed 98 | 203 completed workflows | yes; 105 missing stated |
| Timing observed 101 | 203 completed workflows | yes; 102 missing stated |
| F-Droid rates (125, 74, 74, 54) | 495 APKs | yes |
| Workflow completion (203) | 233 attempted | yes; 30 failures stated |
| Simulator "100 %" precision/recall | the simulator's own labels | yes; repeatedly qualified as not device accuracy |
| FlowDroid fixture `(3,0,1,0)` | 4 fixture graphs | yes; stated as fixture-oracle |

No percentage is presented without its base, and missing telemetry is never
folded into a denominator as zero.

## 5. Abstract, conclusion, and appendix alignment

- The abstract cites `\FDroidCensusN{}`, `\DevicePackagesN{}`,
  `\CompletedWorkflowsN{}`, and `\FailedDeviceWorkflowsN{}` — all generated — and
  states that independent legal review, participant comprehension, multi-OEM
  replication, population accuracy, production signing, and store acceptance
  remain unestablished. No superseded figure appears.
- Chapter 7's conclusions were checked against the corrected chapter 5: the same
  macro-derived counts are used and the same claim boundaries are preserved.
- The appendix material (`formal-evidence-model.tex`) makes no numeric claim that
  conflicts with chapter 5.
- `release/submission-final/tex/*` is byte-identical to `Thesis/Final/*`, enforced
  by `verify-delivery.js`, so the submitted source cannot drift from the checked
  source.

## 6. Residual limitation

The LaTeX PDFs tracked at `output/pdf/Privacy-Lens-Thesis-Final.pdf` and
`release/submission-final/Privacy-Lens-Thesis-Final.pdf` were rendered on the
original host **before** the chapter-5 corrections, and this environment cannot
re-render them (see `ALIEN_CLEAN_BUILD_REPORT.md` §5).

An independent audit confirmed the consequence by inflating the PDF content
stream: the shipped PDF still contains the superseded sentence "a separate
fixed-seed driver was executed twice against the compiled delivered source. Each
execution completed 150,010 assertions in approximately 6.7 seconds", and it does
not contain `112,236`, `verify:mutation`, or either corrected chapter-5
statement. Its PDF metadata records creation on 2026-09-08.

So the PDF is not merely stale in formatting: **it states two claims the
repository has since corrected or retracted** (the 150,010 figure and the
pre-correction mutation claim) and it predates the corrected legal-review-gate
and dashboard-summary statements. This is the largest remaining divergence
between a tracked artifact and its source, and it is the reason the verdict in
`THESIS_FINALIZATION_REPORT.md` is not `SUBMISSION_READY`.

It is disclosed in `README.md` under "Known limitations" and in this report.
`verify:latex` validates source quality and states explicitly that PDF
compilation is a separate rendered-artifact check; `verify-delivery` currently
checks only that the PDF exists. No script in the repository detects stale PDF
content, and adding such a check would require a PDF text extractor that is not a
current dependency.

Everything else in this document was verified against the corrected sources.
