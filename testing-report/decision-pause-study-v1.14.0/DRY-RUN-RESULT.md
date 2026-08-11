# Synthetic analysis pipeline dry run

- Evidence class: **SIMULATED_PIPELINE_ONLY**
- Input rows: 12 generated rows, six per arm
- Purpose: exercise schema validation, grouping, intervals, effect calculation, and visible evidence-boundary output.

The analyzer completed and printed the mandatory warning: `Synthetic dry run only. Do not cite as participant evidence or product effect.` The generated primary risk difference was 0.333, with a 95% Wald interval from -0.166 to 0.832 and approximate two-sided p = 0.221. These numbers are not estimates of a product effect; their uncertainty and non-significance are retained only to demonstrate that the pipeline reports rather than hides an unfavorable or indeterminate result.
