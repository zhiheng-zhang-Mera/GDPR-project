# Revision 12 iteration-1 review and acceptance record

Date: 2026-08-09

Branch: `8-9`

Predecessor: Revision 11 (`main-14.tex`, 70 pages, 26,553 strict continuous body words, simulated multidisciplinary score 82.0/100).

Successor: Revision 12 (`main-15.tex` and seven `*-12.tex` chapter files). Revision 11 remains preserved.

## Outcome

Revision 12 repairs all five thesis-only blockers identified for the 85+ target. The evidence-bounded simulated multidisciplinary score rises from 82.0 to 88.0/100. This is a panel simulation, not a university mark. The score is intentionally held below 95 because no new participant, independent legal, independent oracle, assistive-technology, or multi-device evidence was created in this iteration.

## Material improvements

- grounded the research process in design-science research and mapped each stage to inspectable artefacts;
- added a structured scoping-review protocol and explicit source hierarchy;
- synthesised recent primary studies of Android permission behaviour and control;
- added an evidence-to-action conceptual boundary and a seven-stage system architecture;
- added legal traceability from statutory anchor to permitted prompt, missing facts, and prohibited conclusion;
- added implementation witnesses, evaluation triangulation, and a cross-disciplinary assurance case;
- reframed visual coherence, trustworthy communication, and interaction feasibility as expert product-screening findings rather than population outcomes;
- retained the regulation pack as the replaceable jurisdiction-specific layer and kept platform, repository, and interface layers free from automated legal verdicts.

## Source verification

The new bibliography entries were checked against primary or authoritative records on 2026-08-09:

- Hevner et al., *MIS Quarterly* 28(1), 75-105, DOI `10.2307/25148625`;
- Peffers et al., *Journal of Management Information Systems* 24(3), 45-77, DOI `10.2753/MIS0742-1222240302`;
- Wijesekera et al., USENIX Security 2015, 36 participants and 27 million data points;
- Cao et al., USENIX Security 2021, 1,719 participants across 10 countries/regions;
- Prange et al., SOUPS 2024, 132 field participants, 453-472;
- NISTIR 8062, DOI `10.6028/NIST.IR.8062`;
- NIST Privacy Framework 1.0, DOI `10.6028/NIST.CSWP.01162020`;
- official Android `AppOpsManager` documentation and final EDPB Article 25 guidance.

This check confirms bibliographic identity and the limited facts used in the thesis. It is not a systematic-review completeness claim.

## Machine acceptance

- LaTeX build: PASS with `latexmk`, `pdflatex`, and BibTeX.
- PDF: 76 A4 pages; no encryption; no JavaScript; title metadata identifies Revision 12.
- Strict continuous body count: 27,516 words; headings, captions, float text, and equations excluded; minimum 25,000; PASS.
- Compile-log scan: 0 LaTeX/package warnings, overfull boxes, underfull boxes, undefined citations/references, or duplicate-label warnings.
- Source audit: 8 TeX source files, 25 cited keys, 67 bibliography entries, 0 missing citation keys.
- Cross-references: 9 labels, 10 references, 0 missing references, 0 duplicate labels.
- Encoding: 0 non-ASCII source lines in `main-15.tex` and the seven Revision 12 chapter files.

## Visual acceptance

All 76 PDF pages were rendered to PNG and inspected in four contact sheets. High-risk pages were then inspected at full rendered resolution: title/abstract, design-science table, conceptual model, architecture, legal traceability, implementation witnesses, product screening, evaluation triangulation, cross-disciplinary assurance, and both reference pages.

Result: PASS. The abstract fits on page 1; the contents begin on page 2; there are no blank pages, clipped figures, overlapping table text, orphaned captions, or visually defective reference pages. Figures and tables remain legible at page scale.

## Claim boundaries retained

- deterministic rule agreement is not legal validity;
- one installed-device path is not broad Android reliability;
- expert interface inspection is not participant usability, accessibility conformance, trust, or willingness to use;
- a release APK/AAB is not Play approval or production signing;
- replaceable regulation packs are an architecture capability, not evidence that unreviewed regional packs are legally correct.

## Next iteration

Revision 13 will add deeper comparative synthesis, algorithm and governance formalisation, and a consolidated claim-evidence matrix. If its independently simulated score remains below 95, subsequent progress must come from stronger App and evaluation evidence rather than prose alone.
