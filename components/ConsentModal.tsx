import React, { useContext } from 'react';
import { Modal, View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { PrivacyContext } from '../src/context/PrivacyContext';
import { StorageService } from '../src/services/StorageService';

export default function ConsentModal() {
  const { hasConsented, setHasConsented } = useContext(PrivacyContext);

  const handleAccept = async () => {
    await StorageService.save('gdpr_consent', { accepted: true, date: new Date() });
    setHasConsented(true);
  };

  return (
    <Modal visible={hasConsented === false} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.title}>GDPR 隐私合规确认</Text>
        <ScrollView style={{ marginVertical: 20 }}>
          <Text style={styles.body}>
            本应用（mHealth）需要收集您的健康数据。根据 GDPR：{"\n\n"}
            1. 数据仅加密存储于您的本地设备。{"\n"}
            2. 您可以随时在设置中导出或永久删除数据。{"\n"}
            3. 我们不会在未经允许的情况下上传 PII（个人识别信息）。
          </Text>
        </ScrollView>
        <Button title="我同意并开始使用" onPress={handleAccept} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 40, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold' },
  body: { fontSize: 16, lineHeight: 24, color: '#444' }
});