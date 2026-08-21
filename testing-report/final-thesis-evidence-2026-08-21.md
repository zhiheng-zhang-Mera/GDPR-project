# Final thesis evidence record — 2026-08-21

## Evidence scope

This record describes the current 8-21 source as tested on 21 August 2026. It separates deterministic engineering evidence from legal, field, and product claims. The accompanying final manuscript is self-contained under `Thesis/Final` and does not rely on this report for interpretation.

## Independent high-volume test

The fixed-seed driver at `D:\GDPR\test-files\run-final-thesis-evidence-stress.js` was executed twice after compiling the current compliance-test source. The script is intentionally outside the repository at the user's direction; no new test script is included in the release tree.

Each execution passed 150,010 assertions in approximately 6.7 seconds:

- 40,000 shuffled-observation tests over the EU GDPR and Global Research Baseline packs, checked against an independent count-based multiset oracle;
- 10,000 random partition, export, restore, and resume cases, requiring the final temporal-evidence receipt to equal uninterrupted evaluation;
- 20,000 malformed-audit cases, requiring fail-closed rejection with byte-for-byte unchanged exported temporal ledger;
- one valid 10,001-entry snapshot, requiring bounded restoration to 10,000 entries; and
- one forged oversized snapshot, requiring rejection.

The independent oracle found the expected `WEARABLE_LOCATION_HEALTH` rule for the GDPR fixture and `RESEARCH_SENSOR_FUSION` for the research fixture. Both repeated executions produced the same logical counts and pass conditions.

## Existing verification retained

The repository compliance, temporal, governance, accessibility, release-privacy, type, lint, and delivery checks passed before this record was added. The retained real-device record confirms one OPPO PERM00 debug build installed and executed the controlled native fixture: the Findings count changed from 15 to 16; the card named `com.zhihengzhang.privacylens.controlled-demo` carried the `Controlled device demo` provenance label; the evidence view displayed the 30-minute order-agnostic temporal combination; and the crash buffer was empty.

## Claim boundary

These results support deterministic rule handling, bounded ledger behaviour, controlled bridge transport, and one rendered on-device workflow. They do not establish observation of another application, real sensor collection, legal compliance, independent legal review, cross-device reliability, population usability, performance on arbitrary workloads, production signing, or store acceptance.
