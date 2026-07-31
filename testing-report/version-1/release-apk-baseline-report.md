# 7-31-compress APK 专项分析报告

## 测试对象

- 仓库：`zhiheng-zhang-Mera/GDPR-project`
- 分支：`7-31-compress`
- 提交：`ba0a443b1da253bab9bd9b6fa5536d9c4cedcc05`
- 构建：Release、x86_64、Hermes、R8、资源压缩
- APK：`app-release-x86_64-r8.apk`
- 设备：Android Emulator `emulator-5554`，Android 16 / API 36，320 × 640
- 应用：`com.anonymous.mymobileapp` 1.0.0（versionCode 1）

## 结论

Release APK 可安装、可冷启动、可独立运行，不依赖 Metro。论文验证用的 50 轮权限审计全部完成，结果为：

- TP：40
- FP：0
- FN：0
- Precision：100.0%
- Recall：100.0%

未发现应用崩溃、ANR 或 React Native JavaScript 异常。当前证据没有显示必须修改源代码的问题，因此没有创建 `7-31-compress-2` 分支。

## 体积

| 构建 | 字节 | MB |
|---|---:|---:|
| Debug APK | 81,418,395 | 81.42 |
| Release x86_64 + R8 + shrinkResources | 28,680,221 | 28.68 |

Release APK 相比 Debug APK 减少 52,738,174 字节，约 64.8%。

## 启动与内存

- 冷启动 `am start -W`：TotalTime 948 ms，LaunchState COLD
- 冷启动稳定 10 秒：PSS 99,675 KB，RSS 207,596 KB
- 50 轮审计后稳定采样：
  - PSS 87,988 KB，RSS 197,688 KB
  - PSS 87,915 KB，RSS 197,628 KB
  - PSS 87,928 KB，RSS 197,628 KB
- 审计后平均 PSS：87,944 KB（约 87.94 MB）
- 审计后平均 RSS：197,648 KB（约 197.65 MB）

Release 的 PSS 明显低于 Debug + Metro 条件下约 276 MB 的历史观测值，说明此前高内存主要受调试运行时影响，不能代表发布构建。

## 帧性能

在隐私页执行 50 轮审计后的 `gfxinfo`：

- 总帧数：20
- Janky frames：2（10.00%）
- 50th percentile：26 ms
- 90th percentile：34 ms
- 95th percentile：36 ms
- Missed Vsync：0
- Slow UI thread：1
- GPU 50th / 90th / 95th：3 / 13 / 16 ms

该样本只有 20 帧，适合发现明显阻塞，不足以作为长期流畅度统计。当前没有出现持续卡顿、崩溃或审计失败，不建议仅凭此小样本创建修复分支。后续若要形成论文级性能结论，应在实体 Android 设备上重复多轮、扩大帧样本并记录设备型号和系统版本。

## 构建告警

构建成功，但 Gradle 输出包含第三方 Expo / React Native API 弃用告警，以及项目内 `unsafeCheckOpNoThrow` 弃用告警。它们没有导致当前功能或构建失败；可在升级依赖或适配新 Android API 时单独处理。

## 复核材料

- `app-release-x86_64-r8.apk`：本次测试 APK
- `release-ui.xml`：冷启动页 UI 树
- `privacy-ui.xml`：权限审计页 UI 树
- `post-eval-ui.xml`：50 轮审计结果 UI 树

