import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DynamicDashboard } from '../../components/DynamicDashboard';
import { StandardSettings } from '../../components/StandardSettings';
import { useExperiment } from '../../src/context/ExperimentContext';

const EXPERIMENT_TASKS = [
    {
        id: 1,
        title: 'Task 1: Cross-border Privacy Audit',
        scenarioTitle: 'Scenario 1: Overseas Data Transfer (跨境数据传输)',
        scenarioText: {
            A: 'Permission Request: Third-party apps are requesting access to your sensitive Hormone & Blood Pressure data. \n\n权限请求：系统检测到第三方应用正请求访问您的激素与血压数据。',
            B: 'System detects your sensitive data (Hormone & Blood Pressure) are being requested for cross-border transfer. \n\n系统检测到您的敏感数据（激素与血压）正被请求跨境传输。在动态面板中，高风险流将以【橙色路径】显示。',
            C: 'Privacy Policy Update: According to GDPR Article 46, we are updating our cross-border data transfer policy. \n\n隐私政策更新：根据GDPR第46条关于跨境传输的规定，我们正更新敏感健康数据的处理条款。'
        },
        instruction: {
            A: 'Go to Settings, find BOTH sensitive permissions, and toggle them off. \n请在标准列表中找到这【两个】敏感权限并将它们关闭。',
            B: 'Please identify ALL [Orange Flows] and tap to block them physically. \n请在数据流图中快速识别【所有橙色数据流】（共两个），并点击以物理阻断。',
            C: 'Carefully review the Terms of Service and uncheck ALL cross-border consent boxes. \n请在冗长的服务条款中找到并取消勾选【所有】跨境传输同意框。'
        }
    },
    {
        id: 2,
        title: 'Task 2: Local Differential Privacy',
        scenarioTitle: 'Scenario 2: Data De-identification (数据脱敏与去标识化)',
        scenarioText: {
            A: 'New Feature: Device-level Data Anonymization is now available for your Biometric and Gait data. \n\n系统新功能：系统现已支持针对您的生物特征与步态数据的设备级匿名化处理。',
            B: 'Research institutes need your Biometrics and Gait data. Select their specific nodes to enable LDP. \n\n研究机构需要您的生物与步态数据。请单独选中这些流的节点并开启差分隐私(LDP)。',
            C: 'Consent Required: Please read our updated Data Processing Agreement (DPA) regarding noise-addition algorithms. \n\n需要您的同意：请仔细阅读关于实施差分隐私噪点算法的数据处理协议 (DPA)。'
        },
        instruction: {
            A: 'Open Settings and turn on BOTH "Anonymization" toggles. \n请在列表中找到并打开【两个】数据匿名化开关。',
            B: 'Tap the PEA node of BOTH target streams to SELECT them, then use the top switch to enable LDP. \n请先点击【两个】目标数据流的 PEA 节点进行选中，然后再使用顶部开关为其开启 LDP。',
            C: 'Scroll through the DPA and sign BOTH LDP consent sections. \n请在协议中向下滚动，并在【两个】LDP专项同意部分签字确认。'
        }
    },
    {
        id: 3,
        title: 'Task 3: Granular Sensor Modulation',
        scenarioTitle: 'Scenario 3: Background Tracking (后台定位与麦克风)',
        scenarioText: {
            A: 'Location & Microphone Services: High-frequency background usage detected. \n\n定位与麦克风服务：系统检测到正在进行高频后台访问。',
            B: 'Apps are collecting background Location & Mic data at high frequency (1Hz). \n\n应用正在高频度(1Hz)采集后台定位与麦克风数据。',
            C: 'Data Minimization Notice: As per GDPR Article 5(1)(c), you may exercise your right to restrict granularity. \n\n数据最小化通知：根据GDPR第5(1)(c)条，您有权限制后台数据收集精度。'
        },
        instruction: {
            A: 'Navigate to App Permissions and lower the frequency for BOTH Location and Microphone. \n请进入权限管理，降低定位与麦克风这【两个】传感器的频率。',
            B: 'Tap the PEA nodes to modulate BOTH sampling rates to low frequency (0.01Hz). \n点击 PEA 节点将【两个】传感器的采样率调节为低频 (0.01Hz)。',
            C: 'Locate BOTH "Data Granularity Control" clauses and submit restriction requests. \n定位【两个】“数据粒度控制”条款并分别提交限制请求。'
        }
    },
    {
        id: 4,
        title: 'Task 4: Emergency Break-glass Override',
        scenarioTitle: 'Scenario 4: MEDICAL EMERGENCY (紧急医疗情况)',
        scenarioText: {
            A: 'Medical ID Access Request: First responders are attempting to access your medical profile. \n\n医疗急救卡访问：急救人员正试图访问您的医疗档案。',
            B: 'CRITICAL: You are in a medical emergency. Use the Break-glass button to override all privacy blocks. \n\n紧急情况 (CRITICAL)：您正经历医疗急救，请使用破窗按钮暂时覆盖所有隐私拦截。',
            C: 'Vital Interests Exemption: Under GDPR Article 6(1)(d), processing is strictly necessary in an emergency. \n\n切身利益豁免：根据GDPR第6(1)(d)条，在紧急情况下必须处理您的健康数据。'
        },
        instruction: {
            A: 'Tap "Allow" on the Emergency Access system prompt. \n请在“允许紧急访问”提示框上操作允许。',
            B: 'Use the global "Break-glass" button to let the precise data pass. \n请使用全局“紧急破窗”按钮将精确数据一次性放行。',
            C: 'Read the emergency waiver statement and execute the formal override authorization. \n阅读紧急知情豁免声明，并执行覆盖授权签署。'
        }
    },
    {
        id: 5,
        title: 'Task 5: Automated Decision-Making Transparency',
        scenarioTitle: 'Scenario 5: Algorithmic Profiling (算法画像与自动决策)',
        scenarioText: {
            A: 'Health Profiling: Automated evaluations (Insurance & Credit) are currently active. \n\n健康画像提醒：您的保险与信用自动评估功能目前已激活。',
            B: 'AIs are profiling your Insurance and Health Credit without human review. \n\n保险与信用AI正在无人工审核的情况下对您进行风险画像。',
            C: 'Automated Decision-Making (ADM): You are subject to decisions based solely on automated processing. \n\n自动决策(ADM)通知：您正在接受完全基于自动处理的决策（受GDPR第22条管辖）。'
        },
        instruction: {
            A: 'Disable BOTH "Automated Evaluation" options in the settings. \n请在设置中禁用【两个】自动评估画像选项。',
            B: 'Identify BOTH AI Profiling data flows and completely block them. \n请识别出【两个】算法分析数据流，并彻底切断它们。',
            C: 'Find BOTH "Opt-out of ADM" legal provisions and formally object. \n在超长用户协议中找到【两处】退出条款并提出正式异议。'
        }
    },
    {
        id: 6,
        title: 'Task 6: Sensor-Level API Blockade',
        scenarioTitle: 'Scenario 6: Right to Erasure (被遗忘权与彻底删除)',
        scenarioText: {
            A: 'Genetic Data Program: You are currently enrolled in the data sharing program. \n\n基因数据计划：您目前在系统记录中显示为已加入数据共享计划。',
            B: 'You want to withdraw from a genetic & saliva program. Sever BOTH pipelines visually. \n\n您决定退出基因与唾液计划。必须彻底销毁【两个】管道以行使被遗忘权。',
            C: 'Right to Erasure: You have the right to obtain the erasure of personal data without undue delay. \n\n被遗忘权行使：根据GDPR第17条，您有权要求彻底删除与您相关的个人数据。'
        },
        instruction: {
            A: 'Scroll to the bottom of the settings and tap "Delete My Account and Data". \n请滑动到设置最底部，点击“删除我的账户及数据”按钮。',
            B: 'Revoke consent and verify BOTH pipelines are visually [Severed]. \n撤回授权并验证【两个】数据管道在视觉上已被【彻底物理截断 (Severed)】。',
            C: 'Find the Data Subject Access Request (DSAR) link buried at the bottom. \n请在底部密集的政策条款中，找到并点击隐藏的“数据主体请求(DSAR)”链接。'
        }
    }
];

