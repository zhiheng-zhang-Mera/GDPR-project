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
const SOURCE_REVIEW_LABEL = { CURRENT: 'Source review current', REVIEW_DUE: 'Source review due', NOT_APPLICABLE: 'Non-legal pack', NOT_RECORDED: 'Source review not recorded' } as const;

export const FindingCard = memo(function FindingCard({ finding }: { finding: ComplianceFinding }) {
  const [expanded, setExpanded] = useState(false);
  const presentation = STATUS_PRESENTATION[finding.compliance.status];
  const tone = TONES[finding.compliance.status];
  return (
    <View style={styles.card}>
      <View style={[styles.statusRail, { backgroundColor: tone.foreground }]} />
      <View style={styles.topRow}>
        <View style={[styles.icon, { backgroundColor: tone.background }]}>
          <Ionicons name={tone.icon} size={21} color={tone.foreground} />
        </View>
        <View style={styles.heading}>
          <Text style={styles.title}>{PERMISSION_LABEL[finding.permissionType]}</Text>
          <Text style={styles.packageName}>{finding.packageName}</Text>
        </View>
      </View>
      <View style={[styles.badge, { backgroundColor: tone.background }]}>
        <Text style={[styles.badgeMarker, { color: tone.foreground }]}>{presentation.marker}</Text>
        <Text style={[styles.badgeText, { color: tone.foreground }]}>{presentation.label}</Text>
      </View>
      <Text style={styles.summary}>{finding.communication.summary.replaceAll('_', ' ')}</Text>
      <View style={styles.metaRow}>
        <View style={styles.metaChip}><Ionicons name={finding.evidence.source === 'SIMULATOR' ? 'flask-outline' : 'phone-portrait-outline'} size={14} color={T.colors.muted} /><Text style={styles.meta}>{SOURCE_LABEL[finding.evidence.source]}</Text></View>
        <View style={styles.metaChip}><Ionicons name="layers-outline" size={14} color={T.colors.muted} /><Text style={styles.meta}>{finding.regulationName ?? 'EU GDPR'}</Text></View>
        <View style={[styles.metaChip, finding.compliance.sourceReview.state === 'REVIEW_DUE' && styles.metaChipDue]}><Ionicons name="calendar-outline" size={14} color={finding.compliance.sourceReview.state === 'REVIEW_DUE' ? T.colors.danger : T.colors.muted} /><Text style={[styles.meta, finding.compliance.sourceReview.state === 'REVIEW_DUE' && styles.metaDue]}>{SOURCE_REVIEW_LABEL[finding.compliance.sourceReview.state]}</Text></View>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${expanded ? 'Hide' : 'View'} evidence for ${presentation.label}, ${PERMISSION_LABEL[finding.permissionType]}, ${finding.packageName}`}
        accessibilityHint={expanded ? 'Collapse evidence details' : 'Show evidence details and next step'}
        activeOpacity={0.72}
        onPress={() => setExpanded((value) => !value)}
        style={styles.expandRow}
      >
        <Text style={styles.expandText}>{expanded ? 'Hide evidence' : 'View evidence'}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={T.colors.primary} />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.details}>
          <View style={styles.reasoningStep}><View style={styles.reasoningNumber}><Text style={styles.reasoningNumberText}>1</Text></View><View style={styles.nextStepCopy}><Text style={styles.sectionLabel}>What was observed</Text><Text style={styles.detailText}>Window {finding.evidence.dailyCount} · Peak/min {finding.evidence.peakCallsPerMinute} · Rolling {finding.evidence.rollingCount}</Text><Text style={styles.ruleText}>{finding.legalReference ?? finding.gdprArticle}</Text><Text style={styles.sourceReviewText}>{SOURCE_REVIEW_LABEL[finding.compliance.sourceReview.state]} · assessed {finding.compliance.sourceReview.assessedAt}{finding.compliance.sourceReview.nextDueAt ? ` · next due ${finding.compliance.sourceReview.nextDueAt}` : ''}</Text></View></View>
          <View style={styles.reasoningStep}><View style={styles.reasoningNumber}><Text style={styles.reasoningNumberText}>2</Text></View><View style={styles.nextStepCopy}><Text style={styles.sectionLabel}>What is not established</Text><Text style={styles.detailText}>{finding.compliance.missingEvidence.join(', ') || 'No additional gap was recorded by this rule; legal meaning still requires context.'}</Text></View></View>
          <View style={styles.nextStep}><View style={styles.nextStepIcon}><Text style={styles.reasoningNumberText}>3</Text></View><View style={styles.nextStepCopy}><Text style={styles.sectionLabel}>Your proportionate next step</Text><Text style={styles.detailText}>{finding.communication.recommendedAction}</Text><Text style={styles.agencyText}>Do not change access or confront a developer based on this card alone.</Text></View></View>
          <Text style={styles.caveat}>{finding.compliance.legalCaveat}</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: { position: 'relative', overflow: 'hidden', padding: 18, paddingLeft: 21, borderRadius: T.radius.medium, backgroundColor: T.colors.surface, borderWidth: 1, borderColor: T.colors.line, gap: 12, ...T.shadow.card },
  statusRail: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, minWidth: 0 },
  title: { color: T.colors.ink, fontSize: 17, lineHeight: 22, fontWeight: '800' },
  packageName: { color: T.colors.muted, fontSize: 12, lineHeight: 17, marginTop: 1 },
  badge: { alignSelf: 'flex-start', maxWidth: '100%', paddingHorizontal: 9, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: T.radius.pill },
  badgeMarker: { fontSize: 12, lineHeight: 14, fontWeight: '900' },
  badgeText: { flexShrink: 1, fontSize: 10, lineHeight: 13, fontWeight: '900' },
  summary: { color: T.colors.inkSoft, fontSize: 14, lineHeight: 21 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 },
  metaChip: { minHeight: 30, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: T.radius.pill, backgroundColor: T.colors.surfaceMuted, borderWidth: 1, borderColor: T.colors.line },
  meta: { color: T.colors.muted, fontSize: 11, lineHeight: 15, fontWeight: '700' },
  metaChipDue: { borderColor: T.colors.danger, backgroundColor: T.colors.dangerSoft },
  metaDue: { color: T.colors.danger },
  details: { paddingTop: 13, gap: 10, borderTopWidth: 1, borderTopColor: T.colors.line },
  nextStep: { flexDirection: 'row', gap: 10, padding: 13, borderRadius: 15, backgroundColor: T.colors.mint },
  nextStepIcon: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  nextStepCopy: { flex: 1 },
  reasoningStep: { flexDirection: 'row', gap: 10, paddingHorizontal: 2, paddingVertical: 5 },
  reasoningNumber: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: T.colors.canvasDeep, borderWidth: 1, borderColor: T.colors.mintStrong },
  reasoningNumberText: { color: T.colors.primary, fontSize: 12, lineHeight: 16, fontWeight: '900' },
  sectionLabel: { color: T.colors.ink, fontSize: 11, lineHeight: 15, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailText: { color: T.colors.inkSoft, fontSize: 13, lineHeight: 20, marginTop: 4 },
  ruleText: { color: T.colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  sourceReviewText: { color: T.colors.primaryDark, fontSize: 10, lineHeight: 16, fontWeight: '800', marginTop: 5 },
  agencyText: { color: T.colors.primaryDark, fontSize: 11, lineHeight: 17, fontWeight: '800', marginTop: 6 },
  caveat: { color: T.colors.warning, backgroundColor: T.colors.warningSoft, borderRadius: 10, padding: 11, fontSize: 12, lineHeight: 18, marginTop: 8 },
  expandRow: { alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 3, paddingRight: 8 },
  expandText: { color: T.colors.primary, fontSize: 13, lineHeight: 18, fontWeight: '800' },
});
