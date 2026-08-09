# Revision 9 final-candidate review

Date: 2026-08-09

## Version integrity

- Revision 8 source files remain unchanged.
- New entry point: `main-12.tex`.
- New chapter set: `chapter-01-9.tex` through `chapter-07-9.tex`.
- All seven `main-12.tex` inputs resolve to existing files.

## Chapter-level reconciliation

1. **Introduction:** narrows the thesis to evidence-bounded privacy review, defines four research questions, states contributions, and separates engineering evidence from legal and store claims.
2. **Foundations:** links GDPR principles to review questions rather than count-based legal conclusions; explains Android visibility, calibrated trust, replaceable packs, and store delivery.
3. **Requirements and design:** supplies an acceptance matrix, evidence contract, pack contract, layered architecture, threat model, and evaluation strategy.
4. **Implementation:** documents Privacy Lens 1.1.0, the stable package, pack registry, fail-closed engine, Android bridge, three-screen UI, local storage, permission boundary, and code cleanup.
5. **Evaluation:** records current static checks, 1,000-round deterministic results, extended boundaries, artefact hashes, merged-manifest facts, OPPO installation, UI calibration, and the bounded product assessment.
6. **Discussion:** separates construct, internal, external, ecological, legal, accessibility, and store-validity limits, then prioritises follow-up work.
7. **Conclusion:** answers every research question, states contributions, and distinguishes initial submission candidacy from public production readiness.

## Automated structural checks

- Citation-key scan: PASS; every Revision 9 citation key exists in `reference.bib`.
- Duplicate bibliography-key scan: PASS; none found.
- Input-file scan: PASS; seven of seven inputs exist.
- Unescaped-brace count: PASS for `main-12.tex` and every Revision 9 chapter.
- Label/reference scan: PASS; no missing or duplicate labels in Revision 9.
- Whitespace/error-marker check: PASS (`git diff --check`).

## Source and claim review

- Official GDPR, Android permissions, Android App Bundle, Play target-API, and Play Data safety sources are represented by explicit bibliography entries.
- The Research Baseline pack is described as non-legal and is not presented as a validated second jurisdiction.
- Deterministic precision and recall are described as specification conformance, not population or legal accuracy.
- One-device and short-run results are not generalised to multi-OEM, 24-hour, battery, memory, accessibility, or adoption claims.
- Store readiness is limited to an engineering candidate; production signing and Play Console actions remain external.

## Compilation boundary

No `pdflatex`, `xelatex`, `lualatex`, `latexmk`, or `tectonic` executable is installed in the current environment. A PDF compilation result is therefore **not claimed**. The source-level structural checks above are current and reproducible, but the candidate still requires a LaTeX-enabled final typesetting pass to detect layout warnings, overfull boxes, package availability, and bibliography rendering before academic submission.
