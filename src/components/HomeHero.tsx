import React, { useState, useRef } from 'react';
import {
  Navigation,
  Train,
  Layers,
  Sparkles,
  ShieldCheck,
  Hammer,
  Clock,
  IndianRupee,
  Search,
  ArrowRight,
  ArrowUpDown,
  Compass,
  AlertTriangle,
  Send,
  Loader2,
  CheckCircle2,
  HelpCircle,
  Info,
  MapPin,
  Map as MapIcon,
  RotateCcw,
  Zap
} from 'lucide-react';
import { TransitLine, Station, JourneyPlan, TransportPreference } from '../types/transit.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { queryJourneyAssistant, planJourney } from '../services/api.ts';
import { NetworkSchematic2D, NetworkViewMode } from './NetworkSchematic2D.tsx';
import { TransitGoogleMap } from './TransitGoogleMap.tsx';
import { VisualJourneyTimeline } from './VisualJourneyTimeline.tsx';
import { QuickCommuteSection } from './QuickCommuteSection.tsx';
import { SmartStationSearch } from './SmartStationSearch.tsx';

interface HomeHeroProps {
  lines: TransitLine[];
  stations: Station[];
  onNavigateTab: (tab: 'home' | 'metro' | 'stations' | 'planner' | 'map' | 'suburban' | 'mrts' | 'settings') => void;
  onSelectStation: (station: Station) => void;
  onPlanTrip: (origin: Station, destination: Station, preference?: TransportPreference) => void;
  onSetOrigin?: (station: Station) => void;
  onSetDestination?: (station: Station) => void;
}

