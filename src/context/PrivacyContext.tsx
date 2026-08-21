import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ComplianceFinding, PermissionAudit, ProcessingContext, RegulationId } from '../compliance/types';
import { calculateMetrics } from '../compliance/Evaluation';
import { clearFindings as clearStoredFindings, listFindings, replaceFindings } from '../compliance/ViolationRepository';
import { createEvaluationConfig, simulationToAudit } from '../compliance/ViolationSimulator';
import { RulePackComplianceEngine } from '../compliance/RulePackComplianceEngine';
import { createControlledTemporalFixture } from '../compliance/ControlledTemporalFixture';
import { DEFAULT_REGULATION_ID, getRegulationPack, isRegulationId, listRegulationPacks } from '../regulations/registry';
import { assessAndPersistProductionTrustStore } from '../regulations/TrustStoreStateRepository';
import { assessProductionLegalReviewTrustStore } from '../regulations/trustAnchors';
import { LegalReviewTrustStoreAssessment, RegulationPack } from '../regulations/types';
import { AuditEvent, PrivacyBridge } from '../services/PrivacyBridge';

const REGULATION_KEY = '@privacy_lens_regulation_v1';
const TEMPORAL_LEDGER_KEY = '@privacy_lens_temporal_ledger_v1';
const TEST_CONTEXT: ProcessingContext = {
  purpose: 'Controlled local evaluation',
  lawfulBasis: 'LEGITIMATE_INTERESTS',
  controllerIdentity: 'Prototype operator',
  retentionDays: 1,
  transparencyNoticeReference: 'Controlled evaluation protocol notice',
  dataMinimisationAssessmentReference: 'Synthetic events only; three permission categories',
  retentionJustification: 'One-day bounded local evaluation evidence',
  legitimateInterestsAssessmentReference: 'Prototype evaluation three-part assessment',
  dpiaRequired: false,
  userInitiated: true,
};

interface EvaluationSummary {
  rounds: number;
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
  precision: number;
  recall: number;
}

interface PrivacyContextValue {
  findings: ComplianceFinding[];
  availablePacks: RegulationPack[];
  selectedRegulationId: RegulationId;
  selectedPack: RegulationPack;
  trustStoreAssessment: LegalReviewTrustStoreAssessment;
  isHydrating: boolean;
  isRunning: boolean;
  nativeCapabilityAvailable: boolean;
  lastUpdated?: number;
  statusMessage?: string;
  evaluationSummary?: EvaluationSummary;
  selectRegulation: (id: RegulationId) => Promise<void>;
  runDeviceAudit: () => Promise<void>;
  runControlledEvaluation: () => Promise<void>;
  runControlledTemporalDemo: () => Promise<void>;
  clearFindings: () => Promise<void>;
}

const PrivacyContext = createContext<PrivacyContextValue | undefined>(undefined);

/**
 * Upgrades pre-rule-pack records without rewriting their observed evidence.
 * Unknown legacy governance fields fail toward NOT_RECORDED, never toward a
 * reassuring state.
 */
function migrateFinding(finding: ComplianceFinding): ComplianceFinding {
  const status = finding.compliance.status === 'LIKELY_NON_COMPLIANT' ? 'POTENTIAL_CONFLICT' : finding.compliance.status;
  if (finding.regulationId && finding.legalReference && finding.compliance.sourceReview && finding.compliance.sourceContent && finding.compliance.legalReview && status === finding.compliance.status) return finding;
  return {
    ...finding,
    regulationId: 'EU_GDPR',
    regulationName: 'EU GDPR',
    legalReference: finding.gdprArticle,
    compliance: {
      ...finding.compliance,
      status,
      sourceReview: finding.compliance.sourceReview ?? {
        state: 'NOT_RECORDED',
        assessedAt: new Date(finding.detectedAt).toISOString().slice(0, 10),
        overdueSourceTitles: [],
      },
      sourceContent: finding.compliance.sourceContent ?? {
        state: 'NOT_RECORDED',
        assessedAt: new Date(finding.detectedAt).toISOString().slice(0, 10),
        verifiedArtifactCount: 0,
        expectedArtifactCount: 0,
        affectedArtifactIds: [],
      },
      legalReview: finding.compliance.legalReview ?? {
        state: 'NOT_RECORDED',
        assessedAt: new Date(finding.detectedAt).toISOString().slice(0, 10),
      },
    },
  };
}

