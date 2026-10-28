import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  Train,
  ArrowRight,
  ArrowUpDown,
  Clock,
  IndianRupee,
  ShieldCheck,
  Hammer,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Sparkles,
  Info,
  Layers,
  Compass,
  CheckCircle2,
  Share2,
  History,
  RotateCcw,
  Trash2,
  X,
  ArrowLeftRight,
  Star,
  Bookmark,
  Map as MapIcon
} from 'lucide-react';
import {
  Station,
  JourneyPlan,
  JourneyOption,
  TransportPreference,
  TransitLine,
  RecentTrip,
  FavoriteJourney
} from '../types/transit.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import {
  planJourney,
  getRecentTrips,
  saveRecentTrip,
  clearRecentTrips,
  removeRecentTrip,
  getFavoriteStations,
  toggleFavoriteStation,
  isFavoriteStation,
  getFavoriteJourneys,
  saveFavoriteJourney,
  removeFavoriteJourney,
  isFavoriteJourney
} from '../services/api.ts';
import { SmartStationSearch } from './SmartStationSearch.tsx';
import { RouteComparisonView } from './RouteComparisonView.tsx';
import { VisualJourneyTimeline } from './VisualJourneyTimeline.tsx';
import { TransitGoogleMap } from './TransitGoogleMap.tsx';

interface JourneyPlannerProps {
  stations: Station[];
  lines?: TransitLine[];
  selectedOrigin: Station | null;
  selectedDestination: Station | null;
  onOriginChange: (station: Station | null) => void;
  onDestinationChange: (station: Station | null) => void;
  onSelectStationModal?: (station: Station) => void;
}

