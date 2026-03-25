import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_PREFIX = '@health_data_';

export const StorageService = {
  // 保存当天的某项数据
  saveDailyMetric: async (date, metric, value) => {
    try {
      const key = `${STORAGE_KEY_PREFIX}${date}`;
      const existingData = await AsyncStorage.getItem(key);
      const data = existingData ? JSON.parse(existingData) : {};
      
      data[metric] = value;
      await AsyncStorage.setItem(key, JSON.stringify(data));
      return data;
    } catch (e) { console.error("Save error", e); }
  },

  // 获取特定日期的数据
  getDailyData: async (date) => {
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${date}`);
      return data ? JSON.parse(data) : null;
    } catch (e) { console.error("Fetch error", e); }
  }
};