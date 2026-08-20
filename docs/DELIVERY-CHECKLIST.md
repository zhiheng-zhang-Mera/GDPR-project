# Privacy Lens Final Delivery Checklist / 最终交付清单

Status date: 13 August 2026

Repository version: 1.15.0

Delivery branch: `8-13`

This checklist separates repository-ready engineering evidence from owner-controlled public-release work.

## Repository-ready / 仓库已完成

- [x] Source branch created from the sanitized `8-10` remote baseline.
- [x] IDE caches, stale bundle/archive files, obsolete x86 APK, template reset code, unused starter assets, and disconnected experimental backend removed.
- [x] Version is aligned across `package.json`, `app.json`, and Android Gradle configuration.
- [x] README is bilingual, displays final App 1.14.0 physical-device screenshots, and contains an architecture/evidence-flow visualization.
- [x] User guide covers first use, evidence interpretation, decision pause, local data, limits, and troubleshooting.
- [x] Project manual covers architecture, invariants, governance, development, extension, evidence policy, and release handoff.
- [x] First-contact review records each newcomer-facing problem, its risk, and the implemented correction.
- [x] Critical orchestration and governance paths contain comments explaining fail-closed and persistence boundaries.
- [x] A repeatable `npm run verify:delivery` check validates required files, versions, forbidden tracked paths, local Markdown links, and README screenshots.
- [x] Thesis revision history and minimized acceptance evidence remain versioned.

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
- [ ] Select and add an explicit software/content license before inviting redistribution.

## Release decision / 发布判断

**Repository handoff candidate:** yes, when all automated checks pass on the final commit and the remote tree is independently verified.

**Public production/store release:** no; the owner-controlled items above remain open.

仓库可作为最终工程交接候选，但不等于可直接上架、已获法律认可、已完成人体研究或达到生产安全保证。
