# Thesis and artifact provenance

Status date: 8 September 2026

This timeline records repository-observable development history. It does not attribute unrecorded decisions, invent reviewers, or convert a commit message into experimental evidence. Exact claims and measurements remain governed by `thesis-evidence-manifest.json` and the cited receipts.

| Period | Repository milestone | Traceable identity | Evidence boundary |
|---|---|---|---|
| March-April 2026 | Initial Android application, privacy dashboard, research-question, task, and on-device rendering work | Linear commits ending at `4-6` / `76d493410a822c5400f4127bb0c6e7c3f133c45a` | Early prototype history; not the final evaluated architecture |
| 30 July-1 August 2026 | Native privacy inspection, dashboard consolidation, simulator, accessibility-oriented interface, and thesis evidence revisions | Branch tips through `8-1-editing` / `c878032debc1f063eb8e333500db2897c2d72f45` | Engineering iterations retained for process traceability |
| 3-7 August 2026 | Boundary tests, ARM64 device QA, temporal safety, source provenance, replay controls, and interface refinement | `thesis-improving` / `2b31d1746487b8fb50af30a032316a3b4c7fcefb`; `8-7` / `7d2d08849d4d75ba72f01151d81011e42df6d22b` | Each measurement applies only to its recorded build and interval |
| 9-13 August 2026 | Store-candidate architecture, legal-source governance, decision pause, trust-store and witness gates, bilingual delivery documentation | `8-10` / `4e4984087783d4d4cabcc9cb688dad2d861df4d2`; `8-13` / `69ca14de85ee42879966f123c8c30b132c447255` | QA/debug signing and owner-controlled release gates remained explicit |
| 20-21 August 2026 | Regulation-driven temporal profiles, restart-safe bounded ledger, controlled native fixture, fixed-seed stress evidence, and self-contained thesis source | `8-20` / `b71d8c066a9ae3aa9a2d28bd200a9310c8a83084`; `8-21` / `a0ffea07f62d3fe2f2c7a2d45e98b5d987bc268f` | Controlled fixture is synthetic; device evidence does not establish a real privacy event |
| 22-23 August 2026 | Formal policy constraints, F-Droid and DroidBench evidence, FlowDroid interoperability, corpus missingness, and authorised commercial-corpus protocol | `8-22` / `727056c4b29065a4c21ab9bc291c85ca8fa93d5f` | Open-source corpus is not a commercial-app population; absent tool output remains missing evidence |
| 24 August 2026 | Mature thesis candidate: explicit RQs, typed evidence model, curated safety mutants, mapping-review packet, evidence manifest, scoping-review matrix, PDF and quality gates | `8-24` / `225b03476dd863ee79caf56d96f84d52a379daa5` | Independent legal mapping review and participant evidence remained `NOT_RUN` |
| 8 September 2026 | Finalization pass: repository identity, permission reconciliation, current OPPO release QA, thesis rubric tables, public/submission metadata separation, final package, immutable tag, and default-branch cleanup | Branch `9-8-Finalize`; final tag and commit are published only after all gates pass | Finalization does not expand legal, population, accessibility, production, or cross-device claims |

All historical remote branch tips were confirmed to be ancestors of `8-24` before cleanup. Deleting redundant remote branch names after final publication therefore does not delete their commits from the final branch history or immutable final tag.
