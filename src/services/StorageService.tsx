import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_PREFIX = '@health_data_';

export const StorageService = {
  // 保存当天的某项数据，明确参数类型
  saveDailyMetric: async (date: string, metric: string, value: number) => {
    try {
      const key = `${STORAGE_KEY_PREFIX}${date}`;
      const existingData = await AsyncStorage.getItem(key);
      const data = existingData ? JSON.parse(existingData) : {};
      
      data[metric] = value;
      await AsyncStorage.setItem(key, JSON.stringify(data));
      return data;
    } catch (e: any) { 
      console.error("Save error", e); 
    }
  },

  // 获取特定日期的数据
  getDailyData: async (date: string) => {
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${date}`);
      return data ? JSON.parse(data) : null;
    } catch (e: any) { 
      console.error("Fetch error", e); 
    }
  },

  // 获取过去 7 天的真实历史数据
  getWeeklyData: async () => {
    try {
      // 明确声明数组元素的类型
      const result: any[] = [];
      const labels: string[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const dateStr = date.toISOString().split('T')[0];
        const labelStr = date.toLocaleDateString('en-US', { weekday: 'short' }); 

        const dataStr = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${dateStr}`);
        const data = dataStr ? JSON.parse(dataStr) : {};
        
        labels.push(labelStr);
        result.push(data);
      }
      return { labels, data: result };
    } catch (e: any) { 
      console.error("Fetch weekly error", e); 
      return null;
    }
  }
};