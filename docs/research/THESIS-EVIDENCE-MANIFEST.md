# Thesis Evidence Manifest

The authoritative numeric source is `thesis-evidence-manifest.json`. `scripts/verify-thesis-evidence.js` checks its release identity, receipt hashes, receipt-derived denominators, and generated LaTeX macros. Run it with `--write` only when intentionally regenerating `Thesis/Final/generated-results.tex`; ordinary verification is read-only and fails when that file is stale.

The frozen source baseline is branch `8-22` at commit `727056c4b29065a4c21ab9bc291c85ca8fa93d5f`; the improvement branch is `8-24`. Release identity is version `1.15.0`, Android version code `16`, package `com.zhihengzhang.privacylens`, min SDK `24`, and target SDK `36`.

The manifest records only observed results that can be traced to committed receipts. Independent review and mutation outcomes remain `NOT_RUN` or `null` until their workstreams produce evidence. A completed FlowDroid invocation without an XML result remains an observed missing artifact, never a zero-flow result.

These counts support reproducible engineering statements about a hash-pinned, purposively selected open-source corpus and bounded device/tool executions. They do not support population prevalence, commercial-app coverage, legal ground truth, GDPR compliance, human comprehension, or cross-device reliability.
