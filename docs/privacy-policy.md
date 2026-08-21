# Privacy Lens Privacy Policy

Effective date: 13 August 2026

Applies to repository version: 1.15.0

Privacy Lens is an on-device privacy-review research application.

## Data handled

The app may process locally generated permission-audit summaries containing an application package identifier, permission category, event counts, time-window metadata, evidence source, and rule-evaluation result. The controlled demonstration generates synthetic records that are explicitly labelled as synthetic. A Debug-only controlled temporal route retains only normalised package-scoped observation type, timestamp, count, source category, active regulation-pack identifier/version, and a deduplication key for the active window; it never stores raw sensor content.

## Collection, sharing, and sale

This release has no account system, advertising SDK, analytics SDK, evidence-upload service, or remote evidence database. The developer does not receive, share, or sell the local evidence ledger through the app.

Opening an official legal source uses the device browser and is then governed by the destination site's policy.

## Storage and deletion

Findings, the active rule-pack choice, and the bounded temporal ledger are stored in app-private local storage. Android backup is disabled. Users can delete the local findings and temporal ledger from Settings or remove all app data by uninstalling the app. Incompatible, expired, future, or malformed temporal snapshots are discarded at restart.

The optional decision-pause interaction does not collect research data. Its interpretation choice and context checkboxes exist only while the evidence card remains open, are cleared when that card closes, and are not written to storage or uploaded.

## Permissions and device access

The app does not request location, microphone, contacts, storage, overlay, advertising, Internet, or other sensitive runtime permissions. Official HTTPS sources are delegated to an installed browser, which applies its own network permissions and privacy policy. Operational WorkManager declarations support wake locks, boot rescheduling, and foreground-service compatibility. Ordinary Android security restrictions limit cross-application evidence visibility.

## Purpose and limitations

The app provides technical prompts for human review. It does not provide legal advice, certification, or a determination of infringement. Synthetic evaluation results are not real-world accuracy claims.

## Children

The app is not directed to children and does not operate an account or behavioral-profiling service.

## Contact

Before public distribution, the store owner must replace this repository contact section with a monitored support email and publish this policy at a stable HTTPS URL.

---

## 中文摘要

Privacy Lens 只在设备本地处理权限审查摘要和明确标注的合成演示记录。本版本没有账户、广告 SDK、分析 SDK、证据上传服务或远程证据数据库，不通过应用收集、共享或出售本地证据。发现和法规包选择保存在应用私有空间，Android 备份已关闭，用户可在设置中清空或通过卸载删除。应用不请求位置、麦克风、联系人、存储、悬浮窗、广告、互联网或其他敏感运行时权限；官方 HTTPS 来源由系统浏览器打开，并受浏览器自身权限和隐私政策约束。WorkManager 运行声明用于唤醒锁、启动重排和前台服务兼容。公开发布前，应用所有者须补充真实支持邮箱并将政策发布到稳定 HTTPS 地址。
