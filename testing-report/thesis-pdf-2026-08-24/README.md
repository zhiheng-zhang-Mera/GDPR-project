# Final thesis PDF build and visual QA

The then-current `Thesis/Final/main.tex` was compiled on 2026-08-24 with Tectonic 0.17.0. Its Revision 27 PDF was removed from the public final branch during personal-identifier minimisation; the source revision, this receipt, and Git history remain available. The current public PDF is `output/pdf/Privacy-Lens-Thesis-Final.pdf`.

- SHA-256: `f6f67c4a966fe69671ed062ab5b77b7bcef17cfe34463a43b89b542999958aa4`
- pages: 82
- page size: A4, 595.28 by 841.89 points
- PDF version: 1.5
- compile errors: 0
- unresolved citations: 0
- unresolved references: 0
- overfull boxes: 0

The log contains one underfull table-cell warning in Chapter 3 and an upstream Tectonic bundle warning while reading `algorithm.sty`; neither is a compile error. The PDF was rendered through Poppler at 100 dpi into 82 page images. Six contact sheets were inspected for page continuity, clipping, black squares, overlaps, table/figure placement, section transitions, references, and page numbers. The title page, all diagram/table pages visible in the contact sheets, and representative pages 21, 25, 32, 38, 40, 58, 81, and 82 were inspected at higher resolution. The initially overlapping note boxes in Figure 1 were revised, recompiled, and re-rendered; the final page 21 has separated boxes and no crossing text.

This is rendered-layout evidence for the frozen source. It is not a tagged-PDF accessibility certification: `pdfinfo` reports the PDF as untagged. The device accessibility evidence and its separate limitations remain under `testing-report/real-device-8-24-v1.15.0-accessibility/`.
