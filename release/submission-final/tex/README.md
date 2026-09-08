# Chapter-split TeX source

This directory preserves the public thesis as independently reviewable chapter files. `main.tex` inputs `chapter-01.tex` through `chapter-07.tex`, `formal-evidence-model.tex`, and `generated-results.tex`; `reference.bib` contains the bibliography.

Compile `main.tex` from this directory with a current XeLaTeX-compatible toolchain or Tectonic. The default output is the public archival edition and omits private administrative identifiers.

`private-submission-metadata.example.tex` contains placeholders only. A university edition may be produced locally by copying it to `private-submission-metadata.tex`, filling the required values, defining `\PrivacyLensSubmissionEdition`, and compiling without committing the populated file.
