# Authorised 100-app Android-store corpus

This directory contains the contract for a 100-application research corpus, not APKs. Each entry must identify one store listing, package name, local APK or split-APK paths, and SHA-256 values. APK files must be obtained through an authorised store account, an institution-approved corpus such as AndroZoo, or another lawful source approved by the operator; do not scrape or bypass a store's distribution controls.

`scripts/run-store-corpus-batch.js` defaults to validation-only mode. Execution requires both `--execute` and `--allow-device-installs`, rejects a corpus that does not contain exactly 100 unique entries, verifies every file digest before installation, refuses to replace a pre-existing package, force-stops then uninstalls only the package it just installed, and verifies removal. It never uninstall system packages or a pre-existing user app.

The runner records install/launch/cleanup state, permission declarations, process count, PSS memory snapshots, and a best-effort per-package batterystats snapshot. Energy is reported as `NOT_AVAILABLE` unless two comparable device values are present; a missing or incomparable reading is never converted into zero energy. Every result remains an engineering measurement and potential-review signal, not evidence of a GDPR infringement.