export const JourneyPlanner: React.FC<JourneyPlannerProps> = ({
  stations,
  lines = [],
  selectedOrigin,
  selectedDestination,
  onOriginChange,
  onDestinationChange,
  onSelectStationModal
}) => {
  const { lang, t } = useLanguage();
  const searchFormRef = useRef<HTMLDivElement>(null);

  // Preference filter: 'best' | 'metro' | 'suburban'
  const [preference, setPreference] = useState<TransportPreference>('best');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // All route options calculated for the current origin & destination
  const [options, setOptions] = useState<JourneyOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<JourneyOption | null>(null);

  // View state: 'comparison' (shows route options grid) | 'guide' (shows step-by-step visual timeline) | 'map' (interactive Google Map)
  const [viewMode, setViewMode] = useState<'comparison' | 'guide' | 'map'>('comparison');
  const [comparisonFilter, setComparisonFilter] = useState<'all' | 'best' | 'fewest_transfers' | 'metro' | 'suburban'>('all');

  // Favorites state
  const [favoriteStationIds, setFavoriteStationIds] = useState<string[]>(() => getFavoriteStations());
  const [favoriteJourneys, setFavoriteJourneys] = useState<FavoriteJourney[]>(() => getFavoriteJourneys());
  const [activeCommuteTab, setActiveCommuteTab] = useState<'starred_stations' | 'saved_journeys' | 'recent_trips'>('recent_trips');

  // Recent trips state (up to 10 completed searches)
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>(() => getRecentTrips());

  // Check if current pair is favorited
  const isCurrentPairFavorited = selectedOrigin && selectedDestination
    ? isFavoriteJourney(selectedOrigin.id, selectedDestination.id)
    : false;

  // Toggle favorite station
  const handleToggleFavoriteStation = (stationId: string) => {
    const updated = toggleFavoriteStation(stationId);
    setFavoriteStationIds(updated);
  };

  // Toggle favorite journey
  const handleToggleFavoriteJourney = (orig: Station, dest: Station) => {
    if (isFavoriteJourney(orig.id, dest.id)) {
      const match = favoriteJourneys.find((j) => j.origin_station_id === orig.id && j.dest_station_id === dest.id);
      if (match) {
        const updated = removeFavoriteJourney(match.id);
        setFavoriteJourneys(updated);
      }
    } else {
      const updated = saveFavoriteJourney(orig, dest, preference);
      setFavoriteJourneys(updated);
    }
  };

  // Trigger search whenever origin, dest, or preference changes
  useEffect(() => {
    if (!selectedOrigin || !selectedDestination) {
      setOptions([]);
      setSelectedOption(null);
      setError(null);
      return;
    }

    if (selectedOrigin.id === selectedDestination.id) {
      setError(t('sameStationError'));
      setOptions([]);
      setSelectedOption(null);
      return;
    }

    let isMounted = true;
    async function calculate() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await planJourney(selectedOrigin!.id, selectedDestination!.id, preference);
        if (isMounted) {
          const calculatedOptions: JourneyOption[] = res.options && res.options.length > 0
            ? res.options
            : [
                {
                  id: 'opt_primary',
                  option_type: preference,
                  title: res.lines_used.join(' ➔ ') || 'Direct Transit',
                  tag: 'recommended',
                  tag_label: 'Best Available',
                  ranking_reason: 'Direct connection calculated across transit lines.',
                  mode_types: ['Transit'],
                  ...res
                }
              ];

          setOptions(calculatedOptions);
          setSelectedOption(calculatedOptions[0]);

          // By default, if multiple alternatives exist, show comparison mode; if single direct option, can show comparison or guide
          setViewMode(calculatedOptions.length > 1 ? 'comparison' : 'guide');

          // Persist completed search to recent trips in localStorage (max 10)
          const updated = saveRecentTrip({
            origin_id: res.origin.id,
            origin_name: res.origin.name,
            origin_name_ta: res.origin.name_ta,
            origin_code: res.origin.code,
            origin_line_id: res.origin.line_id,
            dest_id: res.destination.id,
            dest_name: res.destination.name,
            dest_name_ta: res.destination.name_ta,
            dest_code: res.destination.code,
            dest_line_id: res.destination.line_id,
            preference: preference,
            duration_mins: res.estimated_duration_mins,
            distance_km: res.total_distance_km,
            fare_inr: res.fare_inr,
            interchange_count: res.interchange_count,
            lines_used: res.lines_used,
            is_fully_operational: res.is_fully_operational
          });
          setRecentTrips(updated);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Routing failed:', err);
          setError(err.message || t('noRouteFound'));
          setOptions([]);
          setSelectedOption(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    calculate();
    return () => {
      isMounted = false;
    };
  }, [selectedOrigin?.id, selectedDestination?.id, preference]);

  const handleSwap = () => {
    const temp = selectedOrigin;
    onOriginChange(selectedDestination);
    onDestinationChange(temp);
  };

  const handleReRunTrip = (trip: RecentTrip, reverse: boolean = false) => {
    const origId = reverse ? trip.dest_id : trip.origin_id;
    const destId = reverse ? trip.origin_id : trip.dest_id;
    const origStation = stations.find((s) => s.id === origId);
    const destStation = stations.find((s) => s.id === destId);

    if (origStation && destStation) {
      if (trip.preference) {
        setPreference(trip.preference);
      }
      onOriginChange(origStation);
      onDestinationChange(destStation);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleReRunFavoriteJourney = (fav: FavoriteJourney) => {
    const origStation = stations.find((s) => s.id === fav.origin_station_id);
    const destStation = stations.find((s) => s.id === fav.dest_station_id);

    if (origStation && destStation) {
      if (fav.preference) {
        setPreference(fav.preference);
      }
      onOriginChange(origStation);
      onDestinationChange(destStation);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleClearRecent = () => {
    clearRecentTrips();
    setRecentTrips([]);
  };

  const handleRemoveRecent = (tripId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeRecentTrip(tripId);
    setRecentTrips(updated);
  };

  const handleRemoveFavorite = (favId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeFavoriteJourney(favId);
    setFavoriteJourneys(updated);
  };

  const formatRelativeTime = (ts: number): string => {
    if (!ts) return '';
    const diffSec = Math.floor((Date.now() - ts) / 1000);
    if (diffSec < 45) return lang === 'ta' ? 'சற்று முன்' : 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return lang === 'ta' ? `${diffMin} நிமிடம் முன்` : `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return lang === 'ta' ? `${diffHours} மணிநேரம் முன்` : `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return lang === 'ta' ? `${diffDays} நாள் முன்` : `${diffDays}d ago`;
  };

  const getStationLineColor = (lineId?: string) => {
    if (!lineId) return '#0284c7';
    const line = lines.find((l) => l.id === lineId);
    return line?.color || '#0284c7';
  };

  // Scroll to search inputs
  const handleEditJourney = () => {
    if (searchFormRef.current) {
      searchFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Favorite stations objects
  const favoriteStationObjects = React.useMemo(() => {
    return stations.filter((s) => favoriteStationIds.includes(s.id));
  }, [stations, favoriteStationIds]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200 w-full max-w-full min-w-0 box-border">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-xs font-bold text-cyan-400">
          <Navigation className="w-3.5 h-3.5" />
          <span>Multi-Modal Routing Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {t('plannerTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
          {t('plannerSubtitle')}
        </p>
      </div>

      {/* Origin, Destination & Preference Selector Card */}
      <div
        ref={searchFormRef}
        className="w-full max-w-full min-w-0 box-border bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 lg:p-8 space-y-6 shadow-xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center w-full min-w-0">
          {/* Departure Station (Smart Autocomplete Search) */}
          <div className="md:col-span-5 w-full min-w-0">
            <SmartStationSearch
              label={t('originStation')}
              placeholder={lang === 'ta' ? 'புறப்படும் நிலையம் அல்லது குறியீடு (MAS, கிண்டி)...' : 'Departure station, code (e.g. MAS, Airport, Guindy)...'}
              selectedStation={selectedOrigin}
              onSelectStation={(st) => onOriginChange(st)}
              stations={stations}
              lines={lines}
              favoriteStationIds={favoriteStationIds}
              onToggleFavorite={handleToggleFavoriteStation}
              idPrefix="origin"
              helperText="Instant search by name, code, line, or aliases"
            />
          </div>

          {/* Swap Button */}
          <div className="md:col-span-2 flex items-center justify-center py-1 md:pt-6">
            <button
              type="button"
              onClick={handleSwap}
              className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              title={t('swap')}
              aria-label={t('swap')}
            >
              <ArrowUpDown className="w-5 h-5 md:rotate-90 text-cyan-400" />
            </button>
          </div>

          {/* Destination Station (Smart Autocomplete Search) */}
          <div className="md:col-span-5 w-full min-w-0">
            <SmartStationSearch
              label={t('destinationStation')}
              placeholder={lang === 'ta' ? 'சேருமிடம் அல்லது குறியீடு (TBM, CGL, AJJ)...' : 'Destination station, code (e.g. TBM, CGL, AJJ)...'}
              selectedStation={selectedDestination}
              onSelectStation={(st) => onDestinationChange(st)}
              stations={stations}
              lines={lines}
              favoriteStationIds={favoriteStationIds}
              onToggleFavorite={handleToggleFavoriteStation}
              idPrefix="dest"
              helperText="Instant search by name, code, line, or aliases"
            />
          </div>
        </div>

        {/* Quick-Pick Favorite Stations Chips (if user has starred any stations) */}
        {favoriteStationObjects.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 flex-shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>Quick Pick:</span>
            </span>
            {favoriteStationObjects.map((st) => (
              <button
                key={`chip-${st.id}`}
                type="button"
                onClick={() => {
                  if (!selectedOrigin) onOriginChange(st);
                  else if (!selectedDestination && selectedOrigin.id !== st.id) onDestinationChange(st);
                  else onOriginChange(st);
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 cursor-pointer transition"
                title={`Select ${st.name} [${st.code}]`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getStationLineColor(st.line_id) }}
                />
                <span>{st.name}</span>
                <span className="font-mono text-[10px] text-cyan-400 font-bold">[{st.code}]</span>
              </button>
            ))}
          </div>
        )}

        {/* Transport Preferences Tabs */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
          <div className="text-xs font-semibold text-slate-400 shrink-0">
            {t('routePreference')}:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:w-auto min-w-0">
            <button
              type="button"
              onClick={() => setPreference('best')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px] text-center whitespace-normal leading-tight ${
                preference === 'best'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md ring-2 ring-cyan-400/40'
                  : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{t('prefBest')}</span>
            </button>

            <button
              type="button"
              onClick={() => setPreference('metro')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px] text-center whitespace-normal leading-tight ${
                preference === 'metro'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md ring-2 ring-cyan-400/40'
                  : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>{t('prefMetro')}</span>
            </button>

            <button
              type="button"
              onClick={() => setPreference('suburban')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px] text-center whitespace-normal leading-tight ${
                preference === 'suburban'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md ring-2 ring-cyan-400/40'
                  : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              <Train className="w-3.5 h-3.5 shrink-0" />
              <span>{t('prefSuburban')}</span>
            </button>
          </div>
        </div>

        {/* Popular Key Corridors (Fast 1-click links) */}
        <div className="pt-3 border-t border-slate-800 w-full min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Popular Commuter Routes:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full min-w-0">
            {/* Route 1: Central to Arakkonam */}
            <button
              type="button"
              onClick={() => {
                const c = stations.find((s) => s.id === 'SW01');
                const a = stations.find((s) => s.id === 'SW31');
                if (c && a) {
                  onOriginChange(c);
                  onDestinationChange(a);
                }
              }}
              className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-left transition-colors cursor-pointer group flex items-center justify-between gap-2 min-w-0 w-full"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase">West Line</div>
                <div className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                  Central (MMC) ➔ Arakkonam
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0" />
            </button>

            {/* Route 2: Pattabiram Defense Spur */}
            <button
              type="button"
              onClick={() => {
                const p = stations.find((s) => s.id === 'SW16');
                const d = stations.find((s) => s.id === 'SW17');
                if (p && d) {
                  onOriginChange(p);
                  onDestinationChange(d);
                }
              }}
              className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 text-left transition-colors cursor-pointer group flex items-center justify-between gap-2 min-w-0 w-full"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-teal-400 font-bold uppercase">Defense Spur</div>
                <div className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                  PTMS ⇄ PRES (Spur)
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 shrink-0" />
            </button>

            {/* Route 3: Beach to Chengalpattu */}
            <button
              type="button"
              onClick={() => {
                const b = stations.find((s) => s.id === 'SB01');
                const c = stations.find((s) => s.id === 'SB28');
                if (b && c) {
                  onOriginChange(b);
                  onDestinationChange(c);
                }
              }}
              className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-orange-500/50 text-left transition-colors cursor-pointer group flex items-center justify-between gap-2 min-w-0 w-full"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-orange-400 font-bold uppercase">South Line</div>
                <div className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                  Beach ➔ Chengalpattu
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-orange-400 shrink-0" />
            </button>

            {/* Route 4: Poonamallee to Lighthouse */}
            <button
              type="button"
              onClick={() => {
                const y1 = stations.find((s) => s.id === 'YL01');
                const y2 = stations.find((s) => s.id === 'YL28');
                if (y1 && y2) {
                  onOriginChange(y1);
                  onDestinationChange(y2);
                }
              }}
              className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-yellow-500/50 text-left transition-colors cursor-pointer group flex items-center justify-between gap-2 min-w-0 w-full"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-yellow-400 font-bold uppercase">Corridor 4 (Phase 2)</div>
                <div className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                  Poonamallee ➔ Lighthouse
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-yellow-400 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Route Results: Either Route Comparison or Step-by-Step Guidance */}
      {selectedOrigin && selectedDestination && (
        <div className="space-y-4">
          {/* View Mode Switcher (if options exist) */}
          {options.length > 0 && !isLoading && (
            <div className="flex flex-wrap items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-2xl gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setViewMode('comparison')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'comparison'
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Route Comparison ({options.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('guide')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'guide'
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Step-by-Step Guide</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'map'
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Google Map Route</span>
                </button>
              </div>

              {selectedOption && (
                <span className="text-[11px] font-mono text-cyan-400 hidden sm:inline">
                  {selectedOption.title} (~{selectedOption.estimated_duration_mins}m • ₹{selectedOption.fare_inr})
                </span>
              )}
            </div>
          )}

          {/* Mode 1: Route Comparison View */}
          {viewMode === 'comparison' && options.length > 0 && !isLoading && (
            <RouteComparisonView
              options={options}
              selectedOptionId={selectedOption?.id || null}
              onSelectOption={(opt) => {
                setSelectedOption(opt);
                setViewMode('guide');
              }}
              lines={lines}
              stations={stations}
              activeFilter={comparisonFilter}
              onFilterChange={setComparisonFilter}
              onEditJourney={handleEditJourney}
            />
          )}

          {/* Mode 2: Step-by-Step Journey Guide */}
          {(viewMode === 'guide' || ((isLoading || error) && viewMode !== 'map')) && (
            <VisualJourneyTimeline
              plan={selectedOption || (options.length > 0 ? options[0] : null)}
              isLoading={isLoading}
              error={error}
              lines={lines}
              stations={stations}
              onSwapDirection={handleSwap}
              onPlanAnother={() => {
                onOriginChange(null);
                onDestinationChange(null);
              }}
              onSelectStationModal={onSelectStationModal}
              onSaveToFavorites={() => {
                if (selectedOrigin && selectedDestination) {
                  handleToggleFavoriteJourney(selectedOrigin, selectedDestination);
                }
              }}
              isFavorited={isCurrentPairFavorited}
              onBackToComparison={options.length > 1 ? () => setViewMode('comparison') : undefined}
              onEditJourney={handleEditJourney}
              routeTitle={selectedOption?.title}
              rankingReason={selectedOption?.ranking_reason}
            />
          )}

          {/* Mode 3: Interactive Google Map Route View */}
          {viewMode === 'map' && options.length > 0 && !isLoading && (
            <div className="space-y-3">
              <div className="p-3 bg-cyan-950/60 border border-cyan-800/80 rounded-2xl flex items-center justify-between text-xs text-cyan-300">
                <div className="flex items-center gap-2">
                  <MapIcon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>
                    Geographic Route: <strong className="text-white">{selectedOption?.title || options[0].title}</strong> (~{(selectedOption || options[0]).total_distance_km} km • {(selectedOption || options[0]).stops_count} stations)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode('guide')}
                  className="px-2.5 py-1 bg-cyan-900 hover:bg-cyan-800 rounded-lg text-white font-bold transition cursor-pointer flex items-center gap-1 text-[11px]"
                >
                  <span>Step-by-Step Guide</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <TransitGoogleMap
                stations={stations}
                lines={lines}
                activeJourney={selectedOption || options[0]}
                onSelectStationModal={onSelectStationModal}
                height="560px"
                showSearch={false}
                showFilters={false}
                showLegend={true}
              />
            </div>
          )}
        </div>
      )}

      {/* Favorites & Recent Journeys Section */}
      <div className="w-full max-w-full min-w-0 box-border bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 lg:p-7 space-y-4 shadow-xl">
        {/* Navigation Tabs for Commute Storage */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveCommuteTab('recent_trips')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[36px] ${
                activeCommuteTab === 'recent_trips'
                  ? 'bg-cyan-500 text-slate-950 font-black'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Recent Searches ({recentTrips.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCommuteTab('saved_journeys')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[36px] ${
                activeCommuteTab === 'saved_journeys'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Favorite Routes ({favoriteJourneys.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCommuteTab('starred_stations')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[36px] ${
                activeCommuteTab === 'starred_stations'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Starred Stations ({favoriteStationIds.length})</span>
            </button>
          </div>

          {activeCommuteTab === 'recent_trips' && recentTrips.length > 0 && (
            <button
              type="button"
              onClick={handleClearRecent}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-red-300 bg-slate-950/80 hover:bg-red-950/40 border border-slate-800 hover:border-red-800/50 rounded-xl transition-colors cursor-pointer self-start sm:self-center"
              title="Clear all recent trips from local storage"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('clearRecentTrips')}</span>
            </button>
          )}
        </div>

        {/* Tab 1: Recent Trips */}
        {activeCommuteTab === 'recent_trips' && (
          <div>
            {recentTrips.length === 0 ? (
              <div className="p-6 text-center bg-slate-950/40 border border-slate-800/60 rounded-2xl space-y-1.5">
                <div className="inline-flex p-2.5 rounded-full bg-slate-900/80 text-slate-500 mb-1">
                  <History className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  {t('noRecentTrips')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {recentTrips.map((trip) => {
                  const isCurrentlyActive =
                    selectedOrigin?.id === trip.origin_id && selectedDestination?.id === trip.dest_id;
                  const origLineColor = getStationLineColor(trip.origin_line_id);
                  const destLineColor = getStationLineColor(trip.dest_line_id);

                  return (
                    <div
                      key={trip.id}
                      onClick={() => handleReRunTrip(trip, false)}
                      className={`group relative p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer border ${
                        isCurrentlyActive
                          ? 'bg-cyan-950/20 border-cyan-500/50 ring-1 ring-cyan-500/30'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/90'
                      }`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleReRunTrip(trip, false);
                        }
                      }}
                      title="Click to re-run this journey"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Origin ➔ Destination */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Origin station */}
                            <div className="inline-flex items-center gap-1.5 text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: origLineColor }}
                                aria-hidden="true"
                              />
                              <span className="truncate max-w-[180px] sm:max-w-xs">
                                {lang === 'ta' && trip.origin_name_ta ? trip.origin_name_ta : trip.origin_name}
                              </span>
                              {trip.origin_code && (
                                <span className="text-[11px] font-mono text-slate-400 font-normal">
                                  [{trip.origin_code}]
                                </span>
                              )}
                            </div>

                            <ArrowRight className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mx-0.5" />

                            {/* Destination station */}
                            <div className="inline-flex items-center gap-1.5 text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: destLineColor }}
                                aria-hidden="true"
                              />
                              <span className="truncate max-w-[180px] sm:max-w-xs">
                                {lang === 'ta' && trip.dest_name_ta ? trip.dest_name_ta : trip.dest_name}
                              </span>
                              {trip.dest_code && (
                                <span className="text-[11px] font-mono text-slate-400 font-normal">
                                  [{trip.dest_code}]
                                </span>
                              )}
                            </div>

                            {isCurrentlyActive && (
                              <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/70 border border-cyan-800/80 px-2 py-0.5 rounded-full ml-1">
                                Currently Active
                              </span>
                            )}
                          </div>

                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                            {trip.duration_mins !== undefined && (
                              <span className="font-mono text-slate-300 font-medium">
                                ~{trip.duration_mins} mins
                              </span>
                            )}
                            {trip.distance_km !== undefined && (
                              <>
                                <span aria-hidden="true" className="text-slate-600">·</span>
                                <span className="font-mono text-slate-300">
                                  {trip.distance_km} km
                                </span>
                              </>
                            )}
                            {trip.fare_inr !== undefined && (
                              <>
                                <span aria-hidden="true" className="text-slate-600">·</span>
                                <span className="font-mono text-emerald-400 font-medium">
                                  ₹{trip.fare_inr}
                                </span>
                              </>
                            )}
                            {trip.interchange_count !== undefined && (
                              <>
                                <span aria-hidden="true" className="text-slate-600">·</span>
                                <span className="text-slate-300">
                                  {trip.interchange_count === 0 ? 'Direct' : `${trip.interchange_count} transfer`}
                                </span>
                              </>
                            )}
                            {trip.timestamp && (
                              <>
                                <span aria-hidden="true" className="text-slate-600">·</span>
                                <span className="text-slate-500 text-[11px]">
                                  {formatRelativeTime(trip.timestamp)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReRunTrip(trip, false);
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/70 transition-colors cursor-pointer flex items-center gap-1"
                            title="Plan this journey again"
                          >
                            <span>Plan Again</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReRunTrip(trip, true);
                            }}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
                            title={t('reverseTrip')}
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleRemoveRecent(trip.id, e)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                            title="Remove from history"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Saved Favorite Routes */}
        {activeCommuteTab === 'saved_journeys' && (
          <div>
            {favoriteJourneys.length === 0 ? (
              <div className="p-6 text-center bg-slate-950/40 border border-slate-800/60 rounded-2xl space-y-1.5">
                <Star className="w-5 h-5 text-amber-400 mx-auto" />
                <p className="text-xs text-slate-300 font-bold">No favorite journeys saved yet</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Click the star icon on any calculated route to save it here for instant single-tap access.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {favoriteJourneys.map((fav) => (
                  <div
                    key={fav.id}
                    onClick={() => handleReRunFavoriteJourney(fav)}
                    className="p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-amber-500/50 transition cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-white truncate">
                          {fav.origin_name} ➔ {fav.dest_name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Added {formatRelativeTime(fav.added_at)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReRunFavoriteJourney(fav);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-800 text-xs font-bold cursor-pointer"
                      >
                        Plan
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveFavorite(fav.id, e)}
                        className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"
                        title="Remove from favorites"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Starred Stations */}
        {activeCommuteTab === 'starred_stations' && (
          <div>
            {favoriteStationObjects.length === 0 ? (
              <div className="p-6 text-center bg-slate-950/40 border border-slate-800/60 rounded-2xl space-y-1.5">
                <Bookmark className="w-5 h-5 text-amber-400 mx-auto" />
                <p className="text-xs text-slate-300 font-bold">No starred stations yet</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Star any station from the search dropdown, station details modal, or directory to quickly pin it here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {favoriteStationObjects.map((st) => (
                  <div
                    key={`fav-st-${st.id}`}
                    className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: getStationLineColor(st.line_id) }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-white truncate">{st.name}</div>
                        <div className="text-[10px] font-mono text-cyan-400">
                          {st.code} • {st.system_type}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOriginChange(st)}
                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold text-slate-300 hover:text-white cursor-pointer"
                        title="Set as departure station"
                      >
                        From
                      </button>
                      <button
                        type="button"
                        onClick={() => onDestinationChange(st)}
                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold text-slate-300 hover:text-white cursor-pointer"
                        title="Set as destination station"
                      >
                        To
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleFavoriteStation(st.id)}
                        className="p-1 text-amber-400 hover:text-slate-500 cursor-pointer"
                        title="Unstar station"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
