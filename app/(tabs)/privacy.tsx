import { DataFlowVisualizer } from '@/components/DataFlowVisualizer';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PRIVACY_CATEGORIES } from '@/constants/MockData';
import { usePrivacy } from '@/src/context/PrivacyContext';
import { StyleSheet, Switch } from 'react-native';

export default function PrivacyScreen() {
  const { consents, toggleConsent } = usePrivacy();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0E1F9', dark: '#1D3D47' }}
      headerImage={<IconSymbol size={310} name="lock.shield.fill" color="#80B3FF" style={styles.headerImage} />}>

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">隐私与透明度</ThemedText>
      </ThemedView>

      <DataFlowVisualizer />

      <ThemedText style={{ marginTop: 20 }}>您可以随时调整以下数据的处理方式：</ThemedText>

      {PRIVACY_CATEGORIES.map((item) => (
        <ThemedView key={item.id} style={styles.row}>
          <ThemedView style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold">{item.label}</ThemedText>
            <ThemedText type="default">{item.description}</ThemedText>
          </ThemedView>
          <Switch
            value={consents[item.id]}
            onValueChange={() => toggleConsent(item.id)}
          />
        </ThemedView>
      ))}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: { color: '#80B3FF', bottom: -90, left: -35, position: 'absolute' },
  titleContainer: { flexDirection: 'row', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#ccc' },
});