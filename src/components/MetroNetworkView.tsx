import React, { useState, useMemo } from 'react';
import {
  Layers,
  Train,
  MapPin,
  Navigation,
  ShieldCheck,
  Hammer,
  ArrowRight,
  ArrowLeftRight,
  Search,
  Clock,
  Compass,
  AlertTriangle,
  Info,
  CheckCircle2,
  Bus
} from 'lucide-react';
import { TransitLine, Station } from '../types/transit.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface MetroNetworkViewProps {
  lines: TransitLine[];
  stations: Station[];
  initialCorridorId?: string;
  onSelectStation: (station: Station) => void;
  onSetOrigin: (station: Station) => void;
  onSetDestination: (station: Station) => void;
  onNavigateToPlanner: (origin?: Station, dest?: Station) => void;
}

export const MetroNetworkView: React.FC<MetroNetworkViewProps> = ({
  lines,
  stations,
  initialCorridorId = 'yellow',
  onSelectStation,
  onSetOrigin,
  onSetDestination,
  onNavigateToPlanner
}) => {
  const { lang, t } = useLanguage();

  // Filter metro lines only (Blue, Green, Yellow, Purple, Red)
  const metroLines = lines.filter((l) => l.system_type === 'Metro');

  // Currently active selected corridor for station view (default to yellow Corridor 4)
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>(initialCorridorId);

  // Search input specifically for the active corridor's station list
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Section filter for Yellow Line Corridor 4
  const [yellowSectionFilter, setYellowSectionFilter] = useState<'all' | 'sectionA' | 'sectionB' | 'sectionC'>('all');

  // Route direction toggle (West to East vs East to West)
  const [isReversedDirection, setIsReversedDirection] = useState<boolean>(false);

  const selectedLine = metroLines.find((l) => l.id === selectedCorridorId) || metroLines[0];

  // Base stations for selected corridor in natural route order
  const corridorStations = useMemo(() => {
    return stations
      .filter((s) => s.line_id === selectedCorridorId)
      .sort((a, b) => {
        // Natural sequence ordering based on ID number
        const numA = parseInt(a.id.replace(/\D/g, '') || '0', 10);
        const numB = parseInt(b.id.replace(/\D/g, '') || '0', 10);
        return numA - numB;
      });
  }, [stations, selectedCorridorId]);

  // Directed list based on direction toggle
  const orderedStations = useMemo(() => {
    if (isReversedDirection) {
      return [...corridorStations].reverse();
    }
    return corridorStations;
  }, [corridorStations, isReversedDirection]);

  // Filtered station list based on search and section filters
  const displayedStations = useMemo(() => {
    let list = orderedStations;

    // Apply Yellow Line section filter if Yellow line is active
    if (selectedCorridorId === 'yellow' && yellowSectionFilter !== 'all') {
      list = list.filter((s) => {
        const idNum = parseInt(s.id.replace(/\D/g, '') || '0', 10);
        if (yellowSectionFilter === 'sectionA') {
          // Section A: Poonamallee Bypass (1) to Vadapalani (17)
          return idNum >= 1 && idNum <= 17;
        } else if (yellowSectionFilter === 'sectionB') {
          // Section B: Kodambakkam Power House (18) to Kodambakkam (20)
          return idNum >= 18 && idNum <= 20;
        } else if (yellowSectionFilter === 'sectionC') {
          // Section C: Panagal Park (21) to Lighthouse (28)
          return idNum >= 21 && idNum <= 28;
        }
        return true;
      });
    }

    // Apply search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.name_ta && s.name_ta.toLowerCase().includes(q)) ||
          s.code.toLowerCase().includes(q) ||
          (s.interchange_info && s.interchange_info.toLowerCase().includes(q))
      );
    }

    return list;
  }, [orderedStations, selectedCorridorId, yellowSectionFilter, searchQuery]);

  // Helper to determine adjacent stations along the canonical route
  const getAdjacentStations = (stationId: string) => {
    const idx = corridorStations.findIndex((s) => s.id === stationId);
    if (idx === -1) return { prev: null, next: null };
    const prev = idx > 0 ? corridorStations[idx - 1] : null;
    const next = idx < corridorStations.length - 1 ? corridorStations[idx + 1] : null;
    return { prev, next };
  };

  // Helper for line endpoints
  const getEndpoints = (lineId: string) => {
    const list = stations
      .filter((s) => s.line_id === lineId)
      .sort((a, b) => {
        const numA = parseInt(a.id.replace(/\D/g, '') || '0', 10);
        const numB = parseInt(b.id.replace(/\D/g, '') || '0', 10);
        return numA - numB;
      });
    if (list.length === 0) return { start: 'Terminal A', end: 'Terminal B' };
    return {
      start: list[0]?.name || 'Origin',
      end: list[list.length - 1]?.name || 'Destination',
      startTa: list[0]?.name_ta,
      endTa: list[list.length - 1]?.name_ta
    };
  };

  const isYellowLine = selectedCorridorId === 'yellow';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-xs font-bold text-cyan-400">
              <Layers className="w-3.5 h-3.5" />
              <span>Chennai Metro Rail Limited (CMRL) Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {t('navMetro')} — {lang === 'ta' ? 'மெட்ரோ தடங்கள் & நிலையங்கள்' : 'Metro Network Corridors'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Explore operational Phase I lines (Blue & Green) and Phase II corridors under active construction, featuring the comprehensive 28-station Yellow Line (Corridor 4) from Poonamallee Bypass to Lighthouse.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateToPlanner()}
              className="px-5 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>{t('planJourney')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Corridor Cards Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Select a Metro Corridor
          </h2>
          <span className="text-xs text-slate-400">
            5 Verified Corridors
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metroLines.map((line) => {
            const isSelected = selectedCorridorId === line.id;
            const isOperational = line.status === 'operational';
            const endpoints = getEndpoints(line.id);
            const lineStationCount = stations.filter((s) => s.line_id === line.id).length || line.total_stations;
            const interchanges = stations.filter((s) => s.line_id === line.id && s.is_interchange);

            return (
              <div
                key={line.id}
                className={`relative rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-yellow-500/80 ring-2 ring-yellow-500/30 shadow-xl'
                    : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top line accent */}
                <div
                  className="absolute top-0 left-6 right-6 h-1.5 rounded-b-md"
                  style={{ backgroundColor: line.color }}
                />

                <div className="space-y-3 pt-2">
                  {/* Status & Short name */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: line.color }}
                      />
                      <span className="text-xs font-bold text-white font-mono">
                        {line.short_name}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isOperational
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {isOperational ? (
                        <>
                          <ShieldCheck className="w-3 h-3" />
                          <span>{t('statusOperational')}</span>
                        </>
                      ) : (
                        <>
                          <Hammer className="w-3 h-3" />
                          <span>{t('statusUnderConstruction')}</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Line Title */}
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {line.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {line.description}
                    </p>
                  </div>

                  {/* Endpoints */}
                  <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Start</span>
                      <span className="font-semibold text-slate-200 truncate ml-2">
                        {lang === 'ta' && endpoints.startTa ? endpoints.startTa : endpoints.start}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">End</span>
                      <span className="font-semibold text-slate-200 truncate ml-2">
                        {lang === 'ta' && endpoints.endTa ? endpoints.endTa : endpoints.end}
                      </span>
                    </div>
                  </div>

                  {/* Stats Bar */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-400">
                      <span className="text-[10px] text-slate-500 block">Verified Stations</span>
                      <span className="font-bold text-white font-mono">{lineStationCount}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-400">
                      <span className="text-[10px] text-slate-500 block">Length</span>
                      <span className="font-bold text-white font-mono">{line.total_km} km</span>
                    </div>
                  </div>

                  {/* Interchanges summary badge */}
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span className="truncate">
                      {interchanges.length} Interchange Hubs ({interchanges.map((s) => s.name).slice(0, 3).join(', ')}...)
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSelectedCorridorId(line.id);
                      setSearchQuery('');
                      setYellowSectionFilter('all');
                      setIsReversedDirection(false);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <span>{t('viewStations')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      const list = stations.filter((s) => s.line_id === line.id);
                      if (list.length >= 2) {
                        onNavigateToPlanner(list[0], list[list.length - 1]);
                      } else {
                        onNavigateToPlanner();
                      }
                    }}
                    className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-800 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>{t('planJourney')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dedicated Yellow Line / Corridor Section */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Corridor Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: selectedLine?.color }}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                {isYellowLine ? 'Chennai Metro Phase II — Corridor 4' : `${selectedLine?.name} Sequence`}
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                  selectedLine?.status === 'operational'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {selectedLine?.status === 'operational' ? (
                  <>
                    <ShieldCheck className="w-3 h-3" />
                    <span>{t('statusOperational')}</span>
                  </>
                ) : (
                  <>
                    <Hammer className="w-3 h-3" />
                    <span>{t('statusUnderConstruction')} (Phase II)</span>
                  </>
                )}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isYellowLine
                ? (lang === 'ta' ? 'மஞ்சள் தடம் — தடம் 4' : 'Yellow Line — Corridor 4')
                : selectedLine?.name}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {isYellowLine
                ? (lang === 'ta'
                    ? 'பூவிருந்தவல்லி புறவழிச்சாலை முதல் கலங்கரை விளக்கம் வரையிலான 28 மெட்ரோ நிலையங்கள் அடங்கிய பாதை.'
                    : 'Explore 28 stations along the Poonamallee Bypass–Lighthouse suburban metro corridor (West to East alignment).')
                : selectedLine?.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400 font-medium">
              <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold">
                {corridorStations.length} {t('stops')}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold">
                {selectedLine?.total_km} km Corridor
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-bold">
                Poonamallee Bypass ➔ Lighthouse
              </span>
            </div>
          </div>

          {/* Construction Disclaimer Card */}
          {selectedLine?.status !== 'operational' && (
            <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl max-w-md text-xs text-amber-200 space-y-1.5 shadow-lg">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Phase II Infrastructure & Service Notice</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {selectedLine?.target_completion || 'Under active construction by CMRL.'} Passenger revenue services have not yet commenced on this corridor. Timetable benchmarks and station sequences reflect approved CMRL engineering alignments.
              </p>
              <div className="pt-1.5 border-t border-amber-500/30 flex items-start gap-1.5 text-[11px] text-amber-200 font-medium">
                <Bus className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-cyan-400" />
                <span>Current Transit Alternative: Take Green Line to Vadapalani/CMBT, then MTC Feeder Bus 54 or 88K to Poonamallee.</span>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar & Filters Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isYellowLine
                    ? (lang === 'ta'
                        ? '28 மஞ்சள் தட நிலையங்களை பெயர் அல்லது குறியீடு கொண்டு தேடுக...'
                        : 'Search 28 Yellow Line stations by name or code...')
                    : `Search ${selectedLine?.name} stations...`
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Travel Direction Switcher */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsReversedDirection(!isReversedDirection)}
                className="px-4 py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                title="Reverse displayed station sequence"
              >
                <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
                <span>
                  {isReversedDirection
                    ? (lang === 'ta' ? 'கிழக்கு ➔ மேற்கு (கலங்கரை விளக்கம் ➔ பூவிருந்தவல்லி)' : 'Direction: East to West (Lighthouse ➔ Poonamallee)')
                    : (lang === 'ta' ? 'மேற்கு ➔ கிழக்கு (பூவிருந்தவல்லி ➔ கலங்கரை விளக்கம்)' : 'Direction: West to East (Poonamallee ➔ Lighthouse)')}
                </span>
              </button>
            </div>
          </div>

          {/* Yellow Line Specific Section Tabs */}
          {isYellowLine && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400 mr-1">Section Reach:</span>
              <button
                onClick={() => setYellowSectionFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  yellowSectionFilter === 'all'
                    ? 'bg-yellow-500 text-slate-950 font-bold shadow-md shadow-yellow-500/20'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                All 28 Stations
              </button>

              <button
                onClick={() => setYellowSectionFilter('sectionA')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  yellowSectionFilter === 'sectionA'
                    ? 'bg-yellow-500 text-slate-950 font-bold shadow-md shadow-yellow-500/20'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                Section A: Poonamallee–Vadapalani (17 Stns • Priority Stretch)
              </button>

              <button
                onClick={() => setYellowSectionFilter('sectionB')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  yellowSectionFilter === 'sectionB'
                    ? 'bg-yellow-500 text-slate-950 font-bold shadow-md shadow-yellow-500/20'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                Section B: Intermediate Arcot Road (3 Stns)
              </button>

              <button
                onClick={() => setYellowSectionFilter('sectionC')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  yellowSectionFilter === 'sectionC'
                    ? 'bg-yellow-500 text-slate-950 font-bold shadow-md shadow-yellow-500/20'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                Section C: Underground to Lighthouse (8 Stns)
              </button>
            </div>
          )}
        </div>

        {/* Stations List */}
        <div className="space-y-3 pt-2">
          {displayedStations.length === 0 ? (
            <div className="p-12 text-center bg-slate-950/50 rounded-2xl border border-slate-800 space-y-2">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No stations match "{searchQuery}"</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setYellowSectionFilter('all');
                }}
                className="text-xs text-cyan-400 hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            displayedStations.map((station) => {
              // Get actual position index along canonical west-to-east route
              const canonicalIdx = corridorStations.findIndex((s) => s.id === station.id);
              const sequenceNum = canonicalIdx + 1;
              const isFirst = canonicalIdx === 0;
              const isLast = canonicalIdx === corridorStations.length - 1;
              const { prev, next } = getAdjacentStations(station.id);

              return (
                <div
                  key={station.id}
                  className={`group p-4 sm:p-5 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isFirst || isLast
                      ? 'bg-slate-950 border-yellow-500/40 shadow-lg shadow-yellow-950/20'
                      : 'bg-slate-950/70 hover:bg-slate-950 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Left Column: Number, Name, Code, Badges */}
                  <div className="flex items-start gap-4">
                    {/* Sequence Badge */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-mono font-black flex-shrink-0 text-slate-950 shadow-md"
                      style={{ backgroundColor: selectedLine?.color || '#eab308' }}
                    >
                      {sequenceNum}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      {/* Name Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => onSelectStation(station)}
                          className="text-base sm:text-lg font-black text-white group-hover:text-yellow-400 transition-colors text-left cursor-pointer"
                        >
                          {lang === 'ta' && station.name_ta ? station.name_ta : station.name}
                        </button>

                        {/* Station Code Badge */}
                        {station.code && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono font-bold text-slate-300 border border-slate-700">
                            {station.code}
                          </span>
                        )}

                        {/* Terminus Highlights */}
                        {isFirst && (
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-yellow-950 text-yellow-300 border border-yellow-700/80">
                            WESTERN TERMINUS (START)
                          </span>
                        )}
                        {isLast && (
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-700/80">
                            EASTERN TERMINUS (END)
                          </span>
                        )}

                        {/* Section Tag */}
                        {station.zone && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-slate-400 border border-slate-800">
                            {station.zone}
                          </span>
                        )}
                      </div>

                      {/* Alternate language subtext */}
                      {lang === 'ta' && station.name_ta && (
                        <p className="text-xs text-slate-400">{station.name}</p>
                      )}
                      {lang === 'en' && station.name_ta && (
                        <p className="text-xs text-slate-400">{station.name_ta}</p>
                      )}

                      {/* Adjacent Stations Indicator */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-0.5">
                        <span className="text-slate-500">
                          {prev ? (
                            <>
                              <span className="text-slate-600">Prev:</span>{' '}
                              <span className="text-slate-300 font-medium">
                                {prev.name} ({prev.code})
                              </span>
                            </>
                          ) : (
                            <span className="text-yellow-400/90 font-medium">Western Corridor Terminus</span>
                          )}
                        </span>

                        <span className="text-slate-600 hidden sm:inline">•</span>

                        <span className="text-slate-500">
                          {next ? (
                            <>
                              <span className="text-slate-600">Next:</span>{' '}
                              <span className="text-slate-300 font-medium">
                                {next.name} ({next.code})
                              </span>
                            </>
                          ) : (
                            <span className="text-purple-400/90 font-medium">Eastern Coastal Terminus</span>
                          )}
                        </span>
                      </div>

                      {/* Verified Connections / Interchanges */}
                      {station.interchange_info && (
                        <div className="pt-1.5 flex items-start gap-1.5 text-xs text-emerald-400 font-medium">
                          <Navigation className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span className="leading-snug">
                            {station.interchange_info}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Status & Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          station.status === 'operational'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {station.status === 'operational' ? (
                          <>
                            <ShieldCheck className="w-3 h-3" />
                            <span>{t('statusOperational')}</span>
                          </>
                        ) : (
                          <>
                            <Hammer className="w-3 h-3" />
                            <span>{t('statusUnderConstruction')}</span>
                          </>
                        )}
                      </span>
                      {station.target_completion && (
                        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                          {station.target_completion.split('(')[0]}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => onSelectStation(station)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                      >
                        {t('details')}
                      </button>

                      <button
                        onClick={() => onSetOrigin(station)}
                        className="px-3 py-1.5 rounded-xl bg-yellow-950/80 hover:bg-yellow-900 border border-yellow-700/80 text-xs font-bold text-yellow-300 transition-colors cursor-pointer"
                      >
                        {t('planFromHere')}
                      </button>

                      <button
                        onClick={() => onSetDestination(station)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                      >
                        {t('setAsDestination')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
