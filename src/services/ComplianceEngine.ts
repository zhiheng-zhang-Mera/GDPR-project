import { Alert, DeviceEventEmitter } from 'react-native';

// 建立 GDPR 与 PIPL 的完整法条映射字典
export const REGULATION_MAPPING = {
    EXCESSIVE_COLLECTION: {
        description: '健康数据或传感器调用频率过高',
        gdpr: 'Art. 5(1)(c) Data Minimisation (数据最小化原则)',
        pipl: '第5条 最小限度收集原则',
    },
    UNAUTHORIZED_CROSS_BORDER: {
        description: '数据流向未通过等效评估的境外区域',
        gdpr: 'Art. 44-49 International Transfers (跨境传输通用原则)',
        pipl: '第38条 跨境提供条件',
    },
    SENSITIVE_LEAK_RISK: {
        description: '未经二次明确同意读取心率/生物特征',
        gdpr: 'Art. 9 Processing of Special Categories (特殊类别敏感数据限制)',
        pipl: '第28条 敏感个人信息处理规范',
    }
};

export class ComplianceEngine {
    // 缓存上次弹窗时间，防刷机制（HCI 交互优化）
    private static lastAlertTime: Record<string, number> = {};
    private static readonly ALERT_COOLDOWN_MS = 10000; // 10秒防刷限制

    /**
     * 接收被动审计事件，分析合规风险并执行双层交互设计
     */
    static processAuditEvent(
        eventType: keyof typeof REGULATION_MAPPING, 
        apiName: string, 
        contextData: string
    ) {
        const now = Date.now();
        const lastTime = this.lastAlertTime[eventType] || 0;
        const regulation = REGULATION_MAPPING[eventType];

        // 无论是否弹窗，非侵入式日志流必须实时更新
        DeviceEventEmitter.emit('ON_NEW_LOG_STREAM', {
            timestamp: now,
            apiName,
            issue: regulation.description,
            gdpr: regulation.gdpr,
            pipl: regulation.pipl
        });

        // 规避“弹窗轰炸”：如果距离上次该类型弹窗不足10秒，则跳过本次 Alert
        if (now - lastTime < this.ALERT_COOLDOWN_MS) {
            return;
        }

        this.lastAlertTime[eventType] = now;
        this.triggerInteractiveWarning(apiName, regulation);
    }

    private static triggerInteractiveWarning(apiName: string, regulation: any) {
        Alert.alert(
            "⚠️ 异常数据请求警告",
            `组件 [${apiName}] 触发风险行为：\n${regulation.description}\n\n可能违反条例：\n• GDPR: ${regulation.gdpr}\n• PIPL: ${regulation.pipl}`,
            [{ text: "已知晓", style: "default" }]
        );
    }
}