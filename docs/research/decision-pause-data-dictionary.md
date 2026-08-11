# Decision-pause study data dictionary

The analyzer accepts UTF-8 CSV with one row per randomized participant. The committed example is marked `SIMULATED_PIPELINE_ONLY` and is not participant evidence.

| Field | Type / values | Required | Meaning |
|---|---|---:|---|
| `evidence_class` | `PARTICIPANT` or `SIMULATED_PIPELINE_ONLY` | yes | Prevents synthetic rows from being mistaken for collected evidence. A file may not mix classes. |
| `participant_id` | non-empty random identifier | yes | Study ID only; no name, email, device ID, or package name. |
| `arm` | `BASELINE`, `DECISION_PAUSE` | yes | Randomized interface condition. |
| `correct_signal_not_verdict` | `0`, `1` | yes | Primary first-response correctness. |
| `impulsive_action_intent` | integer `1`–`7` | yes | Immediate consequential-action intention; lower is better. |
| `confidence_correctness` | integer `0`–`100` | yes | Confidence in the interpretation. |
| `task_time_ms` | integer at least `3000` after exclusions | yes | Render-to-first-response time. |
| `proportionate_next_step` | `0`, `1` | yes | Selected neutral context gathering before consequential action. |

The analyzer rejects unknown columns, duplicate identifiers, mixed evidence classes, invalid ranges, and absent arms. It prints the evidence class prominently and never converts a synthetic run into an empirical claim.
