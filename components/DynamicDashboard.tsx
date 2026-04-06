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

const getRandomNoiseState = (): FlowState => {
    const rand = Math.random();
    if (rand < 0.5) return 'active';
    if (rand < 0.8) return 'blocked';
    return 'low_freq';
};

const getRandomInitialRisk = (): 'safe' | 'high_risk' | 'purple' => {
    const rand = Math.random();
    if (rand < 0.6) return 'safe';
    if (rand < 0.85) return 'high_risk';
    return 'purple';
};

const DISTRACTOR_POOL = [
    { source: 'Step Counter\n(计步器)', dest: 'Local HealthKit\n(本地库)' },
    { source: 'Sleep Logs\n(睡眠记录)', dest: 'Local Storage\n(本地存储)' },
    { source: 'Heart Rate\n(心率)', dest: 'Domestic Cloud\n(境内云)' },
    { source: 'Hydration\n(饮水日志)', dest: 'Local App\n(本地应用)' },
    { source: 'Workout AI\n(健身AI)', dest: 'Domestic Cloud\n(境内云)' },
    { source: 'Calorie Burn\n(卡路里)', dest: 'Local App\n(本地应用)' },
    { source: 'Screen Time\n(屏幕时间)', dest: 'OS Analytics\n(系统分析)' },
    { source: 'Device Temp\n(设备温度)', dest: 'Hardware Mon\n(硬件监控)' },
    { source: 'Battery Use\n(电池使用)', dest: 'OS Optimizer\n(系统优化)' },
    { source: 'Ambient Light\n(环境光)', dest: 'Auto-Brightness\n(自动亮度)' },
    { source: 'Keyboard Data\n(键盘数据)', dest: 'Local Dict\n(本地词典)' },
    { source: 'App Crash Log\n(崩溃日志)', dest: 'Dev Console\n(开发控制台)' },
    { source: 'Network Ping\n(网络延迟)', dest: 'Router Log\n(路由日志)' },
    { source: 'Volume Level\n(音量级别)', dest: 'Audio Service\n(音频服务)' },
    { source: 'Cache Size\n(缓存大小)', dest: 'Disk Manager\n(磁盘管理)' },
];

