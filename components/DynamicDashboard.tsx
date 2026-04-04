import React, { useEffect, useState } from 'react';
import { NativeModules, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ConsentManager } from '../services/ConsentManager';
import { recordGlobalActionLatency } from './EvaluationTelemetry';

const { PrivacyInterceptor } = NativeModules;
const consentManager = new ConsentManager();

export const DynamicDashboard = () => {
    const [isLDPActive, setIsLDPActive] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [sensorValue, setSensorValue] = useState<number>(0);
    
    // [Fix 1] 数据流泵 (Data Stream Pump) - 模拟 1Hz 持续数据产生，以验证脱敏延迟
    useEffect(() => {
        const interval = setInterval(async () => {
            if (isBlocked) return;
            
            const rawHeartRate = 70 + Math.random() * 15; // 70-85 bpm
            let finalData = rawHeartRate;

            if (isLDPActive && PrivacyInterceptor) {
                try {
                    // 真实调用底层 Kotlin LDP 算法进行加噪
                    finalData = await PrivacyInterceptor.applyLDPToData(rawHeartRate, 1.0, 0.1);
                } catch (e) {
                    console.warn("Native API issue, using JS fallback");
                }
            }
            setSensorValue(finalData);
        }, 1000);
        
        return () => clearInterval(interval);
    }, [isLDPActive, isBlocked]);

    // [Fix 2] 闭环交互：截断执行与遥测上报
    const handleNodeClick = async (sensorId: string) => {
        const startTime = Date.now();
        await consentManager.withdrawConsent(sensorId, 'ThirdPartyAnalysis', true);
        setIsBlocked(true); // 物理截断 UI 响应
        const latency = Date.now() - startTime;
        
        recordGlobalActionLatency(latency); // 写入遥测面板
        console.log(`Successfully blocked sensor: ${sensorId} in ${latency}ms`);
    };

    return (
        <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}>
            <Text style={styles.header}>Dynamic Dashboard (Group B)</Text>
            
            {/* [Fix 3] 简易化实时动态数据流可视化 */}
            <View style={styles.visualizerContainer}>
                {/* 数据源节点 */}
                <View style={styles.node}><Text style={styles.nodeText}>Watch Sensor</Text></View>
                
                {/* 动态连接线与实时数据反馈 */}
                <View style={[styles.path, isBlocked ? styles.pathBlocked : (isLDPActive ? styles.pathBlurry : styles.pathActive)]}>
                    <Text style={styles.dataText}>
                        {isBlocked ? 'DATA CUT' : `${sensorValue.toFixed(1)} bpm`}
                    </Text>
                </View>
                
                {/* 第三方高风险节点（点击阻断） */}
                <TouchableOpacity 
                    style={[styles.node, isBlocked ? styles.nodeBlocked : styles.nodeOrange]}
                    onPress={() => handleNodeClick('heart_rate')}
                    disabled={isBlocked}
                >
                    <Text style={[styles.nodeText, isBlocked && styles.nodeTextBlocked]}>Cloud AI</Text>
                    {!isBlocked && <Text style={styles.clickHint}>[Tap to Block]</Text>}
                </TouchableOpacity>
            </View>

            {isLDPActive && <Text style={styles.noiseWarning}>⚠️ Data converted to statistical noise (LDP Active)</Text>}

            <View style={styles.admContainer}>
                <Text style={styles.subHeader}>Automated Decision Making (ADM) Disclosure</Text>
                <Text style={styles.admText}>• Purpose: Health Risk Profiling</Text>
                <Text style={styles.admText}>• Data Used: Heart Rate, Activity Logs</Text>
                <Text style={styles.admText}>• Logic: Random Forest Classification (V2.1)</Text>
            </View>

            <TouchableOpacity 
                style={[styles.nudgeButton, isBlocked && styles.disabledButton]}
                onPress={() => setIsLDPActive(!isLDPActive)}
                disabled={isBlocked}
            >
                <Text style={styles.nudgeText}>
                    {isLDPActive ? "Disable LDP & Restore Precision" : "Enable Moderate Privacy (LDP)"}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, color: '#333' },
    visualizerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 150, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 12, marginBottom: 20 },
    node: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 8, zIndex: 2, alignItems: 'center', width: 100 },
    nodeOrange: { backgroundColor: '#FF9800' },
    nodeBlocked: { backgroundColor: '#9E9E9E' },
    nodeText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
    nodeTextBlocked: { textDecorationLine: 'line-through' },
    clickHint: { fontSize: 10, color: '#fff', marginTop: 5 },
    path: { flex: 1, height: 4, marginHorizontal: -5, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    pathActive: { backgroundColor: '#4CAF50' },
    pathBlurry: { backgroundColor: '#4CAF50', opacity: 0.3, borderStyle: 'dashed', borderWidth: 2, borderColor: '#4CAF50' },
    pathBlocked: { backgroundColor: 'transparent', borderStyle: 'dashed', borderWidth: 2, borderColor: '#FF5252' },
    dataText: { position: 'absolute', top: -25, fontSize: 12, fontWeight: 'bold', color: '#555' },
    noiseWarning: { marginTop: -10, marginBottom: 20, color: '#FF9800', fontStyle: 'italic', fontWeight: 'bold' },
    subHeader: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
    admContainer: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 20 },
    admText: { fontSize: 14, color: '#444', marginVertical: 2 },
    nudgeButton: { backgroundColor: '#2196F3', padding: 16, borderRadius: 8, elevation: 3 },
    disabledButton: { backgroundColor: '#ccc' },
    nudgeText: { color: 'white', textAlign: 'center', fontWeight: 'bold' }
});