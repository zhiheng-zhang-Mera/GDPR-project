import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '../../components/privacy/BottomNav';
import { FindingCard } from '../../components/privacy/FindingCard';
import { PrivacyTheme as T } from '../../constants/privacyTheme';
import { DashboardFilter, filterFindings, summarizeFindings } from '../../src/compliance/DashboardModel';
import { usePrivacy } from '../../src/context/PrivacyContext';

export default function FindingsScreen() {
  const { findings, selectedPack } = usePrivacy();
  const [filter, setFilter] = useState<DashboardFilter>('ALL');
  const summary = useMemo(() => summarizeFindings(findings), [findings]);
  const visible = useMemo(() => filterFindings(findings, filter), [findings, filter]);
  const filters: { key: DashboardFilter; label: string; count: number }[] = [
    { key: 'ALL', label: 'All', count: summary.total },
    { key: 'ACTION', label: 'Review', count: summary.action },
    { key: 'EVIDENCE', label: 'Evidence gaps', count: summary.evidence },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={visible}
        keyExtractor={(item) => `${item.regulationId ?? 'EU_GDPR'}:${item.id}:${item.detectedAt}`}
        renderItem={({ item }) => <FindingCard finding={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={styles.eyebrow}>LOCAL EVIDENCE LEDGER</Text>
            <Text accessibilityRole="header" style={styles.title}>Findings</Text>
            <Text style={styles.subtitle}>Each item names its evidence source and rule pack. Expand a card before deciding what to do.</Text>
            <View style={styles.packRow}><Ionicons name="layers-outline" size={17} color={T.colors.primary} /><Text style={styles.packText}>Active for new reviews: {selectedPack.shortName}</Text></View>
            <View accessibilityRole="tablist" style={styles.filters}>
              {filters.map((item) => {
                const selected = item.key === filter;
                return (
                  <TouchableOpacity key={item.key} accessibilityRole="tab" accessibilityLabel={`${item.label}, ${item.count} findings`} accessibilityState={{ selected }} onPress={() => setFilter(item.key)} style={[styles.filter, selected && styles.filterSelected]}>
                    <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{item.label}</Text>
                    <View style={[styles.count, selected && styles.countSelected]}><Text style={[styles.countText, selected && styles.countTextSelected]}>{item.count}</Text></View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Ionicons name={filter === 'ALL' ? 'file-tray-outline' : 'checkmark-circle-outline'} size={32} color={T.colors.primary} /></View>
            <Text style={styles.emptyTitle}>{filter === 'ALL' ? 'No findings saved yet' : 'Nothing in this category'}</Text>
            <Text style={styles.emptyText}>{filter === 'ALL' ? 'Start a device review or run the clearly labelled synthetic demo from Overview.' : 'Try another filter to review the local evidence ledger.'}</Text>
          </View>
        }
      />
      <BottomNav active="findings" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.colors.canvas }, container: { flex: 1 }, content: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 32 },
  eyebrow: { color: T.colors.primary, fontSize: 11, lineHeight: 15, fontWeight: '900', letterSpacing: 1 }, title: { color: T.colors.ink, fontSize: 30, lineHeight: 36, fontWeight: '900', marginTop: 5 }, subtitle: { color: T.colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8, maxWidth: 350 }, packRow: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 8, borderRadius: T.radius.pill, backgroundColor: T.colors.mint, marginTop: 14 }, packText: { color: T.colors.primaryDark, fontSize: 12, lineHeight: 16, fontWeight: '700' },
  filters: { flexDirection: 'row', gap: 7, marginTop: 21, marginBottom: 18 }, filter: { flex: 1, minHeight: 46, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 14, borderWidth: 1, borderColor: T.colors.line, backgroundColor: '#FFFFFF' }, filterSelected: { backgroundColor: T.colors.primaryDark, borderColor: T.colors.primaryDark }, filterText: { color: '#49615E', fontSize: 12, lineHeight: 16, fontWeight: '800' }, filterTextSelected: { color: '#FFFFFF' }, count: { minWidth: 22, height: 22, paddingHorizontal: 5, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: T.colors.canvas }, countSelected: { backgroundColor: 'rgba(255,255,255,0.17)' }, countText: { color: T.colors.ink, fontSize: 10, fontWeight: '900' }, countTextSelected: { color: '#FFFFFF' }, separator: { height: 11 },
  empty: { alignItems: 'center', paddingHorizontal: 26, paddingVertical: 36, borderRadius: T.radius.large, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: T.colors.line }, emptyIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: T.colors.mint }, emptyTitle: { color: T.colors.ink, fontSize: 18, lineHeight: 23, fontWeight: '900', marginTop: 16 }, emptyText: { color: T.colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 7 },
});
