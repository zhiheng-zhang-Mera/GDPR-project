import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { StorageService } from '../services/StorageService';

// 1. 定义健康数据的类型
interface HealthData {
  heartRate: number;
  steps: number;
  water: number;
  temp: number;
}

// 2. 定义 Context 暴露出去的值的类型
interface HealthContextType {
  todayData: HealthData;
  updateMetric: (metric: keyof HealthData, value: number | string) => Promise<void>;
  today: string;
}

// 3. 给 createContext 传入泛型，初始值设为 undefined
const HealthContext = createContext<HealthContextType | undefined>(undefined);

// 定义 Provider 的 props 类型
interface HealthProviderProps {
  children: ReactNode;
}

export const HealthProvider = ({ children }: HealthProviderProps) => {
  const today = new Date().toISOString().split('T')[0];
  // 给 useState 明确指定类型
  const [todayData, setTodayData] = useState<HealthData>({ heartRate: 0, steps: 0, water: 0, temp: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await StorageService.getDailyData(today);
    if (data) setTodayData(prev => ({ ...prev, ...data }));
  };

  const updateMetric = async (metric: keyof HealthData, value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value || 0;
    await StorageService.saveDailyMetric(today, metric as string, numValue);
    setTodayData(prev => ({ ...prev, [metric]: numValue }));
  };

  return (
    <HealthContext.Provider value={{ todayData, updateMetric, today }}>
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => {
  const context = useContext(HealthContext);
  // 4. 类型守卫：确保组件包裹在 Provider 内部，这会向 TypeScript 保证返回的类型不是 undefined
  if (context === undefined) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return context;
};