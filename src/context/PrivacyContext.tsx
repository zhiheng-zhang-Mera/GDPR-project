import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface PermissionSetting {
  dataCategory: string;
  purpose: string;
  recipient: string;
  enabled: boolean;
  legalBasis: string;
}

export interface OfflineAction {
  id: string;
  timestamp: string;
  data_category: string;
  purpose: string;
  recipient: string;
  enabled: boolean;
  legal_basis: string;
  device_fingerprint: string;
}

interface PrivacyContextType {
  permissions: PermissionSetting[];
  isOnline: boolean;
  togglePermission: (dataCategory: string, purpose: string, recipient: string) => Promise<void>;
  pendingOfflineSyncCount: number;
  syncOfflineQueue: () => Promise<void>;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

const API_BASE_URL = 'https://api.mhealth-privacy.org/api/privacy';

const DEFAULT_PERMISSIONS: PermissionSetting[] = [
  { dataCategory: 'Heart Rate', purpose: 'Clinical Diagnosis', recipient: 'Attending Physician', enabled: true, legalBasis: 'GDPR_Art_6_1_a' },
  { dataCategory: 'Heart Rate', purpose: 'Academic Research', recipient: 'Third-Party Lab A', enabled: false, legalBasis: 'GDPR_Art_6_1_a' },
  { dataCategory: 'Geolocation', purpose: 'Emergency Alert', recipient: 'Emergency Services', enabled: true, legalBasis: 'GDPR_Art_6_1_d' },
  { dataCategory: 'Geolocation', purpose: 'Commercial Marketing', recipient: 'Ad Network B', enabled: false, legalBasis: 'GDPR_Art_6_1_a' },
  { dataCategory: 'Genomic Sequence', purpose: 'Medical Diagnosis', recipient: 'Hospital Research DB', enabled: true, legalBasis: 'GDPR_Art_9_2_a' },
  { dataCategory: 'Sleep Quality', purpose: 'Health Tracking', recipient: 'Local Device Only', enabled: true, legalBasis: 'GDPR_Art_6_1_a' },
];

export const PrivacyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<PermissionSetting[]>(DEFAULT_PERMISSIONS);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>([]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected ?? true;
      setIsOnline(online);
      if (online && offlineQueue.length > 0) {
        syncOfflineQueue();
      }
    });
    return () => unsubscribe();
  }, [offlineQueue]);

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedPermissions = await AsyncStorage.getItem('@gdpr_permissions');
        if (storedPermissions) setPermissions(JSON.parse(storedPermissions));

        const storedQueue = await AsyncStorage.getItem('@gdpr_offline_queue');
        if (storedQueue) setOfflineQueue(JSON.parse(storedQueue));
      } catch (err) {
        console.error('Failed to load local privacy settings:', err);
      }
    };
    loadStoredData();
  }, []);

  const savePermissionsLocally = async (updated: PermissionSetting[]) => {
    setPermissions(updated);
    await AsyncStorage.setItem('@gdpr_permissions', JSON.stringify(updated));
  };

  const togglePermission = async (dataCategory: string, purpose: string, recipient: string) => {
    const updatedPermissions = permissions.map((item) => {
      if (item.dataCategory === dataCategory && item.purpose === purpose && item.recipient === recipient) {
        return { ...item, enabled: !item.enabled };
      }
      return item;
    });

    const targetItem = updatedPermissions.find(
      (item) => item.dataCategory === dataCategory && item.purpose === purpose && item.recipient === recipient
    );

    if (!targetItem) return;

    await savePermissionsLocally(updatedPermissions);

    const actionPayload = {
      user_id: 'UID_12345',
      data_category: dataCategory,
      purpose,
      recipient,
      enabled: targetItem.enabled,
      legal_basis: targetItem.legalBasis,
      device_fingerprint: 'RN_Device_Pixel6_Android13',
    };

    if (isOnline) {
      try {
        const response = await fetch(`${API_BASE_URL}/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(actionPayload),
        });

        if (!response.ok) throw new Error('Network response not ok');
      } catch (err) {
        console.warn('Network toggle failed, persisting to offline queue:', err);
        await queueOfflineAction(actionPayload);
      }
    } else {
      await queueOfflineAction(actionPayload);
    }
  };

  const queueOfflineAction = async (payload: any) => {
    const newOfflineItem: OfflineAction = {
      id: `OFFLINE_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...payload,
    };

    const newQueue = [...offlineQueue, newOfflineItem];
    setOfflineQueue(newQueue);
    await AsyncStorage.setItem('@gdpr_offline_queue', JSON.stringify(newQueue));
  };

  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;

    try {
      const response = await fetch(`${API_BASE_URL}/sync-offline-queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'UID_12345',
          offline_queue: offlineQueue,
        }),
      });

      if (response.ok) {
        setOfflineQueue([]);
        await AsyncStorage.removeItem('@gdpr_offline_queue');
        console.log('Successfully resynchronized offline GDPR audit queue');
      }
    } catch (err) {
      console.error('Offline synchronization failed:', err);
    }
  };

  return (
    <PrivacyContext.Provider
      value={{
        permissions,
        isOnline,
        togglePermission,
        pendingOfflineSyncCount: offlineQueue.length,
        syncOfflineQueue,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (!context) throw new Error('usePrivacy must be used within a PrivacyProvider');
  return context;
};