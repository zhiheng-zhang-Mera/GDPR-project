# Design alignment - 30 July revision

## Implemented

- Pluggable `IComplianceEngine` contract and GDPR implementation.
- Permission-to-rule mapping for location, microphone, and contacts.
- Dynamic `baseline * deviationMultiplier` thresholds and four risk levels.
- Persistent violation records with notification de-duplication. A notification is emitted only
  for a new finding, active-state transition, or risk-level escalation.
- Deterministic random violation configuration, 24-hour randomized trigger times, and explicit
  ground truth.
- Precision and recall calculation for N-round simulator evaluation.
- Unique 24-hour WorkManager scheduling plus one-shot audit and simulator workers.
- Manual React Native package registration and a bridge for audit/simulation commands.
- Passive dashboard showing threshold, excess count, risk level, and mapped GDPR articles.
- Deterministic compliance-engine verification.

## Platform limitation handled explicitly

Cross-application AppOps access-count history is restricted on many stock Android/OEM builds.
The worker remains non-invasive and records audit capability rather than fabricating counts.
A privileged, device-owner, or research firmware deployment is required when the experiment must
read other applications' complete historical operation counts.

## Verification

```bash
npm run test:compliance
npx tsc --noEmit
cd android
gradlew.bat :app:compileDebugKotlin
```

The compliance test suite passes. The original branch still contains unrelated strict-TypeScript
errors in the projects, health-chart, and consent UI components. Android compilation requires a
local JDK/Android SDK.
