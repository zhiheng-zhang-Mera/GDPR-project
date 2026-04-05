import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { PrivacyBridge } from '../src/services/PrivacyBridge';

interface Props {
    taskId: number;
    variant?: 'standard' | 'text-heavy';
    onInteraction?: (result: { isCorrect: boolean, isError: boolean, latency: number, clickedId: string }) => void;
}

export const StandardSettings = ({ taskId, variant = 'standard', onInteraction }: Props) => {
    const [services, setServices] = useState<any[]>([]);

    useEffect(() => {
        // 扩展至 18 个基础干扰项，制造认知超载 (Cognitive Load)
        const baseDistractors = [
            { id: 'step_counter', name: 'Pedometer & Steps', isTrap: false, enabled: true, region: 'Local Storage', desc: 'Tracks daily step count locally.' },
            { id: 'sleep_monitor', name: 'Sleep Cycle Analysis', isTrap: false, enabled: true, region: 'Local Storage', desc: 'Analyzes REM cycles based on movement.' },
            { id: 'water_logger', name: 'Hydration Tracking', isTrap: false, enabled: true, region: 'Local Storage', desc: 'Manual water intake log.' },
            { id: 'menstrual_cal', name: 'Cycle Calendar', isTrap: false, enabled: true, region: 'Local Storage', desc: 'Basic date predictions.' },
            { id: 'blood_pressure', name: 'BP Log', isTrap: false, enabled: true, region: 'Local Storage', desc: 'Manual blood pressure records.' },
            { id: 'local_voice', name: 'Voice Commands', isTrap: false, enabled: true, region: 'Local Storage', desc: 'On-device voice recognition.' },
            { id: 'calorie_calc', name: 'Calorie Expenditure', isTrap: false, enabled: true, region: 'Domestic Cloud', desc: 'Syncs with national food database.' },
            { id: 'heart_rate_var', name: 'HRV Monitor', isTrap: false, enabled: true, region: 'Domestic Cloud', desc: 'Heart rate variability baseline.' },
            { id: 'workout_social', name: 'Social Leaderboard', isTrap: false, enabled: true, region: 'Domestic Cloud', desc: 'Share step milestones with friends.' },
            { id: 'cloud_backup', name: 'Encrypted Vault', isTrap: false, enabled: true, region: 'Domestic Cloud', desc: 'End-to-end encrypted backup.' },
            { id: 'device_analytics', name: 'App Crash Reports', isTrap: false, enabled: true, region: 'Domestic Cloud', desc: 'Anonymous stability tracking.' },
            { id: 'ai_workout', name: 'AI Workout Coach', isTrap: false, enabled: true, region: 'Domestic Cloud', desc: 'Personalized fitness routines.' },
            { id: 'diet_plan', name: 'Dietary Profiling', isTrap: false, enabled: true, region: 'Domestic Cloud', desc: 'Suggests meal plans.' },
            { id: 'med_reminders', name: 'Medication Sync', isTrap: false, enabled: true, region: 'Domestic Cloud', desc: 'Cross-device pill reminders.' },
            { id: 'ad_network', name: 'Global Ad Network', isTrap: false, enabled: true, region: 'Third-Party', desc: 'Personalized health advertisements.' },
            { id: 'social_meta', name: 'Social Media Sync', isTrap: false, enabled: true, region: 'Third-Party', desc: 'Connect with external social apps.' },
            { id: 'wearable_api', name: 'External Wearable API', isTrap: false, enabled: true, region: 'Third-Party', desc: 'Sync with 3rd party smartwatches.' },
            { id: 'academic_pool', name: 'Academic Data Pool', isTrap: false, enabled: true, region: 'Third-Party', desc: 'Anonymized research contributions.' },
        ];

        let taskData = [...baseDistractors];

        // 动态注入测试陷阱 (Traps)
        if (taskId === 1) {
            taskData.splice(4, 0, { id: 'hormone_eu', name: 'Hormone Level Analytics', isTrap: true, enabled: true, region: 'EU/US Servers', desc: 'Advanced endocrine profiling via 3rd party.' });
        } else if (taskId === 2) {
            taskData = taskData.map(s => ({...s, enabled: false}));
            taskData.splice(7, 0, { id: 'emergency_911', name: 'Emergency Dispatch Auth', isTrap: true, enabled: false, region: 'Gov/Medical Node', desc: 'Bypass blocks for paramedics.' });
        } else if (taskId === 3) {
            taskData.splice(9, 0, { id: 'genetic_registry', name: 'Genetic Sequence Registry', isTrap: true, enabled: true, region: 'Remote Vault', desc: 'Long-term storage of DNA markers.' });
        } else if (taskId === 4) {
            taskData.splice(2, 0, { id: 'adm_insurance', name: 'Insurance Risk Profiler (ADM)', isTrap: true, enabled: true, region: 'Third-Party Brokers', desc: 'Automated health premium scoring.' });
        } else if (taskId === 5) {
            // Task 5: 视觉验证任务，隐藏深处的跨国生物特征流
            taskData.splice(15, 0, { id: 'biometric_visual', name: 'Raw Biometric Telemetry', isTrap: true, enabled: true, region: 'Overseas Cloud', desc: 'Unfiltered biometric data stream.' });
        }

        setServices(taskData);
    }, [taskId]);

    const toggleSwitch = async (id: string, isTrap: boolean, currentValue: boolean) => {
        const newValue = !currentValue;
        let isCorrectAction = false;
        let isError = false;

        if (isTrap) {
            if ((taskId === 1 || taskId === 3 || taskId === 4 || taskId === 5) && newValue === false) isCorrectAction = true;
            if (taskId === 2 && newValue === true) isCorrectAction = true;
        } else {
            isError = true;
        }

        const result = await PrivacyBridge.invokeInterceptor(id, false, isTrap);
        if (onInteraction) onInteraction({ isCorrect: isCorrectAction, isError: isError, latency: result.latencyMs, clickedId: id });
        setServices(services.map(s => s.id === id ? { ...s, enabled: newValue } : s));
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}}>
            {services.map(service => (
                <View key={service.id} style={styles.settingItem}>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>{service.name}</Text>
                        {variant === 'standard' && <Text style={styles.basicText}>{service.desc}</Text>}
                        {variant === 'text-heavy' && (
                            <Text style={styles.legalText}>
                                Processing region: {service.region}. Purpose: {service.desc}
                                {service.isTrap && taskId === 1 ? ' Warning: Cross-border transfer.' : ''}
                                {service.isTrap && taskId === 2 ? ' Exception: Vital interests.' : ''}
                                {service.isTrap && taskId === 3 ? ' Right to be forgotten.' : ''}
                                {service.isTrap && taskId === 4 ? ' ADM automated profiling.' : ''}
                                {service.isTrap && taskId === 5 ? ' High-Risk Biometric Flow.' : ''}
                            </Text>
                        )}
                    </View>
                    <Switch value={service.enabled} onValueChange={() => toggleSwitch(service.id, service.isTrap, service.enabled)} />
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
    textContainer: { flex: 1, paddingRight: 15 },
    title: { fontSize: 15, fontWeight: '600', color: '#333' },
    basicText: { fontSize: 12, color: '#666', marginTop: 4 },
    legalText: { fontSize: 11, color: '#555', marginTop: 5, lineHeight: 16, backgroundColor: '#f9f9f9', padding: 5 }
});