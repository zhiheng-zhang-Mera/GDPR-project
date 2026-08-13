# Privacy Lens User Guide / 用户指南

[English](#english) · [中文](#中文) · [Back to README / 返回首页](README.md)

## English

### Before you begin

Privacy Lens is a research and accountability aid. A warning is a technical review prompt, not proof of a GDPR infringement, developer intent, or unlawful conduct. The app may have little or no device evidence because ordinary Android applications have restricted cross-app visibility.

### Five-minute walkthrough

1. Open **Overview** and read the evidence-reach notice.
2. Tap **Review device activity**. The app asks its native worker for the evidence Android makes available to this deployment.
3. Open **Findings**. Use the source label to distinguish **Observed device**, **Imported**, and **Synthetic demo** evidence.
4. Expand a finding. Read the observation, missing context, suggested next step, governance state, and caveat before interpreting its status.
5. Complete **Decision pause** only if preparing an action. Select what the card actually establishes and check provenance, evidence gaps, and proportionality. Closing the card clears every answer.
6. Open **Settings** to inspect the rule pack, official-source register, source review dates, source-content state, legal-review gate, trust-store/witness state, and local-data controls.

### How to read statuses

| Status | Meaning | It does not mean |
|---|---|---|
| **Review required** | A configured technical signal needs context and human review. | A violation occurred. |
| **Evidence gap** | Required information such as purpose, lawful basis, controller identity, retention, or provenance is absent. | The absent fact is adverse. |
| **No technical concern** | No configured anomaly was found in the accepted input, and every reassurance gate cleared. | General GDPR compliance is proven. |
| **Input rejected** | The record was malformed, unsafe, inconsistent, or unsupported. | The underlying activity is safe or unsafe. |

### Evidence sources

- **Observed device**: supplied through the native bridge. Android visibility may still be incomplete.
- **Imported**: supplied from an external workflow; provenance must be reviewed independently.
- **Synthetic demo**: generated locally for deterministic evaluation and never represented as device observation.

### Rule packs and legal-review gates

Changing the selected pack affects new reviews only. Saved findings retain the pack that produced them. **EU GDPR** is a legal-framework candidate; **Research baseline** is explicitly non-legal.

A legal framework can produce a reassuring state only when source records are current, official document bytes verify against the manifest, a qualified review attestation verifies, and the signed trust store plus witness threshold is current. The repository intentionally ships without production keys or real legal-review attestations, so this gate remains closed.

### Safe demonstration

The 50-round demonstration creates labelled synthetic records and evaluates deterministic agreement. Use it to explore the interface and test implementation behavior. Do not report its precision or recall as real-device, population, or legal accuracy.

### Local data and deletion

Findings, the active rule-pack choice, and minimal trust-store rollback state are stored in app-private local storage. Android backup is disabled. The app has no account, analytics, advertising, evidence upload, or Internet permission.

- **Clear local findings** removes the finding ledger.
- Decision-pause answers disappear when the finding closes and are never persisted.
- Uninstalling or clearing app data removes all app-private state, including rollback history.

### Troubleshooting

| Symptom | What to check |
|---|---|
| No findings appear | Read the evidence-reach notice; a blank result is plausible under Android restrictions. Try the labelled synthetic demo for interface exploration. |
| Audit remains pending | WorkManager is deferrable. OEM battery and background policies can delay execution. |
| Official source does not open | The app delegates the HTTPS link to a browser. Confirm a browser is installed and network access is available to that browser. |
| A finding cannot become reassuring | Inspect source review, content verification, legal attestation, trust-store, and witness states in Settings. Missing production governance is an expected fail-closed condition. |
| Answers disappeared | This is expected: decision-pause answers are session-only and clear when the card closes. |

## 中文

### 使用前须知

Privacy Lens 是研究和问责辅助工具。警告只是技术复核提示，不是 GDPR 侵权、开发者意图或违法行为的证明。由于普通 Android 应用受到跨应用可见性限制，应用可能只能获得很少证据，甚至无法获得证据。

### 五分钟上手

1. 打开**概览**，先阅读“证据可达范围”说明。
2. 点击 **Review device activity**，请求原生工作器读取当前部署权限允许获得的证据。
3. 打开**发现**，根据来源标签区分 **Observed device**、**Imported** 与 **Synthetic demo**。
4. 展开一条发现，在解释状态前依次阅读观测事实、缺失语境、下一步建议、治理状态和限制说明。
5. 只有准备采取行动时才完成 **Decision pause**：选择卡片实际能证明什么，并核对来源、证据缺口和比例原则。关闭卡片后所有答案会被清除。
6. 打开**设置**，检查法规包、官方来源登记、来源复核日期、来源内容校验、法律复核门、信任库/见证状态和本地数据控制。

### 状态解释

| 状态 | 实际含义 | 不代表 |
|---|---|---|
| **Review required** | 配置的技术信号需要补充语境并由人工复核。 | 已经发生侵权。 |
| **Evidence gap** | 目的、法律依据、控制者身份、保留期限或来源等必要信息缺失。 | 缺失事实一定不利。 |
| **No technical concern** | 已接受输入中未发现配置的异常，且所有安抚性门槛均通过。 | 已证明整体 GDPR 合规。 |
| **Input rejected** | 记录格式错误、不安全、不一致或不受支持。 | 底层活动安全或不安全。 |

### 证据来源

- **Observed device**：通过原生桥接提供，但 Android 可见性仍可能不完整。
- **Imported**：由外部流程提供，必须单独复核其来源。
- **Synthetic demo**：本地生成的确定性测试数据，绝不表示设备观测。

### 法规包和法律复核门

切换法规包只影响新审查，历史发现保留生成它的法规包。**EU GDPR** 是法律框架候选；**Research baseline** 明确属于非法律研究演示。

只有来源记录仍在复核期、官方文档字节与清单一致、合格法律复核证明通过签名验证、签名信任库及见证阈值均为当前状态时，法律框架才可能产生安抚性状态。仓库故意不内置生产密钥或真实法律复核证明，因此该门保持关闭。

### 安全演示

50 轮演示只生成带标签的合成记录，用于检查确定性实现一致性。可以用它熟悉界面，但不能把其精确率或召回率表述为真实设备、真实人群或法律判断准确率。

### 本地数据与删除

发现、当前法规包选择和最小信任库回滚状态保存在应用私有空间，Android 备份已关闭。应用没有账户、分析、广告、证据上传或互联网权限。

- **Clear local findings** 删除本地发现账本；
- 决策暂停答案只存在于打开的卡片中，关闭即清除且不会持久化；
- 卸载或清除应用数据会删除全部应用私有状态，包括回滚历史。

### 常见问题

| 现象 | 检查方向 |
|---|---|
| 没有出现发现 | 先阅读证据可达范围；Android 限制下空白结果可能是正常的。可运行明确标注的合成演示熟悉界面。 |
| 审查迟迟未完成 | WorkManager 不是精确定时器，OEM 的电池和后台策略可能延迟执行。 |
| 官方来源无法打开 | 应用把 HTTPS 链接交给系统浏览器；请确认已安装浏览器且浏览器可联网。 |
| 无法得到安抚性结果 | 在设置中逐层检查来源复核、内容校验、法律证明、信任库和见证状态；生产治理缺失时失败关闭属于预期行为。 |
| 答案消失 | 这是预期设计：关闭发现卡片即清除决策暂停答案。 |
