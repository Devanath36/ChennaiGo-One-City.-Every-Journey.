import React, { useState, useEffect } from 'react';
import {
  fetchStations,
  fetchLines,
  fetchHealth,
  FALLBACK_LINES
} from './services/api.ts';
import {
  Station,
  TransitLine,
  JourneyPlan,
  TransportPreference
} from './types/transit.ts';
import { Navbar, AppTab } from './components/Navbar.tsx';
import { HomeHero } from './components/HomeHero.tsx';
import { MetroNetworkView } from './components/MetroNetworkView.tsx';
import { StationDirectory } from './components/StationDirectory.tsx';
import { JourneyPlanner } from './components/JourneyPlanner.tsx';
import { LocalTrainsView } from './components/LocalTrainsView.tsx';
import { MRTSView } from './components/MRTSView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { StationDetailModal } from './components/StationDetailModal.tsx';
import { TransitGoogleMap } from './components/TransitGoogleMap.tsx';
import { OfflineCacheBanner } from './components/OfflineCacheBanner.tsx';
import { LanguageProvider, useLanguage } from './context/LanguageContext.tsx';
import { AlertCircle, RefreshCw, Train } from 'lucide-react';

function AppContent() {
  const { lang, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [activeCorridor, setActiveCorridor] = useState<string>('suburban_west');
  const [stations, setStations] = useState<Station[]>(() => {
    try {
      const raw = localStorage.getItem('chennai_transit_stations_v2');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [lines, setLines] = useState<TransitLine[]>(() => {
    try {
      const raw = localStorage.getItem('chennai_transit_lines_v2');
      if (raw) return JSON.parse(raw);
    } catch {}
    return FALLBACK_LINES;
  });

  // Selection states
  const [modalStation, setModalStation] = useState<Station | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<Station | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Station | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [systemError, setSystemError] = useState<string | null>(null);

  // Load transit data from backend / local cache
  const loadData = async () => {
    setIsLoading(true);
    setSystemError(null);
    try {
      const [linesData, stationsData] = await Promise.all([
        fetchLines(),
        fetchStations()
      ]);
      if (linesData && linesData.length > 0) setLines(linesData);
      if (stationsData && stationsData.length > 0) setStations(stationsData);
    } catch (err: any) {
      console.error('Initial data fetch failure:', err);
      // If we don't even have cached stations, inform user
      if (stations.length === 0) {
        setSystemError(
          err.message || 'Failed to establish connection to Chennai Transit backend database.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSetOriginForPlanner = (st: Station) => {
    setSelectedOrigin(st);
    setActiveTab('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSetDestinationForPlanner = (st: Station) => {
    setSelectedDestination(st);
    setActiveTab('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlanTrip = (origin: Station, dest: Station, preference?: TransportPreference) => {
    setSelectedOrigin(origin);
    setSelectedDestination(dest);
    setActiveTab('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white overflow-x-hidden w-full max-w-full box-border">
      {/* Main Navigation with integrated language switcher and suburban corridor routing */}
      <Navbar
        activeTab={activeTab}
        activeCorridor={activeCorridor}
        onTabChange={(tab, corridor) => {
          setActiveTab(tab);
          if (corridor) setActiveCorridor(corridor);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Offline Status & Local Cache Banner */}
      <OfflineCacheBanner />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full min-w-0 mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 box-border">
        {/* Global Error Banner */}
        {systemError && (
          <div className="mb-6 p-4 bg-red-950/60 border border-red-700/60 rounded-2xl flex items-center justify-between text-red-200 text-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>{systemError}</span>
            </div>
            <button
              onClick={() => loadData()}
              className="px-3 py-1 bg-red-900/80 hover:bg-red-800 rounded-lg text-xs font-semibold flex items-center gap-1 text-white transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('retry')}</span>
            </button>
          </div>
        )}

        {/* If loading initially without any stations, show clean loader */}
        {isLoading && stations.length === 0 ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-300">
              Loading Chennai Transit Network (Metro, Suburban, MRTS)...
            </p>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="mb-4 py-1.5 px-3 bg-cyan-950/40 border border-cyan-800/40 rounded-xl text-xs text-cyan-400 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Syncing latest transit timetables from database...</span>
              </div>
            )}
            {/* TAB: HOME */}
            {activeTab === 'home' && (
              <HomeHero
                lines={lines}
                stations={stations}
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectStation={(st) => setModalStation(st)}
                onPlanTrip={handlePlanTrip}
                onSetOrigin={handleSetOriginForPlanner}
                onSetDestination={handleSetDestinationForPlanner}
              />
            )}

            {/* TAB: METRO NETWORK */}
            {activeTab === 'metro' && (
              <MetroNetworkView
                lines={lines}
                stations={stations}
                onSelectStation={(st) => setModalStation(st)}
                onSetOrigin={handleSetOriginForPlanner}
                onSetDestination={handleSetDestinationForPlanner}
                onNavigateToPlanner={(orig, dest) => {
                  if (orig && dest) {
                    handlePlanTrip(orig, dest);
                  } else {
                    setActiveTab('planner');
                  }
                }}
              />
            )}

            {/* TAB: STATIONS */}
            {activeTab === 'stations' && (
              <StationDirectory
                stations={stations}
                lines={lines}
                onSelectStationModal={(st) => setModalStation(st)}
                onSetOriginForPlanner={handleSetOriginForPlanner}
                onSetDestinationForPlanner={handleSetDestinationForPlanner}
              />
            )}

            {/* TAB: JOURNEY PLANNER */}
            {activeTab === 'planner' && (
              <JourneyPlanner
                stations={stations}
                lines={lines}
                selectedOrigin={selectedOrigin}
                selectedDestination={selectedDestination}
                onOriginChange={setSelectedOrigin}
                onDestinationChange={setSelectedDestination}
                onSelectStationModal={(st) => setModalStation(st)}
              />
            )}

            {/* TAB: GOOGLE MAP */}
            {activeTab === 'map' && (
              <div className="space-y-4">
                <TransitGoogleMap
                  stations={stations}
                  lines={lines}
                  selectedStation={modalStation}
                  onSelectStationModal={(st) => setModalStation(st)}
                  onSetOrigin={handleSetOriginForPlanner}
                  onSetDestination={handleSetDestinationForPlanner}
                  onPlanTrip={handlePlanTrip}
                  height="calc(100vh - 220px)"
                />
              </div>
            )}

            {/* TAB: LOCAL TRAINS */}
            {activeTab === 'suburban' && (
              <LocalTrainsView
                lines={lines}
                stations={stations}
                defaultCorridor={activeCorridor}
                onSelectStation={(st) => setModalStation(st)}
                onSetOrigin={handleSetOriginForPlanner}
                onSetDestination={handleSetDestinationForPlanner}
                onNavigateToPlanner={(orig, dest) => {
                  if (orig && dest) {
                    handlePlanTrip(orig, dest, 'suburban');
                  } else {
                    setActiveTab('planner');
                  }
                }}
              />
            )}

            {/* TAB: MRTS */}
            {activeTab === 'mrts' && (
              <MRTSView
                lines={lines}
                stations={stations}
                onSelectStation={(st) => setModalStation(st)}
                onSetOrigin={handleSetOriginForPlanner}
                onSetDestination={handleSetDestinationForPlanner}
                onNavigateToPlanner={(orig, dest) => {
                  if (orig && dest) {
                    handlePlanTrip(orig, dest);
                  } else {
                    setActiveTab('planner');
                  }
                }}
              />
            )}

            {/* TAB: SETTINGS */}
            {activeTab === 'settings' && (
              <SettingsView
                onRefreshData={loadData}
              />
            )}
          </>
        )}
      </main>

      {/* Global Station Detail Modal */}
      <StationDetailModal
        station={modalStation}
        lines={lines}
        onClose={() => setModalStation(null)}
        onSetOrigin={handleSetOriginForPlanner}
        onSetDestination={handleSetDestinationForPlanner}
      />

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-8 px-4 text-xs text-slate-500 text-center space-y-2 max-w-full overflow-hidden box-border">
        <div className="flex items-center justify-center gap-2 text-slate-400 font-semibold text-sm">
          <Train className="w-4 h-4 text-cyan-400" />
          <span>ChennaiGo · One City. Every Journey.</span>
        </div>
        <p className="max-w-xl mx-auto text-slate-400">
          Data sources: Chennai Metro Rail Limited (CMRL), Indian Railways, Southern Railway, and other verified transport references used by the application.
        </p>
        <p className="text-[11px] text-slate-500">
          Built with React, TypeScript, Vite, Tailwind CSS, and SQLite.
        </p>
        <p className="text-[11px] text-slate-600 font-medium">
          © 2026 Devanath. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
