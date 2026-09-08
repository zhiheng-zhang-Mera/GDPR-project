# Privacy Lens Final Delivery Checklist / 最终交付清单

Status date: 8 September 2026

Repository version: 1.15.0

Delivery branch: `9-8-Finalize`

This checklist separates repository-ready engineering evidence from owner-controlled public-release work.

## Repository-ready / 仓库已完成

- [x] Finalization branch created from mature candidate `8-24` (`225b03476dd863ee79caf56d96f84d52a379daa5`) with the complete linear history retained.
- [x] IDE caches, stale bundle/archive files, obsolete x86 APK, template reset code, unused starter assets, and disconnected experimental backend removed.
- [x] Version is aligned across `package.json`, `app.json`, and Android Gradle configuration.
- [x] README is bilingual, displays the final product screens, identifies the research question and contributions, and links the final thesis, evidence, reproduction path, limitations, citation, archive, and rights notice.
- [x] User guide covers first use, evidence interpretation, decision pause, local data, limits, and troubleshooting.
- [x] Project manual covers architecture, invariants, governance, development, extension, evidence policy, and release handoff.
- [x] First-contact review records each newcomer-facing problem, its risk, and the implemented correction.
- [x] Critical orchestration and governance paths contain comments explaining fail-closed and persistence boundaries.
- [x] A repeatable `npm run verify:delivery` check validates required files, versions, forbidden tracked paths, local Markdown links, and README screenshots.
- [x] Thesis revision history, branch-tip provenance, and bounded acceptance evidence remain versioned.
- [x] The 8 September release rebuild reconciles source, merged-manifest, APK, and installed-package permissions; neither `INTERNET` nor `ACCESS_NETWORK_STATE` is present in the evaluated release.
- [x] Public thesis metadata omits the student identifier; a private local submission build may inject it without committing it.
- [x] The repository carries an explicit all-rights-reserved notice instead of implying open-source redistribution permission.
- [x] The AI-use declaration remains a draft with `SUBJECT_AUTHORIZATION_NOT_VERIFIED`; repository checks do not replace subject-coordinator authorization.

## Engineering acceptance / 工程验收

Run from a clean checkout:

```powershell
npm ci
npm run verify
```

For release artifacts, also run the ARM64 Gradle build in [PROJECT-MANUAL.md](PROJECT-MANUAL.md), inspect package/permissions/signing, and repeat scoped physical-device acceptance. Source-only checks do not substitute for binary or device evidence.

## Owner action required / 所有者仍需完成

- [ ] Create and protect a dedicated Play upload key; do not use the repository QA/debug certificate.
- [ ] Publish [privacy-policy.md](privacy-policy.md) at a stable HTTPS URL and replace the placeholder contact with a monitored address.
- [ ] Complete Play Data safety, content rating, support details, localized listing, and review of Play-delivered splits.
- [ ] Provision independently governed production root/reviewer/witness keys only after documented custody, qualification, separation of duties, rotation, revocation, incident, and recovery decisions.
- [ ] Obtain qualified legal review before any legal-validity claim.
- [ ] Obtain ethics determination and recruit participants before any user-psychology effectiveness claim.
- [ ] Conduct broader device, assistive-technology, long-duration, battery, memory, and security validation before production assurance claims.
- [ ] Replace the conservative all-rights-reserved notice only if the owner later chooses and approves an explicit redistribution licence after reviewing third-party material.

## Release decision / 发布判断

**Repository handoff candidate:** yes, only after all automated checks, final OPPO acceptance, rendered-PDF inspection, remote SHA comparison, and terminal GitHub Actions verification pass on the final commit.

**Public production/store release:** no; the owner-controlled items above remain open.

仓库可作为最终工程交接候选，但不等于可直接上架、已获法律认可、已完成人体研究或达到生产安全保证。
