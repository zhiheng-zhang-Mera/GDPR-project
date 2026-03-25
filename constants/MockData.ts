export const PRIVACY_CATEGORIES = [
  {
    id: 'heart_rate',
    label: '心率数据',
    description: '用于实时监测你的健康状况。',
    icon: 'heart.fill',
    purpose: '健康分析',
  },
  {
    id: 'location',
    label: '精确位置',
    description: '用于记录运动轨迹。',
    icon: 'location.fill',
    purpose: '运动追踪',
  },
  {
    id: 'third_party_sync',
    label: '第三方分享',
    description: '将数据同步给保险公司或医生。',
    icon: 'share.fill',
    purpose: '外部协作',
  },
];

export type ConsentState = {
  [key: string]: boolean;
};