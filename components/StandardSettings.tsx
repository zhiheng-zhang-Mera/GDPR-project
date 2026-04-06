import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { PrivacyBridge } from '../src/services/PrivacyBridge';

interface Props {
    taskId: number;
    variant?: 'standard' | 'text-heavy';
    onInteraction?: (result: { isCorrect: boolean, isError: boolean, latency: number, clickedId: string }) => void;
}

export const StandardSettings = ({ taskId, variant = 'standard', onInteraction }: Props) => {
    const [services, setServices] = useState<any[]>([]);

    useEffect(() => {
        // 注入状态噪音：干扰项的初始状态 (enabled) 被有意打乱，不再是统一的 true
        const baseDistractors = [
            { id: 'step_counter', nameEn: 'Pedometer & Steps', nameCn: '计步与步数', isTrap: false, enabled: true, regionEn: 'Local', regionCn: '本地', descEn: 'Tracks daily step count locally.', descCn: '在本地记录每日步数。' },
            { id: 'sleep_monitor', nameEn: 'Sleep Cycle', nameCn: '睡眠分析', isTrap: false, enabled: false, regionEn: 'Local', regionCn: '本地', descEn: 'Analyzes REM cycles based on movement.', descCn: '基于运动分析快速眼动周期。' },
            { id: 'water_logger', nameEn: 'Hydration Log', nameCn: '饮水记录', isTrap: false, enabled: true, regionEn: 'Local', regionCn: '本地', descEn: 'Manual water intake log.', descCn: '手动饮水记录。' },
            { id: 'calorie_calc', nameEn: 'Calorie Tracker', nameCn: '卡路里追踪', isTrap: false, enabled: false, regionEn: 'Domestic Cloud', regionCn: '境内云', descEn: 'Syncs with national food database.', descCn: '与国家食物数据库同步。' },
            { id: 'heart_rate_var', nameEn: 'HRV Monitor', nameCn: '心率变异性', isTrap: false, enabled: true, regionEn: 'Domestic Cloud', regionCn: '境内云', descEn: 'Heart rate variability baseline.', descCn: '心率变异性基线数据。' },
            { id: 'workout_social', nameEn: 'Social Leaderboard', nameCn: '社交排行榜', isTrap: false, enabled: false, regionEn: 'Domestic Cloud', regionCn: '境内云', descEn: 'Share step milestones with friends.', descCn: '与好友共享步数里程碑。' },
            { id: 'cloud_backup', nameEn: 'Encrypted Vault', nameCn: '加密云备份', isTrap: false, enabled: true, regionEn: 'Domestic Cloud', regionCn: '境内云', descEn: 'End-to-end encrypted backup.', descCn: '端到端加密数据备份。' },
            { id: 'ai_workout', nameEn: 'AI Workout Coach', nameCn: 'AI健身教练', isTrap: false, enabled: true, regionEn: 'Domestic Cloud', regionCn: '境内云', descEn: 'Personalized fitness routines.', descCn: '个性化日常健身计划。' },
            { id: 'ad_network', nameEn: 'Global Ad Network', nameCn: '全球广告网络', isTrap: false, enabled: false, regionEn: 'Third-Party', regionCn: '第三方', descEn: 'Personalized health advertisements.', descCn: '个性化健康广告推送。' },
            { id: 'social_meta', nameEn: 'Social Media Sync', nameCn: '社交媒体同步', isTrap: false, enabled: false, regionEn: 'Third-Party', regionCn: '第三方', descEn: 'Connect with external social apps.', descCn: '连接外部社交应用程序。' },
            { id: 'wearable_api', nameEn: 'Wearable API', nameCn: '穿戴设备接口', isTrap: false, enabled: true, regionEn: 'Third-Party', regionCn: '第三方', descEn: 'Sync with 3rd party smartwatches.', descCn: '与第三方智能手表同步。' },
            { id: 'academic_pool', nameEn: 'Academic Data Pool', nameCn: '学术数据池', isTrap: false, enabled: false, regionEn: 'Third-Party', regionCn: '第三方', descEn: 'Anonymized research contributions.', descCn: '匿名化的科学研究贡献。' },
        ];

        let taskData = [...baseDistractors];

        if (taskId === 1) {
            taskData.splice(3, 0, { id: 'hormone_eu', nameEn: 'Hormone Therapy Analytics', nameCn: '激素治疗分析', isTrap: true, enabled: true, regionEn: 'Overseas Servers', regionCn: '海外服务器', descEn: 'Advanced endocrine profiling via 3rd party.', descCn: '通过第三方进行高级内分泌画像。' });
            taskData.splice(8, 0, { id: 'blood_pressure_us', nameEn: 'Blood Pressure Analytics', nameCn: '血压数据分析', isTrap: true, enabled: true, regionEn: 'US Servers', regionCn: '美国服务器', descEn: 'Remote hypertension prediction models.', descCn: '远程高血压预测模型分析。' });
        } else if (taskId === 2) {
            taskData.splice(4, 0, { id: 'ldp_biometrics', nameEn: 'Biometric Anonymization', nameCn: '生物特征匿名化', isTrap: true, enabled: false, regionEn: 'Local Device', regionCn: '本地设备', descEn: 'Apply noise to de-identify biometric data.', descCn: '在数据传输前添加噪点以去标识化。' });
            taskData.splice(9, 0, { id: 'ldp_gait', nameEn: 'Gait Posture Anonymization', nameCn: '步态姿势匿名化', isTrap: true, enabled: false, regionEn: 'Local Device', regionCn: '本地设备', descEn: 'Apply spatial noise to gait analysis.', descCn: '对步态姿势数据进行空间噪点模糊处理。' });
        } else if (taskId === 3) {
            taskData.splice(2, 0, { id: 'bg_mic', nameEn: 'Background Ambient Mic', nameCn: '后台环境麦克风', isTrap: true, enabled: true, regionEn: 'Third-Party', regionCn: '第三方', descEn: 'High-frequency background ambient collection.', descCn: '高频后台环境音频与压力数据收集。' });
            taskData.splice(10, 0, { id: 'bg_gps', nameEn: 'Precise Background Location', nameCn: '精确常驻后台定位', isTrap: true, enabled: true, regionEn: 'Third-Party', regionCn: '第三方', descEn: '1Hz continuous tracking for ad delivery.', descCn: '1Hz连续后台定位用于精确广告投放。' });
        } else if (taskId === 4) {
            taskData = taskData.map(s => ({...s, enabled: false}));
            taskData.splice(2, 0, { id: 'emergency_911', nameEn: 'Emergency Access Override', nameCn: '紧急访问覆盖', isTrap: true, enabled: false, regionEn: 'Paramedic Node', regionCn: '急救节点', descEn: 'Global bypass for first responders.', descCn: '全局允许急救人员绕过隐私锁定读取健康史。' });
        } else if (taskId === 5) {
            taskData.splice(5, 0, { id: 'adm_insurance', nameEn: 'Automated Health Evaluation', nameCn: '自动健康画像/ADM', isTrap: true, enabled: true, regionEn: 'Insurance Brokers', regionCn: '保险经纪', descEn: 'AI profiling for insurance calculation.', descCn: '无人工审核的保险费率计算AI画像。' });
            taskData.splice(11, 0, { id: 'adm_credit', nameEn: 'Health Credit Scorer', nameCn: '健康信用自动评分', isTrap: true, enabled: true, regionEn: 'Broker ADM', regionCn: '数据经纪', descEn: 'Automated health credit score without human review.', descCn: '无人工审核的健康信用与资质自动评级。' });
        } else if (taskId === 6) {
            taskData.splice(5, 0, { id: 'genetic_registry_distractor', nameEn: 'Genetic Data Sharing', nameCn: '基因数据共享', isTrap: false, enabled: true, regionEn: 'Remote Vault', regionCn: '远程存档', descEn: 'General storage of DNA markers.', descCn: 'DNA序列的常规存储（仅为干扰项）。' });
        }

        setServices(taskData);
    }, [taskId]);

    const toggleSwitch = async (id: string, isTrap: boolean, currentValue: boolean) => {
        const newValue = !currentValue;
        let isCorrectAction = false;
        let isError = false;

        if (isTrap) {
            if ([1, 3, 5].includes(taskId) && newValue === false) isCorrectAction = true;
            if ([2, 4].includes(taskId) && newValue === true) isCorrectAction = true;
        } else {
            isError = true;
        }

        const result = await PrivacyBridge.invokeInterceptor(id, false, isTrap);
        const updatedServices = services.map(s => s.id === id ? { ...s, enabled: newValue } : s);
        setServices(updatedServices);

        if (onInteraction) onInteraction({ isCorrect: isCorrectAction, isError: isError, latency: result.latencyMs, clickedId: id });
    };

    const handleTask6Erasure = async () => {
        let isCorrectAction = taskId === 6;
        const result = await PrivacyBridge.invokeInterceptor('erasure_request', false, true);
        if (onInteraction) onInteraction({ isCorrect: isCorrectAction, isError: !isCorrectAction, latency: result.latencyMs, clickedId: 'erasure_request' });
        
        Alert.alert(
            "Request Submitted / 请求已提交",
            "Your Data Subject Access Request (DSAR) has been formally submitted.\n\n您的数据主体删除请求已正式提交。底层数据管道已被切断。",
            [{ text: "OK" }]
        );
    };

    const renderLegalText = (service: any) => {
        let extraClauseEn = '';
        let extraClauseCn = '';
        if (service.isTrap) {
            if (taskId === 1) { extraClauseEn = '[!] Subject to Article 46 for Cross-Border Transfers.'; extraClauseCn = '[!] 涉及受GDPR第46条管辖的跨境传输。'; }
            if (taskId === 2) { extraClauseEn = '[!] Implementing Local Differential Privacy (LDP).'; extraClauseCn = '[!] 同意实施本地差分隐私(LDP)算法。'; }
            if (taskId === 3) { extraClauseEn = '[!] Exercising Data Minimization (Article 5(1)(c)).'; extraClauseCn = '[!] 行使数据最小化权利限制精度 (第5(1)(c)条)。'; }
            if (taskId === 4) { extraClauseEn = '[!] Vital Interests Exemption (Article 6(1)(d)).'; extraClauseCn = '[!] 触发切身利益豁免 (第6(1)(d)条)。'; }
            if (taskId === 5) { extraClauseEn = '[!] Subject to Automated Decision-Making (ADM).'; extraClauseCn = '[!] 接受自动化决策(ADM)评估画像。'; }
        }

        return (
            <Text style={styles.legalText}>
                data processing region: {service.regionEn} 数据处理位置：{service.regionCn}{'\n'}
                data collection Purpose: {service.descEn} 数据收集目的：{service.descCn}{'\n'}
                {extraClauseEn ? `\n${extraClauseEn}\n${extraClauseCn}\n\n` : '\n'}
                * By toggling this component, the Data Subject formally modifies their explicit consent under Article 7.{'\n'}
                * 切换此选项代表数据主体正式修改其在第7条下的明示同意。
            </Text>
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}}>
            {services.map(service => (
                <View key={service.id} style={[styles.settingItem, variant === 'text-heavy' && styles.legalItem]}>
                    <View style={styles.textContainer}>
                        <Text style={[styles.title, variant === 'text-heavy' && styles.legalTitle]}>
                            {variant === 'text-heavy' ? `${service.nameEn} - ${service.nameCn}` : `${service.nameEn} (${service.nameCn})`}
                        </Text>
                        
                        {variant === 'standard' && <Text style={styles.basicText}>{service.descEn}{'\n'}{service.descCn}</Text>}
                        {variant === 'text-heavy' && renderLegalText(service)}
                    </View>
                    
                    <Switch 
                        value={service.enabled} 
                        onValueChange={() => toggleSwitch(service.id, service.isTrap, service.enabled)} 
                        trackColor={variant === 'text-heavy' ? { true: '#90CAF9', false: '#E0E0E0' } : undefined}
                    />
                </View>
            ))}

            {taskId === 6 && (
                <View style={variant === 'text-heavy' ? styles.dsarContainer : styles.dangerZone}>
                    {variant === 'standard' ? (
                        <TouchableOpacity style={styles.deleteButtonA} onPress={handleTask6Erasure}>
                            <Text style={styles.deleteButtonTextA}>Delete My Account and Data</Text>
                            <Text style={{color: '#D32F2F', fontSize: 12, marginTop: 4}}>彻底删除我的账户及数据</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.legalText}>
                            Section 14.2 Right to be Forgotten: Pursuant to Article 17 of the GDPR, data subjects have the right to obtain from the controller the erasure of personal data without undue delay. If you wish to enforce this right, you must 
                            <Text onPress={handleTask6Erasure} style={styles.dsarLink}> submit a formal Data Subject Access Request (DSAR) via this text link (提交删除请求) </Text>
                            and await our review within 30 days. No further actions can be processed until cleared.
                        </Text>
                    )}
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' }, 
    settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#C6C6C8' },
    textContainer: { flex: 1, paddingRight: 15 },
    title: { fontSize: 16, fontWeight: '400', color: '#000' },
    basicText: { fontSize: 13, color: '#8E8E93', marginTop: 4, lineHeight: 18 },
    legalItem: { alignItems: 'flex-start', paddingVertical: 15, backgroundColor: '#FAFAFA' },
    legalTitle: { fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 6, textTransform: 'uppercase' },
    legalText: { fontSize: 11, color: '#666', lineHeight: 18, backgroundColor: '#EFEFEF', padding: 10, borderRadius: 4, textAlign: 'justify', width: '100%' }, 
    dangerZone: { marginTop: 30, paddingHorizontal: 20, alignItems: 'center' },
    deleteButtonA: { width: '100%', padding: 15, backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#EF5350', borderRadius: 10, alignItems: 'center' },
    deleteButtonTextA: { color: '#C62828', fontSize: 16, fontWeight: 'bold' },
    dsarContainer: { marginTop: 10, padding: 15, backgroundColor: '#FAFAFA', borderTopWidth: 1, borderColor: '#E0E0E0' },
    dsarLink: { textDecorationLine: 'underline', color: '#555', fontWeight: 'bold' }
});