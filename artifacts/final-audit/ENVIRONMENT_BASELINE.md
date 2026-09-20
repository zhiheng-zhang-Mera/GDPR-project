# Alien host — environment and repository baseline

This file records the exact starting conditions for the independent second-host
finalisation of the Privacy Lens thesis artifact. It was produced before any
source file was modified, from a fresh clone.

## Repository provenance

| Field | Value |
|---|---|
| Repository URL | `https://github.com/zhiheng-zhang-Mera/GDPR-project.git` |
| Clone method | `git clone --no-hardlinks <url> repo` into an empty directory |
| Starting branch | `9-8-Finalize` |
| Starting commit SHA | `acffee1e29f1d450aeaa92113cda59cfd309417e` |
| `origin/9-8-Finalize` at clone time | `acffee1e29f1d450aeaa92113cda59cfd309417e` (identical) |
| `origin/HEAD` | `refs/remotes/origin/9-8-Finalize` |
| Working tree at clone | clean (`git status --short` produced no output) |
| Tracked files | 826 |
| Clone size on disk | 65.4 MB |

Commands executed and their observed output:

```text
$ git status
(no output — clean)

$ git branch --show-current
9-8-Finalize

$ git rev-parse HEAD
acffee1e29f1d450aeaa92113cda59cfd309417e

$ git remote -v
origin  https://github.com/zhiheng-zhang-Mera/GDPR-project.git (fetch)
origin  https://github.com/zhiheng-zhang-Mera/GDPR-project.git (push)
```

## Environment independence

The Alien host is a physically separate machine from the original development
host. No build cache, dependency directory, virtual environment, experiment
output directory, or untracked workspace file was copied between them.

| Independence property | Status |
|---|---|
| Fresh clone into an empty directory | Yes |
| Original host's `node_modules` reused | No — installed by `npm ci` from the committed lockfile |
| Original host's Gradle caches reused | No build output was copied; Gradle resolved the wrapper distribution and dependencies on this host |
| Original host's experiment outputs reused | No — all evidence under `testing-report/` and `experiments/` comes from the clone |
| Untracked files imported | None |
| Results hand-copied to match original figures | None — every number in the reports is produced by commands in the repository |
| Git history rewritten | No — no force-push, no rebase of published history |

The Android SDK installation on this host is an independent installation. The
`ARTIFACT.md` environment-lock table records the original host's SDK directory
(`C:\Users\15601\AppData\Local\Android\Sdk\platforms`) explicitly as receipt
evidence rather than a portable requirement, so a different SDK path is expected
and is not a discrepancy.

## Hardware

| Component | Value |
|---|---|
| Host name | `Mera-Alianware` |
| OS | Microsoft Windows 11 Home (Chinese edition), version 10.0.26200, 64-bit |
| CPU | Intel(R) Core(TM) i7-10700K @ 3.80 GHz, 8 physical / 16 logical cores |
| RAM | 31.76 GiB (34,101,420,032 bytes) |

## Toolchain

| Tool | Version observed on this host | Repository expectation | Match |
|---|---|---|---|
| Git | 2.55.0.windows.3 | not pinned | — |
| Node.js | v24.14.1 | `engines: ">=20 <25"` | yes |
| npm | 11.11.0 | `packageManager: npm@10.8.2`; `package-lock.json` lockfile v3 | minor difference; see note |
| pnpm | not installed | not used | — |
| yarn | not installed | not used | — |
| Java (on `PATH`) | Oracle/HotSpot 17.0.12 LTS | `ARTIFACT.md` records 17.0.12 | yes |
| Java (`JAVA_HOME`) | Microsoft OpenJDK 21.0.12 LTS | Gradle launcher JVM | see note |
| Gradle | wrapper 8.14.3 (resolved by the wrapper, JVM 21.0.12) | wrapper 8.14.3 | yes |
| Android SDK root | `C:\Users\15601\AppData\Local\Android\Sdk` | different path is explicitly allowed | allowed |
| Android platforms | android-35, android-36, android-36.1 | compile/target 36 | yes |
| Build tools | 35.0.0, 36.0.0 | 36 required by the project | yes |
| Android NDK | 27.1.12297006 | Expo 54-compatible NDK | yes |
| `adb` / `sdkmanager` / `emulator` | all present from cmdline-tools `latest` | not required for host-only work | — |
| Python | not installed (only the Windows Store `python.exe` app-alias stub) | only `scripts/generate_brand_assets.py`, which is not on the core path | see note |
| MiKTeX / `pdflatex` | MiKTeX 25.12, pdfTeX 1.40.28, `latexmk`, `xelatex` | LaTeX rendering of the thesis PDF | see note |
| GitHub CLI | 2.96.0 | not required | — |

### Notes on version differences

- **npm 11.11.0 vs `packageManager: npm@10.8.2`.** `npm ci` honoured the
  committed `package-lock.json` (lockfile v3) and completed successfully, so the
  resolved dependency graph is the locked one. The `packageManager` field is a
  declared preference for contributors; it did not change the installed tree.
- **Two JDKs present.** `JAVA_HOME` selects OpenJDK 21, which the Gradle wrapper
  used as its launcher and daemon JVM; `java` on `PATH` reports 17.0.12. The
  Android toolchain accepts both, and both the Kotlin unit test task and the
  release build completed under JVM 21.
- **Python absent.** No core or thesis-critical command requires Python.
  `scripts/generate_brand_assets.py` regenerates brand images and is not part of
  the reproduction or verification path.
- **LaTeX present but unusable in this environment.** `pdflatex` compiles a
  minimal document in 0.5 s, but any document loading `geometry` — and therefore
  the thesis preamble — blocks indefinitely in MiKTeX's package installer while
  resolving missing dependencies, with no interactive prompt available. This is
  recorded as a host limitation in
  `artifacts/final-audit/ALIEN_CLEAN_BUILD_REPORT.md`; it does not affect the
  canonical `npm run reproduce:thesis-core` path, whose `verify:latex` step
  performs source-level quality checks and states explicitly that PDF
  compilation is a separate rendered-artifact check.

## Android policy applied

No Android Studio installation and no emulator or AVD was created or started.
The host already carried a complete Android SDK with the required platform,
build tools, and NDK, so no command-line toolchain installation was needed
either. Host-side JVM tests, Gradle compilation, lint, static analysis, and the
repository's existing physical-device receipts were used instead. The
justification and the alternatives considered are recorded in
`artifacts/final-audit/ANDROID_RUNTIME_JUSTIFICATION.md`.
