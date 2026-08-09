# Privacy Lens User Guide / 用户指南

## Quick start

1. Open **Overview** and read the evidence-reach limitation.
2. Tap **Review device activity** to request an on-device audit.
3. Open **Findings** to inspect saved evidence. Expand a card before acting.
4. Open **Settings** to change the rule pack, open its official source, or clear local findings.
5. To explore without claiming real observation, scroll to **Safe demonstration** and run the labelled 50-round demo.

## Reading a finding

- **Observed device** means the native bridge supplied the audit summary; Android visibility may still be incomplete.
- **Synthetic demo** means generated test data, never device observation.
- **Review required** is a technical prompt, not a legal conclusion.
- **Evidence gap** means required context such as purpose, lawful basis, controller identity, or retention period was missing.
- **No technical concern** means no configured signal was observed in that input; it does not prove compliance.

Every card retains its source, active rule pack at creation time, threshold evidence, legal or research reference, rationale, missing evidence, recommended action, and caveat.

## Rule-pack switching

Changing the pack affects new reviews only. Existing findings keep their original pack label. **EU GDPR** is a legal-framework prompt pack; **Research baseline** is explicitly non-legal.

## Data handling

Privacy Lens has no account, advertising, analytics SDK, or evidence upload. Findings and the active pack are stored locally in app-private storage. Android backup is disabled. **Clear local findings** deletes the ledger stored by this app.

## Known limits

Ordinary apps cannot reliably inspect unrestricted activity from other applications. WorkManager is deferrable. OEM behavior differs. The product supports research and accountability review and is not legal advice or compliance certification.

---

## 快速使用

1. 在**概览**页先阅读“证据可达范围”限制。
2. 点击 **Review device activity** 请求设备审查。
3. 在 **Findings** 中查看本地证据，采取行动前先展开卡片。
4. 在 **Settings** 中切换法规包、打开官方来源或清空本地发现。
5. 如需体验流程而不声称真实观测，请运行明确标注的 50 轮合成演示。

“Observed device”仅表示数据来自原生桥接，不代表 Android 提供了完整跨应用历史；“Synthetic demo”始终是合成数据；“Review required”是人工复核提示，不是法律结论；“No technical concern”也不等于证明合规。

切换法规包只影响新审查，历史发现保留产生它的法规包。应用无账户、广告、分析 SDK 或证据上传，数据保存在应用私有空间，Android 备份已关闭。
