import { Ionicons } from '@expo/vector-icons';
import { memo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PrivacyTheme as T } from '../../constants/privacyTheme';
import { STATUS_PRESENTATION } from '../../src/compliance/DashboardModel';
import { ComplianceFinding } from '../../src/compliance/types';

const TONES = {
  POTENTIAL_CONFLICT: { background: T.colors.dangerSoft, foreground: T.colors.danger, icon: 'alert-circle' },
  LIKELY_NON_COMPLIANT: { background: T.colors.dangerSoft, foreground: T.colors.danger, icon: 'alert-circle' },
  REVIEW_REQUIRED: { background: T.colors.warningSoft, foreground: T.colors.warning, icon: 'eye' },
  INSUFFICIENT_EVIDENCE: { background: T.colors.infoSoft, foreground: T.colors.info, icon: 'document-text' },
  NO_TECHNICAL_CONCERN: { background: T.colors.successSoft, foreground: T.colors.success, icon: 'checkmark-circle' },
} as const;

const PERMISSION_LABEL = { LOCATION: 'Location', MICROPHONE: 'Microphone', CONTACTS: 'Contacts' } as const;
const SOURCE_LABEL = { SIMULATOR: 'Synthetic demo', NATIVE_BRIDGE: 'On-device', IMPORTED: 'Imported' } as const;

export const FindingCard = memo(function FindingCard({ finding }: { finding: ComplianceFinding }) {
  const [expanded, setExpanded] = useState(false);
  const presentation = STATUS_PRESENTATION[finding.compliance.status];
  const tone = TONES[finding.compliance.status];
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`${presentation.label}. ${PERMISSION_LABEL[finding.permissionType]}. ${finding.packageName}`}
      accessibilityHint={expanded ? 'Collapse evidence details' : 'Show evidence details and next step'}
      activeOpacity={0.88}
      onPress={() => setExpanded((value) => !value)}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={[styles.icon, { backgroundColor: tone.background }]}>
          <Ionicons name={tone.icon} size={21} color={tone.foreground} />
        </View>
        <View style={styles.heading}>
          <Text style={styles.title}>{PERMISSION_LABEL[finding.permissionType]}</Text>
          <Text style={styles.packageName} numberOfLines={1}>{finding.packageName}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: tone.background }]}>
          <Text style={[styles.badgeText, { color: tone.foreground }]}>{presentation.label}</Text>
        </View>
      </View>
      <Text style={styles.summary}>{finding.communication.summary.replaceAll('_', ' ').toLowerCase()}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{SOURCE_LABEL[finding.evidence.source]}</Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.meta}>{finding.regulationName ?? 'EU GDPR'}</Text>
      </View>
      {expanded && (
        <View style={styles.details}>
          <Text style={styles.sectionLabel}>Recommended next step</Text>
          <Text style={styles.detailText}>{finding.communication.recommendedAction}</Text>
          <Text style={styles.sectionLabel}>Technical evidence</Text>
          <Text style={styles.detailText}>Window count {finding.evidence.dailyCount} · Peak/min {finding.evidence.peakCallsPerMinute} · Rolling {finding.evidence.rollingCount}</Text>
          <Text style={styles.sectionLabel}>Rule reference</Text>
          <Text style={styles.detailText}>{finding.legalReference ?? finding.gdprArticle}</Text>
          <Text style={styles.sectionLabel}>Evidence gaps</Text>
          <Text style={styles.detailText}>{finding.compliance.missingEvidence.join(', ') || 'None recorded for this automated check'}</Text>
          <Text style={styles.caveat}>{finding.compliance.legalCaveat}</Text>
        </View>
      )}
      <View style={styles.expandRow}>
        <Text style={styles.expandText}>{expanded ? 'Hide evidence' : 'View evidence'}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={T.colors.primary} />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: { padding: 17, borderRadius: T.radius.medium, backgroundColor: T.colors.surface, borderWidth: 1, borderColor: T.colors.line, gap: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, minWidth: 0 },
  title: { color: T.colors.ink, fontSize: 17, lineHeight: 22, fontWeight: '800' },
  packageName: { color: T.colors.muted, fontSize: 12, lineHeight: 17, marginTop: 1 },
  badge: { maxWidth: 118, paddingHorizontal: 9, paddingVertical: 6, borderRadius: T.radius.pill },
  badgeText: { fontSize: 11, lineHeight: 14, fontWeight: '800', textAlign: 'center' },
  summary: { color: '#304947', fontSize: 14, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  meta: { color: T.colors.muted, fontSize: 12, lineHeight: 16, fontWeight: '600' },
  metaDot: { color: '#96AAA4' },
  details: { paddingTop: 2, gap: 5, borderTopWidth: 1, borderTopColor: T.colors.line },
  sectionLabel: { color: T.colors.ink, fontSize: 12, lineHeight: 16, fontWeight: '800', marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailText: { color: '#405A57', fontSize: 14, lineHeight: 20 },
  caveat: { color: T.colors.warning, backgroundColor: T.colors.warningSoft, borderRadius: 10, padding: 11, fontSize: 12, lineHeight: 18, marginTop: 8 },
  expandRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  expandText: { color: T.colors.primary, fontSize: 13, lineHeight: 18, fontWeight: '800' },
});
