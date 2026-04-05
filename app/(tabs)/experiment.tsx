import { DynamicDashboard } from '../../components/DynamicDashboard';
import { StandardSettings } from '../../components/StandardSettings';
import { useExperiment } from '../../src/context/ExperimentContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ExperimentScreen() {
    const router = useRouter();
    const { group, setGroup, finishTask } = useExperiment();

    const handleTaskComplete = () => {
        finishTask();
        router.push('/scoring'); // Proceed to NASA-TLX
    };

    // Render completely different UI wrappers based on the Proposal's Table 2
    const renderExperimentStimulus = () => {
        switch (group) {
            case 'A':
                return (
                    <View style={styles.groupWrapper}>
                        <View style={[styles.taskHeader, { backgroundColor: '#E0E0E0' }]}>
                            <Text style={styles.taskTitle}>Group A: Standard OS Settings</Text>
                            <Text style={styles.taskInstruction}>
                                Task: Review your permissions below. Disable any third-party services you find unnecessary.
                            </Text>
                        </View>
                        {/* Native-looking standard toggles */}
                        <StandardSettings />
                    </View>
                );
            case 'B':
                return (
                    <View style={styles.groupWrapper}>
                        <View style={[styles.taskHeader, { backgroundColor: '#E3F2FD', borderColor: '#2196F3', borderWidth: 1 }]}>
                            <Text style={[styles.taskTitle, { color: '#1565C0' }]}>Group B: Dynamic PEA Dashboard</Text>
                            <Text style={styles.taskInstruction}>
                                Task: Identify high-risk cross-border data flows marked in ORANGE. Tap them to invoke an immediate API blockade.
                            </Text>
                        </View>
                        {/* Skia-based dynamic visualizer */}
                        <DynamicDashboard variant="visual" />
                    </View>
                );
            case 'C':
                return (
                    <View style={styles.groupWrapper}>
                        <View style={[styles.taskHeader, { backgroundColor: '#FFF3E0', borderColor: '#FF9800', borderWidth: 1 }]}>
                            <Text style={[styles.taskTitle, { color: '#E65100' }]}>Group C: Enhanced Compliance List</Text>
                            <Text style={styles.taskInstruction}>
                                Task: Read the legal compliance labels carefully. Identify and disable the services that violate regional data residency requirements (e.g., GDPR/PIPL).
                            </Text>
                        </View>
                        {/* In your components, this should be a text-heavy version of settings with legal explanations */}
                        <StandardSettings variant="text-heavy" />
                    </View>
                );
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* Researcher Control Panel (Hidden from actual subjects if needed) */}
            <View style={styles.routerNav}>
                <Text style={styles.navTitle}>Researcher Control: Select RQ Condition</Text>
                <View style={styles.buttonRow}>
                    {(['A', 'B', 'C'] as const).map(g => (
                        <TouchableOpacity
                            key={g}
                            style={[styles.navButton, group === g && styles.navActive]}
                            onPress={() => setGroup(g)}
                        >
                            <Text style={[styles.navText, group === g && styles.navTextActive]}>Group {g}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Render the specific experimental condition */}
            <View style={styles.contentArea}>
                {renderExperimentStimulus()}
            </View>

            {/* Blocking Action to accurately measure task latency (RQ3) */}
            <View style={styles.actionArea}>
                <Text style={styles.actionPrompt}>Have you successfully completed the task instructions above?</Text>
                <TouchableOpacity style={styles.completeBtn} onPress={handleTaskComplete}>
                    <Text style={styles.completeBtnText}>Task Completed: Proceed to Survey</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    scrollContent: { flexGrow: 1 },

    // Researcher Nav
    routerNav: { backgroundColor: '#333', padding: 15, paddingTop: 50 },
    navTitle: { color: '#FFC107', fontSize: 12, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-around' },
    navButton: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: '#555' },
    navActive: { backgroundColor: '#FFC107', borderColor: '#FFC107' },
    navText: { color: '#ccc', fontWeight: 'bold' },
    navTextActive: { color: '#333' },

    // Content Framing
    contentArea: { flex: 1, padding: 15 },
    groupWrapper: { flex: 1, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    taskHeader: { padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
    taskTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#333' },
    taskInstruction: { fontSize: 14, color: '#555', lineHeight: 20 },

    // Action Area
    actionArea: { padding: 30, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#ddd', alignItems: 'center', marginTop: 20 },
    actionPrompt: { fontSize: 14, color: '#666', marginBottom: 15, textAlign: 'center' },
    completeBtn: { backgroundColor: '#4CAF50', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, elevation: 3 },
    completeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});