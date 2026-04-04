import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DynamicDashboard } from '../../components/DynamicDashboard';
import { EvaluationTelemetry } from '../../components/EvaluationTelemetry';
import { StandardSettings } from '../../components/StandardSettings';

export default function PrivacyExperimentScreen() {
    // 控制 A 组 (Baseline) 还是 B 组 (Intervention)
    const [testGroup, setTestGroup] = useState<'A' | 'B'>('B');

    return (
        <View style={styles.container}>
            {/* 顶部的实验控制台（仅限研究人员操作使用） */}
            <View style={styles.routerNav}>
                <Text style={styles.navTitle}>Experiment Router (Researcher Only)</Text>
                <View style={styles.buttonRow}>
                    <TouchableOpacity 
                        style={[styles.navButton, testGroup === 'A' && styles.navActive]} 
                        onPress={() => setTestGroup('A')}
                    >
                        <Text style={[styles.navText, testGroup === 'A' && styles.navTextActive]}>Group A (Control)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.navButton, testGroup === 'B' && styles.navActive]} 
                        onPress={() => setTestGroup('B')}
                    >
                        <Text style={[styles.navText, testGroup === 'B' && styles.navTextActive]}>Group B (Dashboard)</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* 给被试者展示的真实内容区域 */}
            <View style={styles.contentArea}>
                {testGroup === 'A' ? <StandardSettings /> : <DynamicDashboard />}
            </View>

            {/* 遥测面板始终钉在底部，记录两个组别的交互延迟和评分 */}
            <View style={styles.telemetryArea}>
                <EvaluationTelemetry />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f0f0' },
    routerNav: { backgroundColor: '#333', padding: 15, paddingTop: 50 },
    navTitle: { color: '#FFC107', fontSize: 12, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-around' },
    navButton: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#555' },
    navActive: { backgroundColor: '#FFC107', borderColor: '#FFC107' },
    navText: { color: '#ccc', fontWeight: 'bold' },
    navTextActive: { color: '#333' },
    contentArea: { flex: 1 },
    telemetryArea: { borderTopWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' }
});