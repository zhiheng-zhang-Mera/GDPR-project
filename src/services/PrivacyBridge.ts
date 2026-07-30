import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';

const { PrivacyInspector } = NativeModules;

export interface AuditEvent {
  apiName: string;
  frequency: number;
  destination: string;
  eventType: 'EXCESSIVE_COLLECTION' | 'UNAUTHORIZED_CROSS_BORDER' | 'SENSITIVE_LEAK_RISK';
  timestamp: number;
}

export const PrivacyBridge = {
  /**
   * 初始化被动监察桥接。
   * 单独限制在安卓系统工作，接收系统底层异常数据。
   */
  initializePassiveAuditing: (onEventReceived: (event: AuditEvent) => void) => {
    if (Platform.OS !== 'android') {
      console.warn('Privacy Inspector is restricted to Android OS only.');
      return null;
    }

    // 监听来自安卓原生的异步合规事件
    const subscription = DeviceEventEmitter.addListener(
      'ON_PASSIVE_AUDIT_EVENT', 
      (event: AuditEvent) => {
        onEventReceived(event);
      }
    );

    return subscription;
  }
};