# Structured Scoping Review Protocol

## Scope and final search date

The review asks how prior Android privacy work represents technical evidence, policy meaning, provenance, missing evidence, and human-facing action. It is a structured scoping review, not a systematic review or meta-analysis. The final search was run on 2026-08-24.

## Search surfaces and strings

Searches covered publisher or author primary sources surfaced through ACM/DOI records, USENIX proceedings, Google Research, Android Developers and Android Help, NIST, project-owned repositories, and backward/forward title searches. Representative query families were:

- `Android static taint analysis privacy FlowDroid TaintDroid`
- `Android tracker signature analysis Exodus methodology`
- `mobile app privacy policy consistency PoliCheck PolicyLint`
- `formal privacy policy contextual integrity mobile applications`
- `Android permissions user attention comprehension runtime dialogs`
- `Android Privacy Dashboard official documentation`
- `privacy engineering risk framework NIST`

Backward searches followed the foundational systems and constructs cited by the selected work. Targeted forward searches used exact titles and tool names to identify later policy-consistency, contextual-notice, and Android-dashboard work. The review did not attempt database-by-database recall measurement, duplicate screening by two reviewers, or a PRISMA flow.

## Inclusion and exclusion

Included sources had to provide at least one of: an implemented Android analysis system; an empirical mobile privacy study; a defined policy or privacy-engineering model; an official Android platform capability; or an authoritative framework directly relevant to claim boundaries. For claims about a system, the system paper, official documentation, or project-owned methodology was preferred. For platform behaviour, Android-owned documentation was preferred. For legal and privacy-engineering propositions, official regulation, regulator, or NIST material was preferred.

Excluded sources were vendor marketing without a technical method, secondary summaries where the primary source was available, unverifiable bibliographic claims, and work whose analytical object could not be distinguished from a legal conclusion. Recency did not displace seminal work when the older source defined a still-relevant technique or human-factor result.

## Coding and interpretation

Each included work was coded for input, output, static/runtime character, policy or legal semantics, treatment of missing evidence, provenance, and human-facing role. `Not evaluated` means the reviewed source did not evaluate that dimension; it does not assert that the system lacks the capability. `Not applicable` means the dimension is outside the source's stated analytical object. Comparability to Privacy Lens is analytical-object comparability, not a quality ranking.

The resulting matrix is in `docs/research/SOTA-MATRIX.md`. Its purpose is to locate the contribution as evidence-bounded, claim-preserving integration between heterogeneous Android evidence and regulation-owned review obligations. It does not support a “first” claim.
