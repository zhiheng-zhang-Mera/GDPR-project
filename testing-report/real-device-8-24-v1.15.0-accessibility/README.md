# OPPO accessibility and decision-pause evidence

## Scope

This directory records a controlled, single-device check performed on 2026-08-24. The target was an OPPO PERM00 connected as `BICIPVNB5HS85H9T`, running the installed Privacy Lens package `com.zhihengzhang.privacylens` version 1.15.0 (version code 16). This is device evidence for the tested build and screen state only. It is not a WCAG conformance assessment, a cross-device claim, or evidence that a screen reader user completed the flow.

## Observed results

- `findings-default.png` and `findings-default.xml` show the Findings screen at the device's original system font scale of 0.9. The interface exposes non-colour status labels including “Evidence incomplete”, “Controlled device demo”, “Source review current”, “Legal review not recorded”, and “Review required”.
- `findings-decision-pause.png` and `findings-card.xml` show the in-app pause between a technical signal and action. The screen tells the user to gather context or ask a qualified reviewer before changing access or confronting a developer.
- Interactive bottom-navigation items and review summary items appear as clickable nodes in the captured UI hierarchy. The default capture also records labelled evidence actions.
- `crash-buffer.txt` is empty after the tested flow, so no entry was present in Android's crash log buffer at capture time.
- `enabled-accessibility-services.txt` contains `null`: no Android accessibility service, including TalkBack, was enabled during this check. The captures therefore support UI-hierarchy inspection, not a completed TalkBack traversal claim.

## Large-font boundary

ColorOS allowed the font control to preview `超大` (extra large), as recorded in `font-preview-observation.txt`, but the system “Apply” control reported zero-sized bounds and the shell identity lacked permission to write the setting directly. The persisted font scale remained 0.9, as recorded in `font-scale-after.txt`. `findings-font-change-blocked.*` records this unsuccessful attempt and must not be treated as large-font app evidence. The original setting was not changed.

## Method and limitations

Coordinates used for application actions were derived from the immediately preceding Android UI hierarchy. System font interaction was similarly based on the ColorOS hierarchy. The check used one connected device, one installed build, English application content, and no enabled screen reader. It does not establish legal correctness, production monitoring coverage, third-party app behaviour, or accessibility conformance.
