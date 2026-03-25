/*** 

import { useContext, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
// 从新库中导入 SafeAreaView
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrivacyContext } from '../../src/context/PrivacyContext';
import { StorageService } from '../../src/services/StorageService';

export default function Settings() {
  const { setHasConsented } = useContext(PrivacyContext);

  // 10 项模拟健康数据的状态管理
  const [permissions, setPermissions] = useState({
    heartRate: true,
    steps: true,
    bloodSugar: false,
    bodyTemp: true,
    gender: true,
    age: true,
    weight: false,
    bodyFat: false,
    period: false,
    sleepRecord: true,
  });

  const toggleSwitch = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleClearData = async () => {
    Alert.alert("删除数据", "确定要永久抹除您的所有个人数据吗？", [
      { text: "取消" },
      { text: "确认", onPress: async () => {
          await StorageService.delete('gdpr_consent');
          setHasConsented(false); 
          Alert.alert("已抹除", "您的数据已根据 GDPR 被遗忘。");
      }}
    ]);
  };

  const renderSwitchItem = (label, key) => (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        trackColor={{ false: "#D1D1D6", true: "#34C759" }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#D1D1D6"
        onValueChange={() => toggleSwitch(key)}
        value={permissions[key]}
      />
    </View>
  );

  return (
    // 使用新的 SafeAreaView 确保全屏适配
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      
      //{ 顶部滚动区域：数据权限开关}
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.mainTitle}>设置</Text>
        
        <Text style={styles.sectionHeader}>健康数据共享权限</Text>
        <View style={styles.card}>
          {renderSwitchItem("心率 (Heart Rate)", "heartRate")}
          {renderSwitchItem("步数 (Steps)", "steps")}
          {renderSwitchItem("血糖 (Blood Sugar)", "bloodSugar")}
          {renderSwitchItem("体温 (Body Temp)", "bodyTemp")}
          {renderSwitchItem("性别 (Gender)", "gender")}
          {renderSwitchItem("年龄 (Age)", "age")}
          {renderSwitchItem("体重 (Weight)", "weight")}
          {renderSwitchItem("体脂率 (Body Fat)", "bodyFat")}
          {renderSwitchItem("经期记录 (Period)", "period")}
          {renderSwitchItem("睡眠记录 (Sleep Record)", "sleepRecord")}
        </View>
        <Text style={styles.infoText}>这些权限控制应用如何读取您的生物特征数据。</Text>
      </ScrollView>

      //{ 底部固定区域：GDPR 操作 }
      <SafeAreaView edges={['bottom']} style={styles.footerContainer}>
        <View style={styles.buttonWrapper}>
          <Button title="导出我的数据 (.JSON)" onPress={() => Alert.alert("导出成功", "数据已保存。")} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button title="抹除我的所有数据" color="#FF3B30" onPress={handleClearData} />
        </View>
      </SafeAreaView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7', // iOS 系统背景色
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
  },
  sectionHeader: {
    fontSize: 13,
    color: '#6e6e73',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  switchLabel: {
    fontSize: 17,
    color: '#000000',
  },
  infoText: {
    fontSize: 13,
    color: '#8E8E93',
    paddingHorizontal: 5,
    marginBottom: 20,
  },
  footerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#D1D1D6',
    paddingTop: 15,
    paddingHorizontal: 20,
  },
  buttonWrapper: {
    marginBottom: 10,
  }
});

***/

import { Alert, Button, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// 1. 修正导入：只导入 usePrivacy
import { usePrivacy } from '../../src/context/PrivacyContext';

export default function Settings() {
  // 2. 使用 hook 获取 context 里的状态
  const { consents, toggleConsent } = usePrivacy();

  // 3. 将本地权限状态与 Context 关联（为了演示 GDPR 的动态知情同意）
  const handleToggle = (id: string) => {
    toggleConsent(id);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.mainTitle}>设置</Text>
        
        <Text style={styles.sectionHeader}>GDPR 隐私授权 (动态知情同意)</Text>
        <View style={styles.card}>
          {/* 渲染来自 Context 的权限开关 */}
          {Object.keys(consents).map((key) => (
            <View key={key} style={styles.switchRow}>
              <Text>{key === 'heart_rate' ? '心率数据' : key === 'location' ? '地理位置' : '第三方同步'}</Text>
              <Switch
                value={consents[key]}
                onValueChange={() => handleToggle(key)}
              />
            </View>
          ))}
        </View>

        <View style={styles.buttonWrapper}>
          <Button title="导出我的数据报告 (Right to Access)" onPress={() => Alert.alert("导出中", "正在根据 GDPR Art. 15 生成报告...")} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7' },
  scrollContent: { padding: 20 },
  mainTitle: { fontSize: 34, fontWeight: 'bold', marginBottom: 20 },
  sectionHeader: { fontSize: 13, color: '#6e6e73', marginBottom: 8, textTransform: 'uppercase' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 10, marginBottom: 20 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#EEE' },
  buttonWrapper: { marginTop: 20 }
});