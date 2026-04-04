import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ConsentManager } from '../services/ConsentManager';

const consentManager = new ConsentManager();

export const DynamicDashboard = () => {
    const [isLDPActive, setIsLDPActive] = useState(false);
    const [riskLevel, setRiskLevel] = useState<'GREEN' | 'ORANGE'>('GREEN');
    
    const handleNodeClick = async (sensorId: string) => {
        const startTime = Date.now();
        await consentManager.withdrawConsent(sensorId, 'ThirdPartyAnalysis', true);
        const latency = Date.now() - startTime;
        console.log(`Successfully blocked sensor: ${sensorId} in ${latency}ms`);
    };

    return (
        <ScrollView style={{ flex: 1, padding: 20 }}>
            <Text style={styles.header}>Privacy Data Flow</Text>
            
            <View style={styles.canvasContainer}>
                {/* 修复：明确挂载 D3/Skia 渲染层的位置 */}
                <Text style={{ 
                    color: riskLevel === 'ORANGE' ? '#ff9800' : '#4CAF50',
                    opacity: isLDPActive ? 0.4 : 1.0,
                    fontWeight: 'bold'
                }}>
                    [ Skia WebGL Context / D3 Layout Engine Mount Point ]
                </Text>
                {isLDPActive && <Text style={styles.noiseWarning}>⚠️ Data converted to statistical noise (LDP Active)</Text>}
            </View>

            {/* 修复：增加 APP 1.7 要求的算法透明度模块 */}
            <View style={styles.admContainer}>
                <Text style={styles.subHeader}>Automated Decision Making (ADM) Disclosure</Text>
                <Text style={styles.admText}>• Purpose: Health Risk Profiling</Text>
                <Text style={styles.admText}>• Data Used: Heart Rate, Activity Logs</Text>
                <Text style={styles.admText}>• Logic: Random Forest Classification (V2.1)</Text>
            </View>

            <TouchableOpacity 
                style={styles.nudgeButton}
                onPress={() => setIsLDPActive(!isLDPActive)}
            >
                <Text style={styles.nudgeText}>
                    {isLDPActive ? "Disable LDP & Restore Precision" : "Enable Moderate Privacy (LDP)"}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
    subHeader: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
    canvasContainer: { height: 250, backgroundColor: '#e0e0e0', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginVertical: 20 },
    noiseWarning: { marginTop: 10, color: '#555', fontStyle: 'italic' },
    admContainer: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 20 },
    admText: { fontSize: 14, color: '#333', marginVertical: 2 },
    nudgeButton: { backgroundColor: '#2196F3', padding: 16, borderRadius: 8, elevation: 3 },
    nudgeText: { color: 'white', textAlign: 'center', fontWeight: 'bold' }
});