import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DynamicDashboard } from '../../components/DynamicDashboard';
import { StandardSettings } from '../../components/StandardSettings';
import { useExperiment } from '../../src/context/ExperimentContext';

const EXPERIMENT_TASKS = [
    {
        id: 1,
        // 对应 RQ3: Interaction Efficiency & Time Cost (通过橙色高亮降低视觉搜索时间)
        // 对应 RP Table 3 (Scenario B: Third-party Deep Processing)
        title: 'Task 1: Cross-border Privacy Audit (Visual Identification)',
        scenarioTitle: 'Scenario 1: Overseas Data Transfer',
        scenarioText: '系统检测到您的“激素治疗(Hormone Therapy)”敏感数据正被请求进行跨境传输，这违反了本地数据主权原则。\n\n在动态面板中，高风险的跨境数据流将以【橙色警告路径 (Orange Flow)】显示。',
        instruction: '请在数据流图中快速识别【橙色数据流】，并点击以在底层物理阻断它。',
    },
    {
        id: 2,
        // 对应 RQ1: Cognitive Load (测试动态视觉反馈能否降低心理负荷)
        // 对应 RP Section 7.3: Local Differential Privacy (LDP) Visualization
        title: 'Task 2: Local Differential Privacy (The Blurry Path)', 
        scenarioTitle: 'Scenario 2: Data De-identification',
        scenarioText: '某研究机构需要您的运动步态和心率数据。您希望协助研究，但不想暴露精确个体身份。\n\n系统支持本地差分隐私(LDP)，可在数据离开设备前加入噪点。',
        instruction: '请找到生物特征数据流，开启“模糊处理 (LDP)”。观察其如何变成【模糊路径 (Blurry Path)】并将警报降级为绿色。',
    },
    {
        id: 3,
        // 对应 RQ2: Perceived Behavioral Control (测试对底层传感器的细粒度控制感)
        // 对应 RP Section 7.2: Granular Strategies (Sampling rate modulation)
        title: 'Task 3: Granular Sensor Modulation (Native Interception)',
        scenarioTitle: 'Scenario 3: Background GPS & Microphone',
        scenarioText: '一个“城市压力映射(Urban Stress Mapping)”项目正在高频度采集您的后台位置和环境音，这可能导致行动轨迹泄露。\n\n隐私拦截中间件允许您在不完全关闭服务的情况下，从底层限制传感器的精度。',
        instruction: '请找到 GPS 节点，将其采样率从高频(1Hz)调节为低频(0.01Hz)以模糊轨迹。',
    },
    {
        id: 4,
        // 对应 RQ3 & 交互对比 (测试在极端情况下的撤回/授权效率)
        // 对应 RP Table 3 (Scenario A: Emergency Break-glass)
        title: 'Task 4: Emergency Break-glass Override',
        scenarioTitle: 'Scenario 4: MEDICAL EMERGENCY',
        scenarioText: '紧急情况 (CRITICAL)：您正经历严重的过敏性休克，急救人员需要立即读取您之前屏蔽的完整健康史。\n\n根据 GDPR 第6条“保护生命攸关的利益(Vital Interests)”，您需要打破常规限制。',
        instruction: '请使用“紧急破窗机制(Break-glass)”，一键暂时覆盖所有隐私拦截，将精确数据放行给急救中心。',
    },
    {
        id: 5,
        // 对应 RQ1 & 语义鸿沟 (Semantic Gap)
        // 对应 RP Section 3.2 & 3.4 (APP 1.7 自动化决策透明度)
        title: 'Task 5: Automated Decision-Making (ADM) Transparency',
        scenarioTitle: 'Scenario 5: Algorithmic Profiling',
        scenarioText: '保险公司在未经人工审核的情况下，使用黑盒算法(AI)评估您的“健康风险评分”，并可能据此提高您的保费。\n\n最新的隐私法案要求应用程序必须对这类自动化决策(ADM)提供明确的拒绝权。',
        instruction: '请识别出通向【保险经纪(Insurance Broker)】的算法分析(AI Profiling)数据流，并彻底切断它。',
    },
    {
        id: 6,
        // 对应 RQ2: System Trust & API Blockade (测试“被遗忘权”的彻底执行)
        // 对应 RP Section 5.2 (The Architectural Control Paradox)
        title: 'Task 6: Sensor-Level API Blockade (Right to Erasure)',
        scenarioTitle: 'Scenario 6: Revoke Consent & Sever Pipeline',
        scenarioText: '您决定退出基因数据(Genetic Data)分析计划。为了行使“被遗忘权”，仅仅修改表面设置是不够的，必须通过底层中间件彻底销毁管道。\n\n您的操作将直接触发 Native 层的强制隔离。',
        instruction: '找到基因注册表连接，点击撤回授权。请验证该数据管道(Pipeline)是否在视觉上已被【彻底物理截断 (Severed)】。',
    }
];