export function DynamicDashboard({ taskId, onInteraction }: Props) {
    const [syncLatency, setSyncLatency] = useState<number | null>(null);
    const [flows, setFlows] = useState<FlowData[]>([]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    useEffect(() => {
        setSelectedNodeId(null);

        let traps: FlowData[] = [];
        switch (taskId) {
            case 1:
                traps = [
                    { id: 't1', source: 'Hormone Data\n(激素数据)', dest: 'EU Analytics\n(欧洲分析)', initialRisk: 'high_risk', state: 'active', isTrap: true },
                    { id: 't2', source: 'Blood Pressure\n(血压记录)', dest: 'US Server\n(美国服务器)', initialRisk: 'high_risk', state: 'active', isTrap: true }
                ];
                break;
            case 2:
                traps = [
                    { id: 't1', source: 'Biometrics\n(生物特征)', dest: 'Research Pool\n(研究机构)', initialRisk: 'high_risk', state: 'active', isTrap: true },
                    { id: 't2', source: 'Gait Analysis\n(步态分析)', dest: 'Univ Server\n(大学服务器)', initialRisk: 'high_risk', state: 'active', isTrap: true }
                ];
                break;
            case 3:
                traps = [
                    { id: 't1', source: 'Ambient Mic\n(环境麦克风)', dest: 'Stress Map\n(压力映射 1Hz)', initialRisk: 'high_risk', state: 'active', isTrap: true },
                    { id: 't2', source: 'Precise GPS\n(精确常驻定位)', dest: 'Ad Network\n(广告网络 1Hz)', initialRisk: 'high_risk', state: 'active', isTrap: true }
                ];
                break;
            case 4:
                traps = [
                    { id: 't1', source: 'Health History\n(完整健康史)', dest: 'Paramedic 911\n(急救中心)', initialRisk: 'blocked', state: 'blocked', isTrap: true },
                    { id: 't2', source: 'Medications\n(当前药物)', dest: 'Paramedic 911\n(急救中心)', initialRisk: 'blocked', state: 'blocked', isTrap: true }
                ];
                break;
            case 5:
                traps = [
                    { id: 't1', source: 'Health Risk\n(健康风险)', dest: 'Insurance ADM\n(保险AI画像)', initialRisk: 'high_risk', state: 'active', isTrap: true },
                    { id: 't2', source: 'Credit Score\n(健康信用)', dest: 'Broker ADM\n(经纪AI画像)', initialRisk: 'high_risk', state: 'active', isTrap: true }
                ];
                break;
            case 6:
                traps = [
                    { id: 't1', source: 'DNA Sequence\n(DNA序列)', dest: 'Genetic Archive\n(基因档案)', initialRisk: 'purple', state: 'active', isTrap: true },
                    { id: 't2', source: 'Saliva Sample\n(唾液样本)', dest: 'Genetic Archive\n(基因档案)', initialRisk: 'purple', state: 'active', isTrap: true }
                ];
                break;
        }

        const shuffledPool = [...DISTRACTOR_POOL].sort(() => 0.5 - Math.random()).slice(0, 9);
        const distractors: FlowData[] = shuffledPool.map((d, index) => ({
            id: `noise_${index}`,
            source: d.source,
            dest: d.dest,
            initialRisk: getRandomInitialRisk(),
            state: taskId === 4 ? 'blocked' : getRandomNoiseState(),
            isTrap: false
        }));

        let combinedFlows = [...traps, ...distractors];
        combinedFlows = combinedFlows.sort(() => 0.5 - Math.random());

        setFlows(combinedFlows);
    }, [taskId]);

    const handleFlowAction = async (flowId: string, actionType: 'block' | 'modulate' | 'emergency' | 'ldp' | 'remove_ldp') => {
        const flow = flows.find(f => f.id === flowId);
        if (!flow) return;

        let isCorrectAction = false;
        let isError = false;
        let newState: FlowState = flow.state;

        if (flow.isTrap) {
            if (taskId === 1 && actionType === 'block') {
                newState = flow.state === 'blocked' ? 'active' : 'blocked';
                isCorrectAction = newState === 'blocked';
            }
            else if (taskId === 2) {
                if (actionType === 'ldp') { isCorrectAction = true; newState = 'ldp'; }
                else if (actionType === 'remove_ldp') { isCorrectAction = false; newState = 'active'; }
            }
            else if (taskId === 3 && actionType === 'modulate') {
                newState = flow.state === 'low_freq' ? 'active' : 'low_freq';
                isCorrectAction = newState === 'low_freq';
            }
            else if (taskId === 4 && actionType === 'emergency') {
                isCorrectAction = true; newState = 'emergency_active';
            }
            else if (taskId === 5 && actionType === 'block') {
                newState = flow.state === 'blocked' ? 'active' : 'blocked';
                isCorrectAction = newState === 'blocked';
            }
            else if (taskId === 6 && actionType === 'block') {
                newState = flow.state === 'severed' ? 'active' : 'severed';
                isCorrectAction = newState === 'severed';
            }
        } else {
            isError = true;
            if (actionType === 'ldp') newState = 'ldp';
            else if (actionType === 'remove_ldp') newState = 'active';
            else {
                newState = (flow.state === 'active') ? 'blocked' : 'active';
            }
        }

        const response = await PrivacyBridge.invokeInterceptor(flow.id, actionType === 'ldp', flow.isTrap);
        setSyncLatency(response.latencyMs);

        const updatedFlows = flows.map(f => f.id === flowId ? { ...f, state: newState } : f);
        setFlows(updatedFlows);

        if (onInteraction) onInteraction({ isCorrect: isCorrectAction, isError, latency: response.latencyMs });
    };

    const triggerEmergencyBreakGlass = async () => {
        const response = await PrivacyBridge.invokeInterceptor('emergency_override', false, true);
        setSyncLatency(response.latencyMs);
        setFlows(prev => prev.map(f => f.isTrap ? { ...f, state: 'emergency_active' } : f));
        if (onInteraction) onInteraction({ isCorrect: true, isError: false, latency: response.latencyMs });
    };

    const getMissionReminderText = () => {
        switch (taskId) {
            case 1: return "Block 2 targets -> [Hormone Data] & [Blood Pressure]\n拦截2个目标 ->【激素数据】与【血压记录】";
            case 2: return "Enable LDP for 2 targets -> [Biometrics] & [Gait Analysis]\n为2个目标开启LDP ->【生物特征】与【步态分析】";
            case 3: return "Modulate 2 targets to 0.01Hz -> [Ambient Mic] & [Precise GPS]\n将2个目标降频 ->【环境麦克风】与【精确常驻定位】";
            case 4: return "Tap the RED button to ACTIVATE EMERGENCY OVERRIDE\n点击红色按钮，激活全局紧急破窗";
            case 5: return "Block 2 targets -> [Health Risk] & [Credit Score]\n拦截2个目标 ->【健康风险】与【健康信用】";
            case 6: return "Sever 2 targets -> [DNA Sequence] & [Saliva Sample]\n物理切断2个目标 ->【DNA序列】与【唾液样本】";
            default: return "";
        }
    };

    const renderPipeline = (flow: FlowData) => {
        let lineColor = '#4CAF50';
        let lineStyle: 'solid' | 'dashed' = 'solid';
        let lineThickness = 4;
        let statusText = 'ACTIVE\n(活跃)';

        if (flow.state === 'severed') {
            lineColor = '#BDBDBD';
            lineStyle = 'dashed';
            lineThickness = 2;
            statusText = 'SEVERED\n(彻底切断)';
        } else if (flow.state === 'emergency_active') {
            lineColor = '#9C27B0';
            lineStyle = 'dashed';
            lineThickness = 4;
            statusText = 'EMERGENCY\n(紧急放行)';
        } else if (flow.state === 'blocked') {
            lineColor = '#9E9E9E';
            lineStyle = 'solid';
            lineThickness = 4;
            statusText = 'BLOCKED\n(已拦截)';
        } else if (flow.state === 'ldp') {
            lineColor = '#4CAF50';
            lineStyle = 'dashed';
            lineThickness = 3;
            statusText = 'LDP BLURRED\n(差分脱敏)';
        } else if (flow.state === 'low_freq') {
            lineColor = '#FF9800';
            lineStyle = 'dashed';
            lineThickness = 3;
            statusText = '0.01Hz FREQ\n(低频调节)';
        } else if (flow.initialRisk === 'high_risk') {
            lineColor = '#FF9800';
            lineStyle = 'solid';
            lineThickness = 4;
            statusText = 'HIGH RISK\n(高风险)';
        } else if (flow.initialRisk === 'purple') {
            lineColor = '#9C27B0';
            lineStyle = 'solid';
            lineThickness = 4;
            statusText = 'SENSITIVE\n(极度敏感)';
        } else {
            lineColor = '#4CAF50';
            lineStyle = 'solid';
            lineThickness = 4;
        }

        const isSelected = taskId === 2 && selectedNodeId === flow.id;

        return (
            <View key={flow.id} style={styles.pipelineContainer}>
                {/* 左侧节点 */}
                <View style={styles.nodeBox}>
                    <Text style={styles.nodeText}>{flow.source}</Text>
                </View>

                {/* 核心管道与状态区 */}
                <View style={styles.flowPath}>
                    <View style={[styles.line, { borderColor: lineColor, borderStyle: lineStyle, borderWidth: lineThickness }]} />

                    {/* 【修复】原生柔性排列容器，彻底消除绝对定位的遮挡问题 */}
                    <View style={styles.peaWrapper}>
                        <TouchableOpacity
                            style={[
                                styles.interceptorBtn,
                                { backgroundColor: lineColor },
                                isSelected && { borderColor: '#FFC107', borderWidth: 3, transform: [{ scale: 1.25 }] }
                            ]}
                            onPress={() => {
                                if (taskId === 2) {
                                    setSelectedNodeId(flow.id);
                                }
                                else if (taskId === 3) handleFlowAction(flow.id, 'modulate');
                                else if (taskId === 4) handleFlowAction(flow.id, 'emergency');
                                else handleFlowAction(flow.id, 'block');
                            }}
                        >
                            <Text style={styles.interceptorText}>PEA</Text>
                        </TouchableOpacity>

                        {/* 状态文字现在位于文档流内，自然向下延展 */}
                        <Text style={[styles.statusText, { color: lineColor }]}>{statusText}</Text>
                    </View>
                </View>

                {/* 右侧节点 */}
                <View style={[styles.nodeBox, flow.state === 'blocked' || flow.state === 'severed' ? styles.nodeDeactivated : {}]}>
                    <Text style={styles.nodeText}>{flow.dest}</Text>
                </View>
            </View>
        );
    };

    const activeNodeData = flows.find(f => f.id === selectedNodeId);
    const isCurrentNodeLdp = activeNodeData ? activeNodeData.state === 'ldp' : false;

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: '#ffffff' }}
            contentContainerStyle={{ padding: 12, paddingBottom: 60 }}
            stickyHeaderIndices={[1]}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.missionBox}>
                <Text style={styles.missionTitle}>🎯 Target Reminder / 目标提示</Text>
                <Text style={styles.missionText}>{getMissionReminderText()}</Text>
            </View>

            {taskId === 2 ? (
                <View style={styles.stickyHeaderContainer}>
                    <View style={[styles.settingRow, !selectedNodeId && { backgroundColor: '#f0f0f0', elevation: 0, shadowOpacity: 0 }]}>
                        <View style={styles.textWrapper}>
                            <Text style={[styles.label, !selectedNodeId && { color: '#999' }]}>Local Differential Privacy (差分隐私)</Text>
                            <Text style={[styles.desc, { color: selectedNodeId ? '#1565C0' : '#D32F2F', fontWeight: 'bold' }]}>
                                {selectedNodeId
                                    ? `Controlling: ${activeNodeData?.source.replace(/\n/g, ' ')}`
                                    : "⚠️ Select a target PEA node below first (请先在下方选中节点)"}
                            </Text>
                        </View>
                        <Switch
                            disabled={!selectedNodeId}
                            value={isCurrentNodeLdp}
                            onValueChange={(val) => {
                                if (selectedNodeId) handleFlowAction(selectedNodeId, val ? 'ldp' : 'remove_ldp');
                            }}
                            trackColor={{ true: '#81C784', false: '#ccc' }}
                            thumbColor={!selectedNodeId ? '#f4f3f4' : (isCurrentNodeLdp ? '#4CAF50' : '#f4f3f4')}
                        />
                    </View>
                </View>
            ) : (
                <View style={{ height: 0, opacity: 0 }} />
            )}

            <View style={{ zIndex: 1, marginTop: 5 }}>
                {taskId === 4 && (
                    <TouchableOpacity style={styles.breakGlassBtn} onPress={triggerEmergencyBreakGlass}>
                        <Text style={styles.breakGlassText}>⚠️ ACTIVATE EMERGENCY OVERRIDE</Text>
                        <Text style={[styles.breakGlassText, {fontSize: 12, marginTop: 4}]}>激活全局紧急破窗放行机制</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.diagramArea}>
                    <Text style={styles.diagramHeader}>PEA Data Flow Visualization</Text>
                    <Text style={styles.diagramSubHeader}>Tap the middle 'PEA' node to intercept or modulate.</Text>
                    <View style={{height: 20}} />
                    {flows.map(renderPipeline)}
                </View>

                {syncLatency !== null && (
                    <View style={styles.latencyBox}>
                        <Text style={styles.latencyText}>✓ OS Middleware Synced: API enforced in {syncLatency}ms</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    missionBox: { backgroundColor: '#FFF3E0', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#FFB74D', marginBottom: 15, elevation: 1 },
    missionTitle: { fontSize: 13, fontWeight: 'bold', color: '#E65100', marginBottom: 6 },
    missionText: { fontSize: 13, color: '#333', fontWeight: 'bold', lineHeight: 20 },

    stickyHeaderContainer: {
        backgroundColor: '#ffffff',
        paddingTop: 5,
        paddingBottom: 15,
        zIndex: 999,
        elevation: 10
    },
    settingRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#fff', padding: 15, borderRadius: 12,
        borderWidth: 1, borderColor: '#ddd',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6,
        elevation: 5
    },

    textWrapper: { flex: 1, paddingRight: 10 },
    label: { fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    desc: { fontSize: 11, color: '#666' },
    breakGlassBtn: { backgroundColor: '#D32F2F', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
    breakGlassText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    diagramArea: { backgroundColor: '#fff', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#eee', elevation: 2 },
    diagramHeader: { fontSize: 16, fontWeight: 'bold', color: '#1565C0', textAlign: 'center' },
    diagramSubHeader: { fontSize: 11, color: '#757575', textAlign: 'center' },

    // 【修改点】整体管道容器设为 flex-start 对齐，间距调小
    pipelineContainer: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
    // 【修改点】节点固定高度 65px，使得中心点严格位于 Y轴 32.5px 处
    nodeBox: { width: '28%', height: 65, backgroundColor: '#F5F5F5', padding: 5, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center', elevation: 1 },
    nodeDeactivated: { opacity: 0.4 },
    nodeText: { fontSize: 10, fontWeight: 'bold', color: '#333', textAlign: 'center', lineHeight: 14 },

    flowPath: { flex: 1, alignItems: 'center', paddingHorizontal: 5 },
    // 【修改点】管道中心线绝对定位于顶部 32px 处，精准穿透节点中心
    line: { position: 'absolute', width: '100%', top: 32, zIndex: 0 },

    // 【修改点】柔性列容器：包裹 PEA 按钮和下方文本。
    // marginTop: 14 的作用是让高度为 36 的按钮（18半径）恰好落在 Y轴 32 处 (14+18=32)
    peaWrapper: { alignItems: 'center', zIndex: 1, marginTop: 14 },
    interceptorBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff', elevation: 3 },
    interceptorText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

    // 【修改点】废弃所有绝对定位，设置 marginTop 保证始终紧贴按钮正下方
    statusText: { fontSize: 9, fontWeight: 'bold', textAlign: 'center', lineHeight: 12, marginTop: 6, width: 85 },

    latencyBox: { marginTop: 15, backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#A5D6A7' },
    latencyText: { color: '#2E7D32', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }
});