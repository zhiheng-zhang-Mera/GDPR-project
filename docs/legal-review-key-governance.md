# Legal-review key governance procedure

Status: **mechanism implemented and tested; production roots and envelopes unprovisioned**

Policy identifier: `privacy-lens.trust-store-policy.v2`

Applies to: Privacy Lens legal-rule-pack attestations

## Boundary

This is a project release control, not a requirement stated by the GDPR, a certification scheme, proof of reviewer qualification, or a substitute for legal advice. The production root store and signed trust-store envelope are empty. No real EU pack can clear the legal-review gate until independently governed root and reviewer keys, a genuine qualified review, and trusted rollback state are provisioned. The rollback state is app-private persistent storage, not tamper-resistant hardware: uninstalling the app, clearing application data, restoring an unsuitable backup, or compromising the device can remove or alter that history. Android backup is disabled, but that does not turn local state into a transparency log or guarantee continuity across reinstallations.

The envelope design is informed by general key-lifecycle guidance in [NIST SP 800-57 Part 1 Revision 5](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final) and by version, expiry, predecessor, and rollback concepts in [The Update Framework specification](https://theupdateframework.github.io/specification/). Privacy Lens does not claim TUF conformance or that NIST guidance creates a GDPR obligation.

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

## Signed trust-store envelope

1. Keep the offline trust-store root distinct from reviewer-attestation keys. Root private material must remain outside the repository and application bundle; only an explicitly approved public root may ship.
2. Encode each release as `privacy-lens.legal-review-trust-store.v1` with a positive safe-integer sequence, issue and validity dates, distinct issuer and approver, reviewer anchors, explicit revocations, root key ID, and Ed25519 signature.
3. Sequence 1 has no predecessor. Every later envelope must advance exactly one sequence and bind the SHA-256 digest of the immediately preceding signed envelope.
4. Verify schema, dates, role separation, root validity and revocation, signature, sequence continuity, predecessor digest, envelope expiry, reviewer-key validity, and explicit reviewer-key revocations before exposing any effective anchor.
5. Persist the highest accepted sequence and signed-envelope digest in application-private non-volatile storage before relying on a newly accepted envelope. An older sequence, a different envelope at the same sequence, a skipped sequence, a broken predecessor link, malformed stored state, or failed persistence blocks all reviewer anchors.
6. Exact reassessment of the currently accepted sequence and digest is idempotent. Clearing ordinary findings must not clear rollback state.

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
- The prototype now verifies explicit revocation entries inside a signed, monotonically sequenced offline envelope. Production root keys and envelopes remain unprovisioned, and distribution still requires an application release; revocation is therefore not instantaneous and provides no online status or transparency proof.
- A revocation envelope must remove reassurance for the affected key, identify a successor or blocking identifier where applicable, preserve the incident record, advance exactly one sequence, bind its predecessor, and pass downgrade, fork, gap, expiry, and rollback probes.
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
- durable highest-sequence and accepted-envelope-digest state, with recovery and corruption procedures;
- release-artifact hashes and reproducible test results;
- jurisdiction, language, and deployment-scope review;
- privacy notice and store declaration reconciliation.
