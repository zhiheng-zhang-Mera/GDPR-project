# Revision 11 multidisciplinary baseline assessment

Date: 2026-08-09

Reference point: RP score 23.5/30 (78.3%).

This is a structured independent-panel simulation, not a mark awarded by the university. The score is intentionally evidence-based: each category is limited by what a third-party examiner can verify in the thesis, repository, generated artefacts, and recorded evaluation.

## Baseline score

| Category | Weight | Revision 11 | Panel rationale |
|---|---:|---:|---|
| Research problem, significance, and originality | 10 | 8.5 | The evidence-to-decision gap and evidence-bounded framing are clear and defensible. The novelty claim needs a sharper comparison against recent Android permission-control research. |
| Literature and theoretical foundations | 15 | 11.0 | Relevant GDPR, privacy, cognitive-load, trust, accessibility, and platform foundations are present, but 17 cited sources across 26,553 body words is too sparse for distinction-level synthesis. No source-selection protocol is reported. |
| Research design and methodological validity | 15 | 11.5 | Layered evidence and claim boundaries are strong. The iterative method is described informally rather than anchored in an established design-science methodology; evaluator independence remains weak. |
| Algorithm and quantitative evaluation | 15 | 12.5 | Admission, deterministic thresholds, replay controls, and adversarial tests are unusually explicit. Thresholds remain research choices rather than calibrated estimates, and the fixed-seed oracle shares assumptions with the implementation. |
| Software engineering and reproducibility | 15 | 14.0 | Versioned packs, fail-closed validation, traceable artefacts, hashes, release builds, and device evidence are strong. Architecture is described almost entirely in prose, reducing independent auditability. |
| Human-computer interaction and accessibility | 10 | 7.0 | Information hierarchy, progressive disclosure, non-colour cues, and claim calibration are thoughtfully designed. Evidence is limited to expert inspection on one handset; there is no participant, screen-reader, large-font, or comparative task study. |
| Legal, ethical, and governance validity | 10 | 8.5 | The thesis correctly refuses to equate thresholds with infringement and distinguishes pack modularity from legal validity. It lacks an examiner-friendly article-to-signal-to-missing-evidence matrix and a formal pack approval/change-control model. |
| Academic communication and presentation | 10 | 9.0 | The structure and claim language are polished, with clean compilation and bounded conclusions. The 70-page thesis has no substantive architecture or evaluation figures and only two cross-referenced artefacts. |
| **Total** | **100** | **82.0** | Strong potential distinction draft, but not yet 85+ on externally reviewable evidence and not close to 95+ without new methodological and empirical strength. |

## Hard blockers to 85+

1. Add a transparent literature/source-selection protocol and materially improve primary-source synthesis.
2. Anchor the work in an established design-science research method and map every stage to produced evidence.
3. Add architecture, decision-lifecycle, and evaluation-triangulation figures with cross-references.
4. Add a regulation-pack legal traceability matrix that separates statutory text, engineering prompt, missing facts, and prohibited conclusion.
5. Make recent Android permission-behaviour research part of the gap analysis instead of relying primarily on general privacy theory.

## Hard blockers to 95+

1. Independent human evidence: participant-based comprehension/task testing or a defensible substitute cannot be created by prose revision.
2. Independent legal review of the EU pack and a signed governance record for pack approval and change control.
3. A stronger oracle or mutation/property-based evaluation that reduces correlated-defect risk.
4. Multi-device/accessibility evidence, including screen reader, font scaling, colour-vision, and interaction-target checks.
5. Visual and quantitative comparison against at least one baseline interface or decision presentation.

## Iteration policy

- Revision 12 targets at least 87/100 by repairing the five 85+ blockers without changing implementation claims.
- Revision 13 targets at least 90-92/100 through deeper synthesis, examiner-facing traceability, and a stricter limitations/contribution argument.
- If Revision 13 remains below 95, code and App evidence must be strengthened before further thesis revision; prose alone must not be used to manufacture the missing empirical validity.
