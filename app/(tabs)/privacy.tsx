import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '../../components/privacy/BottomNav';
import { FindingCard } from '../../components/privacy/FindingCard';
import { PrivacyTheme as T } from '../../constants/privacyTheme';
import { DashboardFilter, filterFindings, summarizeFindings } from '../../src/compliance/DashboardModel';
import { usePrivacy } from '../../src/context/PrivacyContext';

export default function FindingsScreen() {
  const { fontScale } = useWindowDimensions();
  const largeTextLayout = fontScale >= 1.4;
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
        key={findings.length === 0 ? 'empty-ledger' : 'populated-ledger'}
        style={styles.container}
        contentContainerStyle={styles.content}
        data={visible}
        keyExtractor={(item) => `${item.regulationId ?? 'EU_GDPR'}:${item.id}:${item.detectedAt}`}
        renderItem={({ item }) => <FindingCard finding={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}><Text style={styles.eyebrow}>LOCAL EVIDENCE LEDGER</Text><Text accessibilityRole="header" style={styles.title}>Findings</Text></View>
              <View style={styles.ledgerSeal}><Ionicons name="finger-print" size={24} color={T.colors.primary} /></View>
            </View>
            <Text style={styles.subtitle}>A review workspace, not a verdict list. Every item retains its evidence source, rule pack, and uncertainty.</Text>
            <View style={styles.packRow}><Ionicons name="layers-outline" size={17} color={T.colors.primary} /><Text style={styles.packText}>Active for new reviews: {selectedPack.shortName}</Text></View>
            <View style={[styles.ledgerSummary, largeTextLayout && styles.ledgerSummaryLargeText]}>
              <View style={styles.ledgerSummaryItem}><Text style={styles.ledgerSummaryValue}>{summary.total}</Text><Text style={styles.ledgerSummaryLabel}>Stored items</Text></View>
              <View style={[styles.ledgerDivider, largeTextLayout && styles.ledgerDividerLargeText]} />
              <View style={styles.ledgerSummaryCopy}><Text style={styles.ledgerSummaryTitle}>{summary.action + summary.evidence > 0 ? 'Human attention remains' : 'No unresolved signal'}</Text><Text style={styles.ledgerSummaryText}>Open a card to inspect evidence and the bounded next step.</Text></View>
            </View>
            <View accessibilityRole="tablist" style={[styles.filters, largeTextLayout && styles.filtersLargeText]}>
              {filters.map((item) => {
                const selected = item.key === filter;
                return (
                  <TouchableOpacity key={item.key} accessibilityRole="tab" accessibilityLabel={`${item.label}, ${item.count} findings`} accessibilityState={{ selected }} onPress={() => setFilter(item.key)} style={[styles.filter, largeTextLayout && styles.filterLargeText, selected && styles.filterSelected]}>
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
  safe: { flex: 1, backgroundColor: T.colors.canvas }, container: { flex: 1 }, content: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 34 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 }, headerCopy: { flex: 1 }, ledgerSeal: { width: 54, height: 54, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: T.colors.mint, borderWidth: 1, borderColor: T.colors.mintStrong }, eyebrow: { color: T.colors.primary, fontSize: 11, lineHeight: 15, fontWeight: '900', letterSpacing: 1 }, title: { color: T.colors.ink, fontSize: 31, lineHeight: 37, fontWeight: '900', letterSpacing: -0.7, marginTop: 5 }, subtitle: { color: T.colors.muted, fontSize: 14, lineHeight: 21, marginTop: 10, maxWidth: 360 }, packRow: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 8, borderRadius: T.radius.pill, backgroundColor: T.colors.mint, marginTop: 15 }, packText: { color: T.colors.primaryDark, fontSize: 12, lineHeight: 16, fontWeight: '700' },
  ledgerSummary: { minHeight: 90, marginTop: 16, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: T.radius.medium, backgroundColor: T.colors.primaryDark, ...T.shadow.card }, ledgerSummaryItem: { minWidth: 64, alignItems: 'center' }, ledgerSummaryValue: { color: '#FFFFFF', fontSize: 29, lineHeight: 34, fontWeight: '900' }, ledgerSummaryLabel: { color: '#BBD8D0', fontSize: 10, lineHeight: 14, fontWeight: '800', marginTop: 2 }, ledgerDivider: { alignSelf: 'stretch', width: 1, backgroundColor: 'rgba(255,255,255,0.16)' }, ledgerSummaryCopy: { flex: 1 }, ledgerSummaryTitle: { color: '#FFFFFF', fontSize: 14, lineHeight: 19, fontWeight: '900' }, ledgerSummaryText: { color: '#CDE2DC', fontSize: 11, lineHeight: 16, marginTop: 3 },
  ledgerSummaryLargeText: { alignItems: 'stretch', flexDirection: 'column' }, ledgerDividerLargeText: { alignSelf: 'stretch', width: '100%', height: 1 },
  filters: { flexDirection: 'row', gap: 7, marginTop: 17, marginBottom: 18 }, filter: { flex: 1, minHeight: 48, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 15, borderWidth: 1, borderColor: T.colors.line, backgroundColor: '#FFFFFF' }, filterSelected: { backgroundColor: T.colors.primary, borderColor: T.colors.primary, ...T.shadow.card }, filterText: { color: T.colors.inkSoft, fontSize: 12, lineHeight: 16, fontWeight: '800' }, filterTextSelected: { color: '#FFFFFF' }, count: { minWidth: 22, height: 22, paddingHorizontal: 5, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: T.colors.canvas }, countSelected: { backgroundColor: 'rgba(255,255,255,0.18)' }, countText: { color: T.colors.ink, fontSize: 10, fontWeight: '900' }, countTextSelected: { color: '#FFFFFF' }, separator: { height: 12 },
  filtersLargeText: { flexDirection: 'column' }, filterLargeText: { flex: 0, width: '100%', justifyContent: 'space-between', paddingHorizontal: 14 },
  empty: { alignItems: 'center', paddingHorizontal: 26, paddingVertical: 38, borderRadius: T.radius.large, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: T.colors.line, ...T.shadow.card }, emptyIcon: { width: 66, height: 66, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: T.colors.mint }, emptyTitle: { color: T.colors.ink, fontSize: 18, lineHeight: 23, fontWeight: '900', marginTop: 17 }, emptyText: { color: T.colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 7 },
});
