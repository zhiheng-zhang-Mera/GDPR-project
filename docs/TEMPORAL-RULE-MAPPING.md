# Temporal co-occurrence rule mapping

Privacy Lens 1.15 adds an advisory, order-agnostic temporal detector. It does not intercept, block, revoke, or modify another app's behaviour.

## Module boundary

1. A `RegulationPack` owns `temporalProfiles`: each profile declares its observation combination, per-observation minimum count, rule-specific `windowMs`, legal references, rationale, risk level, and notification priority.
2. `src/regulations/temporalRuleMapping.ts` is the conversion boundary. It validates the active pack fail-closed and compiles its profiles into regulation-labelled detector rules.
3. `src/compliance/TemporalCooccurrenceEngine.ts` is a pure bag-of-events evaluator. It has no GDPR constants, persistence, networking, Android calls, or blocking action.
4. `RulePackComplianceEngine` keeps a bounded in-memory observation ledger per package, applies only the active pack's compiled mappings, and attaches deterministic SHA-256 evidence receipts to advisory findings.
5. Native observations remain behind `PrivacyBridge`. The bridge labels observation type, channel, destination, timestamp, count, and provenance; unsupported types and invalid time/count data are rejected.

Switching from `EU_GDPR` to another installed pack replaces the temporal mapping for new reviews. Existing stored findings retain the regulation and pack version that produced them.

## Adding a mapping

Add a profile to the relevant regulation pack rather than editing the detector. A profile must have a stable uppercase ID, a positive rule-owned window of at most 30 days, one or more unique supported observation requirements with positive counts, and reviewed non-empty references and rationale. Increment the pack version and complete the existing source/legal governance process when the legal mapping changes.

The 30-day ceiling is a resource-safety bound, not a universal detection window. Every effective detection window remains profile-specific.

## Evidence and claim boundary

The evaluator sorts observations before aggregation, so order does not affect the result or receipt. It filters events to `[evaluation time - rule window, evaluation time]`, counts each required type, and emits a match only when every requirement is met. The result is a technical prompt for contextual review, not proof of GDPR infringement, developer intent, server-side processing, or completeness of Android AppOps evidence.

Synthetic, imported, and native observations remain distinguishable. No temporal event is sent to a server. Dismissing a finding's Decision Pause clears its transient answers immediately under the existing component lifecycle.
