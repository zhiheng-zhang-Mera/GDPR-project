# Revision 10 thesis compile and rendering acceptance

Date: 2026-08-09
Branch under review: `8-9`
Main source: `Thesis Version/main-13.tex`

## D-drive LaTeX toolchain

- Distribution: TinyTeX / TeX Live 2026, Windows complete release v2026.07.
- Install root: `D:\Tools\TinyTeX\TinyTeX`.
- Compiler: `D:\Tools\TinyTeX\TinyTeX\bin\windows\pdflatex.exe`.
- pdfTeX version: 3.141592653-2.6-1.40.29 (TeX Live 2026).
- Build driver: Latexmk 4.88.
- Download archive: `D:\Tools\TinyTeX-v2026.07.zip`.
- Archive SHA-256: `A523FC82C5FB60B0F68084F2C6FD84077C0A86C1011B7CF6D332534A15C83A95`.
- The archive checksum matched the checksum published with the official TinyTeX v2026.07 GitHub release asset.

## Strict body-word acceptance

Command:

```powershell
& .\scripts\count-thesis-words.ps1
```

Result:

- Metric: TeXcount continuous body text only.
- Sum weights: `1,0,0,0,0,0,0`.
- Excluded: titles and headings; table and figure captions and float text; equations.
- Count: **25,138**.
- Required minimum: **25,000**.
- Status: **PASS** (138-word margin).

The script uses TeXcount's `-dir`, `-inc`, and `-merge` options so included chapter files are resolved relative to the main document. It was exercised successfully from both the repository root and the thesis directory.

## Citation and compile acceptance

- Citation-key audit: 19 keys used, 59 entries defined, 0 missing keys.
- `latexmk -pdf` completed successfully and incorporated `reference.bib` through BibTeX.
- Final log scan found 0 undefined citations or references.
- Final log scan found 0 LaTeX or package warnings, 0 overfull boxes, and 0 underfull boxes.
- Output: 67 A4 pages, PDF 1.7, 444,873 bytes.
- Final PDF SHA-256: `AC7A35304BB42A55C3FB8C19D7607C0B11B6B83130FB2CCB97DD0CE9F24BEA01`.
- Deliverable: `output/pdf/privacy-lens-thesis-revision-10.pdf`.

## Rendering acceptance

The final compiled PDF was rendered with Poppler at 120 DPI to 67 PNG files. All 67 pages were reviewed through four contact sheets, followed by detailed inspection of the title/abstract page, all contents pages, the Android artefact table and wrapped SHA-256 values, the bounded product-assessment table, the final conclusion page, and the references pages.

Observed result:

- no clipped or overlapping text;
- no unintended blank page;
- no visible over-margin hash, path, or identifier;
- no coloured hyperlink boxes;
- consistent A4 margins, headings, typography, line spacing, and page numbering;
- contents entries and page references rendered coherently;
- tables remained within the text area and legible;
- bibliography fitted within the final page.

Status: **PASS for compiled thesis layout and rendering**.

## Claim boundary

This acceptance establishes the reproducibility, minimum body-word count, citation resolution, compilation, and bounded visual quality of Revision 10. It does not establish legal correctness of every GDPR interpretation, institutional thesis acceptance, participant usability, accessibility conformance, broad Android behaviour, application-store approval, or public production readiness. Those boundaries remain explicit in the thesis itself.
