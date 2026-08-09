# Revision 11 style, relevance, and acceptance review

Date: 2026-08-09

Branch: `8-9`
First verified cloud sync: `e264f585a9d9fd60c26b10465b86e559fe2de29f`

## Reference use

`GDPR__IEEE__V37.pdf` was used only as a writing-style reference. Revision 11 adopts its strongest habits: problem-first section openings, explicit research-question mapping, contrastive explanations, contribution categories, and limitations connected to the next required evidence. It does not import the reference's PEA, LDP/Blurry Path, Skia, NASA-TLX, PLS-SEM, PIPL, HarmonyOS, mHealth, kernel-ground-truth, multi-jurisdiction, or planned-as-completed claims.

## Chapter relevance and revision result

| Chapter | Architectural purpose in Revision 11 | Main change |
|---|---|---|
| 1 Introduction | Defines the evidence-to-decision gap, research questions, contribution boundary, and jurisdiction-neutral pack direction. | Rewritten around four evidence-backed research questions; removed domain-specific health framing. |
| 2 Literature Review and Foundations | Establishes the regulatory, Android-evidence, human-factors, rule-system, and store-delivery foundations needed by the design. | Added an explicit five-part research gap and an evidence-rule-claim-action conceptual model. |
| 3 Requirements and System Design | Converts the problem into requirements, threat model, lifecycle, evidence contract, pack contract, and traceability. | Consolidated duplicated summaries and grouped formerly flat subsections into a coherent design hierarchy. |
| 4 Implementation | Shows where the evidence contract, pack registry, repository, bridge, interface, release configuration, and privacy controls exist in the product. | Removed repeated high-level descriptions; added codebase reconciliation and requirement-to-module traceability. |
| 5 Evaluation and Results | Tests source, engine, pack, Android artefacts, physical-device flow, and bounded product qualities against distinct conditions. | Separated protocol, engine, pack, device, interpretation, and validity; retained hashes and explicit evidence limits. |
| 6 Discussion and Limitations | Interprets findings without promoting engineering evidence into legal, accessibility, population, or store-approval proof. | Grouped technical validity, human trust, governance, and prioritised next work. |
| 7 Conclusion | Answers each research question, integrates contributions, states the final product position, and identifies the next evidence. | Removed the duplicate contribution list and deployment roadmap; tightened the closing claim boundary. |

## Content-pruning decisions

- Removed duplicated architecture, implementation, and deployment summaries where a later section already carried the evidence.
- Removed the generic five-stage roadmap from the conclusion because Chapter 6 already owns prioritised future evidence.
- Removed medical-domain motivation and its two now-unused citations so the thesis matches the product's domain-neutral Android privacy-review architecture.
- Retained GDPR as the evaluated legal objective while describing jurisdictional mappings as replaceable, versioned regulation packs outside the Android, repository, and interface layers.
- Preserved negative evidence: the work does not claim legal compliance, unrestricted Android visibility, participant-validated usability, accessibility conformance, long-run reliability, security certification, store approval, or multi-jurisdiction correctness.

## Final acceptance evidence

- Strict continuous-body word count: **26,553** words; required minimum: 25,000; result: PASS. The metric excludes headings, titles, float text, captions, and equations.
- Citations: 17 cited keys, 59 bibliography entries, 0 missing cited keys.
- Cross-references: 2 labels, 2 references, 0 missing references, 0 duplicate labels.
- Encoding: 0 non-ASCII lines across `main-14.tex` and the seven Revision 11 chapter files.
- Compilation: pdfTeX/latexmk completed; 70 A4 pages; no LaTeX/package warnings, overfull or underfull boxes, undefined citations/references, or multiply defined labels were found in the final log.
- Visual QA: all 70 pages were rendered at 120 DPI and inspected through four contact sheets; title/abstract, contents, requirements table, artefact hash table, bounded product assessment, chapter transitions, conclusion, and references were separately enlarged. No blank pages, clipping, overflow, broken hierarchy, orphaned headings, or table-boundary defects were observed.
- Final PDF SHA-256: `423E4811D957C5C9A273A2993A365E481C10B1FA62E81488E163A7E7A18BA4EF`.

Revision 11 is therefore a coherent potential submission draft within the recorded engineering and expert-review scope. It is not evidence of legal approval, store approval, or general user acceptance.
