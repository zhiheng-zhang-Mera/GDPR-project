# Privacy Lens Thesis Artifact

## Canonical reproduction command

From a fresh checkout of branch `8-24`:

```powershell
npm ci
npm run reproduce:thesis-core
```

This is the only canonical core entry point. It compiles and runs the semantic suites; checks accessibility-source, release-privacy, experiment, TypeScript, lint, and delivery contracts; verifies the nine formal safety properties and curated mutants; validates the mapping-review packet; regenerates corpus/device/FlowDroid summaries and LaTeX result macros; verifies the thesis evidence manifest and claim boundaries; and checks TeX inputs, labels, references, citations, bibliography keys, stale markers, figure paths, and duplicate long paragraphs.

Expected terminal summaries include `Safety properties verified: 9 properties, 9/9 curated mutants detected`, `Thesis results verified: F-Droid N=495, device N=233, PSS N=98`, `Thesis evidence verified`, and `Thesis references verified`. A successful run must leave tracked generated files unchanged.

## Reproducible claims

The public artifact reproduces software-semantic conformance, curated mutation detection, regulation-pack isolation, typed-policy output restrictions, accessibility source contracts, evidence-manifest hashes, committed aggregate summaries, FlowDroid receipt interpretation, and thesis reference integrity. It can verify that a completed FlowDroid invocation without XML remains missing evidence.

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

The machine-readable authority is `docs/research/thesis-evidence-manifest.json`. It pins the F-Droid census, device aggregate, and FlowDroid receipt by SHA-256. `docs/research/release-identity.json` records package, branch, source baseline, and Android version metadata. `output/thesis-results/` is generated from committed summaries; `Thesis/Final/generated-results.tex` is generated from the evidence manifest.

Hardware evidence is retained under `testing-report/` with denominators, failures, UI trees, screenshots, and explicit limitations. CI verifies these committed receipts and transformations but does not pretend to rerun the hardware study.

## External and restricted artifacts

APK and AAB binaries are intentionally excluded from Git. The F-Droid corpus APKs and any commercial APK records are not redistributed. The FlowDroid JAR, Android SDK platforms, Java runtime, Node/npm distributions, and device firmware are external dependencies governed by their own licences. No top-level repository redistribution licence was found during this freeze, so the artifact must not be assumed to grant rights beyond inspection and the rights attached to each dependency or source.

Production signing keys, Play Console declarations, public policy/support endpoints, independent reviewer records, AndroZoo credentials and packages, and participant data are unavailable. Their absence is a release or study boundary, not a negative result.
