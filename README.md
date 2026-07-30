# Welcome to your Expo app 👋

## GDPR permission-audit architecture

The `7-30-adjusted` implementation now contains a non-blocking compliance path:

- `src/compliance/IComplianceEngine.ts`: pluggable regulation-engine contract.
- `GDPRComplianceEngine.ts`: dynamic baseline + deviation thresholds mapped to GDPR Articles 5, 6, and 9.
- `ViolationRepository.ts`: persistent finding state and notification de-duplication.
- `ViolationSimulator.ts` and `Evaluation.ts`: random 24-hour test configurations, ground truth, precision, and recall.
- Android `AuditScheduler` / `PermissionAuditWorker`: unique 24-hour WorkManager audit without Root or VPN.
- Android `ViolationSimulatorWorker`: isolated test-harness scheduling.

Run the deterministic engine verification with:

```bash
npm run test:compliance
```

The Android AppOps history surface varies by OS/OEM and may require privileged or device-owner
deployment for cross-application access counts. The worker records this capability explicitly
instead of claiming unavailable evidence or blocking another application's data flow.

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
