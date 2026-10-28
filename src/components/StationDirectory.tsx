import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  MapPin,
  Train,
  Clock,
  Zap,
  ShieldCheck,
  Hammer,
  Navigation,
  ArrowRight,
  Layers,
  Car,
  Bus,
  Accessibility,
  Building2,
  X,
  Star
} from 'lucide-react';
import { Station, TransitLine } from '../types/transit.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { getFavoriteStations, toggleFavoriteStation } from '../services/api.ts';

interface StationDirectoryProps {
  stations: Station[];
  lines: TransitLine[];
  onSelectStationModal: (station: Station) => void;
  onSetOriginForPlanner: (station: Station) => void;
  onSetDestinationForPlanner: (station: Station) => void;
}

export const StationDirectory: React.FC<StationDirectoryProps> = ({
  stations,
  lines,
  onSelectStationModal,
  onSetOriginForPlanner,
  onSetDestinationForPlanner
}) => {
  const { lang, t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [selectedLine, setSelectedLine] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [onlyStarred, setOnlyStarred] = useState<boolean>(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => getFavoriteStations());

  const handleToggleFavorite = (stationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = toggleFavoriteStation(stationId);
    setFavoriteIds(updated);
  };

  // Filtered station list with alias and line awareness
  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
      // Starred filter
      if (onlyStarred && !favoriteIds.includes(station.id)) {
        return false;
      }

      // Search term
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = station.name.toLowerCase().includes(query);
        const matchesTa = (station.name_ta || '').toLowerCase().includes(query);
        const matchesCode = (station.code || '').toLowerCase().includes(query);
        const matchesLineName = (station.line_name || '').toLowerCase().includes(query);
        const matchesLineShort = (station.line_short_name || '').toLowerCase().includes(query);
        const matchesZone = (station.zone || '').toLowerCase().includes(query);

        // Colloquial synonyms
        let matchesAlias = false;
        if (query.includes('airport') && ['BL26', 'SB14'].includes(station.id)) matchesAlias = true;
        if (query.includes('central') && ['GL01', 'SW01', 'BL13'].includes(station.id)) matchesAlias = true;
        if (query.includes('egmore') && ['GL02', 'SB04'].includes(station.id)) matchesAlias = true;
        if (query.includes('guindy') && ['BL22', 'SB11'].includes(station.id)) matchesAlias = true;
        if (query.includes('beach') && ['SB01', 'MR01'].includes(station.id)) matchesAlias = true;
        if (query.includes('tambaram') && ['SB18'].includes(station.id)) matchesAlias = true;
        if (query.includes('arakkonam') && ['SW31'].includes(station.id)) matchesAlias = true;
        if (query.includes('kanchi') && ['WS09'].includes(station.id)) matchesAlias = true;

        if (!matchesName && !matchesTa && !matchesCode && !matchesLineName && !matchesLineShort && !matchesZone && !matchesAlias) {
          return false;
        }
      }

      // Mode filter
      if (selectedMode !== 'all') {
        if (selectedMode === 'Metro' && station.system_type !== 'Metro') return false;
        if (selectedMode === 'Suburban' && station.system_type !== 'Suburban') return false;
        if (selectedMode === 'MRTS' && station.system_type !== 'MRTS') return false;
      }

      // Line filter
      if (selectedLine !== 'all' && station.line_id !== selectedLine) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && station.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [stations, searchQuery, selectedMode, selectedLine, selectedStatus, onlyStarred, favoriteIds]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-xs font-bold text-cyan-400">
          <MapPin className="w-3.5 h-3.5" />
          <span>Global Station Explorer</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {t('navStations')} — {lang === 'ta' ? 'அனைத்து ரயில் & மெட்ரோ நிலையங்கள்' : 'All Transport Stations'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
          Search across {stations.length} verified stations in Chennai Metro, Southern Railway Suburban, and MRTS networks with verified facilities, interchange connections, and timetable metadata.
        </p>
      </div>

      {/* Global Search and Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stations by name in English or Tamil, or station code (e.g., Central, Vadapalani, Airport, DMS, YL28)..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-12 pr-10 py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {[
              { id: 'all', label: t('allCategories') },
              { id: 'Metro', label: t('categoryMetro') },
              { id: 'Suburban', label: t('categorySuburban') },
              { id: 'MRTS', label: t('categoryMRTS') }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setSelectedMode(m.id);
                  if (m.id !== 'all') setSelectedLine('all');
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  selectedMode === m.id
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Line Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Corridors & Lines</option>
              {lines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">{t('statusAll')}</option>
              <option value="operational">{t('statusOperational')}</option>
              <option value="under_construction">{t('statusUnderConstruction')}</option>
            </select>

            {/* Starred Stations Quick Toggle */}
            <button
              type="button"
              onClick={() => setOnlyStarred(!onlyStarred)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                onlyStarred
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-950 text-slate-400 hover:text-amber-400 border border-slate-700'
              }`}
              title="Show only starred favorite stations"
            >
              <Star className={`w-3.5 h-3.5 ${onlyStarred ? 'fill-current' : ''}`} />
              <span>Starred ({favoriteIds.length})</span>
            </button>
          </div>
        </div>

        {/* Results Counter */}
        <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{filteredStations.length}</strong> of {stations.length} stations
          </span>
          {(searchQuery || selectedMode !== 'all' || selectedLine !== 'all' || selectedStatus !== 'all' || onlyStarred) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedMode('all');
                setSelectedLine('all');
                setSelectedStatus('all');
                setOnlyStarred(false);
              }}
              className="text-cyan-400 hover:underline cursor-pointer"
            >
              {t('reset')} Filters
            </button>
          )}
        </div>
      </div>

      {/* Stations Cards Grid */}
      {filteredStations.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <p className="text-base font-bold text-white">No stations matched your search query</p>
          <p className="text-xs text-slate-400">Try searching for a different station name or clear active filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStations.map((station) => {
            const line = lines.find((l) => l.id === station.line_id);
            const isOperational = station.status === 'operational';
            const lineColor = station.line_color || line?.color || '#0284c7';
            const isFav = favoriteIds.includes(station.id);

            return (
              <div
                key={station.id}
                onClick={() => onSelectStationModal(station)}
                className="group relative p-5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                {/* Top line accent */}
                <div
                  className="absolute top-0 left-6 right-6 h-1 rounded-b-md"
                  style={{ backgroundColor: lineColor }}
                />

                <div className="space-y-3 pt-1">
                  {/* Line Tag, Star, & Operational Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-md text-[11px] font-bold text-white font-mono flex items-center gap-1 shadow-sm"
                      style={{ backgroundColor: lineColor }}
                    >
                      <Train className="w-3 h-3" />
                      <span>{station.line_short_name || line?.short_name || station.line_id.toUpperCase()}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(station.id, e)}
                        className="p-1 rounded-lg text-slate-400 hover:text-amber-400 transition cursor-pointer"
                        title={isFav ? 'Remove from favorites' : 'Add to favorite stations'}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOperational
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isOperational ? t('statusOperational') : t('statusUnderConstruction')}
                      </span>
                    </div>
                  </div>

                  {/* Title & Tamil Name */}
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {lang === 'ta' && station.name_ta ? station.name_ta : station.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {lang === 'ta' ? station.name : station.name_ta}
                    </p>
                  </div>

                  {/* Code and System Type */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800 font-mono text-slate-300">
                      CODE: {station.code}
                    </span>
                    <span>•</span>
                    <span>{station.system_type}</span>
                    <span>•</span>
                    <span>{station.platform_count || 2} Platforms</span>
                  </div>

                  {/* Interchange notice */}
                  {station.is_interchange ? (
                    <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-emerald-400 flex items-start gap-1.5 font-medium leading-relaxed">
                      <Navigation className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span className="truncate">{station.interchange_info || 'Interchange Hub'}</span>
                    </div>
                  ) : null}

                  {/* Headway & Frequency preview for operational corridors */}
                  {isOperational && (station.headway_peak || line?.headway_peak) && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1 text-cyan-400 font-mono font-semibold">
                        <Zap className="w-3 h-3 text-cyan-400" />
                        Peak: every {station.headway_peak || line?.headway_peak} mins
                      </span>
                      <span>Hours: 05:00 - 23:00</span>
                    </div>
                  )}

                  {!isOperational && (
                    <div className="text-[11px] text-amber-400 font-medium">
                      Phase II Under Construction (Target 2025-2027)
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div
                  className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onSetOriginForPlanner(station)}
                    className="py-1.5 px-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-[11px] font-bold text-cyan-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>{t('planFromHere')}</span>
                  </button>

                  <button
                    onClick={() => onSetDestinationForPlanner(station)}
                    className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold text-slate-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ArrowRight className="w-3 h-3" />
                    <span>{t('setAsDestination')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