/**
 * Application orchestration boundary. Screens consume this context; native
 * observations, synthetic evaluation, rule-pack governance, and persistence
 * stay separated here so presentation code cannot silently relabel evidence.
 */
export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [findings, setFindings] = useState<ComplianceFinding[]>([]);
  const [selectedRegulationId, setSelectedRegulationId] = useState<RegulationId>(DEFAULT_REGULATION_ID);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>();
  const [statusMessage, setStatusMessage] = useState<string>();
  const [evaluationSummary, setEvaluationSummary] = useState<EvaluationSummary>();
  const [trustStoreAssessment, setTrustStoreAssessment] = useState<LegalReviewTrustStoreAssessment>(() => assessProductionLegalReviewTrustStore());
  const trustStoreRef = useRef(trustStoreAssessment);
  const engineRef = useRef(new RulePackComplianceEngine(getRegulationPack(DEFAULT_REGULATION_ID), undefined, trustStoreAssessment));
  const selectedPack = getRegulationPack(selectedRegulationId);

  // Keep a bounded, newest-first app-private ledger. This is local persistence,
  // not a server sync or an evidentiary chain-of-custody guarantee.
  const publish = useCallback(async (next: ComplianceFinding[]) => {
    const ordered = [...next].sort((a, b) => b.detectedAt - a.detectedAt).slice(0, 100);
    setFindings(ordered);
    await replaceFindings(ordered);
    setLastUpdated(Date.now());
  }, []);

  // evaluateSafe converts malformed or unsupported input into a visible
  // rejection instead of allowing screen code to construct a finding.
  const processAudit = useCallback(async (audit: PermissionAudit) => {
    const result = engineRef.current.evaluateSafe(audit);
    if (!result.accepted) {
      setStatusMessage(`Audit input rejected: ${result.message}`);
      return;
    }
    try {
      await AsyncStorage.setItem(TEMPORAL_LEDGER_KEY, JSON.stringify(engineRef.current.exportTemporalLedger()));
    } catch {
      setStatusMessage('The temporal ledger could not be saved. No data was uploaded; restart continuity is unavailable until storage succeeds.');
    }
    setFindings((current) => {
      const next = [result.finding, ...current.filter((item) => item.id !== result.finding.id)].slice(0, 100);
      void replaceFindings(next);
      return next;
    });
    setLastUpdated(Date.now());
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [storedRegulation, storedFindings, assessedTrustStore, storedTemporalLedger] = await Promise.all([
          AsyncStorage.getItem(REGULATION_KEY),
          listFindings(),
          assessAndPersistProductionTrustStore(),
          AsyncStorage.getItem(TEMPORAL_LEDGER_KEY),
        ]);
        if (!active) return;
        const regulationId = isRegulationId(storedRegulation) ? storedRegulation : DEFAULT_REGULATION_ID;
        setSelectedRegulationId(regulationId);
        trustStoreRef.current = assessedTrustStore;
        setTrustStoreAssessment(assessedTrustStore);
        engineRef.current = new RulePackComplianceEngine(getRegulationPack(regulationId), undefined, assessedTrustStore);
        if (storedTemporalLedger && !engineRef.current.restoreTemporalLedger(JSON.parse(storedTemporalLedger))) setStatusMessage('Stored temporal evidence was expired, incompatible, or invalid and was not restored.');
        const migrated = storedFindings.map(migrateFinding).sort((a, b) => b.detectedAt - a.detectedAt);
        setFindings(migrated);
        setLastUpdated(migrated[0]?.detectedAt);
      } catch {
        if (active) setStatusMessage('Stored evidence could not be loaded. You can start a new review.');
      } finally {
        if (active) setIsHydrating(false);
      }
    })();
    PrivacyBridge.scheduleDailyAudit();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const subscription = PrivacyBridge.initializePassiveAuditing((event: AuditEvent) => {
      if (event.permissionType) void processAudit({ ...event, source: event.source ?? 'NATIVE_BRIDGE' });
    });
    return () => subscription?.remove();
  }, [processAudit]);

  const selectRegulation = useCallback(async (id: RegulationId) => {
    const pack = getRegulationPack(id);
    engineRef.current = new RulePackComplianceEngine(pack, undefined, trustStoreRef.current);
    setSelectedRegulationId(id);
    setEvaluationSummary(undefined);
    await AsyncStorage.setItem(REGULATION_KEY, id);
    await AsyncStorage.removeItem(TEMPORAL_LEDGER_KEY);
    setStatusMessage(`${pack.shortName} is now active. Existing findings keep their original rule-pack label.`);
  }, []);

  const runDeviceAudit = useCallback(async () => {
    setIsRunning(true);
    setStatusMessage(undefined);
    try {
      const started = await PrivacyBridge.runAuditNow();
      if (started) setLastUpdated(Date.now());
      setStatusMessage(started
        ? 'On-device audit requested. Android may restrict evidence available to ordinary apps.'
        : 'Native auditing is unavailable in this build or platform. Use the controlled demo to explore the workflow.');
    } catch {
      setStatusMessage('The on-device audit could not be started. No data was uploaded.');
    } finally {
      setIsRunning(false);
    }
  }, []);

  const runControlledEvaluation = useCallback(async () => {
    setIsRunning(true);
    setStatusMessage(undefined);
    const engine = new RulePackComplianceEngine(getRegulationPack(selectedRegulationId), undefined, trustStoreRef.current);
    const samples = [];
    const latest = new Map<string, ComplianceFinding>();
    for (let round = 0; round < 50; round += 1) {
      const config = createEvaluationConfig(round);
      const audit = { ...simulationToAudit(config), source: 'SIMULATOR' as const, processingContext: TEST_CONTEXT };
      const finding = engine.evaluate(audit);
      samples.push({ expectedViolation: config.expectedViolation, detectedViolation: finding.isActive });
      latest.set(`${finding.regulationId}:${finding.id}`, finding);
      PrivacyBridge.scheduleSimulation(config);
      if ((round + 1) % 10 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
    }
    const metrics = calculateMetrics(samples);
    await publish([...latest.values(), ...findings]);
    setEvaluationSummary({ rounds: 50, ...metrics });
    setStatusMessage('Synthetic evaluation complete. These events are labelled as simulator evidence.');
    setIsRunning(false);
  }, [findings, publish, selectedRegulationId]);

  const runControlledTemporalDemo = useCallback(async () => {
    setIsRunning(true);
    setStatusMessage(undefined);
    try {
      const started = await PrivacyBridge.runControlledTemporalFixture(createControlledTemporalFixture(selectedPack));
      setStatusMessage(started
        ? 'Controlled on-device temporal demo requested. The resulting finding is explicitly labelled synthetic and advisory.'
        : 'Controlled temporal demos are available only in a debug Android build with the native test bridge.');
    } catch {
      setStatusMessage('The controlled temporal demo was rejected by the debug bridge. No finding was created.');
    } finally {
      setIsRunning(false);
    }
  }, [selectedPack]);

  const clearFindings = useCallback(async () => {
    setFindings([]);
    setLastUpdated(undefined);
    setEvaluationSummary(undefined);
    setStatusMessage('Local findings cleared.');
    await clearStoredFindings();
    await AsyncStorage.removeItem(TEMPORAL_LEDGER_KEY);
  }, []);

  const value = useMemo<PrivacyContextValue>(() => ({
    findings,
    availablePacks: listRegulationPacks(),
    selectedRegulationId,
    selectedPack,
    trustStoreAssessment,
    isHydrating,
    isRunning,
    nativeCapabilityAvailable: PrivacyBridge.isNativeAvailable(),
    lastUpdated,
    statusMessage,
    evaluationSummary,
    selectRegulation,
    runDeviceAudit,
    runControlledEvaluation,
    runControlledTemporalDemo,
    clearFindings,
  }), [findings, selectedRegulationId, selectedPack, trustStoreAssessment, isHydrating, isRunning, lastUpdated, statusMessage, evaluationSummary, selectRegulation, runDeviceAudit, runControlledEvaluation, runControlledTemporalDemo, clearFindings]);

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (!context) throw new Error('usePrivacy must be used within PrivacyProvider');
  return context;
}
