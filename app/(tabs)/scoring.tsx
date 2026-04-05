import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { EvaluationTelemetry } from '../../components/EvaluationTelemetry';

export default function ScoringScreen() {
    return (
        <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* 顶部的留白，避免问卷被刘海屏遮挡 */}
            <View style={styles.headerPadding} />

            {/* 纯净的打分与导出组件 */}
            <EvaluationTelemetry />
            
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#fcfcfc' 
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40 
    },
    headerPadding: {
        height: 50,
        backgroundColor: '#fcfcfc'
    }
});