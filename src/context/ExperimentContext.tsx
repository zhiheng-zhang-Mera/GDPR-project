import React, { createContext, useContext, useRef, useState } from 'react';

type GroupType = 'A' | 'B' | 'C'; // A: 标准设置, B: 动态仪表盘, C: 文本增强

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
}

const ExperimentContext = createContext<any>(null);

export const ExperimentProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [state, setState] = useState<ExperimentState>({
    group: 'B', // 默认分配到干预组进行测试
    taskStartTime: null,
    events: [],
  });

  const taskTimer = useRef<number | null>(null);

  // 开始计时（当用户进入撤回授权任务时调用）
  const startTask = () => {
    taskTimer.current = performance.now();
    setState(prev => ({ ...prev, taskStartTime: Date.now() }));
    logEvent('TASK_START', 'consent_withdrawal');
  };

  // 结束计时并记录总耗时
  const finishTask = () => {
    if (taskTimer.current) {
      const duration = performance.now() - taskTimer.current;
      logEvent('TASK_FINISH', 'consent_withdrawal', duration);
      taskTimer.current = null;
    }
  };

  // 记录行为与底层延迟
  const logEvent = (action: string, target: string, latencyMs?: number) => {
    const newEvent: TelemetryEvent = { timestamp: Date.now(), action, target, latencyMs };
    setState(prev => ({ ...prev, events: [...prev.events, newEvent] }));
    console.log('[Telemetry]', newEvent); // 实际研究中应 POST 到后端服务器
  };

  const setGroup = (group: GroupType) => {
    setState(prev => ({ ...prev, group }));
    logEvent('GROUP_CHANGE', group);
  };

  return (
    <ExperimentContext.Provider value={{ ...state, setGroup, startTask, finishTask, logEvent }}>
      {children}
    </ExperimentContext.Provider>
  );
};

export const useExperiment = () => useContext(ExperimentContext);