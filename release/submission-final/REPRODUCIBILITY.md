# Reproducibility

Use Node 20--24 and npm 10.8.2 from a clean checkout of tag `v1.15.0-thesis-final`:

```powershell
npm ci
npm run reproduce:thesis-core
```

For Android, install SDK platform/build-tools 36, NDK 27.1.12297006, CMake 3.22.1, and JDK 21, then run from `android`:

```powershell
.\gradlew.bat assembleRelease bundleRelease --no-daemon --console=plain -PreactNativeArchitectures=arm64-v8a
```

The final physical-device receipt is under `testing-report/real-device-9-8-finalize-v1.15.0/`. Device evidence is intentionally bounded to the recorded OPPO PERM00 interval. A successful build or test does not establish legal correctness, participant comprehension, cross-device reliability, production signing, or store approval.
