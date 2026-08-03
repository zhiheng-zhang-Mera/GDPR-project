# Extended real-device QA summary

- Device: OPPO PERM00, Android 12 / API 31, ARM64 (serial `BICIPVNB5HS85H9T`)
- Package: `com.anonymous.mymobileapp` release 1.0.0
- Restart rounds: 10
- Median / mean TotalTime: 1009 ms / 1012.8 ms
- Sampled TOTAL PSS range: 127705-128305 KB
- Package-specific crash-buffer entry: False

This is a short restart/endurance check. It does not establish long-duration leak freedom, battery consumption, Doze timing, or legal compliance.

All ten launches produced a live application PID. The PSS range spans only 600 KB and is not monotonic, providing scoped evidence against immediate restart-to-restart accumulation. The crash buffer contained no package-specific entry. AppOps output exposed only application-owned storage-related modes and did not provide third-party access history.

## Corrected release smoke test

The two corrections identified by the extended logical suite were rebuilt into an ARM64 release APK. Build output was 32,776,788 bytes with SHA-256 `DA5C984CC4236ACD889597B98D98434375EBA3B5C15139DE4A436F78CE3C13BB`. Replacement installation succeeded; the first post-install cold start completed in 1,736 ms, the process remained live, sampled TOTAL PSS was 129,876 KB, and log screening found no package-specific fatal exception, ANR, or React Native error. This post-install observation is not pooled with the ten-cycle distribution.
