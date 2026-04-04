import React, { createContext, useContext, useRef, useState } from 'react';

type GroupType = 'A' | 'B' | 'C';

interface TelemetryEvent {
  timestamp: number;
  action: string;
  target: string;
  latencyMs?: number;
}

interface ExperimentState {
  group: GroupType;
  taskStartTime: number | null;
  events: TelemetryEvent[];
  tlxScores: { mentalDemand: number; frustration: number } | null; // 新增
}

const ExperimentContext = createContext<any>(null);

export const ExperimentProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [state, setState] = useState<ExperimentState>({
    group: 'B', 
    taskStartTime: null,
    events: [],
    tlxScores: null
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

  // 【新增】保存受试者的 TLX 问卷结果
  const saveTLXScores = (mentalDemand: number, frustration: number) => {
    setState(prev => ({ ...prev, tlxScores: { mentalDemand, frustration } }));
    logEvent('SUBMIT_TLX', `mental:${mentalDemand},frustration:${frustration}`);
  };

  // 【新增】结束测试并导出完整 JSON 数据供 PLS-SEM 分析
  const exportSessionData = () => {
    const sessionData = JSON.stringify(state, null, 2);
    console.log("=== EXPORT FOR PLS-SEM ===");
    console.log(sessionData);
    // 在真机测试时，这里可以替换为保存到本地文件或发往服务器
    alert("Data exported to console!");
  };

  return (
    <ExperimentContext.Provider value={{ ...state, setGroup, startTask, finishTask, logEvent, saveTLXScores, exportSessionData }}>
      {children}
    </ExperimentContext.Provider>
  );
};

export const useExperiment = () => useContext(ExperimentContext);