export default function ExperimentScreen() {
    // ... [保留原本的 React 状态和函数定义完全不变, startCurrentTask, handleTaskComplete, handleInteraction 等]
    const router = useRouter();
    const { group, setGroup, startTask, finishTask } = useExperiment();

    const [taskIndex, setTaskIndex] = useState(0);
    const [experimentState, setExperimentState] = useState<'briefing' | 'active'>('briefing');
    const [startTime, setStartTime] = useState<number | null>(null);
    const [taskResults, setTaskResults] = useState<{taskId: number, duration: number, isCorrect: boolean, errors: number}[]>([]);
    const [currentAccuracy, setCurrentAccuracy] = useState<boolean>(false);
    const [currentErrors, setCurrentErrors] = useState<number>(0);

    const currentTask = EXPERIMENT_TASKS[taskIndex];

    const startCurrentTask = () => {
        setStartTime(Date.now());
        setCurrentAccuracy(false); 
        setCurrentErrors(0);
        setExperimentState('active');
        startTask(); 
    };

    const handleTaskComplete = () => {
        if (!startTime) return;
        const duration = (Date.now() - startTime) / 1000; 
        
        const newResults = [...taskResults, { taskId: currentTask.id, duration, isCorrect: currentAccuracy, errors: currentErrors }];
        setTaskResults(newResults);
        finishTask(); 

        if (taskIndex < EXPERIMENT_TASKS.length - 1) {
            setTaskIndex(taskIndex + 1);
            setExperimentState('briefing');
        } else {
            router.push({
                pathname: '/scoring',
                params: { group: group, results: JSON.stringify(newResults) }
            }); 
        }
    };

    const handleInteraction = (res: { isCorrect: boolean, isError: boolean }) => {
        if (res.isCorrect) setCurrentAccuracy(true);
        if (res.isError) setCurrentErrors(prev => prev + 1);
    };

    const renderBriefing = () => (
        <View style={[styles.briefingContainer, currentTask.id === 2 && styles.emergencyBriefing]}>
            <Text style={[styles.scenarioTitle, currentTask.id === 2 && {color: '#fff'}]}>{currentTask.scenarioTitle}</Text>
            <Text style={[styles.scenarioText, currentTask.id === 2 && {color: '#fff'}]}>{currentTask.scenarioText}</Text>
            <TouchableOpacity style={[styles.startBtn, currentTask.id === 2 && {backgroundColor: '#fff'}]} onPress={startCurrentTask}>
                <Text style={[styles.startBtnText, currentTask.id === 2 && {color: '#D32F2F'}]}>Start {currentTask.title}</Text>
            </TouchableOpacity>
        </View>
    );

    const renderExperimentStimulus = () => {
        switch (group) {
            case 'A':
                return (
                    <View style={styles.groupWrapper}>
                        <View style={[styles.taskHeader, { backgroundColor: '#E0E0E0' }]}>
                            <Text style={styles.taskTitle}>Group A: OS Standard Settings</Text>
                            <Text style={styles.taskInstruction}>{currentTask.instruction}</Text>
                        </View>
                        <StandardSettings taskId={currentTask.id} onInteraction={handleInteraction} />
                    </View>
                );
            case 'B':
                return (
                    <View style={styles.groupWrapper}>
                        <View style={[styles.taskHeader, { backgroundColor: '#E3F2FD' }]}>
                            <Text style={styles.taskTitle}>Group B: Dynamic PEA Dashboard</Text>
                            <Text style={styles.taskInstruction}>{currentTask.instruction}</Text>
                        </View>
                        <DynamicDashboard taskId={currentTask.id} onInteraction={handleInteraction} />
                    </View>
                );
            case 'C':
                return (
                    <View style={styles.groupWrapper}>
                        <View style={[styles.taskHeader, { backgroundColor: '#FFF3E0' }]}>
                            <Text style={styles.taskTitle}>Group C: Enhanced Compliance Text</Text>
                            <Text style={styles.taskInstruction}>{currentTask.instruction}</Text>
                        </View>
                        <StandardSettings taskId={currentTask.id} variant="text-heavy" onInteraction={handleInteraction} />
                    </View>
                );
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
            {experimentState === 'briefing' && taskIndex === 0 && (
                <View style={styles.routerNav}>
                    <Text style={styles.navTitle}>Researcher Control</Text>
                    <View style={styles.buttonRow}>
                        {(['A', 'B', 'C'] as const).map(g => (
                            <TouchableOpacity key={g} style={[styles.navButton, group === g && styles.navActive]} onPress={() => setGroup(g)}>
                                <Text style={group === g ? styles.navTextActive : styles.navText}>Group {g}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            <View style={styles.progressContainer}>
                <Text style={styles.progressText}>Task {taskIndex + 1} of {EXPERIMENT_TASKS.length}</Text>
            </View>

            <View style={styles.contentArea}>
                {experimentState === 'briefing' ? renderBriefing() : renderExperimentStimulus()}
            </View>

            {experimentState === 'active' && (
                <View style={styles.actionArea}>
                    <TouchableOpacity style={styles.completeBtn} onPress={handleTaskComplete}>
                        <Text style={styles.completeBtnText}>Confirm Action & Next</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

// ... [styles 保持原样]
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    progressContainer: { padding: 10, alignItems: 'center', backgroundColor: '#e0e0e0' },
    progressText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
    briefingContainer: { padding: 20, backgroundColor: '#fff', borderRadius: 12, elevation: 3 },
    emergencyBriefing: { backgroundColor: '#D32F2F' }, 
    scenarioTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#1976D2' },
    scenarioText: { fontSize: 16, lineHeight: 24, marginBottom: 15, color: '#333' },
    startBtn: { backgroundColor: '#1976D2', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    startBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    routerNav: { backgroundColor: '#333', padding: 15 },
    navTitle: { color: '#FFC107', fontSize: 12, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-around' },
    navButton: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: '#555' },
    navActive: { backgroundColor: '#FFC107', borderColor: '#FFC107' },
    navText: { color: '#ccc', fontWeight: 'bold' },
    navTextActive: { color: '#333', fontWeight: 'bold' },
    contentArea: { flex: 1, padding: 15 },
    groupWrapper: { flex: 1, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
    taskHeader: { padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
    taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    taskInstruction: { fontSize: 14, color: '#555', marginTop: 5, fontWeight: 'bold' },
    actionArea: { padding: 30, backgroundColor: '#fff', alignItems: 'center' },
    completeBtn: { backgroundColor: '#4CAF50', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30 },
    completeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});