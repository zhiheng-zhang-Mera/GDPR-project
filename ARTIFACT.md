# Privacy Lens Thesis Artifact

## Canonical reproduction command

From the immutable tag `v1.15.0-thesis-final`, or from branch `9-8-Finalize` before the tag is created:

```powershell
npm ci
npm run reproduce:thesis-core
```

This is the only canonical core entry point. It compiles and runs the semantic suites; runs the fixed-seed temporal stress campaign and checks its deterministic totals against the evidence manifest; checks accessibility-source, release-privacy, experiment, TypeScript, lint, and delivery contracts; checks the safety-property catalogue structurally; validates the mapping-review packet; regenerates corpus/device/FlowDroid summaries and LaTeX result macros; recomputes the published device percentiles from the pinned redacted samples; verifies the thesis evidence manifest, thesis numeric consistency, and claim boundaries; checks that every repository path cited by the governing documents exists; and checks TeX inputs, labels, references, citations, bibliography keys, stale markers, figure paths, and duplicate long paragraphs.

Expected terminal summaries include `Safety-property catalogue verified: 9 properties`, `Thesis results verified: F-Droid N=495, device N=233, PSS N=98`, `Thesis evidence verified: 12 receipt-derived metrics, 4 pinned sources`, `Thesis numeric consistency verified`, `Claim-evidence path traceability verified`, and `Thesis references verified`. A successful run must leave tracked generated files unchanged.

Note on `verify:formal-properties`: that command performs a **structural** check of `docs/research/safety-property-catalog.json` — that the catalogue is complete, internally consistent, and that each property names an existing test file containing its evidence marker. It does not execute a property test, and its output says so. The executable form of the curated mutation claim is `npm run verify:mutation` (see below), which is part of `npm run verify` but deliberately kept out of the core path because it recompiles the suite once per mutant.

### Heavier reproduction commands

Two claims are deliberately kept out of the default path because they are slower. Both are first-class reproduction entry points and are exercised by `npm run verify`.

| Command | What it reproduces | Approximate cost |
|---|---|---|
| `npm run reproduce:thesis-stress` | Runs the full fixed-seed temporal stress campaign twice and requires both runs to agree on every deterministic field. Writes host-stamped receipts under `artifacts/reproduction/`. | ~20 s |
| `npm run verify:mutation` | Applies each of the nine registered source weakenings in an isolated temporary tree, recompiles, and requires the compiled compliance suite to detect it. Fails if any mutant survives. Writes `artifacts/mutation/mutation-verification.json`. | ~80 s |
| `npm run test:android-unit` | Runs the 24 host-JVM Kotlin unit tests for the native audit-bridge mapping. Requires the Android SDK and a JDK; no emulator or device. | ~45 s first run |

## Reproducible claims

The public artifact reproduces software-semantic conformance, curated mutation detection, regulation-pack isolation, typed-policy output restrictions, accessibility source contracts, native audit-bridge mapping on the host JVM, evidence-manifest hashes, committed aggregate summaries, FlowDroid receipt interpretation, and thesis reference integrity. It can verify that a completed FlowDroid invocation without XML remains missing evidence.

The curated mutation score is executable rather than declared. `npm run verify:mutation` copies the compilable sources to a temporary tree, applies one declared weakening per registered mutant, recompiles, and requires the compiled suite to fail. Each transformation is anchored to an exact source string and the script fails loudly if an anchor drifts, so a mutant can never be silently skipped. A surviving mutant fails the command.

The high-volume temporal campaign is also in-repo. `npm run reproduce:thesis-stress` runs 40,000 randomised observation multisets against an independent count-and-window oracle, 10,000 partition/export/restore/resume cases, and 20,000 malformed-audit cases, and fails if any registered temporal rule is never matched.

It does not reproduce the 233-package device campaign, the one-device UI session, a fresh FlowDroid invocation, legal mapping review, participant comprehension, multi-OEM behaviour, production signing, store acceptance, population prevalence, or GDPR compliance. Those require hardware, restricted inputs, independent people, external accounts, or authority not supplied by this repository.

## Environment lock

| Component | Frozen or recorded value |
|---|---|
| Node.js | 20.x in CI; package contract `>=20 <25` |
| npm | 10.8.2; `package-lock.json` lockfile version 3 |
| package-lock SHA-256 | `5f7d15f89fcfa95ab326c93a8baa6bb27f0a31bdec9a01fccbe962b629ed69d4` |
| Java | 17.0.12 in the recorded Windows environment |
| Gradle | wrapper 8.14.3 |
| Android SDK | compile/target 36; minimum SDK 24 |
| React Native / Expo | 0.81.5 / 54.0.33 family, resolved by the npm lock |
| FlowDroid | 2.15.1 |
| FlowDroid JAR SHA-256 | `51dadead47a173c494c2fa4855b1e8bd3b54e702a2c4b5ed58e60153009ae218` |
| source/sink definition SHA-256 | `34aec214338de48f51d0289a03aaa2a02a06bab22904f697f2ad9e6864d67a49` |
| recorded Android platform directory | `C:\Users\15601\AppData\Local\Android\Sdk\platforms` |
| core CI OS | GitHub-hosted `ubuntu-latest` |
| device evidence | OPPO PERM00, Android 12 / API 31 |
| device build fingerprint | `OPPO/PERM00/OP4E7F:12/SP1A.210812.016/Q.206711c_1:user/release-keys` |

The machine-specific Android platform path is receipt evidence, not a portable requirement. A reproducer may use another SDK installation path while retaining the required platform version.

## Evidence and hashes

The machine-readable authority is `docs/research/thesis-evidence-manifest.json`. It pins the F-Droid census, the device aggregate, the device redacted per-sample metrics, and the FlowDroid receipt by SHA-256. `docs/research/release-identity.json` records package, branch, source baseline, and Android version metadata. `output/thesis-results/` is generated from committed summaries; `Thesis/Final/generated-results.tex` is generated from the evidence manifest.

The published PSS and timing percentiles are **recomputed from the pinned redacted per-sample file** on every run of `verify:thesis-evidence`, not trusted as prose. That file is a redacted per-sample extract: the upstream raw device receipts it summarises are referenced by SHA-256 but are not redistributed, so the percentiles are reproducible from the committed samples rather than from a re-execution of the campaign.

Hardware evidence is retained under `testing-report/` with denominators, failures, UI trees, screenshots, and explicit limitations. CI verifies these committed receipts and transformations but does not pretend to rerun the hardware study.

## External and restricted artifacts

APK and AAB binaries are intentionally excluded from Git. The F-Droid corpus APKs and any commercial APK records are not redistributed. The FlowDroid JAR, Android SDK platforms, Java runtime, Node/npm distributions, and device firmware are external dependencies governed by their own licences. The repository now carries a conservative all-rights-reserved notice and grants no redistribution permission; third-party and external material remains governed by its own terms.

Production signing keys, Play Console declarations, public policy/support endpoints, independent reviewer records, AndroZoo credentials and packages, and participant data are unavailable. Their absence is a release or study boundary, not a negative result.

Optional post-thesis studies and their authority, acceptance, and stop conditions are preregistered in `docs/research/P2-EXTENSION-REGISTER.md`. Every item remains deferred; the register contains no experimental result.
