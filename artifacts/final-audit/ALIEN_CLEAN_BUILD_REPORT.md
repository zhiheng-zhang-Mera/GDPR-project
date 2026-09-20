# Alien clean build report

All commands were run on the Alien host from `D:\GDPR-closure\repo`, a fresh
clone of branch `9-8-Finalize`, with `node_modules` installed by `npm ci` from
the committed lockfile. No cache, build output, or artifact was carried over
from the original development host.

Working tree state after every command in the table below: **clean**. The
generated outputs written by the reproduction path re-serialise byte-identically,
which is the reproducibility property `ARTIFACT.md` requires.

## 1. Install

| Command | Exit | Duration | Result |
|---|---|---|---|
| `npm ci` | 0 | 25.5 s | 971 packages installed, 972 audited, from `package-lock.json` |

`npm ci` reported 24 advisories (14 moderate, 10 high) in transitive
dependencies. They are recorded as dependency-maintenance debt, not silently
suppressed. The evaluated build requests no sensitive runtime permission and
performs no network I/O, which bounds the practical exposure of most of these
advisories; no advisory was worked around by editing the lockfile.

## 2. Verification command matrix

Run after the finalisation changes, in one pass:

| # | Command | Exit | Duration | Observed summary |
|---|---|---|---|---|
| 1 | `npm ci` | 0 | 25.5 s | clean install from lockfile |
| 2 | `npm run typecheck` | 0 | 5.3 s | `tsc --noEmit` clean |
| 3 | `npm run lint` | 0 | 9.0 s | `expo lint` clean |
| 4 | `npm run test:compliance` | 0 | 10.4 s | 5 runners: seeded corpus, adversarial, governance (1,800 cases), temporal, information flow |
| 5 | `npm run test:stress-campaign` | 0 | 6.0 s | 3,262 assertions over the reduced campaign |
| 6 | `npm run test:accessibility` | 0 | 3.1 s | 5 files, 15 interactive touchables |
| 7 | `npm run test:release-privacy` | 0 | 4.0 s | 37 source files + debug-only fixture gate |
| 8 | `npm run test:experiments` | 0 | 33.9 s | corpus, runner, aggregation, FlowDroid scoring contracts |
| 9 | `npm run test:thesis-numbers` | 0 | 3.1 s | 24 macros, 9 properties, 8 cross-references |
| 10 | `npm run verify:delivery` | 0 | 3.3 s | 36 files, 113 Markdown files, version 1.15.0 |
| 11 | `npm run verify:formal-properties` | 0 | 3.1 s | 9 properties, 9/9 mutants |
| 12 | `npm run verify:thesis-evidence` | 0 | 3.1 s | 12 metrics, 4 pinned sources |
| 13 | `npm run verify:claim-boundaries` | 0 | 3.1 s | no legal-verdict tokens; high-risk prose qualified |
| 14 | `npm run verify:claim-paths` | 0 | 3.2 s | 61 cited paths across 45 documents |
| 15 | `npm run verify:latex` | 0 | 4.1 s | 11 TeX files, 9 labels, 56 citations |
| 16 | `npm run verify:generated-results` | 0 | 3.1 s | F-Droid N=495, device N=233, PSS N=98 |
| 17 | `npm run verify:mapping-review` | 0 | 3.1 s | 13 atomic items |
| 18 | `npm run verify:mutation` | 0 | 77.4 s | baseline green, 9/9 mutants detected |
| 19 | `npm run reproduce:thesis-stress` | 0 | 26.2 s | 112,236 assertions, two runs identical |
| 20 | `npm run verify:pdf` | 0 | ~1 s | both shipped PDFs: 22 required fragments present, 6 retracted fragments absent |
| 21 | `npm run verify:submission-manifest` | 0 | ~1 s | 17 checksums, PDF digest, 85 pages |
| 22 | `npm run reproduce:thesis-pdf` | 0 | 9.7 s | render byte-identical to the published PDF |

Total: 22 commands, all exit 0, no failures, no skips.

### Canonical entry point

| Command | Exit | Duration |
|---|---|---|
| `npm run reproduce:thesis-core` | 0 | 103.5–110.4 s (five runs) |

`reproduce:thesis-core` now also runs the PDF prose check and the submission
manifest check, so a stale PDF or a stale checksum list fails the canonical
command rather than passing silently.

This is the command the CI workflow invokes. It was also run three times
consecutively to confirm determinism: identical output, identical exit code, and
no residual diff in tracked generated files.

## 3. Android build

| Command | Exit | Duration | Result |
|---|---|---|---|
| `gradlew --version` | 0 | 2.1 s | wrapper 8.14.3, JVM 21.0.12 |
| `gradlew :app:testDebugUnitTest` | 0 | 45.9 s | 24 tests, 0 failures, 0 errors, 0 skipped |
| `gradlew :app:assembleRelease :app:bundleRelease` | 0 | 4 m 04 s | 329 tasks (302 executed, 27 up-to-date) |

### Produced artifacts

| Artifact | Size | SHA-256 |
|---|---|---|
| `app-release.apk` | 62,969,819 B | `ec74f7df4832a00a830e0902790c46b258e0e51a7653411e7e46b4c59728ad14` |
| `app-release.aab` | 31,811,673 B | `d9b3d31c47e2eb54e24588f8ae9173d93d4c2f9c271c422ef16152f4de7e4cc6` |

