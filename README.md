# Privacy Lens

Privacy Lens is an evidence-first Android privacy review prototype. It separates observed device evidence from synthetic demonstrations, explains what Android can and cannot reveal, and turns technical signals into questions for human review—not legal conclusions.

中文简介见下方 [中文](#中文)。

## Product status

Version 1.1.0 is an initial store-submission candidate at the code and artifact level:

- focused three-page experience: Overview, Findings, and Settings;
- ARM64 release APK and Android App Bundle built against target SDK 36;
- branded launcher and splash assets;
- no account, advertising, analytics SDK, evidence upload, or sensitive runtime permission;
- local evidence storage with Android backup disabled;
- device QA on OPPO PERM00, including cold launch, navigation, synthetic workflow, screenshots, UI hierarchy, and crash-log checks.

The generated release artifacts in `android/app/build/outputs/` use the repository's QA/debug signing configuration. A store owner must supply and protect a dedicated upload key before Play submission. Play Console declarations and listing publication are external steps.

## What it does

- Requests an on-device audit through a Kotlin/React Native bridge and WorkManager.
- Reviews location, microphone, and contacts event summaries using the active rule pack.
- Preserves evidence source, rule-pack identity, thresholds, rationale, caveats, and recommended human action in every finding.
- Runs a clearly labelled 50-round deterministic synthetic demonstration.
- Stores findings and the active rule-pack choice in app-private local storage.

## Regional rule packs

Regulation loading is independent of screen code. A registered pack owns its jurisdiction label, source, rules, references, evidence requirements, classification policy, principles, and caveat.

Included packs:

- **EU GDPR** — legal-framework prompts backed by the official EUR-Lex text.
- **Research baseline** — explicitly non-legal, region-neutral demonstration of pack switching.

Adding a region means implementing a `RegulationPack` and registering it in `src/regulations/registry.ts`; existing findings keep the pack that produced them.

## Evidence boundaries

- Ordinary Android apps generally cannot inspect unrestricted AppOps history for other apps.
- A blank audit is not proof that no access occurred.
- WorkManager execution is deferrable and OEM-dependent.
- Synthetic metrics show agreement with deterministic labels, not legal validity or real-world detection accuracy.
- The app is a research and accountability aid, not legal advice, certification, or a finding of infringement.

## Build and verify

Requirements: Node.js, Java 21, Android SDK 36, and an Android NDK compatible with Expo 54.

```powershell
npm install
node node_modules/typescript/bin/tsc -p tsconfig.compliance-tests.json
node .compliance-test-build/tests/runComplianceTests.js
node .compliance-test-build/tests/runExtendedComplianceTests.js
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js .

$env:NODE_ENV = 'production'
Set-Location android
.\gradlew.bat assembleRelease bundleRelease --no-daemon --console=plain -PreactNativeArchitectures=arm64-v8a
```

On Windows, a hoisted dependency layout may be needed to avoid native CMake path limits.

## Key paths

- `app/(tabs)/` — product screens
- `src/regulations/` — decoupled regional rule packs
- `src/compliance/` — validation, evaluation, evidence models
- `android/app/src/main/java/com/zhihengzhang/privacylens/privacy/` — native audit bridge and workers
- `tests/` — deterministic and boundary tests
- `testing-report/ui-round-2026-08-09/` — current physical-device visual evidence
- `docs/` — store-readiness, privacy policy, and product audit
- `Thesis Version/` — append-only thesis revisions

## 中文

Privacy Lens 是一款“证据优先”的 Android 隐私审查研究原型。它把设备观测证据与合成演示严格分开，说明 Android 能看到什么、不能看到什么，并把技术信号转化为供人工复核的问题，而不是直接给出法律结论。

### 当前状态

1.1.0 版本在代码和构建产物层面达到“初步商店提交候选”状态：

- 界面收敛为概览、发现、设置三个核心页面；
- 已生成面向 ARM64、target SDK 36 的 release APK 与 AAB；
- 已完成品牌图标、启动图、无障碍标签和实体设备交互验收；
- 不包含账户、广告、分析 SDK、证据上传或敏感 Android 权限；
- 证据仅保存在应用私有空间，并关闭 Android 备份。

仓库 release 当前仍使用 QA/调试签名，正式提交前必须由应用所有者配置并妥善保管独立上传密钥；Play Console 的 Data safety、隐私政策网址和商店文案发布也是外部步骤。

### 地区法规解耦

法规包不写死在界面中。每个 `RegulationPack` 独立定义地区、来源、阈值、条文引用、证据要求、分类策略、原则与免责边界。目前包含 EU GDPR 法律框架包和明确标注为“非法律演示”的地区中立研究包。新增地区只需实现并注册新包；历史发现不会被新选择重新贴标签。

### 重要边界

- 普通 Android 应用通常无法读取其他应用不受限制的 AppOps 历史；
- 空白结果不代表没有发生访问；
- WorkManager 可能被系统和 OEM 延迟；
- 50 轮指标只证明确定性标签与实现一致，不代表真实世界或法律判断准确率；
- 本项目不构成法律建议、合规认证或侵权认定。

See [User-Guide.md](User-Guide.md), [store readiness](docs/store-readiness.md), and [privacy policy](docs/privacy-policy.md).
