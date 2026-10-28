import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HardDriveDownload,
  Info
} from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus.ts';

export const OfflineCacheBanner: React.FC = () => {
  const { isOnline, isCached, stationCount, lineCount, lastUpdated, refreshCache } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    await refreshCache();
    setIsSyncing(false);
    setSyncSuccess(true);
    setTimeout(() => setSyncSuccess(false), 2500);
  };

  return (
    <>
      {/* Offline Alert Bar (Only shown when connection drops) */}
      {!isOnline && (
        <div className="bg-amber-950/80 border-b border-amber-600/40 text-amber-200 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
            <span className="font-semibold text-amber-300">
              Offline Mode Active:
            </span>
            <span>
              Unstable or disconnected network detected. Station directory, 3D map coordinates, and offline route planner are running from local cache ({stationCount} stations loaded).
            </span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-700/50">
            LOCAL STORAGE + SERVICE WORKER ACTIVE
          </span>
        </div>
      )}

      {/* Persistent Tiny Cache Indicator / Sync Control */}
      <div className="fixed bottom-4 right-4 z-40 hidden sm:flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl px-3 py-1.5 shadow-xl text-xs text-slate-300">
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
          <span className="text-[11px] font-medium text-slate-300">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        <span className="text-slate-600">|</span>

        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
          <Database className="w-3 h-3 text-cyan-400" />
          <span>{stationCount} Stations Cached</span>
        </span>

        {isOnline && (
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            title="Update offline cache with latest server data"
            className="ml-1 p-1 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        )}

        {syncSuccess && (
          <span className="text-[10px] text-emerald-400 font-medium animate-in fade-in">
            Updated!
          </span>
        )}
      </div>
    </>
  );
};
