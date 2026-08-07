# Computer Science Department Review Panel — Round 1

Date: 7 August 2026  
Reviewed baseline: Revision 5 and commit `2b31d17`  
Produced revision: Revision 6 (`main-09.tex` and `chapter-*-6.tex`)

## Shared finding

The prototype has useful deterministic engineering evidence, but the thesis must keep four boundaries visible: controlled labels are not field accuracy; a technical warning is not a GDPR verdict; short-run device observations are not endurance or battery evidence; and Android API availability is not unrestricted cross-application visibility.

## Visual and information-design reviewer

The thesis needs one consistent evidence vocabulary and a compact evidence matrix. In the next round, add a table mapping each claim to implementation status, test layer, artifact, device scope, and limitation. Replace visually dense correction paragraphs with a single revision note per chapter and keep figures/captions close to the evidence they support. PDF layout remains unverified because no LaTeX renderer is installed in the current environment.

## Software engineering reviewer

Revision 6 fixes overlapping-window double counting and unsafe numeric inputs. The next priority is ordering and replay semantics: define how late, duplicate, nested, and out-of-order imported windows affect history. Add bounded history storage and tests for eviction at the 24-hour boundary. Validate the runtime `source` field rather than treating every non-`SIMULATOR` string as imported evidence.

## Literature and argument reviewer

The narrative still carries layers from earlier designs. The next round should remove superseded implementation descriptions rather than repeatedly contradicting them in revision notes. Each empirical sentence should identify its sample, oracle, platform, and inference boundary. Legal propositions should cite primary GDPR text; Android capability claims should cite official platform documentation; market-size material should remain contextual and not motivate technical validity.

## Methods and statistics reviewer

Report the 1,000-case seeded result as rule-conformance evidence. Do not use the same generator and rule-derived oracle to infer independent detection accuracy. Preserve confusion-matrix counts, but add a test taxonomy and state which cases are independent, boundary-constructed, simulator-derived, or device observations. Do not pool heterogeneous layers into a single confidence interval.

## Human-computer interaction reviewer

The warning language is appropriately cautious, but the thesis does not yet demonstrate user comprehension. A next-stage study should pre-register comprehension, calibration, false-assurance, and action-selection outcomes. Until then, notification hierarchy and dashboard accessibility are engineering properties, not evidence of reduced cognitive load.

## Round-2 priorities

1. Validate audit `source`, replay, ordering, overlap, adjacency, and retention boundaries in code.
2. Add a claim-to-evidence matrix to the thesis and reconcile remaining legacy implementation prose.
3. Run structural LaTeX checks locally; compile and visually inspect the PDF when a TeX toolchain is available.
4. Keep physical-device claims limited to the recorded single-device, short-run evidence.
