# Legal-review key governance procedure

Status: **draft and unprovisioned**

Policy identifier: `privacy-lens.trust-store-policy.v1`

Applies to: Privacy Lens legal-rule-pack attestations

## Boundary

This is a project release control, not a requirement stated by the GDPR, a certification scheme, proof of reviewer qualification, or a substitute for legal advice. The production trust store is empty. No real EU pack can clear the legal-review gate until an independently governed key and a genuine qualified review are provisioned.

## Roles and separation

- **Qualified reviewer:** performs the scoped legal review and owns the review rationale.
- **Release custodian:** independently verifies the identity, qualification record, pack version, source-content verification report, and requested key transition before approving a trust-store change.
- **Incident custodian:** records suspected compromise or loss and initiates revocation. This role may request emergency action but cannot silently replace the reviewer or release custodian.

Role separation is a conservative Privacy Lens control. It must not be represented as a universal statutory four-eyes requirement.

## Key onboarding

1. Record the reviewer's verified identity, professional qualification evidence, institutional affiliation where applicable, permitted scope, and evidence-retention location outside the app repository.
2. Generate an Ed25519 key under documented custody. Record whether the key is hardware-backed, exportable, shared, escrowed, or recoverable.
3. Calculate the public-key fingerprint and confirm it with the reviewer through an independent channel.
4. Create a trust-anchor request containing a unique key ID, owner, algorithm, validity interval, scope, and public key. Private material must never enter the repository, app bundle, test fixture, or evidence report.
5. Require the release custodian to approve the request and the source-content verification report before adding the public key.
6. Test the candidate release with positive, unknown-key, wrong-signature, expired-key, revoked-key, source-mutation, and rollback cases.

## Attestation and release

1. Retrieve each official document through the manifest `contentUrl`; preserve the exact raw bytes outside the repository.
2. Run `node scripts/verify-source-content-manifest.js <artifact-directory>` after compiling the compliance test target. Every artifact must match its recorded byte length and SHA-256 digest.
3. Review the rule pack against those verified bytes. A URL or page title alone is insufficient.
4. Sign the canonical attestation payload, which binds the pack identity and version, source-record digest, source-content-manifest digest, identities, scope, dates, algorithm, and key ID.
5. Independently verify the signature and produce a release record containing the application commit, APK/AAB hashes, manifest digest, attestation ID, key ID, and decision.
6. A passing signature authenticates only the payload relative to the configured key. The reviewer remains responsible for the legal analysis and scope.

## Rotation and revocation

- Rotate before expiry, on role or institutional change, when custody controls change, or when the cryptographic policy changes.
- Revoke on suspected compromise, loss, unauthorised use, qualification or scope invalidation, or material review-process failure.
- The current prototype uses a bundled static denylist. Emergency revocation therefore requires a new signed application release; it is not instantaneous and provides no online status or transparency proof.
- A revocation release must remove reassurance for the affected key, identify a successor or blocking identifier, preserve the incident record, and test downgrade/rollback attempts.
- Previously signed packs must not be reissued under a new key without repeating source-content verification and independent approval.

## Publication and source-artifact handling

The repository may publish URLs, retrieval dates, byte lengths, hashes, verification code, and bounded reports. Third-party official-document bytes remain outside the repository unless their redistribution basis and disclosure scope are separately approved. A digest proves equality to the retrieved snapshot; it does not prove that the publisher served the legally controlling language or version, that the retrieval channel was uncompromised, or that the document remains current.

## Production acceptance gates

A production trust-store change is blocked unless all of the following are evidenced:

- verified reviewer identity and qualification record;
- independent release-custodian approval;
- documented private-key custody and rotation plan;
- complete source-content verification report;
- canonical payload and valid Ed25519 signature;
- current key and attestation validity;
- revocation and rollback tests;
- release-artifact hashes and reproducible test results;
- jurisdiction, language, and deployment-scope review;
- privacy notice and store declaration reconciliation.
