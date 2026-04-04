import React, { createContext, useContext, useState } from 'react';
// 修正路径：假设在 src/context/ 目录下
import { ConsentState } from '@/constants/MockData';
import { auditLog } from '../utils/auditLogger';

const PrivacyContext = createContext<{
  consents: ConsentState;
  toggleConsent: (id: string) => void;
} | undefined>(undefined);

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [consents, setConsents] = useState<ConsentState>({
    heart_rate: true,
    location: false,
    third_party_sync: false,
  });

  const toggleConsent = (id: string) => {
    setConsents((prev) => {
      const newState = { ...prev, [id]: !prev[id] };
      auditLog(`用户更改了 [${id}] 的同意状态为: ${newState[id]}`);
      return newState;
    });
  };

  return (
    <PrivacyContext.Provider value={{ consents, toggleConsent }}>
      {children}
    </PrivacyContext.Provider>
  );
}

// 这是推荐的访问方式
export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (!context) throw new Error('usePrivacy must be used within PrivacyProvider');
  return context;
};