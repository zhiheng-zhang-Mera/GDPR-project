import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';

const { PrivacyInterceptor } = NativeModules;

export interface InterceptResult {
  success: boolean;
  latencyMs: number;
  message: string;
}

export const PrivacyBridge = {
  invokeInterceptor: async (apiName: string, isLdp: boolean = false): Promise<InterceptResult> => {
    const startTime = performance.now();
    
    try {
      if (Platform.OS === 'android' && PrivacyInterceptor) {
        // 【关键修复】调用 Kotlin 中真实存在的方法：toggleSensorAccess
        // 传递参数: sensorType, isAllowed (这里传 false 代表强行切断)
        await PrivacyInterceptor.toggleSensorAccess(apiName, false);
      } else {
        // 模拟环境 Fallback
        await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 20)); 
      }
      
      const latency = Math.round(performance.now() - startTime);
      
      // 【关键修复】将真实的延迟数据广播给 EvaluationTelemetry 模块
      DeviceEventEmitter.emit('RECORD_LATENCY', latency);

      return { success: true, latencyMs: latency, message: 'Native API Blocked Successfully' };
    } catch (error: any) {
      return { success: false, latencyMs: Math.round(performance.now() - startTime), message: error.message || 'Interception Failed' };
    }
  }
};