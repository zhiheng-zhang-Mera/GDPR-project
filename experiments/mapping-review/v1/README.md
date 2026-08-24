# Independent Mapping Review v1

This packet freezes every current EU GDPR threshold rule, temporal profile, formal-policy constraint, and information-flow constraint as 13 atomic items. Generate or verify it only after compiling the compliance TypeScript: `node scripts/generate-mapping-review.js --write` or `node scripts/generate-mapping-review.js`.

Use at least two reviewers independent of implementation. Reviewers must not inspect final tool outputs before rating the frozen items. One reviewer should cover privacy/data-protection interpretation and one security/software-analysis semantics where possible. If reviewers lack qualified legal status, describe the activity only as an independent blinded mapping review—not legal validation, legal attestation, or certification.

Each reviewer independently records `SUPPORTED`, `PARTIAL`, `UNSUPPORTED`, or `NOT_QUALIFIED`, severity, rationale, and proposed revision. Do not alter mapping items after ratings begin. Adjudication must preserve the original ratings, name every revision, and leave no unresolved critical unsupported mapping in a final release. Agreement and Cohen's kappa are calculated only from completed compatible ratings; no target value is imposed.

`reviewer-a.json`, `reviewer-b.json`, `adjudication.json`, and `summary.json` are intentionally absent until signed/identified external receipts exist. The thesis evidence manifest therefore remains `NOT_RUN`; templates are not results.
