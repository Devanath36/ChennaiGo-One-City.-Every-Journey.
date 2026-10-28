import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps';
import {
  Layers,
  Train,
  Navigation,
  MapPin,
  Search,
  Compass,
  RotateCcw,
  Maximize2,
  CheckCircle2,
  Hammer,
  ArrowRight,
  Filter,
  Info,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Car,
  Bus,
  Accessibility
} from 'lucide-react';
import { Station, TransitLine, JourneyPlan, TransportPreference } from '../types/transit.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

// Google Maps API Key provisioned via AI Studio Google Maps Platform integration
export const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyB6eKUDEH_EmaGfIYJSxLJfdWwE5dYdzwI';

// Default Chennai Geographic Center (Chennai Central / Ripon Building area)
export const CHENNAI_DEFAULT_CENTER = { lat: 13.0827, lng: 80.2707 };
export const CHENNAI_DEFAULT_ZOOM = 11;

// Polyline component using Google Maps JS SDK via useMap hook
interface PolylineOverlayProps {
  path: google.maps.LatLngLiteral[];
  strokeColor: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  zIndex?: number;
  isDashed?: boolean;
}

const PolylineOverlay: React.FC<PolylineOverlayProps> = ({
  path,
  strokeColor,
  strokeOpacity = 0.85,
  strokeWeight = 4,
  zIndex = 2,
  isDashed = false
}) => {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || path.length < 2) return;

    // Build stroke styling: solid for operational, dashed/dotted for under-construction
    const lineSymbol = {
      path: 'M 0,-1 0,1',
      strokeOpacity: 1,
      scale: 3
    };

    const polyline = new google.maps.Polyline({
      path,
      strokeColor,
      strokeOpacity: isDashed ? 0 : strokeOpacity,
      strokeWeight,
      zIndex,
      icons: isDashed
        ? [
            {
              icon: lineSymbol,
              offset: '0',
              repeat: '14px'
            }
          ]
        : undefined,
      map
    });

    polylineRef.current = polyline;

    return () => {
      polyline.setMap(null);
      polylineRef.current = null;
    };
  }, [map, path, strokeColor, strokeOpacity, strokeWeight, zIndex, isDashed]);

  return null;
};

// Camera Controller for programmatic pan and zoom
interface CameraControllerProps {
  center: google.maps.LatLngLiteral | null;
  zoom?: number;
}

const CameraController: React.FC<CameraControllerProps> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !center) return;
    map.panTo(center);
    if (typeof zoom === 'number') {
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);

  return null;
};

export interface TransitGoogleMapProps {
  stations: Station[];
  lines: TransitLine[];
  selectedStation?: Station | null;
  activeJourney?: JourneyPlan | null;
  onSelectStationModal?: (station: Station) => void;
  onSetOrigin?: (station: Station) => void;
  onSetDestination?: (station: Station) => void;
  onPlanTrip?: (origin: Station, destination: Station, preference?: TransportPreference) => void;
  height?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showLegend?: boolean;
  compactMode?: boolean;
}

