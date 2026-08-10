import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ComplianceFinding, PermissionAudit, ProcessingContext, RegulationId } from '../compliance/types';
import { calculateMetrics } from '../compliance/Evaluation';
import { clearFindings as clearStoredFindings, listFindings, replaceFindings } from '../compliance/ViolationRepository';
import { createEvaluationConfig, simulationToAudit } from '../compliance/ViolationSimulator';
import { RulePackComplianceEngine } from '../compliance/RulePackComplianceEngine';
import { DEFAULT_REGULATION_ID, getRegulationPack, isRegulationId, listRegulationPacks } from '../regulations/registry';
import { RegulationPack } from '../regulations/types';
import { AuditEvent, PrivacyBridge } from '../services/PrivacyBridge';

const REGULATION_KEY = '@privacy_lens_regulation_v1';
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
  isHydrating: boolean;
  isRunning: boolean;
  nativeCapabilityAvailable: boolean;
  lastUpdated?: number;
  statusMessage?: string;
  evaluationSummary?: EvaluationSummary;
  selectRegulation: (id: RegulationId) => Promise<void>;
  runDeviceAudit: () => Promise<void>;
  runControlledEvaluation: () => Promise<void>;
  clearFindings: () => Promise<void>;
}

const PrivacyContext = createContext<PrivacyContextValue | undefined>(undefined);

function migrateFinding(finding: ComplianceFinding): ComplianceFinding {
  const status = finding.compliance.status === 'LIKELY_NON_COMPLIANT' ? 'POTENTIAL_CONFLICT' : finding.compliance.status;
  if (finding.regulationId && finding.legalReference && status === finding.compliance.status) return finding;
  return {
    ...finding,
    regulationId: 'EU_GDPR',
    regulationName: 'EU GDPR',
    legalReference: finding.gdprArticle,
    compliance: { ...finding.compliance, status },
  };
}

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [findings, setFindings] = useState<ComplianceFinding[]>([]);
  const [selectedRegulationId, setSelectedRegulationId] = useState<RegulationId>(DEFAULT_REGULATION_ID);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>();
  const [statusMessage, setStatusMessage] = useState<string>();
  const [evaluationSummary, setEvaluationSummary] = useState<EvaluationSummary>();
  const engineRef = useRef(new RulePackComplianceEngine(getRegulationPack(DEFAULT_REGULATION_ID)));
  const selectedPack = getRegulationPack(selectedRegulationId);

  const publish = useCallback(async (next: ComplianceFinding[]) => {
    const ordered = [...next].sort((a, b) => b.detectedAt - a.detectedAt).slice(0, 100);
    setFindings(ordered);
    await replaceFindings(ordered);
    setLastUpdated(Date.now());
  }, []);

  const processAudit = useCallback(async (audit: PermissionAudit) => {
    const result = engineRef.current.evaluateSafe(audit);
    if (!result.accepted) {
      setStatusMessage(`Audit input rejected: ${result.message}`);
      return;
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
        const [storedRegulation, storedFindings] = await Promise.all([
          AsyncStorage.getItem(REGULATION_KEY),
          listFindings(),
        ]);
        if (!active) return;
        const regulationId = isRegulationId(storedRegulation) ? storedRegulation : DEFAULT_REGULATION_ID;
        setSelectedRegulationId(regulationId);
        engineRef.current = new RulePackComplianceEngine(getRegulationPack(regulationId));
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
    engineRef.current = new RulePackComplianceEngine(pack);
    setSelectedRegulationId(id);
    setEvaluationSummary(undefined);
    await AsyncStorage.setItem(REGULATION_KEY, id);
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
    const engine = new RulePackComplianceEngine(getRegulationPack(selectedRegulationId));
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

  const clearFindings = useCallback(async () => {
    setFindings([]);
    setLastUpdated(undefined);
    setEvaluationSummary(undefined);
    setStatusMessage('Local findings cleared.');
    await clearStoredFindings();
  }, []);

  const value = useMemo<PrivacyContextValue>(() => ({
    findings,
    availablePacks: listRegulationPacks(),
    selectedRegulationId,
    selectedPack,
    isHydrating,
    isRunning,
    nativeCapabilityAvailable: PrivacyBridge.isNativeAvailable(),
    lastUpdated,
    statusMessage,
    evaluationSummary,
    selectRegulation,
    runDeviceAudit,
    runControlledEvaluation,
    clearFindings,
  }), [findings, selectedRegulationId, selectedPack, isHydrating, isRunning, lastUpdated, statusMessage, evaluationSummary, selectRegulation, runDeviceAudit, runControlledEvaluation, clearFindings]);

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (!context) throw new Error('usePrivacy must be used within PrivacyProvider');
  return context;
}
