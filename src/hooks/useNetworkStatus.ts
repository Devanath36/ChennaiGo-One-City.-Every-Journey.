import { useState, useEffect, useCallback } from 'react';
import { getOfflineCacheStatus, clearOfflineCache, fetchStations, fetchLines } from '../services/api.ts';

export interface NetworkStatus {
  isOnline: boolean;
  isCached: boolean;
  stationCount: number;
  lineCount: number;
  lastUpdated: string | null;
  refreshCache: () => Promise<void>;
  purgeCache: () => void;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [cacheInfo, setCacheInfo] = useState(() => getOfflineCacheStatus());

  const updateCacheStatus = useCallback(() => {
    setCacheInfo(getOfflineCacheStatus());
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Automatically refresh cache when reconnecting
      fetchStations().then(() => fetchLines()).then(() => updateCacheStatus());
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateCacheStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    updateCacheStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateCacheStatus]);

  const refreshCache = async () => {
    try {
      await Promise.all([fetchLines(), fetchStations()]);
      updateCacheStatus();
    } catch (e) {
      console.warn('Cache refresh encountered error:', e);
    }
  };

  const purgeCache = () => {
    clearOfflineCache();
    updateCacheStatus();
  };

  return {
    isOnline,
    isCached: cacheInfo.isCached,
    stationCount: cacheInfo.stationCount,
    lineCount: cacheInfo.lineCount,
    lastUpdated: cacheInfo.lastUpdated,
    refreshCache,
    purgeCache
  };
}