export const TransitGoogleMap: React.FC<TransitGoogleMapProps> = ({
  stations,
  lines,
  selectedStation,
  activeJourney,
  onSelectStationModal,
  onSetOrigin,
  onSetDestination,
  onPlanTrip,
  height = 'calc(100vh - 200px)',
  showSearch = true,
  showFilters = true,
  showLegend = true,
  compactMode = false
}) => {
  const { lang, t } = useLanguage();

  // Internal selection state
  const [activeStation, setActiveStation] = useState<Station | null>(selectedStation || null);
  const [hoveredStation, setHoveredStation] = useState<Station | null>(null);

  // Filter states
  const [modeFilter, setModeFilter] = useState<'all' | 'Metro' | 'Suburban' | 'MRTS'>('all');
  const [corridorFilter, setCorridorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'operational' | 'under_construction'>('all');

  // Search input state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Station[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Camera targets
  const [cameraTarget, setCameraTarget] = useState<google.maps.LatLngLiteral | null>(null);
  const [cameraZoom, setCameraZoom] = useState<number | undefined>(undefined);

  // Sync external selected station if provided
  useEffect(() => {
    if (selectedStation) {
      setActiveStation(selectedStation);
      setCameraTarget({ lat: selectedStation.lat, lng: selectedStation.lon });
      setCameraZoom(15);
    }
  }, [selectedStation]);

  // Pre-calculate line lookup
  const lineMap = useMemo(() => {
    const map = new Map<string, TransitLine>();
    for (const l of lines) {
      map.set(l.id, l);
    }
    return map;
  }, [lines]);

  // Filter stations based on user selection
  const filteredStations = useMemo(() => {
    return stations.filter((s) => {
      if (modeFilter !== 'all' && s.system_type !== modeFilter) return false;
      if (corridorFilter !== 'all' && s.line_id !== corridorFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      return true;
    });
  }, [stations, modeFilter, corridorFilter, statusFilter]);

  // Generate corridor paths by grouping stations by line_id in coordinate order
  const corridorPaths = useMemo(() => {
    const grouped = new Map<string, Station[]>();
    for (const s of stations) {
      if (!grouped.has(s.line_id)) {
        grouped.set(s.line_id, []);
      }
      grouped.get(s.line_id)!.push(s);
    }

    const paths: Array<{
      lineId: string;
      line: TransitLine | undefined;
      path: google.maps.LatLngLiteral[];
      color: string;
      isOperational: boolean;
    }> = [];

    for (const [lineId, stList] of grouped.entries()) {
      // Respect corridor filter
      if (corridorFilter !== 'all' && lineId !== corridorFilter) continue;
      const line = lineMap.get(lineId);
      if (modeFilter !== 'all' && line && line.system_type !== modeFilter) continue;
      if (statusFilter !== 'all' && line && line.status !== statusFilter) continue;

      if (stList.length >= 2) {
        const color = line?.color || '#0284c7';
        const isOperational = line?.status === 'operational';
        const path = stList.map((st: Station) => ({ lat: st.lat, lng: st.lon }));
        paths.push({
          lineId,
          line,
          path,
          color,
          isOperational
        });
      }
    }

    return paths;
  }, [stations, lines, lineMap, modeFilter, corridorFilter, statusFilter]);

  // Active journey path if present
  const journeyPath = useMemo(() => {
    if (!activeJourney || !activeJourney.steps || activeJourney.steps.length < 2) return null;
    return activeJourney.steps.map((step) => ({ lat: step.lat, lng: step.lon }));
  }, [activeJourney]);

  // Autocomplete search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    const matches = stations
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.name_ta.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q)
      )
      .slice(0, 8);
    setSearchResults(matches);
    setIsSearchOpen(matches.length > 0);
  }, [searchQuery, stations]);

  const handleSelectSearchResult = (st: Station) => {
    setActiveStation(st);
    setCameraTarget({ lat: st.lat, lng: st.lon });
    setCameraZoom(15);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleFlyToHub = (preset: 'central' | 'airport' | 'omr' | 'west' | 'metro_ring' | 'all') => {
    if (preset === 'central') {
      setCameraTarget({ lat: 13.0827, lng: 80.2754 });
      setCameraZoom(14);
    } else if (preset === 'airport') {
      setCameraTarget({ lat: 12.9856, lng: 80.1506 });
      setCameraZoom(14);
    } else if (preset === 'omr') {
      setCameraTarget({ lat: 12.9516, lng: 80.2435 });
      setCameraZoom(13);
    } else if (preset === 'west') {
      setCameraTarget({ lat: 13.0456, lng: 80.1587 });
      setCameraZoom(13);
    } else {
      setCameraTarget(CHENNAI_DEFAULT_CENTER);
      setCameraZoom(CHENNAI_DEFAULT_ZOOM);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative">
      {/* Top Controls Toolbar */}
      {!compactMode && (
        <div className="p-3 sm:p-4 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10 backdrop-blur-md">
          {/* Title & Quick Stats */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 flex-shrink-0">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {lang === 'ta' ? 'சென்னை போக்குவரத்து நேரலை வரைபடம்' : 'Chennai Transit Live Map'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/80 font-mono">
                  Google Maps
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {lang === 'ta'
                  ? `${filteredStations.length} நிலையங்கள் · மெட்ரோ, புறநகர் மற்றும் பறக்கும் ரயில் வழித்தடங்கள்`
                  : `${filteredStations.length} Verified Stations · Real-world Geographic Alignment`}
              </p>
            </div>
          </div>

          {/* Quick Hub Jump Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 hidden md:inline">
              {lang === 'ta' ? 'விரைவு காட்சி:' : 'Jump to:'}
            </span>
            <button
              onClick={() => handleFlyToHub('central')}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 hover:text-white transition cursor-pointer"
            >
              Central Hub
            </button>
            <button
              onClick={() => handleFlyToHub('airport')}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 hover:text-white transition cursor-pointer"
            >
              Airport (MAA)
            </button>
            <button
              onClick={() => handleFlyToHub('omr')}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 hover:text-white transition cursor-pointer"
            >
              OMR IT / Velachery
            </button>
            <button
              onClick={() => handleFlyToHub('all')}
              className="px-2 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition cursor-pointer flex items-center gap-1"
              title="Reset View"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      {showFilters && !compactMode && (
        <div className="px-3 sm:px-4 py-2.5 bg-slate-900/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 z-10 text-xs">
          {/* Mode Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', 'Metro', 'Suburban', 'MRTS'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setModeFilter(m);
                  if (m !== 'all') setCorridorFilter('all');
                }}
                className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer text-xs ${
                  modeFilter === m
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {m === 'all'
                  ? lang === 'ta' ? 'அனைத்து முறைகள்' : 'All Networks'
                  : m === 'Metro'
                  ? 'Metro Rail'
                  : m === 'Suburban'
                  ? 'Suburban Local'
                  : 'MRTS'}
              </button>
            ))}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs font-medium focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Corridors (Phase 1 & 2)</option>
              <option value="operational">Operational Only</option>
              <option value="under_construction">Phase II (Under Construction)</option>
            </select>

            {/* Corridor Selector */}
            <select
              value={corridorFilter}
              onChange={(e) => setCorridorFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs font-medium focus:outline-none focus:border-cyan-500 max-w-[180px] truncate"
            >
              <option value="all">All Lines ({lines.length})</option>
              {lines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.short_name} ({l.system_type})
                </option>
              ))}
            </select>
          </div>

          {/* Autocomplete Station Search Input */}
          {showSearch && (
            <div className="relative w-full sm:w-64">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === 'ta' ? 'நிலையத்தை தேடுக...' : 'Find station or code...'}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              {/* Autocomplete Popup */}
              {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-30 max-h-56 overflow-y-auto">
                  {searchResults.map((st) => {
                    const stLine = lineMap.get(st.line_id);
                    return (
                      <button
                        key={st.id}
                        onClick={() => handleSelectSearchResult(st)}
                        className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center justify-between text-xs border-b border-slate-800/60 last:border-none cursor-pointer group transition"
                      >
                        <div>
                          <div className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                            {st.name}
                            <span className="ml-1.5 text-[10px] text-slate-400 font-mono">
                              ({st.code})
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{ backgroundColor: stLine?.color || '#0284c7' }}
                            />
                            <span>{stLine?.short_name || st.line_id}</span>
                            <span>•</span>
                            <span className={st.status === 'operational' ? 'text-emerald-400' : 'text-amber-400'}>
                              {st.status === 'operational' ? 'Operational' : 'Phase 2'}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Google Maps Container */}
      <div style={{ height, width: '100%' }} className="relative flex-1 bg-slate-950">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            defaultCenter={CHENNAI_DEFAULT_CENTER}
            defaultZoom={CHENNAI_DEFAULT_ZOOM}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            gestureHandling="greedy"
            disableDefaultUI={false}
            mapTypeControl={true}
            streetViewControl={true}
            fullscreenControl={true}
            zoomControl={true}
            className="w-full h-full"
          >
            {/* Camera Controller */}
            <CameraController center={cameraTarget} zoom={cameraZoom} />

            {/* Network Corridor Polylines */}
            {corridorPaths.map((cp) => (
              <PolylineOverlay
                key={cp.lineId}
                path={cp.path}
                strokeColor={cp.color}
                strokeWeight={cp.isOperational ? 4 : 3}
                strokeOpacity={cp.isOperational ? 0.9 : 0.65}
                isDashed={!cp.isOperational}
                zIndex={cp.isOperational ? 3 : 2}
              />
            ))}

            {/* Active Journey Route Highlight (if provided) */}
            {journeyPath && (
              <>
                {/* Glowing underlay polyline */}
                <PolylineOverlay
                  path={journeyPath}
                  strokeColor="#06b6d4"
                  strokeWeight={9}
                  strokeOpacity={0.4}
                  zIndex={9}
                />
                {/* Foreground route polyline */}
                <PolylineOverlay
                  path={journeyPath}
                  strokeColor="#22d3ee"
                  strokeWeight={5}
                  strokeOpacity={1.0}
                  zIndex={10}
                />
              </>
            )}

            {/* Station Advanced Markers */}
            {filteredStations.map((st) => {
              const stLine = lineMap.get(st.line_id);
              const color = stLine?.color || '#0284c7';
              const isInterchange = st.is_interchange === 1;
              const isSelected = activeStation?.id === st.id;
              const isOperational = st.status === 'operational';

              return (
                <AdvancedMarker
                  key={st.id}
                  position={{ lat: st.lat, lng: st.lon }}
                  title={`${st.name} (${st.code}) - ${stLine?.name || st.line_id}`}
                  onClick={() => {
                    setActiveStation(st);
                    setCameraTarget({ lat: st.lat, lng: st.lon });
                  }}
                >
                  <div
                    className={`relative cursor-pointer transition-transform duration-200 ${
                      isSelected ? 'scale-125 z-40' : 'hover:scale-115 z-20'
                    }`}
                  >
                    {/* Interchange Badge or Standard Pin */}
                    {isInterchange ? (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white ring-2 ring-cyan-500/80 animate-pulse"
                        style={{ backgroundColor: color }}
                      >
                        <Train className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div
                        className={`rounded-full border border-white/80 shadow-md flex items-center justify-center ${
                          isOperational ? 'w-4 h-4' : 'w-3.5 h-3.5 border-dashed border-amber-300'
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    )}

                    {/* Floating label for interchanges or selected station */}
                    {(isSelected || (isInterchange && st.platform_count >= 4)) && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-0.5 rounded-md bg-slate-950/95 border border-slate-700 text-[10px] font-bold text-white whitespace-nowrap shadow-xl pointer-events-none z-50">
                        {st.name}
                      </div>
                    )}
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* Station InfoWindow when a marker is active */}
            {activeStation && (
              <InfoWindow
                position={{ lat: activeStation.lat, lng: activeStation.lon }}
                onCloseClick={() => setActiveStation(null)}
              >
                <div className="p-1 max-w-xs text-slate-900 font-sans">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5 mb-1.5">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-tight">
                        {activeStation.name}
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium">
                        {activeStation.name_ta}
                      </p>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-800 border border-slate-300">
                      {activeStation.code}
                    </span>
                  </div>

                  {/* Line & Status Details */}
                  <div className="space-y-1 text-xs mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                        style={{
                          backgroundColor:
                            lineMap.get(activeStation.line_id)?.color || '#0284c7'
                        }}
                      />
                      <span className="font-semibold text-slate-800">
                        {lineMap.get(activeStation.line_id)?.name || activeStation.line_id}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-600">
                      {activeStation.status === 'operational' ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Operational Service
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <Hammer className="w-3 h-3" /> Phase II Under Construction
                        </span>
                      )}
                    </div>

                    {activeStation.is_interchange === 1 && (
                      <div className="p-1.5 rounded-lg bg-cyan-50 border border-cyan-200 text-[11px] text-cyan-900">
                        <span className="font-bold">Interchange Hub:</span>{' '}
                        {activeStation.interchange_info || 'Cross-platform transfer'}
                      </div>
                    )}
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-200">
                    {onSetOrigin && (
                      <button
                        onClick={() => {
                          onSetOrigin(activeStation);
                          setActiveStation(null);
                        }}
                        className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-[11px] font-bold text-center cursor-pointer transition"
                      >
                        Depart Here
                      </button>
                    )}
                    {onSetDestination && (
                      <button
                        onClick={() => {
                          onSetDestination(activeStation);
                          setActiveStation(null);
                        }}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold text-center cursor-pointer transition"
                      >
                        Destination
                      </button>
                    )}
                  </div>

                  {onSelectStationModal && (
                    <button
                      onClick={() => {
                        onSelectStationModal(activeStation);
                      }}
                      className="w-full mt-1.5 py-1 text-center text-[11px] font-bold text-cyan-700 hover:text-cyan-900 hover:underline cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>Full Station Info & Amenities</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </APIProvider>

        {/* Floating Interactive Legend Overlay */}
        {showLegend && (
          <div className="hidden lg:block absolute bottom-6 right-6 max-w-xs w-72 bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-md shadow-2xl text-xs z-10 space-y-2 pointer-events-auto">
            <div className="flex items-center justify-between font-bold text-slate-200 text-xs border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Corridor Legend</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">10 Corridors</span>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
                <span className="text-slate-300">Blue (Corridor 1)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a]" />
                <span className="text-slate-300">Green (Corridor 2)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9333ea]" />
                <span className="text-slate-300">Purple (Phase 2)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
                <span className="text-slate-300">Yellow (Phase 2)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                <span className="text-slate-300">Red (Phase 2)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
                <span className="text-slate-300">Suburban South</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                <span className="text-slate-300">Suburban West</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
                <span className="text-slate-300">Suburban North</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" />
                <span className="text-slate-300">MRTS Velachery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed]" />
                <span className="text-slate-300">West-South Link</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-emerald-400 inline-block" /> Solid = Active
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 border-b border-dashed border-amber-400 inline-block" /> Dashed = Phase 2
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
