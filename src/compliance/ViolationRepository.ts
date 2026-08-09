import AsyncStorage from '@react-native-async-storage/async-storage';
import { ComplianceFinding } from './types';

const KEY = '@privacy_lens_findings_v2';
const RANK = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 } as const;

export interface SaveFindingResult {
  changed: boolean;
  shouldNotify: boolean;
  previous?: ComplianceFinding;
}

export async function listFindings(): Promise<ComplianceFinding[]> {
  const value = await AsyncStorage.getItem(KEY);
  return value ? (JSON.parse(value) as ComplianceFinding[]) : [];
}

export async function replaceFindings(findings: ComplianceFinding[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(findings.slice(0, 100)));
}

export async function clearFindings(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

export async function saveFinding(finding: ComplianceFinding): Promise<SaveFindingResult> {
  const records = await listFindings();
  const index = records.findIndex((item) => item.id === finding.id);
  const previous = index >= 0 ? records[index] : undefined;
  const shouldNotify =
    !previous ||
    previous.isActive !== finding.isActive ||
    RANK[finding.riskLevel] > RANK[previous.riskLevel];
  const changed = !previous || JSON.stringify(previous) !== JSON.stringify(finding);

  if (index >= 0) records[index] = finding;
  else records.push(finding);
  await AsyncStorage.setItem(KEY, JSON.stringify(records));

  return { changed, shouldNotify, previous };
}
