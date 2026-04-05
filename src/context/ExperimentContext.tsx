import React, { createContext, useContext, useRef, useState } from 'react';

export type GroupType = 'A' | 'B' | 'C';

export interface TelemetryEvent {
  timestamp: number;
  action: string;
  target: string;
  latencyMs?: number;
}

export interface TLXScores {
  mentalDemand: number;
  physicalDemand: number;
  temporalDemand: number;
  performance: number;
  effort: number;
  frustration: number;
}

export interface UserProfile {
  age: string;
  gender: string;
  culture: string;
  education: string;
  techSavvy: number;
  privacyConcern: number;
}

export interface TaskEvaluation {
  transparency: number;
  control: number;
  preference: string;
}

interface ExperimentState {
  group: GroupType;
  taskStartTime: number | null;
  events: TelemetryEvent[];
  tlxScores: TLXScores | null;
  userProfile: UserProfile | null;
  taskEvaluation: TaskEvaluation | null;
}

const ExperimentContext = createContext<any>(null);

export const ExperimentProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [state, setState] = useState<ExperimentState>({
    group: 'C', // 默认为 C 组
    taskStartTime: null,
    events: [],
    tlxScores: null,
    userProfile: null,
    taskEvaluation: null
  });

  const taskTimer = useRef<number | null>(null);

  const startTask = () => {
    taskTimer.current = performance.now();
    setState(prev => ({ ...prev, taskStartTime: Date.now() }));
    logEvent('TASK_START', 'consent_withdrawal');
  };

  const finishTask = () => {
    if (taskTimer.current) {
      const duration = performance.now() - taskTimer.current;
      logEvent('TASK_FINISH', 'consent_withdrawal', duration);
      taskTimer.current = null;
    }
  };

  const logEvent = (action: string, target: string, latencyMs?: number) => {
    const newEvent: TelemetryEvent = { timestamp: Date.now(), action, target, latencyMs };
    setState(prev => ({ ...prev, events: [...prev.events, newEvent] }));
  };

  const setGroup = (group: GroupType) => {
    setState(prev => ({ ...prev, group }));
    logEvent('GROUP_CHANGE', group);
  };

  // 统一保存所有问卷数据
  const saveFinalResults = (tlx: TLXScores, profile: UserProfile, evalData: TaskEvaluation) => {
    setState(prev => ({ 
        ...prev, 
        tlxScores: tlx, 
        userProfile: profile, 
        taskEvaluation: evalData 
    }));
    logEvent('SUBMIT_ALL_SURVEYS', 'completed');
  };

  // 导出供 PLS-SEM 分析的数据
  const exportSessionData = () => {
    const sessionData = JSON.stringify(state, null, 2);
    console.log("========== EXPORT FOR PLS-SEM ==========");
    console.log(sessionData);
    alert("Data exported to console! Check your Metro terminal.");
  };

  return (
    <ExperimentContext.Provider value={{ 
        ...state, 
        setGroup, 
        startTask, 
        finishTask, 
        logEvent, 
        saveFinalResults, 
        exportSessionData 
    }}>
      {children}
    </ExperimentContext.Provider>
  );
};

export const useExperiment = () => useContext(ExperimentContext);