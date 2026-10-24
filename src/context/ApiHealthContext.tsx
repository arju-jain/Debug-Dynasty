import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { checkHealth } from '../api/debug';
import { ApiHealth } from '../types/api';
import { API_BASE_URL } from '../api/client';

interface ApiHealthContextType {
  isChecking: boolean;
  isHealthy: boolean;
  healthData: ApiHealth | null;
  errorMessage: string | null;
  lastChecked: Date | null;
  checkServerHealth: () => Promise<void>;
  apiUrl: string;
}

const ApiHealthContext = createContext<ApiHealthContextType | undefined>(undefined);

export const ApiHealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [isHealthy, setIsHealthy] = useState<boolean>(false);
  const [healthData, setHealthData] = useState<ApiHealth | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkServerHealth = useCallback(async () => {
    setIsChecking(true);
    try {
      const data = await checkHealth();
      setHealthData(data);
      setIsHealthy(data.status === 'healthy' || data.status === 'ok' || Boolean(data));
      setErrorMessage(null);
    } catch (err: unknown) {
      setIsHealthy(false);
      setHealthData(null);
      const msg = err instanceof Error ? err.message : 'Backend server unreachable';
      setErrorMessage(msg);
    } finally {
      setIsChecking(false);
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    checkServerHealth();
    // Periodically re-check health every 45 seconds
    const interval = setInterval(checkServerHealth, 45000);
    return () => clearInterval(interval);
  }, [checkServerHealth]);

  return (
    <ApiHealthContext.Provider
      value={{
        isChecking,
        isHealthy,
        healthData,
        errorMessage,
        lastChecked,
        checkServerHealth,
        apiUrl: API_BASE_URL,
      }}
    >
      {children}
    </ApiHealthContext.Provider>
  );
};

export const useApiHealth = (): ApiHealthContextType => {
  const context = useContext(ApiHealthContext);
  if (!context) {
    throw new Error('useApiHealth must be used within an ApiHealthProvider');
  }
  return context;
};