These are **Alien-built** artifacts and are deliberately not compared with the
original host's binary hashes: release builds embed environment-dependent inputs
(paths, toolchain metadata) and the original hashes are not republished in the
repository. The APK and AAB are gitignored by policy.

### Independent verification of the packaged permission claim

The thesis claims the evaluated build requests wake lock, boot rescheduling,
foreground service, and an application-scoped dynamic-receiver signature
permission, and that Internet, network-state, and legacy external-storage
declarations are absent. This was re-derived on this host from the Alien-built
artifacts, not read from the thesis:

`aapt2 dump badging` on the Alien APK reported `com.zhihengzhang.privacylens`,
versionCode 16, versionName 1.15.0, compileSdk 36, targetSdk 36, and exactly four
`uses-permission` entries — `WAKE_LOCK`, `RECEIVE_BOOT_COMPLETED`,
`FOREGROUND_SERVICE`, and `com.zhihengzhang.privacylens.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`.

The merged release manifest and the source manifest agree with that set, and
`INTERNET`, `ACCESS_NETWORK_STATE`, `READ_EXTERNAL_STORAGE`,
`WRITE_EXTERNAL_STORAGE`, `ACCESS_FINE_LOCATION`, `RECORD_AUDIO`,
`READ_CONTACTS`, and `CAMERA` are all absent. `android:allowBackup="false"` is
present in the application element. **The packaged-permission claim is therefore
independently reproduced on the second host from a from-scratch build.**

## 4. Build warnings retained

| Warning | Source | Assessment |
|---|---|---|
| Gradle 9 deprecations | Gradle 8.14.3 plugin usage | Maintenance debt; recorded, not suppressed |
| JVM metaspace exhaustion warning | `org.gradle.jvmargs` sets 2 GiB heap / 512 MiB metaspace | The build succeeded; increasing metaspace is a reasonable follow-up |
| Kotlin deprecation warnings | React Native and Expo modules, `PhoneStateListener`-adjacent APIs | Third-party and platform deprecations, not project defects |
| 24 npm advisories | transitive dependencies | Dependency-maintenance debt; bounded by the app's permission and network posture |

None of these prevented a successful build, and none is hidden.

## 5. Could not be run on this host

### LaTeX PDF render

`verify:latex` passes (source quality: inputs, labels, references, citations,
bibliography keys, stale markers, figure paths, duplicate paragraphs). It states
explicitly that PDF compilation is a separate rendered-artifact check.

An attempt was made to perform that render with the host's MiKTeX installation:

| Command | Result |
|---|---|
| `pdflatex min.tex` (minimal document) | **exit 0 in 0.5 s** — the LaTeX engine itself works |
| `pdflatex` on a document loading `geometry` | **hangs indefinitely** |
| `pdflatex main.tex` (thesis) | **hangs indefinitely**, three attempts, killed after 15+ minutes each |

Diagnosis: MiKTeX's package manager reports unresolved dependencies
(`ms`, `showframe`, `sttools`, `thailatex`, `luxi` and the transitive needs of
`geometry`) and then blocks while trying to obtain them, with CPU idle and no
download activity logged. No interactive prompt is available to answer, so the
install cannot complete. Setting `MIKTEX_AUTOINSTALL=no` did not change the
behaviour, and `mpm`/`miktex packages install` could not resolve the names.

**Resolution.** The failure was specific to MiKTeX, not to this host. A complete
TeX Live 2026 distribution was already installed as TinyTeX at
`D:\Tools\TinyTeX\TinyTeX`, and it carried every package the preamble needs.
The thesis now renders in about eight seconds:

| Command | Result |
|---|---|
| `pdflatex` via TinyTeX (4 passes with `bibtex`) | **exit 0**, 85 pages, 579,798 bytes |
| Rebuild with `SOURCE_DATE_EPOCH` pinned | **byte-identical** across consecutive runs (sha256 `a49ea44a6957b4e3…`) |

The published PDFs were replaced with the fresh render, `SHA256SUMS.txt` was
regenerated, and two guards were added so this cannot drift again silently:
`npm run verify:pdf` extracts both PDFs' prose and fails on a missing corrected
claim or a reappearing retracted figure, and it runs inside
`reproduce:thesis-core`. `npm run reproduce:thesis-pdf` re-renders on demand.

`reproduce:thesis-pdf` locates TeX from `PDFLATEX_BIN`, `TINYTEX_ROOT`, a set of
conventional install paths, or `PATH`, and reports a clear skip rather than a
failure when no TeX installation exists — so a runner without LaTeX still passes
the content checks against the committed PDF.

## 6. Reproducibility observations

- **Byte-stable generated output.** `npm run reproduce:thesis-core` runs
  `summarize-thesis-results.js --write` and `verify-thesis-evidence.js --write`
  and then re-verifies. After four consecutive runs the working tree was clean
  each time, so the generated summaries and macros are a deterministic function
  of the committed receipts.
- **No hidden local state.** `npm ci` from the lockfile, a fresh Gradle
  dependency resolution, and no copied cache were sufficient for every command.
- **Node version.** The declared engine range is `>=20 <25`; this host ran
  v24.14.1 and CI is expected to run Node 20. Every suite passed on 24.14.1, so
  the range is honest on the upper bound, but CI has not been observed on this
  host's Node version.