export const HomeHero: React.FC<HomeHeroProps> = ({
  lines,
  stations,
  onNavigateTab,
  onSelectStation,
  onPlanTrip,
  onSetOrigin,
  onSetDestination
}) => {
  const { lang, t } = useLanguage();

  // Quick Journey Form state
  const [quickOriginId, setQuickOriginId] = useState<string>('');
  const [quickDestId, setQuickDestId] = useState<string>('');
  const [quickPreference, setQuickPreference] = useState<TransportPreference>('best');

  // In-homepage calculated Journey Plan
  const [homePlan, setHomePlan] = useState<JourneyPlan | null>(null);
  const [homePlanLoading, setHomePlanLoading] = useState<boolean>(false);
  const [homePlanError, setHomePlanError] = useState<string | null>(null);
  const [isHomePlanFavorited, setIsHomePlanFavorited] = useState<boolean>(false);

  // Section anchor references for smooth scrolling
  const timelineRef = useRef<HTMLDivElement>(null);
  const schematicRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Active schematic view mode state ('metro' | 'suburban_mrts' | 'full')
  const [schematicViewMode, setSchematicViewMode] = useState<NetworkViewMode>('metro');
  const [displayNetworkType, setDisplayNetworkType] = useState<'schematic' | 'google_map'>('schematic');

  // Handle switching schematic mode and smooth scrolling to the 2D diagram
  const handleExploreNetworkMode = (mode: NetworkViewMode) => {
    setDisplayNetworkType('schematic');
    setSchematicViewMode(mode);
    setTimeout(() => {
      schematicRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Smart Assistant state
  const [assistantInput, setAssistantInput] = useState<string>('');
  const [assistantLoading, setAssistantLoading] = useState<boolean>(false);
  const [assistantResult, setAssistantResult] = useState<{
    success: boolean;
    matched_origin?: Station;
    matched_destination?: Station;
    plan?: JourneyPlan;
    error?: string;
  } | null>(null);

  // Helper to record recent station in localStorage
  const recordRecentStation = (stId: string) => {
    try {
      const raw = localStorage.getItem('chennai_transit_recent_stations_v1');
      const list: string[] = raw ? JSON.parse(raw) : [];
      const updated = [stId, ...list.filter((id) => id !== stId)].slice(0, 8);
      localStorage.setItem('chennai_transit_recent_stations_v1', JSON.stringify(updated));
    } catch {}
  };

  // Quick Search Handler (runs directly in-page and scrolls to timeline)
  const handleQuickSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickOriginId || !quickDestId) return;

    if (quickOriginId === quickDestId) {
      setHomePlanError(t('sameStationError'));
      setHomePlan(null);
      return;
    }

    const orig = stations.find((s) => s.id === quickOriginId);
    const dest = stations.find((s) => s.id === quickDestId);
    if (!orig || !dest) return;

    setHomePlanLoading(true);
    setHomePlanError(null);
    setIsHomePlanFavorited(false);

    try {
      const res = await planJourney(orig.id, dest.id, quickPreference);
      setHomePlan(res);
      recordRecentStation(orig.id);
      recordRecentStation(dest.id);

      // Smooth scroll down to the Visual Journey Timeline
      setTimeout(() => {
        timelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setHomePlanError(err.message || t('noRouteFound'));
      setHomePlan(null);
    } finally {
      setHomePlanLoading(false);
    }
  };

  // Swap Stations in the search form
  const handleSwapStations = () => {
    const temp = quickOriginId;
    setQuickOriginId(quickDestId);
    setQuickDestId(temp);
  };

  // In-timeline Swap Direction
  const handleSwapHomeJourney = async () => {
    if (!homePlan) return;
    const tempO = homePlan.destination;
    const tempD = homePlan.origin;
    setQuickOriginId(tempO.id);
    setQuickDestId(tempD.id);
    setHomePlanLoading(true);
    setHomePlanError(null);
    try {
      const res = await planJourney(tempO.id, tempD.id, quickPreference);
      setHomePlan(res);
    } catch (err: any) {
      setHomePlanError(err.message || t('noRouteFound'));
    } finally {
      setHomePlanLoading(false);
    }
  };

  // In-timeline Plan Another
  const handlePlanAnother = () => {
    setHomePlan(null);
    setHomePlanError(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // In-timeline Return to 2D Network Explorer
  const handleReturnToNetwork = () => {
    schematicRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Toggle favorite for calculated journey
  const handleSaveToFavorites = (orig: Station, dest: Station) => {
    try {
      const raw = localStorage.getItem('chennai_transit_fav_journeys_v1');
      const list: Array<{ id: string; origId: string; destId: string; origName: string; destName: string }> = raw
        ? JSON.parse(raw)
        : [];
      const exists = list.some((j) => j.origId === orig.id && j.destId === dest.id);
      let updated;
      if (exists) {
        updated = list.filter((j) => !(j.origId === orig.id && j.destId === dest.id));
        setIsHomePlanFavorited(false);
      } else {
        updated = [
          ...list,
          {
            id: `${orig.id}-${dest.id}`,
            origId: orig.id,
            destId: dest.id,
            origName: orig.name,
            destName: dest.name
          }
        ];
        setIsHomePlanFavorited(true);
      }
      localStorage.setItem('chennai_transit_fav_journeys_v1', JSON.stringify(updated));
    } catch {}
  };

  // Direct Plan Trip from Quick Commute or Schematic (runs directly on homepage)
  const handleExecuteTrip = async (origin: Station, dest: Station, preference: TransportPreference = 'best') => {
    setQuickOriginId(origin.id);
    setQuickDestId(dest.id);
    setQuickPreference(preference);
    setHomePlanLoading(true);
    setHomePlanError(null);
    setIsHomePlanFavorited(false);

    try {
      const res = await planJourney(origin.id, dest.id, preference);
      setHomePlan(res);
      recordRecentStation(origin.id);
      recordRecentStation(dest.id);

      // Smooth scroll to the result timeline
      setTimeout(() => {
        timelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setHomePlanError(err.message || t('noRouteFound'));
      setHomePlan(null);
    } finally {
      setHomePlanLoading(false);
    }
  };

  // Smart Assistant Query
  const handleAssistantSubmit = async (customQuery?: string) => {
    const query = (customQuery !== undefined ? customQuery : assistantInput).trim();
    if (!query) return;

    if (customQuery !== undefined) {
      setAssistantInput(customQuery);
    }

    setAssistantLoading(true);
    setAssistantResult(null);

    try {
      const res = await queryJourneyAssistant(query, 'best');
      setAssistantResult(res);
    } catch (err: any) {
      setAssistantResult({
        success: false,
        error: 'Unable to reach transport assistant. Please try again.'
      });
    } finally {
      setAssistantLoading(false);
    }
  };

  // Featured Journey trigger: Chennai Central to Poonamallee
  const handleFeaturedJourneyClick = () => {
    const central = stations.find((s) => s.id === 'GL01' || s.id === 'BL13');
    const poonamallee = stations.find(
      (s) => s.id === 'YL01' || s.id === 'YL28' || s.name.toLowerCase().includes('poonamallee')
    );

    if (central && poonamallee) {
      handleExecuteTrip(central, poonamallee, 'best');
    } else {
      onNavigateTab('planner');
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-200">
      {/* 1. Hero Title & Journey Planner Card */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
        {/* Subtle decorative rail track background line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-amber-500 opacity-60" />

        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-xs font-bold text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Multi-Modal Transit Guide for Chennai</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            {lang === 'ta' ? 'சென்னையில் சுலபமாக பயணிக்கலாம்' : 'Navigate Chennai Public Transit with Ease'}
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
            {lang === 'ta'
              ? 'சென்னை மெட்ரோ, தெற்கு ரயில்வே புறநகர் மற்றும் பறக்கும் ரயில் (MRTS) நெட்வொர்க்குகளுக்கான துல்லியமான பயண வழிகாட்டி மற்றும் நிலைய விவரங்கள்.'
              : 'Discover verified routes across Chennai Metro (Phase I & II), Southern Railway Suburban trains, and MRTS with accurate timetables, interchange guidance, and zero sign-in.'}
          </p>

          {/* Master Commuter Navigation Shortcuts */}
          <div className="pt-4 flex flex-wrap gap-2.5 items-center w-full min-w-0">
            {/* Shortcut 1: Plan a Journey */}
            <button
              type="button"
              onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              className="px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-cyan-950/40 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{lang === 'ta' ? 'பயணத்தை திட்டமிடுங்கள்' : 'Plan a Journey'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Shortcut 2: Explore Metro */}
            <button
              type="button"
              onClick={() => handleExploreNetworkMode('metro')}
              className="px-3.5 py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-cyan-800/60 hover:border-cyan-500 text-cyan-300 hover:text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lang === 'ta' ? 'மெட்ரோ நெட்வொர்க்' : 'Explore Metro'}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            {/* Shortcut 3: Explore Suburban + MRTS */}
            <button
              type="button"
              onClick={() => handleExploreNetworkMode('suburban_mrts')}
              className="px-3.5 py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-emerald-800/60 hover:border-emerald-500 text-emerald-300 hover:text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <Train className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'ta' ? 'புறநகர் + MRTS' : 'Explore Suburban + MRTS'}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            {/* Shortcut 4: Explore Full Network */}
            <button
              type="button"
              onClick={() => handleExploreNetworkMode('full')}
              className="px-3.5 py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-purple-800/60 hover:border-purple-500 text-purple-300 hover:text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            >
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              <span>{lang === 'ta' ? 'முழு நெட்வொர்க்' : 'Explore Full Network'}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            {/* Shortcut 5: Find a Station */}
            <button
              type="button"
              onClick={() => onNavigateTab('stations')}
              className="px-3.5 py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'ta' ? 'நிலையத்தை தேடுங்கள்' : 'Find a Station'}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            {/* Shortcut 6: Live Google Map */}
            <button
              type="button"
              onClick={() => {
                setDisplayNetworkType('google_map');
                setTimeout(() => {
                  schematicRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-cyan-950/90 hover:bg-cyan-900/90 border border-cyan-500/60 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer min-h-[40px] shadow-sm shadow-cyan-950/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <MapIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lang === 'ta' ? 'கூகுள் வரைபடம்' : 'Live Google Map'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Quick Search Form */}
        <form
          ref={formRef}
          onSubmit={handleQuickSearch}
          className="mt-8 w-full max-w-full min-w-0 box-border bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Navigation className="w-4 h-4 text-cyan-400" />
              <span>{t('searchRoutes')}</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {stations.length} Verified Stations Available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center w-full min-w-0">
            {/* Origin Smart Search */}
            <div className="md:col-span-5 w-full min-w-0">
              <SmartStationSearch
                label={t('originStation')}
                placeholder={lang === 'ta' ? 'புறப்படும் நிலையம் அல்லது குறியீடு...' : 'Departure station, code (e.g. MAS, Airport)...'}
                selectedStation={stations.find((s) => s.id === quickOriginId) || null}
                onSelectStation={(st) => setQuickOriginId(st ? st.id : '')}
                stations={stations}
                lines={lines}
                idPrefix="home-quick-orig"
              />
            </div>

            {/* Swap Button */}
            <div className="md:col-span-1 flex items-center justify-center py-1 md:pt-5">
              <button
                type="button"
                onClick={handleSwapStations}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                title={t('swap')}
                aria-label={t('swap')}
              >
                <ArrowUpDown className="w-4 h-4 md:rotate-90 text-cyan-400" />
              </button>
            </div>

            {/* Destination Smart Search */}
            <div className="md:col-span-5 w-full min-w-0">
              <SmartStationSearch
                label={t('destinationStation')}
                placeholder={lang === 'ta' ? 'சேருமிடம் அல்லது குறியீடு...' : 'Destination station, code (e.g. TBM, CGL)...'}
                selectedStation={stations.find((s) => s.id === quickDestId) || null}
                onSelectStation={(st) => setQuickDestId(st ? st.id : '')}
                stations={stations}
                lines={lines}
                idPrefix="home-quick-dest"
              />
            </div>

            {/* Submit Button */}
            <div className="md:col-span-1 flex items-end pt-1 md:pt-5 w-full min-w-0">
              <button
                type="submit"
                disabled={!quickOriginId || !quickDestId || homePlanLoading}
                className="w-full p-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer shadow-md shadow-cyan-900/30 min-h-[42px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                title={t('searchRoutes')}
                aria-label={t('searchRoutes')}
              >
                {homePlanLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Preference Row with Responsive Wrapping */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 w-full min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto min-w-0">
              <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider shrink-0">
                {t('routePreference')}:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 w-full sm:w-auto min-w-0">
                {(['best', 'metro', 'suburban'] as TransportPreference[]).map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => setQuickPreference(pref)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center whitespace-normal leading-tight min-h-[38px] flex items-center justify-center ${
                      quickPreference === pref
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <span>
                      {pref === 'best' && t('prefBest')}
                      {pref === 'metro' && t('prefMetro')}
                      {pref === 'suburban' && t('prefSuburban')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('planner')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 transition cursor-pointer self-end sm:self-auto shrink-0 py-1"
            >
              <span>{t('plannerTitle')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </section>

      {/* 2. Visual Journey Timeline (Rendered after user searches a route) */}
      <div ref={timelineRef}>
        {(homePlan || homePlanLoading || homePlanError) && (
          <VisualJourneyTimeline
            plan={homePlan}
            isLoading={homePlanLoading}
            error={homePlanError}
            lines={lines}
            stations={stations}
            onSwapDirection={handleSwapHomeJourney}
            onPlanAnother={handlePlanAnother}
            onReturnToNetwork={handleReturnToNetwork}
            onSelectStationModal={onSelectStation}
            onSaveToFavorites={handleSaveToFavorites}
            isFavorited={isHomePlanFavorited}
          />
        )}
      </div>

      {/* 3. Section B: EXPLORE CHENNAI'S TRANSIT NETWORK & INTERACTIVE 2D DIAGRAM */}
      <section className="space-y-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-xs font-bold text-cyan-400 mb-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>Multi-Modal Rail System</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {lang === 'ta' ? 'சென்னையின் போக்குவரத்து நெட்வொர்க்கை ஆராயுங்கள்' : "Explore Chennai's Transit Network"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            {lang === 'ta'
              ? 'மெட்ரோ, புறநகர் மின்சார ரயில்கள் அல்லது முழுமையான ஒருங்கிணைந்த வரைபடத்தைத் தேர்ந்தெடுக்கவும்'
              : 'Select a transit network mode below to explore verified corridors, stations, and interchange hubs in the high-contrast 2D schematic diagram.'}
          </p>
        </div>

        {/* 3 Entry Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Explore Metro */}
          <div
            onClick={() => handleExploreNetworkMode('metro')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleExploreNetworkMode('metro');
              }
            }}
            className={`p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
              schematicViewMode === 'metro'
                ? 'bg-slate-900 border-cyan-500 ring-1 ring-cyan-500/50 shadow-lg shadow-cyan-950/40'
                : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/60 hover:bg-slate-900'
            }`}
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {lang === 'ta' ? 'மெட்ரோ நெட்வொர்க்' : 'Explore Metro'}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    5 Lines
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Blue & Green operational lines, plus Phase 2 priority corridors (Yellow, Purple & Red) with junction hubs.
                </p>
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-cyan-400">
              <span>{lang === 'ta' ? 'வரைபடத்தில் காண்க' : 'Explore on Schematic'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Explore Suburban + MRTS */}
          <div
            onClick={() => handleExploreNetworkMode('suburban_mrts')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleExploreNetworkMode('suburban_mrts');
              }
            }}
            className={`p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
              schematicViewMode === 'suburban_mrts'
                ? 'bg-slate-900 border-emerald-500 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-950/40'
                : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900'
            }`}
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Train className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {lang === 'ta' ? 'புறநகர் ரயில் + MRTS' : 'Explore Suburban + MRTS'}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    5 Corridors
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Southern Railway North, South, West Lines, West–South Link (13 stns), and Beach–Velachery elevated MRTS.
                </p>
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span>{lang === 'ta' ? 'வரைபடத்தில் காண்க' : 'Explore on Schematic'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Explore Full Network */}
          <div
            onClick={() => handleExploreNetworkMode('full')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleExploreNetworkMode('full');
              }
            }}
            className={`p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
              schematicViewMode === 'full'
                ? 'bg-slate-900 border-purple-500 ring-1 ring-purple-500/50 shadow-lg shadow-purple-950/40'
                : 'bg-slate-900/80 border-slate-800 hover:border-purple-500/60 hover:bg-slate-900'
            }`}
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors">
                    {lang === 'ta' ? 'முழு நெட்வொர்க்' : 'Explore Full Network'}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                    All Modes
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Unified multi-modal metropolitan map with layer toggles for Metro, Suburban Rail, and MRTS with transfer hubs.
                </p>
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-purple-400">
              <span>{lang === 'ta' ? 'வரைபடத்தில் காண்க' : 'Explore on Schematic'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Network Exploration (2D Schematic / Google Map) */}
      <div ref={schematicRef} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                {lang === 'ta' ? 'சென்னை நெட்வொர்க் வரைபடம்' : 'Chennai Transit Network Explorer'}
              </span>
              <p className="text-[11px] text-slate-400">
                {displayNetworkType === 'schematic'
                  ? 'High-clarity schematic diagram with collision-aware labels and pan/zoom'
                  : 'Real-world geographic alignment powered by Google Maps Platform'}
              </p>
            </div>
          </div>

          {/* Segmented View Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setDisplayNetworkType('schematic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                displayNetworkType === 'schematic'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2D Schematic Diagram</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayNetworkType('google_map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                displayNetworkType === 'google_map'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Live Google Map</span>
            </button>
          </div>
        </div>

        {displayNetworkType === 'schematic' ? (
          <NetworkSchematic2D
            lines={lines}
            stations={stations}
            initialViewMode={schematicViewMode}
            onSelectStationModal={onSelectStation}
            onSetOriginForPlanner={(st) => {
              setQuickOriginId(st.id);
              formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            onSetDestinationForPlanner={(st) => {
              setQuickDestId(st.id);
              formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            onPlanTrip={handleExecuteTrip}
          />
        ) : (
          <TransitGoogleMap
            lines={lines}
            stations={stations}
            onSelectStationModal={onSelectStation}
            onSetOrigin={(st) => {
              setQuickOriginId(st.id);
              formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            onSetDestination={(st) => {
              setQuickDestId(st.id);
              formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            onPlanTrip={handleExecuteTrip}
            height="650px"
          />
        )}
      </div>

      {/* 4. Section D: SMART COMMUTER SHORTCUTS ("Quick Commute") */}
      <QuickCommuteSection
        stations={stations}
        onPlanTrip={handleExecuteTrip}
        onSetOrigin={(st) => {
          setQuickOriginId(st.id);
          formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
        onSetDestination={(st) => {
          setQuickDestId(st.id);
          formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      />

      {/* 5. Smart Transport Assistant Section: "Where do you want to go?" */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {t('assistantTitle')}
            </h2>
            <p className="text-xs text-slate-400">
              {t('assistantSubtitle')}
            </p>
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={assistantInput}
              onChange={(e) => setAssistantInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAssistantSubmit()}
              placeholder={t('assistantPlaceholder')}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>
          <button
            onClick={() => handleAssistantSubmit()}
            disabled={assistantLoading || !assistantInput.trim()}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-cyan-900/30"
          >
            {assistantLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{t('assistantButton')}</span>
          </button>
        </div>

        {/* Quick Example Queries */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          <span className="text-slate-500 font-semibold">{t('assistantExamples')}</span>
          {[
            'Chennai Central to Poonamallee',
            'Airport to Chennai Central',
            'Guindy to Chennai Egmore',
            'Chennai Beach to Velachery',
            'Tambaram to Vadapalani'
          ].map((sample) => (
            <button
              key={sample}
              onClick={() => handleAssistantSubmit(sample)}
              className="px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px]"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Assistant Response Card */}
        {assistantResult && (
          <div className="mt-4 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-in fade-in">
            {assistantResult.success && assistantResult.plan ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-bold text-white">
                      {assistantResult.matched_origin?.name} ➔ {assistantResult.matched_destination?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span>{assistantResult.plan.total_distance_km} km</span>
                    <span>•</span>
                    <span className="text-cyan-400 font-bold">~{assistantResult.plan.estimated_duration_mins} mins</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">₹{assistantResult.plan.fare_inr}</span>
                  </div>
                </div>

                {/* Construction Warning if any */}
                {assistantResult.plan.notice && (
                  <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
                    <Hammer className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-300">Phase II Upcoming Route Notice</p>
                      <p className="mt-0.5 text-slate-300 leading-relaxed">{assistantResult.plan.notice}</p>
                    </div>
                  </div>
                )}

                {/* Step-by-Step Directions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t('assistantInstruction')}
                  </h4>
                  <div className="space-y-2 text-xs">
                    {assistantResult.plan.steps
                      .filter((s, idx) => idx === 0 || s.is_transfer || idx === assistantResult.plan!.steps.length - 1)
                      .map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
                          <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-white">
                              {step.instruction || step.station_name}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Line: {step.line_name} • Station: {step.station_name}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Alternative note if applicable */}
                {assistantResult.plan.alternative_note && (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300">
                    <span className="font-bold text-cyan-400 block mb-1">
                      {t('operationalAlternative')}:
                    </span>
                    <p className="leading-relaxed text-slate-300">{assistantResult.plan.alternative_note}</p>
                  </div>
                )}

                {/* 1-click open in full planner */}
                <button
                  onClick={() => {
                    if (assistantResult.matched_origin && assistantResult.matched_destination) {
                      handleExecuteTrip(assistantResult.matched_origin, assistantResult.matched_destination);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span>{t('openInPlanner')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{assistantResult.error || t('noRouteFound')}</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 6. Featured Example: Chennai Central to Poonamallee */}
      <section className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-600/30 rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wide">
              Featured Journey Guide
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {t('featuredTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {t('featuredSubtitle')}
            </p>
          </div>

          <button
            onClick={handleFeaturedJourneyClick}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg shadow-amber-900/20 cursor-pointer self-start sm:self-center"
          >
            <span>{t('planThisJourney')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Step-by-Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                STEP 1 • OPERATIONAL
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">Green Line</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {t('featuredStep1')}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                STEP 2 • INTERCHANGE
              </span>
              <span className="text-xs font-mono font-bold text-purple-400">Vadapalani Hub</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {t('featuredStep2')}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                STEP 3 • UPCOMING PHASE 2
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">Yellow Line (C-4)</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {t('featuredStep3')}
            </p>
          </div>
        </div>

        {/* Operational Alternative Notice */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 text-xs text-slate-300 space-y-1">
          <span className="font-bold text-amber-300 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{t('operationalAlternative')}:</span>
          </span>
          <p className="leading-relaxed text-slate-400">
            {t('featuredAlternative')}
          </p>
        </div>
      </section>

      {/* 7. Three Transport Categories Navigation Cards */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Explore Chennai Public Transport Categories
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Three distinct transport modes operating across the metropolitan area
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Metro Network Card */}
          <div
            onClick={() => onNavigateTab('metro')}
            className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-cyan-500/60 transition-all cursor-pointer group space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                {t('categoryMetro')}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                5 Corridors: Blue & Green (Operational), Yellow (Priority Phase 2), Purple & Red (Under Construction).
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-cyan-400">
              <span>{t('viewStations')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Suburban Local Trains Card */}
          <div
            onClick={() => onNavigateTab('suburban')}
            className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/60 transition-all cursor-pointer group space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Train className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                {t('categorySuburban')}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Southern Railway South Line (Beach to Chengalpattu, 28 Stns) & West Line (Central MMC to Arakkonam, 31 Stns) EMU services.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span>{t('viewStations')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* MRTS Card */}
          <div
            onClick={() => onNavigateTab('mrts')}
            className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-purple-500/60 transition-all cursor-pointer group space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                <Train className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                {t('categoryMRTS')}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Elevated rapid rail line from Chennai Beach to Velachery with direct city center and IT corridor links.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-purple-400">
              <span>{t('viewStations')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 8. Live Service Status & Timetable Metadata Banner */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <h3 className="text-base font-bold text-white">
                {t('liveStatusTitle')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('liveStatusSubtitle')}
              </p>
            </div>
          </div>

          <span className="text-xs font-mono text-slate-400">
            Timetable verified: Daily 05:00 - 23:00
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {t('serviceOperationalText')}
        </p>

        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 text-[11px] text-slate-500 leading-relaxed">
          {t('staticNoticeText')}
        </div>
      </section>
    </div>
  );
};
