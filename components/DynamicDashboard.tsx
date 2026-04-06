import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { PrivacyBridge } from '../src/services/PrivacyBridge';

interface Props {
    taskId: number;
    onInteraction?: (result: { isCorrect: boolean, isError: boolean, latency: number }) => void;
}

type FlowState = 'active' | 'blocked' | 'ldp' | 'low_freq' | 'emergency_active' | 'severed';

interface FlowData {
    id: string;
    source: string;
    dest: string;
    initialRisk: 'safe' | 'high_risk' | 'purple' | 'blocked';
    state: FlowState;
    isTrap: boolean;
}

export function DynamicDashboard({ taskId, onInteraction }: Props) {
    const [isLdpEnabled, setIsLdpEnabled] = useState(false);
    const [syncLatency, setSyncLatency] = useState<number | null>(null);
    const [flows, setFlows] = useState<FlowData[]>([]);

    // 根据 Task ID 动态加载专属的可视化管道数据
    useEffect(() => {
        setIsLdpEnabled(false);
        let initialFlows: FlowData[] = [];

        switch (taskId) {
            case 1: // RQ3: Cross-border (Orange Flow)
                initialFlows = [
                    { id: 'f1', source: 'Step Counter', dest: 'Local HealthKit', initialRisk: 'safe', state: 'active', isTrap: false },
                    { id: 'target', source: 'Hormone Data', dest: 'EU Analytics Server', initialRisk: 'high_risk', state: 'active', isTrap: true },
                    { id: 'f2', source: 'Heart Rate', dest: 'Domestic Cloud', initialRisk: 'safe', state: 'active', isTrap: false },
                ];
                break;
            case 2: // RQ1: LDP Blurry Path
                initialFlows = [
                    { id: 'f1', source: 'Sleep Analysis', dest: 'Local Storage', initialRisk: 'safe', state: 'active', isTrap: false },
                    { id: 'target', source: 'Biometrics (Gait/HR)', dest: 'University Research Pool', initialRisk: 'high_risk', state: 'active', isTrap: true },
                ];
                break;
            case 3: // RQ2: Granular Sensor Modulation
                initialFlows = [
                    { id: 'f1', source: 'Calorie Burn', dest: 'Domestic Cloud', initialRisk: 'safe', state: 'active', isTrap: false },
                    { id: 'target', source: 'Background GPS & Mic', dest: 'Urban Stress Mapping (1Hz)', initialRisk: 'high_risk', state: 'active', isTrap: true },
                ];
                break;
            case 4: // RQ3: Emergency Break-glass
                initialFlows = [
                    { id: 'target', source: 'Complete Health History', dest: 'Paramedic Dispatch 911', initialRisk: 'blocked', state: 'blocked', isTrap: true },
                    { id: 'f1', source: 'Current Medications', dest: 'Paramedic Dispatch 911', initialRisk: 'blocked', state: 'blocked', isTrap: true },
                ];
                break;
            case 5: // RQ1: ADM Transparency
                initialFlows = [
                    { id: 'f1', source: 'Dietary Logs', dest: 'Local Coach AI', initialRisk: 'safe', state: 'active', isTrap: false },
                    { id: 'target', source: 'Health Risk Profile', dest: 'Insurance Broker AI (ADM)', initialRisk: 'high_risk', state: 'active', isTrap: true },
                ];
                break;
            case 6: // RQ2: Right to Erasure
                initialFlows = [
                    { id: 'f1', source: 'Workout Logs', dest: 'Cloud Vault', initialRisk: 'safe', state: 'active', isTrap: false },
                    { id: 'target', source: 'DNA Sequence', dest: 'Genetic Registry Archive', initialRisk: 'purple', state: 'active', isTrap: true },
                ];
                break;
            default:
                break;
        }
        setFlows(initialFlows);
    }, [taskId]);

    // 统一处理中间件拦截器（或 LDP 开关）的交互
    const handleFlowAction = async (flowId: string, actionType: 'block' | 'modulate' | 'emergency' | 'ldp') => {
        const flow = flows.find(f => f.id === flowId);
        if (!flow) return;

        let isCorrectAction = false;
        let isError = false;
        let newState: FlowState = flow.state;

        // 验证用户操作是否符合当前 Task 的目标
        if (flow.isTrap) {
            if (taskId === 1 && actionType === 'block') { isCorrectAction = true; newState = 'blocked'; }
            if (taskId === 2 && actionType === 'ldp') { isCorrectAction = true; newState = 'ldp'; }
            if (taskId === 3 && actionType === 'modulate') { isCorrectAction = true; newState = 'low_freq'; }
            if (taskId === 4 && actionType === 'emergency') { isCorrectAction = true; newState = 'emergency_active'; }
            if (taskId === 5 && actionType === 'block') { isCorrectAction = true; newState = 'blocked'; }
            if (taskId === 6 && actionType === 'block') { isCorrectAction = true; newState = 'severed'; }
        } else {
            isError = true;
            newState = flow.state === 'active' ? 'blocked' : 'active'; // 误触时的视觉反馈
        }

        // 模拟调用底层 Privacy Bridge (PEA)
        const response = await PrivacyBridge.invokeInterceptor(flow.id, isLdpEnabled, flow.isTrap);
        setSyncLatency(response.latencyMs);

        // 更新 UI 状态
        setFlows(prev => prev.map(f => f.id === flowId ? { ...f, state: newState } : f));
        if (onInteraction) onInteraction({ isCorrect: isCorrectAction, isError, latency: response.latencyMs });
    };

    // 监听 LDP 开关，专门为 Task 2 服务
    const toggleLdp = (value: boolean) => {
        setIsLdpEnabled(value);
        if (taskId === 2) {
            const target = flows.find(f => f.isTrap);
            if (target) handleFlowAction(target.id, value ? 'ldp' : 'modulate');
        }
    };

    // 渲染单个数据管道可视化
    const renderPipeline = (flow: FlowData) => {
        let lineColor = '#4CAF50'; // 默认安全绿
        let lineStyle: 'solid' | 'dashed' | 'dotted' = 'solid';
        let statusText = 'ACTIVE';

        if (flow.state === 'active' && flow.initialRisk === 'high_risk') {
            lineColor = '#FF9800'; // 高风险橙色流
            statusText = 'HIGH RISK';
        } else if (flow.state === 'active' && flow.initialRisk === 'purple') {
            lineColor = '#9C27B0'; // 基因/极高敏感数据
            statusText = 'SENSITIVE';
        } else if (flow.state === 'blocked' || flow.initialRisk === 'blocked') {
            lineColor = '#BDBDBD'; // 阻断灰色
            statusText = 'BLOCKED';
        } else if (flow.state === 'severed') {
            lineColor = '#F44336';
            lineStyle = 'dashed';
            statusText = 'SEVERED (ERASED)';
        } else if (flow.state === 'ldp') {
            lineColor = '#81C784'; // LDP 模糊绿
            lineStyle = 'dashed';
            statusText = 'LDP BLURRED';
        } else if (flow.state === 'low_freq') {
            lineColor = '#4CAF50';
            lineStyle = 'dotted';
            statusText = '0.01Hz LOW FREQ';
        } else if (flow.state === 'emergency_active') {
            lineColor = '#D32F2F'; // 紧急红
            statusText = 'EMERGENCY OVERRIDE';
        }

        return (
            <View key={flow.id} style={styles.pipelineContainer}>
                {/* 数据源 (左) */}
                <View style={styles.nodeBox}>
                    <Text style={styles.nodeTitle}>Source</Text>
                    <Text style={styles.nodeText}>{flow.source}</Text>
                </View>

                {/* 连接线与中间件拦截器 (中) */}
                <View style={styles.flowPath}>
                    <View style={[styles.line, { borderColor: lineColor, borderStyle: lineStyle, borderWidth: flow.state === 'low_freq' ? 1 : 3 }]} />

                    {/* PEA 中间件控制节点 */}
                    <TouchableOpacity
                        style={[styles.interceptorBtn, { backgroundColor: lineColor }]}
                        onPress={() => {
                            if (taskId === 3) handleFlowAction(flow.id, 'modulate');
                            else if (taskId === 4) handleFlowAction(flow.id, 'emergency');
                            else handleFlowAction(flow.id, 'block');
                        }}
                    >
                        <Text style={styles.interceptorText}>PEA</Text>
                    </TouchableOpacity>

                    <Text style={[styles.statusText, { color: lineColor }]}>{statusText}</Text>
                </View>

                {/* 数据终点 (右) */}
                <View style={[styles.nodeBox, flow.state === 'blocked' || flow.state === 'severed' ? styles.nodeDeactivated : {}]}>
                    <Text style={styles.nodeTitle}>Destination</Text>
                    <Text style={styles.nodeText}>{flow.dest}</Text>
                </View>
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* LDP 差分隐私全局开关 (主要为 Task 2 服务) */}
            {(taskId === 2 || taskId === 5) && (
                <View style={styles.settingRow}>
                    <View style={styles.textWrapper}>
                        <Text style={styles.label}>Local Differential Privacy (LDP)</Text>
                        <Text style={styles.desc}>Apply visual 'Blurry Path' to de-identify data before transfer.</Text>
                    </View>
                    <Switch value={isLdpEnabled} onValueChange={toggleLdp} trackColor={{ true: '#81C784', false: '#ccc' }} />
                </View>
            )}

            {/* 紧急破窗全局按钮 (主要为 Task 4 服务) */}
            {taskId === 4 && (
                <TouchableOpacity
                    style={styles.breakGlassBtn}
                    onPress={() => flows.forEach(f => handleFlowAction(f.id, 'emergency'))}
                >
                    <Text style={styles.breakGlassText}>⚠️ ACTIVATE EMERGENCY OVERRIDE</Text>
                </TouchableOpacity>
            )}

            <View style={styles.diagramArea}>
                <Text style={styles.diagramHeader}>PEA Data Flow Visualization</Text>
                <Text style={styles.diagramSubHeader}>Tap the middle 'PEA' node to intercept or modulate the API flow.</Text>

                {flows.map(renderPipeline)}
            </View>

            {/* 底层日志回显，验证 Gap 2：The Architectural Control Paradox */}
            {syncLatency !== null && (
                <View style={styles.latencyBox}>
                    <Text style={styles.latencyText}>✓ Native OS Middleware Synced: API physically enforced in {syncLatency}ms</Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10 },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 1 },
    textWrapper: { flex: 1, paddingRight: 10 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    desc: { fontSize: 11, color: '#666', marginTop: 4 },
    breakGlassBtn: { backgroundColor: '#D32F2F', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
    breakGlassText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

    diagramArea: { backgroundColor: '#fff', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#eee', elevation: 2 },
    diagramHeader: { fontSize: 16, fontWeight: 'bold', color: '#1565C0', textAlign: 'center' },
    diagramSubHeader: { fontSize: 12, color: '#757575', textAlign: 'center', marginBottom: 20 },

    pipelineContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
    nodeBox: { width: '28%', backgroundColor: '#F5F5F5', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center', elevation: 1 },
    nodeDeactivated: { opacity: 0.4 },
    nodeTitle: { fontSize: 9, color: '#757575', textTransform: 'uppercase', marginBottom: 4 },
    nodeText: { fontSize: 11, fontWeight: 'bold', color: '#333', textAlign: 'center' },

    flowPath: { flex: 1, height: 40, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
    line: { position: 'absolute', width: '100%', top: '50%', zIndex: 0 },
    interceptorBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', zIndex: 1, borderWidth: 2, borderColor: '#fff', elevation: 3 },
    interceptorText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    statusText: { position: 'absolute', bottom: -18, fontSize: 9, fontWeight: 'bold' },

    latencyBox: { marginTop: 15, backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#A5D6A7' },
    latencyText: { color: '#2E7D32', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }
});