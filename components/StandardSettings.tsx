import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { ConsentManager } from '../services/ConsentManager';
import { recordGlobalActionLatency } from './EvaluationTelemetry';

const consentManager = new ConsentManager();

export const StandardSettings = () => {
    const [hrEnabled, setHrEnabled] = useState(true);

    const toggleSwitch = async (value: boolean) => {
        const startTime = Date.now();
        if (!value) {
            // 测试 Gap 2：传统 UI 下的撤回操作
            await consentManager.withdrawConsent('heart_rate', 'ThirdPartyAnalysis', false);
        } else {
            await consentManager.grantSeparateConsent('heart_rate', 'ThirdPartyAnalysis', false);
        }
        setHrEnabled(value);
        
        // 闭环遥测：记录传统列表操作的响应延迟
        recordGlobalActionLatency(Date.now() - startTime);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Settings (Group A: Baseline)</Text>
            <View style={styles.settingItem}>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Third-Party Data Sharing</Text>
                    <Text style={styles.description}>Allow this app to share heart rate data with cloud analysis partners.</Text>
                </View>
                <Switch 
                    value={hrEnabled} 
                    onValueChange={toggleSwitch} 
                    trackColor={{ false: "#767577", true: "#81b0ff" }} 
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: '#f5f5f5', flex: 1 },
    header: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, elevation: 1 },
    textContainer: { flex: 1, paddingRight: 15 },
    title: { fontSize: 16, fontWeight: '600' },
    description: { fontSize: 12, color: '#666', marginTop: 5 }
});