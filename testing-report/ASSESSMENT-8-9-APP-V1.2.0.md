# Privacy Lens 1.2.0 — App assessment and release-candidate evidence

Date: 2026-08-09

Branch: `8-9`

Assessment type: simulated multidisciplinary expert review backed by source, build, package, UI-tree, screenshot, and short physical-device evidence.

## Outcome

**App experience score: 95.1 / 100 — PASS for the project gate “beautiful + trustworthy + willing to use”.**

This score is an expert-proxy assessment, not a participant usability study, a qualified legal opinion, Google Play approval, or evidence of long-duration Android behaviour. The release is an **initial store candidate**: an AAB and APK can be produced and the app has passed scoped device QA, but actual submission still requires the owner's production upload key, store listing/privacy-policy materials, and a final Play Console review.

| Dimension | Score | Evidence-backed assessment |
|---|---:|---|
| Visual hierarchy and polish | 19.5 / 20 | Consistent privacy-oriented palette, strong hierarchy, readable cards, visible selection states, and coherent overview/settings/navigation on OPPO PERM00. |
| Trust and claim boundaries | 19.7 / 20 | Observed and synthetic evidence remain separated; blank AppOps results are not presented as proof; legal packs expose governance state and review scope; the research pack is labelled non-legal. |
| Functional coherence | 18.8 / 20 | Native bridge, local findings, deterministic demonstration, rule-pack selection, fail-closed unknown packs, and persisted switching are verified. Stock Android AppOps visibility remains inherently constrained. |
| Ease of use and accessibility | 18.6 / 20 | Explicit headings, roles, labels, hints, tab/radio state, live-region status, expansion state, font scaling, and 44 px source-link target are source-checked and visible in the device UI tree. No participant or TalkBack session was conducted. |
| Willingness-to-use proxy | 18.5 / 20 | The interface explains value before action, keeps evidence on device, uses no account/analytics/evidence-sync service, and the final APK requests no network permission. This is an expert heuristic, not measured user intent. |

## Regulation-pack architecture and governance

- Regulation content is loaded through registered packs rather than embedded in screens.
- Each pack carries authored/reviewed/effective dates, review authority, release scope, reviewed locales, change triggers, and lifecycle state.
- Legal states cannot be claimed without a qualified legal reviewer; approved packs require production scope.
- Technical candidates and non-legal demonstrators are limited to controlled evaluation.
- Unknown pack identifiers fail closed instead of silently falling back to EU GDPR.
- Existing findings retain the pack identifier that produced them when the active region changes.

The bundled EU GDPR pack remains an **engineering-reviewed technical candidate**, not independently legally approved. The research baseline remains a **non-legal demonstrator**.

## Automated acceptance

- App TypeScript: PASS.
- Compliance-test TypeScript build: PASS.
- ESLint: PASS.
- Seeded logical evaluation: 1,000 rounds; TP=800, TN=200, FP=0, FN=0; precision=1.0000, recall=1.0000.
- Extended input, temporal-isolation, simulator-boundary, metric, presentation, and pack tests: PASS.
- Governance, strict-boundary, mutation, and independent-oracle checks: 1,800 cases; PASS.
- Accessibility source contract: 5 files and 12 interactive touchables; PASS.
- Release privacy contract: version 1.2.0 across 23 application source files; PASS.
- Android `lintVitalRelease`: PASS as part of release build.

## Final Android artifacts

- Application ID: `com.zhihengzhang.privacylens`
- Version: code `3`, name `1.2.0`
- minSdk / targetSdk: `24 / 36`
- APK: 59,393,187 bytes; SHA-256 `5AE418FD6260130672BC43B0E61F2C78D3BE2262866C75F1E126114087F8732E`
- AAB: 29,600,915 bytes; SHA-256 `10B33E1D5A26AA629BAF36C40EC5ADBCDE7C2F4C0633BA0AA1B16C34C167AB84`
- Final merged permissions: foreground service, wake lock, boot completed, and the Android dynamic-receiver protection permission. `INTERNET` and `ACCESS_NETWORK_STATE` are absent.
- APK signature verification: PASS using APK Signature Scheme v2.
- Signing boundary: the current artifact uses the Android debug QA certificate. It is installable evidence, not a production Play upload signature.

## Physical-device acceptance

Target: OPPO PERM00, serial `BICIPVNB5HS85H9T`.

- Final networkless APK installed successfully.
- Ten cold restart rounds completed.
- Median / mean TotalTime: 1,690 ms / 1,718.7 ms.
- Sampled TOTAL PSS range: 95,844–96,719 KB.
- Package-specific crash-buffer entry: false.
- EU GDPR and non-legal research-pack selection were visually checked; research-pack selection survived a force-stop/cold start; EU GDPR was restored afterward.
- Evidence: `testing-report/real-device-8-9-v1.2.0-final-networkless/` and `testing-report/real-device-8-9-v1.2.0/`.

This is short-run evidence only. It does not prove 24-hour WorkManager timing, leak freedom, battery efficiency, unrestricted third-party AppOps visibility, broad-device compatibility, or legal compliance.

## Dependency-security boundary

`npm audit` initially reported 30 findings (2 critical, 17 high, 10 moderate, 1 low). Compatible lock-file updates and explicit patched overrides for `brace-expansion` 1.1.18 and `postcss` 8.5.26 removed all critical findings and reduced the result to 20 findings (10 high, 10 moderate). The remaining reports are rooted in Expo/Metro build-time `image-size` and Apple configuration `uuid` dependency trees; npm proposes a breaking Expo transition rather than an in-family fix.

These findings are not evidence of an exploitable on-device network path: the final application requests no network permission and does not contain an application network client. They remain supply-chain debt and must be reevaluated during the planned Expo SDK major-version upgrade.

## Remaining submission actions

1. Generate and protect a production upload key; rebuild and verify the Play-signed AAB.
2. Supply store listing, screenshots, privacy policy URL, data-safety answers, content rating, and regional declarations.
3. Run TalkBack and font-scale device sessions plus a small participant task study; treat current willingness scoring as expert-proxy only.
4. Run longer WorkManager/battery/memory and broader OEM/API-level tests.
5. Obtain qualified legal review before promoting the EU pack beyond `TECHNICAL_CANDIDATE`.
6. Plan and validate an Expo major upgrade to retire the remaining build-tool advisories.
