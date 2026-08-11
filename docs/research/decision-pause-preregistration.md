# Decision-pause comprehension study preregistration draft

- Status: **DRAFT — REGISTER BEFORE RECRUITMENT**
- Product contrast: Privacy Lens Revision 25 baseline versus Revision 26 / App 1.14.0
- Evidence boundary: no participant has been recruited and no outcome is reported in this repository.

## Research question and confirmatory hypothesis

Does a non-collecting comprehension check plus a three-item context pause improve a user's ability to distinguish a bounded technical privacy signal from a legal conclusion or an inference about developer intent?

The confirmatory hypothesis is that the decision-pause arm has a higher proportion of participants who select “a technical signal that needs context” after reviewing a standardized finding. The null is zero risk difference. All other outcomes are secondary or exploratory.

Prior usable-security experiments show that interface structure and temporary interruption can change attention to salient risk information, while repeated warnings can produce avoidance or habituation. These studies motivate testing rather than assuming an effect: Bravo-Lillo et al., [DOI 10.1145/2501604.2501610](https://doi.org/10.1145/2501604.2501610); Sunshine et al., [USENIX Security 2009](https://www.usenix.org/conference/usenixsecurity09/technical-sessions/presentation/crying-wolf-empirical-study-ssl-warning). The protocol follows the principle that a preregistration is a time-stamped, read-only plan made before collection or analysis, as described by [OSF Registrations](https://help.osf.io/article/330-welcome-to-registrations).

## Design

- Two-arm, between-subject, 1:1 randomized controlled online study.
- `BASELINE`: the Revision 25 expanded card, including observation, missing evidence, proportionate action, and caveat.
- `DECISION_PAUSE`: the same card plus the Revision 26 understanding question, immediate corrective feedback, and three context checks.
- The scenario, finding status, evidence values, typography, viewport, and task wording are held constant. The displayed package name is fictional.
- Allocation is generated server-side after consent using permuted blocks of undisclosed varying size. Analysis labels remain masked until data-quality decisions are frozen.

## Population, ethics, and consent

Eligible participants are adults aged 18 or older who can read English and use a mobile-width interface. Recruitment must not begin until the responsible institution determines whether ethics approval is required and grants it where applicable. The consent page must state purpose, duration, compensation, foreseeable discomfort, voluntary participation, withdrawal mechanics, data retention, contact details, and complaint route.

No real device, package, AppOps, account, legal matter, or special-category data will be requested. The study deployment must collect only the fields in the data dictionary, use a random study identifier, avoid IP/user-agent retention where operationally possible, and publish a deletion deadline. The App 1.14.0 interaction itself stores and uploads no answers; a separately reviewed research instrument is required for an actual study.

## Sample size and stopping rule

The planning contrast is 0.60 correct in baseline versus 0.75 with the pause. With two-sided alpha 0.05 and 80% power, the normal approximation requires 152 analyzable participants per arm (304 total). Recruit up to 360 to allow approximately 15% preregistered exclusions. Recruitment stops when both arms contain at least 152 eligible complete records or the 360-person cap is reached, whichever occurs first. There is no interim efficacy test, optional stopping, or post-hoc sample-size revision.

## Outcomes

Primary outcome:

- `correct_signal_not_verdict`: 1 only when the participant selects “a technical signal that needs context” on the first scored response; otherwise 0. In the intervention arm, the response is recorded before corrective feedback.

Secondary outcomes:

- `impulsive_action_intent`: 1–7 agreement with changing access or confronting a developer immediately, where lower is better.
- `confidence_correctness`: 0–100 confidence in the interpretation, analysed for calibration by correctness.
- `task_time_ms`: time from fully rendered finding to first scored interpretation.
- `proportionate_next_step`: 1 for seeking neutral context before consequential action, otherwise 0.

Exploratory outcomes are completion of each context check, prior privacy-tool familiarity, and self-reported screen-reader use. They cannot replace the primary test.

## Exclusions fixed before unmasking

Exclude records only for: no consent; age below 18; duplicate random study identifier; missing arm or primary outcome; task time under 3,000 ms; failure of the single scenario-independent attention check; or a recorded technical failure that prevented the stimulus from rendering. Retain slow, incorrect, abandoned-after-primary, and assistive-technology records. Report counts and reasons by arm. Do not exclude based on outcome direction or desired score.

## Confirmatory analysis

Use intention-to-treat among eligible records. Report arm counts, primary proportions with Wilson 95% confidence intervals, the unadjusted risk difference with a 95% Wald interval, and a two-sided two-proportion z-test at alpha 0.05. The claim is supported only if the interval excludes zero in the positive direction. Report effect size and uncertainty even when non-significant. A pre-specified sensitivity analysis uses Fisher's exact test; disagreement is disclosed, not optimized away.

Secondary continuous outcomes are reported as mean, standard deviation, median, and interquartile range by arm; binary secondary outcomes use the same descriptive intervals as the primary outcome. Holm correction applies across the four secondary confirmatory comparisons. Familiarity and assistive-technology interactions are exploratory and labelled as such.

Missing primary data are excluded under the fixed rule and counted. No imputation is used for the primary endpoint. Secondary denominators are shown per outcome. Any deviation, code change after registration, or unplanned analysis must be dated and labelled exploratory.

## Reproducibility and release rule

The offline analyzer is `scripts/analyze-decision-pause-study.js`; its schema is documented in `docs/research/decision-pause-data-dictionary.md`. The committed CSV is synthetic and exists only to exercise the pipeline. Before collection, archive the exact stimuli, analyzer hash, randomization procedure, consent text, ethics determination, and this protocol in a public or embargoed time-stamped registration.

App/论文内部质量评分可以评价“是否准备好开展该研究”，但不得把协议、合成数据或界面选择计为用户理解、焦虑降低、信任校准或真实行为效果。
