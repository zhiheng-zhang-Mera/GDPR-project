import { DynamicDashboard } from '@/components/DynamicDashboard';
import { EvaluationTelemetry } from '@/components/EvaluationTelemetry';
import { StandardSettings } from '@/components/StandardSettings';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedView } from '@/components/themed-view';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ScoringScreen() {
    // 扩展至 3 个测试组: A (对照组), B (控制台面板), C (混合视图)
    const [testGroup, setTestGroup] = useState<'A' | 'B' | 'C'>('C');

    const renderContent = () => {
        if (testGroup === 'A') return <StandardSettings />;
        if (testGroup === 'B') return <DynamicDashboard />;
        if (testGroup === 'C') return (
            <ParallaxScrollView
              headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
              headerImage={<ThemedView style={styles.headerSpacer} />}
            >
              <ThemedView style={styles.parallaxContainer}>
                <ThemedView style={{ height: 20, backgroundColor: 'transparent' }} />
                <DynamicDashboard />
              </ThemedView>
            </ParallaxScrollView>
        );
    };

    return (
        <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true} // 允许内部的 ParallaxScrollView 也能滑动
        >
            <View style={styles.routerNav}>
                <Text style={styles.navTitle}>Experiment Router & Scoring</Text>
                <View style={styles.buttonRow}>
                    <TouchableOpacity 
                        style={[styles.navButton, testGroup === 'A' && styles.navActive]} 
                        onPress={() => setTestGroup('A')}
                    >
                        <Text style={[styles.navText, testGroup === 'A' && styles.navTextActive]}>Group A</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.navButton, testGroup === 'B' && styles.navActive]} 
                        onPress={() => setTestGroup('B')}
                    >
                        <Text style={[styles.navText, testGroup === 'B' && styles.navTextActive]}>Group B</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.navButton, testGroup === 'C' && styles.navActive]} 
                        onPress={() => setTestGroup('C')}
                    >
                        <Text style={[styles.navText, testGroup === 'C' && styles.navTextActive]}>Group C</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.contentArea}>
                {renderContent()}
            </View>

            <View style={styles.telemetryArea}>
                <EvaluationTelemetry />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f0f0f0' 
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40 // 底部预留空间，防止导出按钮被系统白条遮挡
    },
    routerNav: { 
        backgroundColor: '#333', 
        padding: 15, 
        paddingTop: 50 
    },
    navTitle: { 
        color: '#FFC107', 
        fontSize: 12, 
        fontWeight: 'bold', 
        marginBottom: 10, 
        textAlign: 'center' 
    },
    buttonRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-around' 
    },
    navButton: { 
        paddingVertical: 8, 
        paddingHorizontal: 15, 
        borderRadius: 20, 
        borderWidth: 1, 
        borderColor: '#555' 
    },
    navActive: { 
        backgroundColor: '#FFC107', 
        borderColor: '#FFC107' 
    },
    navText: { 
        color: '#ccc', 
        fontWeight: 'bold' 
    },
    navTextActive: { 
        color: '#333' 
    },
    contentArea: { 
        flex: 1,
        minHeight: 400 // 保证上半部分区域即使在问卷很长的情况下也不会被完全压瘪
    },
    telemetryArea: { 
        borderTopWidth: 1, 
        borderColor: '#ddd', 
        backgroundColor: '#fff' 
    },
    headerSpacer: { 
        height: 100, 
        backgroundColor: '#1D3D47' 
    },
    parallaxContainer: { 
        flex: 1, 
        padding: 16 
    }
});