import React, { useEffect, useState } from 'react';
import { Button, DeviceEventEmitter, StyleSheet, Text, View } from 'react-native';

interface TelemetryData {
    actionLatencies: number[];
    tlxScores: { mentalDemand: number, frustration: number };
}

// 修复 1：将供外部调用的方法移至组件外部的模块顶层
// 这样其他文件可以直接 import { recordGlobalActionLatency } from './EvaluationTelemetry'
export const recordGlobalActionLatency = (latencyMs: number) => {
    DeviceEventEmitter.emit('RECORD_LATENCY', latencyMs);
};

export const EvaluationTelemetry = () => {
    const [telemetry, setTelemetry] = useState<TelemetryData>({
        actionLatencies: [],
        tlxScores: { mentalDemand: 0, frustration: 0 }
    });

    // 修复 2：在组件挂载时监听跨组件传来的延迟数据
    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('RECORD_LATENCY', (latencyMs: number) => {
            setTelemetry(prev => ({
                ...prev,
                actionLatencies: [...prev.actionLatencies, latencyMs]
            }));
        });

        // 组件卸载时清理监听器，防止内存泄漏
        return () => subscription.remove();
    }, []);

    // 修复 3：组件内部私有方法，直接去掉 export 关键字
    const submitTLXScore = (mental: number, frustration: number) => {
        setTelemetry(prev => ({
            ...prev,
            tlxScores: { mentalDemand: mental, frustration: frustration }
        }));
        console.log("TLX Data Recorded for PLS-SEM Analysis");
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Research Evaluation Tool</Text>
            
            <View style={styles.metricBox}>
                <Text>Average Sync Latency: </Text>
                <Text style={styles.bold}>
                    {telemetry.actionLatencies.length > 0 
                        ? (telemetry.actionLatencies.reduce((a, b) => a + b, 0) / telemetry.actionLatencies.length).toFixed(2) 
                        : 0} ms
                </Text>
            </View>

            <View style={styles.tlxBox}>
                <Text style={styles.subtitle}>NASA-TLX Quick Entry</Text>
                <Button title="Simulate Score: Low Load (LDP On)" onPress={() => submitTLXScore(3, 2)} />
                <Button title="Simulate Score: High Load (Text Only)" onPress={() => submitTLXScore(8, 7)} color="orange" />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
    title: { fontSize: 16, fontWeight: 'bold', color: '#666' },
    metricBox: { flexDirection: 'row', marginTop: 10 },
    bold: { fontWeight: 'bold', color: '#2E7D32' },
    tlxBox: { marginTop: 20, gap: 10 },
    subtitle: { fontSize: 14, marginBottom: 10 }
});