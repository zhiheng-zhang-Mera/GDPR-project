/**
 * Deterministic evaluation clock for ComplianceEngine suites.
 *
 * `RulePackComplianceEngine` defaults `evaluatedAt` to the wall-clock date so
 * that production always fails closed against the current source-review and
 * legal-review state. A test oracle must not inherit that behaviour: otherwise
 * the expected result silently changes the day a recorded source review
 * deadline passes, and the same commit passes on one date and fails on another.
 *
 * The suites that assert engine verdicts therefore pin the date that the
 * recorded pack evidence covers. This value is the pack's own
 * `governance.lastReviewedAt`, which is the date on which the sources below were
 * last checked and is inside every `reviewDueAt` interval of the EU GDPR pack.
 *
 * The pack's review currency is exercised deliberately and separately by
 * `runGovernanceAndPropertyTests.ts`, which asserts that `2026-08-11` is
 * `CURRENT` and `2026-09-12` is `REVIEW_DUE`. Overdue-source fail-closed
 * behaviour is therefore still covered; it is simply no longer an accident of
 * the day the suite runs.
 *
 * Changing this constant requires updating that overdue-review assertion too.
 */
export const PINNED_EVALUATION_DATE = '2026-08-11';
