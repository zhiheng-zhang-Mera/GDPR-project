# Final thesis citation audit

Audit date: 8 September 2026

The final TeX source cites 28 unique bibliography keys. The audit checked each cited key for a matching bibliography record, identifiable authorship or issuing organisation, title, year, publication venue or official publisher where applicable, and a DOI or authoritative/project-owned URL where one is available. The existing automated reference gate separately checks missing keys, duplicate keys, labels, and unresolved references.

## High-authority and technical sources

| Claim family | Cited sources | Audit result | Use boundary |
|---|---|---|---|
| GDPR principles, accountability, and data protection by design | `eurlex2016`, `edpb2019`, `edpb2022` | Identity and issuing authority verified against EUR-Lex and EDPB records | Used to motivate review questions and interface conduct, not to certify the app or derive numeric thresholds |
| Android permissions, AppOps, bundles, accessibility, Privacy Dashboard, target API, and Data safety | `androidpermissions2026`, `androidappops2026`, `androidbundle2026`, `androidaccess`, `androiddashboard2026`, `playtarget2026`, `playdatasafety2026` | Official Android or Google documentation links retained | Platform statements remain bounded by release and device evidence; store pages do not prove store acceptance |
| Static/dynamic information-flow and policy analysis | `flowdroid2014`, `taintdroid2010`, `policheck2020`, `shvartz2019`, `49` | Original conference or DOI records verified | Systems are compared by analytical object; no superiority or field-accuracy claim is made |
| Tracker-signature method | `exodus2026` | Project-owned methodology record verified | A signature indicates embedded code under the bounded method, not effective tracking |
| Permission comprehension | `felt2012`, `bonne2017` | Original study records verified | Findings motivate missing human evidence; they are not substituted for a Privacy Lens participant study |
| Privacy engineering and usability standards | `nist8062`, `nistprivacy2020`, `iso924111`, `wcag22` | NIST, ISO, and W3C identities verified | Used as design guidance, not legal, security, or accessibility certification |
| Privacy, attention, cognitive load, and calibrated trust | `5`, `12`, `13`, `22`, `27`, `34` | Author, title, venue or publisher, and year verified | Used for conceptual motivation; population effects are not attributed to the prototype |

## Sentence-level support review

Every citation occurrence in `Thesis/Final/` was reviewed in context. Citations support the proposition immediately before them: legal provisions support principle statements; platform documentation supports API or delivery facts; original system papers support descriptions of their analytical objects; empirical studies support claims about their own participants or measured behaviours; and standards/frameworks support design criteria. No citation is used as evidence for a Privacy Lens experiment, legal conclusion, population prevalence, production readiness, or completed human study.

No cited record was removed in this pass. The audit does not assert that uncited bibliography entries were used, and it does not turn bibliographic verification into independent peer review of this thesis.
