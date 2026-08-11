import { Ionicons } from '@expo/vector-icons';
import { memo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PrivacyTheme as T } from '../../constants/privacyTheme';
import { STATUS_PRESENTATION } from '../../src/compliance/DashboardModel';
import { assessDecisionReadiness, FindingInterpretation } from '../../src/compliance/DecisionReadiness';
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
const SOURCE_CONTENT_LABEL = { VERIFIED: 'Source bytes verified', MANIFEST_NOT_PROVIDED: 'No content manifest', ARTIFACTS_NOT_AVAILABLE: 'Source bytes not verified here', ARTIFACT_MISSING: 'Source artifact missing', ARTIFACT_LENGTH_MISMATCH: 'Source length mismatch', ARTIFACT_HASH_MISMATCH: 'Source digest mismatch', NOT_APPLICABLE: 'Non-legal pack', NOT_RECORDED: 'Content verification not recorded' } as const;
const LEGAL_REVIEW_LABEL = { CURRENT: 'Signed legal review current', EXPIRED: 'Signed legal review expired', NOT_PROVIDED: 'Legal review not recorded', SOURCE_BUNDLE_MISMATCH: 'Source bundle changed', SOURCE_CONTENT_MANIFEST_MISMATCH: 'Content manifest changed', SOURCE_CONTENT_UNVERIFIED: 'Source content unverified', SIGNER_NOT_TRUSTED: 'Signer not trusted', SIGNER_REVOKED: 'Signer revoked', SIGNATURE_INVALID: 'Signature invalid', TRUST_STORE_UNVERIFIED: 'Trust store unverified', NOT_APPLICABLE: 'Non-legal pack', NOT_RECORDED: 'Legal review not recorded' } as const;
const TRUST_STORE_LABEL = { CURRENT: 'Witnessed trust store current', ENVELOPE_VERIFIED: 'Envelope verified; witnesses pending', UNPROVISIONED: 'Trust store unprovisioned', INVALID: 'Trust store invalid', ROOT_NOT_TRUSTED: 'Trust-store root not trusted', ROOT_REVOKED: 'Trust-store root revoked', SIGNATURE_INVALID: 'Trust-store signature invalid', NOT_YET_VALID: 'Trust store not yet valid', EXPIRED: 'Trust store expired', HISTORY_NOT_AVAILABLE: 'Rollback history unavailable', ROLLBACK_DETECTED: 'Trust-store rollback detected', SEQUENCE_GAP: 'Trust-store sequence gap', CHAIN_MISMATCH: 'Trust-store chain mismatch', WITNESS_POLICY_UNPROVISIONED: 'Witness policy unprovisioned', WITNESS_POLICY_INVALID: 'Witness policy invalid', WITNESS_RECEIPTS_INVALID: 'Witness receipts invalid', WITNESS_QUORUM_NOT_MET: 'Witness quorum not met' } as const;

