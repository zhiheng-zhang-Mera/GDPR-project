# Optional P2 Extension Register

Status date: 2026-08-24. Every item in this register is deferred and outside the thesis-completion critical path. The existing F-Droid corpus provides bounded external engineering validation; none of the extensions below automatically supplies legal ground truth, privacy ground truth, population validity, or a production-readiness claim.

## P2-A: Pre-registered real-app FlowDroid subset

Status: `NOT_RUN`.

Before execution, freeze a 30--50 APK subset from the 495-item hash-pinned F-Droid corpus using a declared sampling rule. Record every APK SHA-256, FlowDroid JAR hash, Android platform, source/sink definition hash, timeout, memory limit, thread count, and tool command. Preserve completion, timeout, failure, and no-artifact states. Do not convert an absent XML artifact into zero flows or a true negative.

Acceptance requires a complete receipt denominator, parser telemetry, retained missingness, and adapter provenance back to each XML and invocation receipt. The result may support interoperability and tool-behaviour statements. It must not report Privacy Lens versus FlowDroid accuracy, F1, superiority, GDPR detection, or legal validity without an independently adjudicated same-corpus oracle.

Stop if the subset, hashes, tool configuration, or source/sink definition changes after seeing outputs; if restricted binaries would be committed; or if failures cannot be distinguished from negative outputs.

## P2-B: AndroZoo commercial-corpus replication

Status: `PENDING_AUTHORISED_INPUTS`.

Execution requires the authorised AndroZoo API key, a provider record, metadata snapshot, approved research purpose, non-redistribution acknowledgement, and a frozen sampling rule. Only hash-pinned records whose commercial-store provenance is supported by the authorised metadata may enter the corpus. F-Droid, convenience-installed applications, and `play.google.com` metadata are not substitutes for this study.

Acceptance requires an immutable catalogue, APK hashes, download and analysis receipts, missingness taxonomy, no APKs in Git, and the same evidence-type boundaries used for F-Droid. The study may extend closed-source/commercial ecological diversity. It still cannot establish legal violation prevalence or classifier accuracy without independent labels.

Stop before download if any authorisation or metadata prerequisite is absent, and stop publication if a binary, key, personal datum, or redistribution-restricted field would be exposed.

## P2-C: Multi-OEM and multi-version replication

Status: `NOT_RUN`.

Freeze a matrix spanning named OEMs, Android versions, application version, build hash, locale, font scale, enabled accessibility service, battery policy, and observation window. Reuse identical UI tasks and evidence contracts. Retain device-specific failures and unavailable platform capabilities rather than averaging them away.

Acceptance requires package/version reconciliation, before/after settings, UI-tree-derived actions, screenshots, crash buffers, cleanup verification, and per-device rather than pooled conclusions. This can support replication statements only for the tested matrix.

Stop if a device cannot be restored to its original settings, if an action could affect user data outside the authorised app scope, or if the task definition changes between devices.

## P2-D: Participant comprehension study

Status: `PENDING_ETHICS_AND_PROTOCOL`.

Do not recruit or collect participant data until an appropriate ethics/HREC determination, consent materials, data-minimisation plan, preregistered tasks, exclusion rules, outcomes, and analysis plan exist. Separate comprehension, calibrated reliance, task success, accessibility experience, preference, and willingness to use; no one-screen inspection substitutes for these outcomes.

Acceptance requires the approved protocol, participant flow, denominators, missing data, instrument wording, analysis code, and adverse-event/privacy handling. Findings support only the recruited population and study context.

Stop if ethics authority, consent, secure storage, withdrawal, accessibility accommodation, or data-destruction procedures are unresolved.

## P2-E: Second reviewed jurisdiction pack

Status: `NOT_RUN`.

Select a jurisdiction only after defining scope, regulated actors, effective date, official sources, exceptions, localisation, reviewer qualifications, update ownership, fixtures, migration, rollback, and deprecation. The generic pack interface is not evidence that another legal regime has been correctly represented.

Acceptance requires independent atomic mapping review, no unresolved critical disagreement, versioned source hashes, executable positive and negative fixtures, and visible jurisdiction caveats. Agreement statistics must be reported as observed and may not be prefilled.

Stop if the pack is produced by relabelling GDPR rules, if official sources cannot be frozen, if reviewers see tool outputs before independent coding, or if `UNSUPPORTED` items are promoted into production mappings.

## Priority after the current freeze

The next necessary external action is completion of the already prepared 13-item independent GDPR mapping review, not any P2 expansion. P2 work should start only when it answers a named validity gap and all prerequisites are satisfied. Feature count and corpus size are not acceptance criteria.
