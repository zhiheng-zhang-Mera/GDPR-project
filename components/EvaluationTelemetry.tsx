import React, { useEffect, useState } from 'react';
import { Button, DeviceEventEmitter, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useExperiment } from '../src/context/ExperimentContext';

// 全局遥测上报方法，供 DynamicDashboard 和 StandardSettings 调用
export const recordGlobalActionLatency = (latencyMs: number) => {
    DeviceEventEmitter.emit('RECORD_LATENCY', latencyMs);
};

export const EvaluationTelemetry = () => {
    // 解构出完整的实验上下文方法和状态
    const { saveTLXScores, exportSessionData, tlxScores, group, setGroup } = useExperiment();
    
    const [actionLatencies, setActionLatencies] = useState<number[]>([]);
    
    // 将所有维度的初始默认分值设置在 0（即 -3 到 +3 的中立位置）
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

    // 渲染 -3 到 +3 分选择器的复用组件
    const renderScale = (value: number, setter: (v: number) => void) => (
        <View style={styles.scaleRow}>
            {[-3, -2, -1, 0, 1, 2, 3].map(num => (
                <TouchableOpacity 
                    key={num} 
                    style={[styles.scaleBtn, value === num && styles.scaleBtnActive]}
                    onPress={() => setter(num)}
                >
                    <Text style={value === num ? styles.scaleTextActive : styles.scaleText}>
                        {/* 如果是正数，强制显示 '+' 号以增强对比度 */}
                        {num > 0 ? `+${num}` : num}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Researcher Dashboard (User Evaluation)</Text>
            
            {/* 主试面板：切换受试者的实验分组 */}
            <View style={styles.groupSelector}>
                <Text style={styles.subtitle}>Current Active Group (For Researchers):</Text>
                <View style={styles.scaleRow}>
                    {(['A', 'B', 'C'] as const).map(g => (
                        <TouchableOpacity 
                            key={g} 
                            style={[styles.scaleBtn, group === g && styles.scaleBtnActive]}
                            onPress={() => setGroup(g)}
                        >
                            <Text style={group === g ? styles.scaleTextActive : styles.scaleText}>{g}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* 记录的底层响应延迟 */}
            <View style={styles.metricBox}>
                <Text>Average End-to-End Latency: </Text>
                <Text style={styles.bold}>
                    {actionLatencies.length > 0 
                        ? (actionLatencies.reduce((a, b) => a + b, 0) / actionLatencies.length).toFixed(2) 
                        : 0} ms
                </Text>
            </View>

            {/* 给受试者的真实打分区域 (NASA-TLX) */}
            <View style={styles.tlxBox}>
                <Text style={styles.subtitle}>NASA-TLX: How mentally demanding was the task?</Text>
                {renderScale(mentalDemand, setMentalDemand)}

                <Text style={styles.subtitle}>NASA-TLX: How physically demanding was the task?</Text>
                {renderScale(physicalDemand, setPhysicalDemand)}

                <Text style={styles.subtitle}>NASA-TLX: How hurried or rushed was the pace of the task?</Text>
                {renderScale(temporalDemand, setTemporalDemand)}

                <Text style={styles.subtitle}>NASA-TLX: How successful were you in accomplishing what you were asked to do?</Text>
                {renderScale(performance, setPerformance)}

                <Text style={styles.subtitle}>NASA-TLX: How hard did you have to work to accomplish your level of performance?</Text>
                {renderScale(effort, setEffort)}

                <Text style={styles.subtitle}>NASA-TLX: How insecure, discouraged, irritated, stressed, and annoyed were you?</Text>
                {renderScale(frustration, setFrustration)}

                {!tlxScores ? (
                    <Button 
                        title="Submit TLX Score" 
                        onPress={() => saveTLXScores({
                            mentalDemand,
                            physicalDemand,
                            temporalDemand,
                            performance,
                            effort,
                            frustration
                        })} 
                    />
                ) : (
                    <View>
                        <Text style={styles.successText}>✓ TLX Recorded</Text>
                        <Button title="Export Session Data (For PLS-SEM)" color="#E91E63" onPress={exportSessionData} />
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee', marginTop: 20 },
    title: { fontSize: 16, fontWeight: 'bold', color: '#666', marginBottom: 15 },
    groupSelector: { marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#eee' },
    metricBox: { flexDirection: 'row', marginTop: 10, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#eee' },
    bold: { fontWeight: 'bold', color: '#2E7D32' },
    tlxBox: { marginTop: 20 },
    subtitle: { fontSize: 13, marginBottom: 8, color: '#444' },
    scaleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    // 稍微放大按钮尺寸 (从 35 改为 38)，确保带有符号的文本 (如 "-3" 或 "+3") 居中时不会过于拥挤
    scaleBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    scaleBtnActive: { backgroundColor: '#2196F3' },
    scaleText: { color: '#666', fontSize: 13 },
    scaleTextActive: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
    successText: { color: '#4CAF50', textAlign: 'center', marginBottom: 10, fontWeight: 'bold' }
});