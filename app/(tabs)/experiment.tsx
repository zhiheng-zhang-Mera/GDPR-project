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
        scenarioTitle: 'Scenario 1: Overseas Data Transfer',
        scenarioText: 'You are tracking sensitive hormone levels. The app updated its policy.\n\nYour task is to locate the settings and DISABLE any third-party services processing data OUTSIDE your local jurisdiction (Cross-border transfers).',
        instruction: 'Identify and BLOCK the non-compliant overseas data flow.',
    },
    {
        id: 2,
        title: 'Task 2: Emergency Break-glass',
        scenarioTitle: 'Scenario 2: MEDICAL EMERGENCY',
        scenarioText: 'CRITICAL: You are experiencing a severe allergic reaction and an ambulance has been called.\n\nYour task is to quickly override previous privacy blocks and GRANT emergency responders access to your precise location and medical history.',
        instruction: 'Identify and ENABLE the Emergency Responder data flow.',
    },
    {
        id: 3,
        title: 'Task 3: Right to Erasure',
        scenarioTitle: 'Scenario 3: Genetic Data Deletion',
        scenarioText: 'You have decided to leave a specialized DNA analysis program. To fully protect your genetic privacy, you must exercise your "Right to be Forgotten".\n\nYour task is to locate and DESTROY your historical DNA records stored in the remote registry.',
        instruction: 'Identify and SEVER the Genetic Registry connection.',
    },
    {
        id: 4,
        title: 'Task 4: Automated Decision-Making (ADM)',
        scenarioTitle: 'Scenario 4: Algorithmic Profiling',
        scenarioText: 'The app introduced a new algorithm that calculates your "Health Risk Score" and shares it with third-party insurance brokers without explicit human oversight.\n\nYour task is to OPT-OUT of this automated insurance profiling.',
        instruction: 'Identify and BLOCK the Insurance Broker AI profiling.',
    }
];

export default function ExperimentScreen() {
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
        if (res.isError) setCurrentErrors(prev => prev + 1); // 记录误操作次数
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