export const FindingCard = memo(function FindingCard({ finding }: { finding: ComplianceFinding }) {
  const [expanded, setExpanded] = useState(false);
  const [interpretation, setInterpretation] = useState<FindingInterpretation>();
  const [provenanceChecked, setProvenanceChecked] = useState(false);
  const [gapsChecked, setGapsChecked] = useState(false);
  const [proportionalityChecked, setProportionalityChecked] = useState(false);
  const presentation = STATUS_PRESENTATION[finding.compliance.status];
  const tone = TONES[finding.compliance.status];
  const legalReviewWarning = finding.compliance.legalReview.state !== 'CURRENT' && finding.compliance.legalReview.state !== 'NOT_APPLICABLE';
  const sourceContentWarning = finding.compliance.sourceContent.state !== 'VERIFIED' && finding.compliance.sourceContent.state !== 'NOT_APPLICABLE';
  const readiness = assessDecisionReadiness({ interpretation, provenanceChecked, gapsChecked, proportionalityChecked });
  const toggleExpanded = () => {
    if (expanded) {
      setInterpretation(undefined);
      setProvenanceChecked(false);
      setGapsChecked(false);
      setProportionalityChecked(false);
    }
    setExpanded((value) => !value);
  };
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
        <View style={[styles.metaChip, sourceContentWarning && styles.metaChipDue]}><Ionicons name="document-lock-outline" size={14} color={sourceContentWarning ? T.colors.danger : T.colors.muted} /><Text style={[styles.meta, sourceContentWarning && styles.metaDue]}>{SOURCE_CONTENT_LABEL[finding.compliance.sourceContent.state]}</Text></View>
        <View style={[styles.metaChip, legalReviewWarning && styles.metaChipDue]}><Ionicons name="shield-checkmark-outline" size={14} color={legalReviewWarning ? T.colors.danger : T.colors.muted} /><Text style={[styles.meta, legalReviewWarning && styles.metaDue]}>{LEGAL_REVIEW_LABEL[finding.compliance.legalReview.state]}</Text></View>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${expanded ? 'Hide' : 'View'} evidence for ${presentation.label}, ${PERMISSION_LABEL[finding.permissionType]}, ${finding.packageName}`}
        accessibilityHint={expanded ? 'Collapse evidence details' : 'Show evidence details and next step'}
        activeOpacity={0.72}
        onPress={toggleExpanded}
        style={styles.expandRow}
      >
        <Text style={styles.expandText}>{expanded ? 'Hide evidence' : 'View evidence'}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={T.colors.primary} />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.details}>
          <View style={styles.reasoningStep}><View style={styles.reasoningNumber}><Text style={styles.reasoningNumberText}>1</Text></View><View style={styles.nextStepCopy}><Text style={styles.sectionLabel}>What was observed</Text><Text style={styles.detailText}>Window {finding.evidence.dailyCount} · Peak/min {finding.evidence.peakCallsPerMinute} · Rolling {finding.evidence.rollingCount}</Text><Text style={styles.ruleText}>{finding.legalReference ?? finding.gdprArticle}</Text><Text style={styles.sourceReviewText}>{SOURCE_REVIEW_LABEL[finding.compliance.sourceReview.state]} · assessed {finding.compliance.sourceReview.assessedAt}{finding.compliance.sourceReview.nextDueAt ? ` · next due ${finding.compliance.sourceReview.nextDueAt}` : ''}</Text><Text style={[styles.sourceReviewText, sourceContentWarning && styles.legalReviewWarning]}>{SOURCE_CONTENT_LABEL[finding.compliance.sourceContent.state]} · {finding.compliance.sourceContent.verifiedArtifactCount}/{finding.compliance.sourceContent.expectedArtifactCount} artifacts verified here</Text>{finding.compliance.sourceContent.reason ? <Text style={[styles.sourceReviewText, styles.legalReviewWarning]}>{finding.compliance.sourceContent.reason}</Text> : null}<Text style={[styles.sourceReviewText, legalReviewWarning && styles.legalReviewWarning]}>{LEGAL_REVIEW_LABEL[finding.compliance.legalReview.state]} · assessed {finding.compliance.legalReview.assessedAt}{finding.compliance.legalReview.validUntil ? ` · valid until ${finding.compliance.legalReview.validUntil}` : ''}{finding.compliance.legalReview.signingKeyId ? ` · key ${finding.compliance.legalReview.signingKeyId}` : ''}</Text>{finding.compliance.legalReview.trustStoreState ? <Text style={[styles.sourceReviewText, finding.compliance.legalReview.trustStoreState !== 'CURRENT' && styles.legalReviewWarning]}>{TRUST_STORE_LABEL[finding.compliance.legalReview.trustStoreState]}</Text> : null}{finding.compliance.legalReview.reason ? <Text style={[styles.sourceReviewText, styles.legalReviewWarning]}>{finding.compliance.legalReview.reason}</Text> : null}</View></View>
          {finding.compliance.legalReview.requiredWitnessCount !== undefined ? <Text style={[styles.sourceReviewText, finding.compliance.legalReview.trustStoreState !== 'CURRENT' && styles.legalReviewWarning]}>Witness receipts {finding.compliance.legalReview.verifiedWitnessCount ?? 0}/{finding.compliance.legalReview.requiredWitnessCount}{finding.compliance.legalReview.witnessReceiptSetSha256 ? ` · set ${finding.compliance.legalReview.witnessReceiptSetSha256.slice(0, 12)}…` : ''}</Text> : null}
          <View style={styles.reasoningStep}><View style={styles.reasoningNumber}><Text style={styles.reasoningNumberText}>2</Text></View><View style={styles.nextStepCopy}><Text style={styles.sectionLabel}>What is not established</Text><Text style={styles.detailText}>{finding.compliance.missingEvidence.join(', ') || 'No additional gap was recorded by this rule; legal meaning still requires context.'}</Text></View></View>
          <View style={styles.nextStep}><View style={styles.nextStepIcon}><Text style={styles.reasoningNumberText}>3</Text></View><View style={styles.nextStepCopy}><Text style={styles.sectionLabel}>Your proportionate next step</Text><Text style={styles.detailText}>{finding.communication.recommendedAction}</Text><Text style={styles.agencyText}>Do not change access or confront a developer based on this card alone.</Text></View></View>
          <View style={styles.pauseCard}>
            <View style={styles.pauseHeadingRow}>
              <View style={styles.pauseIcon}><Ionicons name="pause" size={17} color={T.colors.primary} /></View>
              <View style={styles.pauseHeadingCopy}>
                <Text style={styles.pauseTitle}>Decision pause</Text>
                <Text style={styles.pauseIntro}>A private, session-only check before you act. Closing this evidence card clears every answer.</Text>
              </View>
            </View>
            <Text style={styles.pauseQuestion}>What does this card establish?</Text>
            {([
              ['TECHNICAL_SIGNAL', 'A technical signal that needs context'],
              ['LEGAL_VIOLATION', 'A GDPR violation'],
              ['DEVELOPER_INTENT', 'Developer intent'],
            ] as const).map(([value, label]) => {
              const selected = interpretation === value;
              return (
                <TouchableOpacity
                  key={value}
                  accessibilityRole="radio"
                  accessibilityLabel={label}
                  accessibilityState={{ selected }}
                  activeOpacity={0.72}
                  onPress={() => setInterpretation(value)}
                  style={[styles.choice, selected && styles.choiceSelected]}
                >
                  <View style={[styles.choiceRadio, selected && styles.choiceRadioSelected]}>{selected ? <View style={styles.choiceDot} /> : null}</View>
                  <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
            <Text accessibilityLiveRegion="polite" style={[styles.feedback, readiness.state === 'MISINTERPRETATION_CORRECTED' && styles.feedbackCorrection, readiness.ready && styles.feedbackReady]}>{readiness.feedback}</Text>
            <Text style={styles.pauseQuestion}>Context checks</Text>
            {([
              ['provenance', 'I distinguished synthetic, imported, and on-device provenance', provenanceChecked, setProvenanceChecked],
              ['gaps', 'I reviewed the missing evidence and legal-context gaps', gapsChecked, setGapsChecked],
              ['proportionate', 'I will seek neutral context before changing access or confronting anyone', proportionalityChecked, setProportionalityChecked],
            ] as const).map(([key, label, checked, setter]) => (
              <TouchableOpacity
                key={key}
                accessibilityRole="checkbox"
                accessibilityLabel={label}
                accessibilityState={{ checked }}
                activeOpacity={0.72}
                onPress={() => setter(!checked)}
                style={[styles.checkRow, checked && styles.checkRowSelected]}
              >
                <View style={[styles.checkbox, checked && styles.checkboxSelected]}>{checked ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}</View>
                <Text style={styles.checkText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
  legalReviewWarning: { color: T.colors.danger },
  agencyText: { color: T.colors.primaryDark, fontSize: 11, lineHeight: 17, fontWeight: '800', marginTop: 6 },
  pauseCard: { marginTop: 4, padding: 14, gap: 9, borderRadius: 16, backgroundColor: T.colors.surfaceMuted, borderWidth: 1, borderColor: T.colors.mintStrong },
  pauseHeadingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  pauseIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: T.colors.mint },
  pauseHeadingCopy: { flex: 1 },
  pauseTitle: { color: T.colors.ink, fontSize: 14, lineHeight: 19, fontWeight: '900' },
  pauseIntro: { color: T.colors.muted, fontSize: 11, lineHeight: 17, marginTop: 2 },
  pauseQuestion: { color: T.colors.ink, fontSize: 12, lineHeight: 17, fontWeight: '900', marginTop: 3 },
  choice: { minHeight: 44, paddingHorizontal: 11, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 12, borderWidth: 1, borderColor: T.colors.line, backgroundColor: '#FFFFFF' },
  choiceSelected: { borderColor: T.colors.primary, backgroundColor: T.colors.mint },
  choiceRadio: { width: 21, height: 21, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#8DA09B' },
  choiceRadioSelected: { borderColor: T.colors.primary },
  choiceDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: T.colors.primary },
  choiceText: { flex: 1, color: T.colors.inkSoft, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  choiceTextSelected: { color: T.colors.primaryDark },
  feedback: { padding: 10, borderRadius: 10, color: T.colors.primaryDark, backgroundColor: T.colors.infoSoft, fontSize: 11, lineHeight: 17, fontWeight: '800' },
  feedbackCorrection: { color: T.colors.danger, backgroundColor: T.colors.dangerSoft },
  feedbackReady: { color: T.colors.primaryDark, backgroundColor: T.colors.mint },
  checkRow: { minHeight: 44, paddingHorizontal: 11, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 12, borderWidth: 1, borderColor: T.colors.line, backgroundColor: '#FFFFFF' },
  checkRowSelected: { borderColor: T.colors.mintStrong, backgroundColor: '#F7FCFA' },
  checkbox: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#8DA09B' },
  checkboxSelected: { borderColor: T.colors.primary, backgroundColor: T.colors.primary },
  checkText: { flex: 1, color: T.colors.inkSoft, fontSize: 11, lineHeight: 17, fontWeight: '700' },
  caveat: { color: T.colors.warning, backgroundColor: T.colors.warningSoft, borderRadius: 10, padding: 11, fontSize: 12, lineHeight: 18, marginTop: 8 },
  expandRow: { alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 3, paddingRight: 8 },
  expandText: { color: T.colors.primary, fontSize: 13, lineHeight: 18, fontWeight: '800' },
});
