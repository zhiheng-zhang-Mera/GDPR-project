# Temporal rule cards

These cards describe prototype risk assumptions, not legal conclusions. Every temporal notice is local, advisory, and explicitly bounded by the active rule-pack version. Source metadata and retrieval dates are recorded in `src/regulations/packs/euGdpr.ts`; independent legal review remains required before treating any mapping as a legal assurance.

| Rule ID | Risk assumption and scope | Window and combination | References and review status | Counterexample / unknown facts |
| --- | --- | --- | --- | --- |
| `WEARABLE_LOCATION_HEALTH` | A wearable-style combination can enable health-and-location inference. | 30 minutes: location, activity recognition, body sensors. | GDPR Art. 5(1)(c), Art. 9; source register current in the packaged metadata, independent legal attestation not provisioned. | A user-requested fitness function, purpose, necessity, consent, and safeguards are not established by observations. |
| `MULTIMODAL_BIOMETRIC_CAPTURE` | Physiological, acoustic, and visual signals can support sensitive multimodal inference. | 15 minutes: body sensors, microphone, camera. | GDPR Art. 9(1), Art. 9(2)(a); same review boundary. | The card does not prove biometric processing, consent absence, or controller intent. |
| `CROSS_DOMAIN_PROFILING` | Clipboard, identifier, and image access can be combined for profiling beyond an expected purpose. | 10 minutes: clipboard read, device identifier, media images. | GDPR Art. 5(1)(b), Art. 22; same review boundary. | A permitted local workflow, recipient, automated decision, and actual use remain unknown. |
| `POST_BACKGROUND_MEDIA_ACCESS` | Media-location access soon after backgrounding can conflict with user expectations. | 5 minutes: app backgrounded, media location. | GDPR Art. 5(1)(a), Art. 7; same review boundary. | Background status alone does not establish collection, transmission, or invalid consent. |
| `HIGH_FREQUENCY_LOCATION` | Repeated location observations can merit a data-minimisation question. | 60 minutes: 20 location observations. | GDPR Art. 5(1)(c), Art. 25; same review boundary. | Sampling design, navigation use, precision, retention, and legal necessity are not inferred. |

The `GLOBAL_RESEARCH_BASELINE` profile is a non-legal demonstration control. It must not be represented as GDPR mapping or legal advice.
