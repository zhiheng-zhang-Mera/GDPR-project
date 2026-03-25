import { createContext, useContext, useEffect, useState } from 'react';
import { StorageService } from '../services/StorageService';

const HealthContext = createContext();

export const HealthProvider = ({ children }) => {
  const today = new Date().toISOString().split('T')[0];
  const [todayData, setTodayData] = useState({ heartRate: 0, steps: 0, water: 0, temp: 0 });

  // 初始化加载今日数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await StorageService.getDailyData(today);
    if (data) setTodayData(prev => ({ ...prev, ...data }));
  };

  const updateMetric = async (metric, value) => {
    const numValue = parseFloat(value) || 0;
    await StorageService.saveDailyMetric(today, metric, numValue);
    setTodayData(prev => ({ ...prev, [metric]: numValue }));
  };

  return (
    <HealthContext.Provider value={{ todayData, updateMetric, today }}>
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => useContext(HealthContext);