export default function ExperimentScreen() {
    const router = useRouter();
    const { group, setGroup, startTask, finishTask } = useExperiment();

    const [taskIndex, setTaskIndex] = useState(0);
    const [experimentState, setExperimentState] = useState<'briefing' | 'active'>('briefing');
    const [startTime, setStartTime] = useState<number | null>(null);
    const [taskResults, setTaskResults] = useState<any[]>([]);

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

    const handleInteraction = (res: { isCorrect: boolean, isError: boolean, latency: number }) => {
        if (res.isCorrect) setCurrentAccuracy(true);
        if (res.isError) setCurrentErrors(prev => prev + 1);
    };

    const renderBriefing = () => {
        const currentScenarioText = currentTask.scenarioText[group as keyof typeof currentTask.scenarioText];
        return (
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
                <View style={[styles.briefingContainer, currentTask.id === 4 && styles.emergencyBriefing]}>
                    <Text style={[styles.scenarioTitle, currentTask.id === 4 && {color: '#fff'}]}>{currentTask.scenarioTitle}</Text>
                    <Text style={[styles.scenarioText, currentTask.id === 4 && {color: '#fff'}]}>{currentScenarioText}</Text>
                    <TouchableOpacity style={[styles.startBtn, currentTask.id === 4 && {backgroundColor: '#fff'}]} onPress={startCurrentTask}>
                        <Text style={[styles.startBtnText, currentTask.id === 4 && {color: '#D32F2F'}]}>Start {currentTask.title}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    };

    const renderExperimentStimulus = () => {
        const currentInstruction = currentTask.instruction[group as keyof typeof currentTask.instruction];
        switch (group) {
            case 'A': return (<View style={styles.groupWrapper}><View style={[styles.taskHeader, { backgroundColor: '#E0E0E0' }]}><Text style={styles.taskTitle}>Group A: OS Standard</Text><Text style={styles.taskInstruction}>{currentInstruction}</Text></View><StandardSettings taskId={currentTask.id} onInteraction={handleInteraction} /></View>);
            case 'B': return (<View style={styles.groupWrapper}><View style={[styles.taskHeader, { backgroundColor: '#E3F2FD' }]}><Text style={styles.taskTitle}>Group B: Dynamic PEA</Text><Text style={styles.taskInstruction}>{currentInstruction}</Text></View><DynamicDashboard taskId={currentTask.id} onInteraction={handleInteraction} /></View>);
            case 'C': return (<View style={styles.groupWrapper}><View style={[styles.taskHeader, { backgroundColor: '#FFF3E0' }]}><Text style={styles.taskTitle}>Group C: Bureaucratic Text</Text><Text style={styles.taskInstruction}>{currentInstruction}</Text></View><StandardSettings taskId={currentTask.id} variant="text-heavy" onInteraction={handleInteraction} /></View>);
        }
    };

    // 【核心修复】：将外层的 ScrollView 改为刚性的 View，消除嵌套滚动冲突
    return (
        <View style={styles.container}>
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

            {/* contentArea 赋予 flex: 1，强制内部的子组件（如 DynamicDashboard）在自己的视口内独立滚动 */}
            <View style={styles.contentArea}>
                {experimentState === 'briefing' ? renderBriefing() : renderExperimentStimulus()}
            </View>

            {/* actionArea 现在脱离了滚动文档流，永远悬浮固定在屏幕最底部，这是完美的测试 UX */}
            {experimentState === 'active' && (
                <View style={styles.actionArea}>
                    <TouchableOpacity style={styles.completeBtn} onPress={handleTaskComplete}>
                        <Text style={styles.completeBtnText}>Confirm Action & Next</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

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
    contentArea: { flex: 1, padding: 10 },
    groupWrapper: { flex: 1, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
    taskHeader: { padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
    taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    taskInstruction: { fontSize: 14, color: '#D32F2F', marginTop: 5, fontWeight: 'bold' },

    // 底部 Action 按钮的专属固定样式
    actionArea: {
        padding: 15,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#e0e0e0',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 10
    },
    completeBtn: { width: '100%', backgroundColor: '#4CAF50', paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
    completeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});