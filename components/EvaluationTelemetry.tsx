import React, { useEffect, useState } from 'react';
import { Button, DeviceEventEmitter, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useExperiment } from '../src/context/ExperimentContext';

export const recordGlobalActionLatency = (latencyMs: number) => {
    DeviceEventEmitter.emit('RECORD_LATENCY', latencyMs);
};

export const EvaluationTelemetry = () => {
    const { saveFinalResults, exportSessionData, tlxScores, group, setGroup } = useExperiment();
    const [actionLatencies, setActionLatencies] = useState<number[]>([]);

    // --- 状态: Part 1 人口统计学 ---
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [culture, setCulture] = useState('');
    const [education, setEducation] = useState('');

    // --- 状态: Part 2 个人特质与主观评价 ---
    const [techSavvy, setTechSavvy] = useState(4); // 1-7 scale, default 4
    const [privacyConcern, setPrivacyConcern] = useState(4); // 1-7 scale, default 4
    const [transparency, setTransparency] = useState(0); // -3 to +3 scale, default 0
    const [control, setControl] = useState(0); // -3 to +3 scale, default 0
    const [preference, setPreference] = useState('');

    // --- 状态: Part 3 NASA-TLX ---
    const [mentalDemand, setMentalDemand] = useState(0);
    const [physicalDemand, setPhysicalDemand] = useState(0);
    const [temporalDemand, setTemporalDemand] = useState(0);
    const [performance, setPerformance] = useState(0);
    const [effort, setEffort] = useState(0);
    const [frustration, setFrustration] = useState(0);

    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('RECORD_LATENCY', (latencyMs: number) => {
            setActionLatencies(prev => [...prev, latencyMs]);
        });
        return () => subscription.remove();
    }, []);

    // 渲染复选按钮组 (用于年龄、性别等)
    const renderButtonGroup = (options: string[], selected: string, setter: (val: string) => void) => (
        <View style={styles.btnGroupContainer}>
            {options.map(opt => (
                <TouchableOpacity 
                    key={opt} 
                    style={[styles.tagBtn, selected === opt && styles.tagBtnActive]} 
                    onPress={() => setter(opt)}
                >
                    <Text style={selected === opt ? styles.tagTextActive : styles.tagText}>{opt}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    // 渲染打分条 (-3 到 +3 或 1 到 7)
    const renderScale = (range: number[], value: number, setter: (v: number) => void, showPlus: boolean = false) => (
        <View style={styles.scaleRow}>
            {range.map(num => (
                <TouchableOpacity 
                    key={num} 
                    style={[styles.scaleBtn, value === num && styles.scaleBtnActive]}
                    onPress={() => setter(num)}
                >
                    <Text style={value === num ? styles.scaleTextActive : styles.scaleText}>
                        {showPlus && num > 0 ? `+${num}` : num}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const handleSubmit = () => {
        saveFinalResults(
            { mentalDemand, physicalDemand, temporalDemand, performance, effort, frustration },
            { age, gender, culture, education, techSavvy, privacyConcern },
            { transparency, control, preference }
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerBox}>
                <Text style={styles.title}>Researcher Dashboard & Survey</Text>
                <Text style={styles.subtitle}>Current Test Group (For Researchers):</Text>
                {renderScale([0, 1, 2], group === 'A' ? 0 : group === 'B' ? 1 : 2, (v) => setGroup(v === 0 ? 'A' : v === 1 ? 'B' : 'C'))}
                <Text style={styles.bold}>
                    Avg Latency: {actionLatencies.length > 0 ? (actionLatencies.reduce((a, b) => a + b, 0) / actionLatencies.length).toFixed(2) : 0} ms
                </Text>
            </View>

            {/* PART 1: Demographics */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Part 1: Demographics</Text>
                
                <Text style={styles.question}>Age:</Text>
                {renderButtonGroup(['18-24', '25-34', '35-44', '45-54', '55+'], age, setAge)}

                <Text style={styles.question}>Gender:</Text>
                {renderButtonGroup(['Male', 'Female', 'Non-binary', 'Prefer not to say'], gender, setGender)}

                <Text style={styles.question}>Highest Education Level:</Text>
                {renderButtonGroup(['High School', "Bachelor's", "Master's", 'PhD'], education, setEducation)}

                <Text style={styles.question}>Country of Residence / Cultural Background:</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="e.g. Australia, China, USA..." 
                    value={culture} 
                    onChangeText={setCulture} 
                />
            </View>

            {/* PART 2: Traits & Evaluation */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Part 2: Traits & System Evaluation</Text>

                <Text style={styles.question}>How confident are you in managing privacy settings on your smartphone? (-3: Not confident, 3: Extremely confident)</Text>
                {renderScale([-3, -2, -1, 0, 1, 2, 3], techSavvy, setTechSavvy)}

                <Text style={styles.question}>I am highly concerned about how mobile apps collect my data. (-3: Strongly Disagree, 3: Strongly Agree)</Text>
                {renderScale([-3, -2, -1, 0, 1, 2, 3], privacyConcern, setPrivacyConcern)}

                <Text style={styles.question}>The dashboard clearly explained what data is collected and why.</Text>
                {renderScale([-3, -2, -1, 0, 1, 2, 3], transparency, setTransparency, true)}

                <Text style={styles.question}>I felt in control of my personal data when using this dashboard.</Text>
                {renderScale([-3, -2, -1, 0, 1, 2, 3], control, setControl, true)}

                <Text style={styles.question}>Which privacy dashboard design do you prefer for daily use?</Text>
                {renderButtonGroup(['Group A (Standard)', 'Group B (Dynamic)', 'Group C (Mixed)'], preference, setPreference)}
            </View>

            {/* PART 3: NASA-TLX */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Part 3: NASA-TLX Task Load</Text>

                <Text style={styles.question}>Mental Demand: How mentally demanding was the task?</Text>
                {renderScale([-3, -2, -1, 0, 1, 2, 3], mentalDemand, setMentalDemand, true)}

                <Text style={styles.question}>Physical Demand: How physically demanding was the task?</Text>
                {renderScale([-3, -2, -1, 0, 1, 2, 3], physicalDemand, setPhysicalDemand, true)}

                <Text style={styles.question}>Temporal Demand: How hurried or rushed was the pace of the task?</Text>
                {renderScale([-3, -2, -1, 0, 1, 2, 3], temporalDemand, setTemporalDemand, true)}

                <Text style={styles.question}>Performance: How successful were you in accomplishing the task?</Text>
                {renderScale([-3, -2, -1, 0, 1, 2, 3], performance, setPerformance, true)}

                <Text style={styles.question}>Effort: How hard did you have to work to accomplish your level of performance?</Text>
                {renderScale([-3, -2, -1, 0, 1, 2, 3], effort, setEffort, true)}

                <Text style={styles.question}>Frustration: How insecure, discouraged, irritated, stressed, and annoyed were you?</Text>
                {renderScale([-3, -2, -1, 0, 1, 2, 3], frustration, setFrustration, true)}
            </View>

            <View style={styles.footer}>
                {!tlxScores ? (
                    <Button title="Submit All Feedback" color="#2196F3" onPress={handleSubmit} />
                ) : (
                    <View>
                        <Text style={styles.successText}>✓ Survey & Telemetry Recorded</Text>
                        <Button title="Export JSON for PLS-SEM" color="#E91E63" onPress={exportSessionData} />
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: '#fcfcfc', borderTopWidth: 1, borderColor: '#eee', marginTop: 20 },
    headerBox: { marginBottom: 20, paddingBottom: 15, borderBottomWidth: 2, borderColor: '#ddd' },
    title: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    section: { marginBottom: 25, backgroundColor: '#fff', padding: 15, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1976D2', marginBottom: 15, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 5 },
    question: { fontSize: 13, marginBottom: 10, color: '#444', fontWeight: '500' },
    subtitle: { fontSize: 13, marginBottom: 8, color: '#666' },
    bold: { fontWeight: 'bold', color: '#2E7D32', marginTop: 10 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: '#fff', marginBottom: 10 },
    
    // Tag Buttons (Flow Layout)
    btnGroupContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15, gap: 8 },
    tagBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#eee', borderWidth: 1, borderColor: '#ddd' },
    tagBtnActive: { backgroundColor: '#E3F2FD', borderColor: '#2196F3' },
    tagText: { color: '#666', fontSize: 13 },
    tagTextActive: { color: '#2196F3', fontWeight: 'bold', fontSize: 13 },

    // Scales
    scaleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    scaleBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    scaleBtnActive: { backgroundColor: '#2196F3' },
    scaleText: { color: '#666', fontSize: 13 },
    scaleTextActive: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

    footer: { marginTop: 10, marginBottom: 40 },
    successText: { color: '#4CAF50', textAlign: 'center', marginBottom: 10, fontWeight: 'bold', fontSize: 16 }
});