import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ScoringScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    
    // 解析从上游传递过来的客观测试结果
    const objectiveResults = params.results ? JSON.parse(params.results as string) : [];

    // --- 人口统计学特征 (Demographics) ---
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [culturalBackground, setCulturalBackground] = useState('');

    // --- 完整的 NASA-TLX 量表 (6个维度) ---
    const [mentalDemand, setMentalDemand] = useState(4);
    const [physicalDemand, setPhysicalDemand] = useState(4);
    const [temporalDemand, setTemporalDemand] = useState(4);
    const [performance, setPerformance] = useState(4);
    const [effort, setEffort] = useState(4);
    const [frustration, setFrustration] = useState(4);

    // --- 知觉行为控制 (PBC) ---
    const [pbc, setPbc] = useState(4);

    const submitData = () => {
        if (!age || !gender || !culturalBackground) {
            alert("Please tell us a little bit about yourself first!");
            return;
        }

        const payload = {
            group: params.group,
            demographics: {
                age: parseInt(age),
                gender: gender,
                culturalBackground: culturalBackground
            },
            objectiveTasks: objectiveResults, 
            totalTimeSecs: objectiveResults.reduce((acc: number, task: any) => acc + task.duration, 0),
            subjectiveScores: {
                nasaTlx: {
                    mental: mentalDemand,
                    physical: physicalDemand,
                    temporal: temporalDemand,
                    performance: performance,
                    effort: effort,
                    frustration: frustration
                },
                pbcControl: pbc
            },
            timestamp: new Date().toISOString()
        };
        
        console.log("[PLS-SEM FULL DATASET EXPORT] ", JSON.stringify(payload, null, 2));
        alert("All done! Thank you for playing and helping us out!");
        router.push('/'); 
    };

    // 渲染 1-7 的李克特量表
    const renderScale = (value: number, setter: (val: number) => void, lowLabel: string = "Not at all", highLabel: string = "Very much") => (
        <View>
            <View style={styles.scaleRow}>
                {[1, 2, 3, 4, 5, 6, 7].map(num => (
                    <TouchableOpacity key={num} onPress={() => setter(num)} 
                      style={[styles.scaleBtn, value === num && styles.scaleActive]}>
                        <Text style={{color: value === num ? '#fff' : '#333', fontWeight: value === num ? 'bold' : 'normal'}}>{num}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.scaleLabels}>
                <Text style={styles.helperText}>{lowLabel}</Text>
                <Text style={styles.helperText}>{highLabel}</Text>
            </View>
        </View>
    );

    const renderGenderOption = (label: string) => (
        <TouchableOpacity 
            style={[styles.optionBtn, gender === label && styles.optionActive]} 
            onPress={() => setGender(label)}>
            <Text style={{color: gender === label ? '#fff' : '#333'}}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 50}}>
            <Text style={styles.title}>Quick Questions!</Text>
            <Text style={styles.subtitle}>You did great! Just a few simple questions before we finish.</Text>
            
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>1. About You</Text>
                
                <Text style={styles.question}>How old are you?</Text>
                <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="Type your age here" 
                    value={age} 
                    onChangeText={setAge} 
                />

                <Text style={styles.question}>Are you a boy, a girl, or something else?</Text>
                <View style={styles.optionsRow}>
                    {renderGenderOption('Boy / Man')}
                    {renderGenderOption('Girl / Woman')}
                    {renderGenderOption('Other')}
                    {renderGenderOption('Skip')}
                </View>

                <Text style={styles.question}>Where are you from? (Which country?)</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="e.g., Australia, UK, China..." 
                    value={culturalBackground} 
                    onChangeText={setCulturalBackground} 
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. How did the task feel?</Text>
                
                {/* 脑力需求通俗化 */}
                <Text style={styles.question}>Did you have to think really hard to figure it out?</Text>
                {renderScale(mentalDemand, setMentalDemand, "Easy peasy", "My brain hurts")}

                {/* 体力需求通俗化 */}
                <Text style={styles.question}>Did your fingers or eyes get tired from tapping and looking?</Text>
                {renderScale(physicalDemand, setPhysicalDemand, "Not tired", "Super tired")}

                {/* 时间需求通俗化 */}
                <Text style={styles.question}>Did you feel rushed, like you were running out of time?</Text>
                {renderScale(temporalDemand, setTemporalDemand, "Plenty of time", "Super rushed")}

                {/* 绩效评估通俗化 (反向计分) */}
                <Text style={styles.question}>How good of a job do you think you did?</Text>
                {renderScale(performance, setPerformance, "I nailed it!", "I totally failed")}

                {/* 努力程度通俗化 */}
                <Text style={styles.question}>How hard did you have to try to get it done?</Text>
                {renderScale(effort, setEffort, "Barely tried", "Tried my absolute best")}

                {/* 挫败感通俗化 */}
                <Text style={styles.question}>Did you feel annoyed, upset, or stressed out?</Text>
                {renderScale(frustration, setFrustration, "Felt great", "Super annoyed")}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>3. Trust in the App</Text>
                {/* 知觉行为控制 (PBC) 通俗化 */}
                <Text style={styles.question}>I believe this app actually listened to me and stopped sharing my secrets.</Text>
                {renderScale(pbc, setPbc, "Nope, don't trust it", "Yes, totally trust it")}
            </View>

            <View style={styles.summaryBox}>
                <Text style={{fontWeight: 'bold', marginBottom: 5}}>System Log (For researchers):</Text>
                <Text>Group Allocation: {params.group}</Text>
                {objectiveResults.map((res: any, idx: number) => (
                    <Text key={idx}>Task {res.taskId} Time: {res.duration.toFixed(2)}s | Accuracy: {res.isCorrect ? 'Pass' : 'Fail'}</Text>
                ))}
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={submitData}>
                <Text style={styles.submitText}>Finish & Send!</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f4f6f8' },
    title: { fontSize: 26, fontWeight: 'bold', marginTop: 30, color: '#102A43' },
    subtitle: { fontSize: 14, color: '#627D98', marginBottom: 20, marginTop: 5 },
    section: { marginBottom: 25, padding: 20, backgroundColor: '#ffffff', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#005A9C' },
    question: { fontSize: 14, color: '#334E68', marginBottom: 10, marginTop: 15, fontWeight: '700' },
    input: { borderWidth: 1, borderColor: '#D9E2EC', borderRadius: 8, padding: 12, fontSize: 14, backgroundColor: '#F0F4F8' },
    optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    optionBtn: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#F0F4F8', borderWidth: 1, borderColor: '#D9E2EC', marginBottom: 5 },
    optionActive: { backgroundColor: '#005A9C', borderColor: '#005A9C' },
    scaleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    scaleBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F0F4F8', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D9E2EC' },
    scaleActive: { backgroundColor: '#FF9800', borderColor: '#FF9800' }, // 改为更活泼的橙色
    scaleLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, paddingHorizontal: 2 },
    helperText: { fontSize: 11, color: '#829AB1', fontWeight: 'bold' },
    summaryBox: { backgroundColor: '#E0ECE4', padding: 15, borderRadius: 8, marginBottom: 20, opacity: 0.7 },
    submitBtn: { backgroundColor: '#4CAF50', padding: 16, borderRadius: 30, alignItems: 'center', shadowColor: '#4CAF50', shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 }, // 改为绿色的完成按钮
    submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 }
});