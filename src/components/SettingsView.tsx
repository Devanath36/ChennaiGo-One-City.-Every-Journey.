import React, { useState, useEffect } from 'react';
import {
  Settings,
  Languages,
  Check,
  RotateCcw,
  Database,
  ShieldCheck,
  HardDrive,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Copy,
  Search,
  Filter,
  Eye,
  Train,
  Bus,
  Layers,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { getOfflineCacheStatus, clearOfflineCache, fetchDataSources } from '../services/api.ts';
import { TransitDataSource, SourceCategory } from '../types/transit.ts';

interface SettingsViewProps {
  onRefreshData: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefreshData }) => {
  const { lang, setLang, t } = useLanguage();
  const [cacheStatus, setCacheStatus] = useState(getOfflineCacheStatus());
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  // Accordion state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    language: true,
    sources: true,
    transparency: false,
    accessibility: false,
    cache: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Data Sources State
  const [sources, setSources] = useState<TransitDataSource[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sourceSearch, setSourceSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Accessibility State (persisted in localStorage)
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('chennai_transit_high_contrast') === 'true';
  });
  const [reducedMotion, setReducedMotion] = useState(() => {
    return localStorage.getItem('chennai_transit_reduced_motion') === 'true';
  });
  const [largeFont, setLargeFont] = useState(() => {
    return localStorage.getItem('chennai_transit_font_scale') === 'large';
  });

  useEffect(() => {
    let isMounted = true;
    fetchDataSources().then((data) => {
      if (isMounted) {
        setSources(data);
        setSourcesLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    localStorage.setItem('chennai_transit_high_contrast', String(next));
    if (next) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };

  const handleToggleReducedMotion = () => {
    const next = !reducedMotion;
    setReducedMotion(next);
    localStorage.setItem('chennai_transit_reduced_motion', String(next));
    if (next) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  };

  const handleToggleFontScale = (scale: 'normal' | 'large') => {
    setLargeFont(scale === 'large');
    localStorage.setItem('chennai_transit_font_scale', scale);
    if (scale === 'large') {
      document.documentElement.classList.add('text-large');
    } else {
      document.documentElement.classList.remove('text-large');
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2500);
      });
    } else {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshSuccess(false);
    try {
      clearOfflineCache();
      await onRefreshData();
      const updatedSources = await fetchDataSources();
      setSources(updatedSources);
      setCacheStatus(getOfflineCacheStatus());
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 3500);
    } catch (e) {
      console.error('Failed refreshing cache:', e);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter sources
  const filteredSources = sources.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    const q = sourceSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.organization.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.supports_data.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const categoryChips: { id: string; label: string; count: number }[] = [
    { id: 'all', label: t('sourcesFilterAll'), count: sources.length },
    { id: 'metro', label: t('sourcesFilterMetro'), count: sources.filter((s) => s.category === 'metro').length },
    { id: 'suburban_north', label: t('sourcesFilterSuburbanNorth'), count: sources.filter((s) => s.category === 'suburban_north').length },
    { id: 'suburban_south', label: t('sourcesFilterSuburbanSouth'), count: sources.filter((s) => s.category === 'suburban_south').length },
    { id: 'suburban_west', label: t('sourcesFilterSuburbanWest'), count: sources.filter((s) => s.category === 'suburban_west').length },
    { id: 'suburban_west_south', label: t('sourcesFilterSuburbanWestSouth'), count: sources.filter((s) => s.category === 'suburban_west_south').length },
    { id: 'mrts', label: t('sourcesFilterMRTS'), count: sources.filter((s) => s.category === 'mrts').length },
    { id: 'bus', label: t('sourcesFilterBus'), count: sources.filter((s) => s.category === 'bus').length },
    { id: 'general', label: t('sourcesFilterGeneral'), count: sources.filter((s) => s.category === 'general').length }
  ];

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'metro':
        return 'text-sky-400 border-sky-800/60 bg-sky-950/40';
      case 'suburban_north':
        return 'text-amber-400 border-amber-800/60 bg-amber-950/40';
      case 'suburban_south':
        return 'text-emerald-400 border-emerald-800/60 bg-emerald-950/40';
      case 'suburban_west':
        return 'text-blue-400 border-blue-800/60 bg-blue-950/40';
      case 'suburban_west_south':
        return 'text-rose-400 border-rose-800/60 bg-rose-950/40';
      case 'mrts':
        return 'text-purple-400 border-purple-800/60 bg-purple-950/40';
      case 'bus':
        return 'text-orange-400 border-orange-800/60 bg-orange-950/40';
      default:
        return 'text-cyan-400 border-cyan-800/60 bg-cyan-950/40';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-xs font-bold text-cyan-400">
          <Settings className="w-3.5 h-3.5" />
          <span>Application Settings & Data Governance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {t('settingsTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
          {t('settingsSubtitle')}
        </p>
      </div>

      {/* SECTION 1: LANGUAGE SETTINGS */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden transition-all shadow-lg">
        <button
          onClick={() => toggleSection('language')}
          className="w-full p-6 sm:p-8 flex items-center justify-between text-left hover:bg-slate-850/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 min-h-[44px]"
          aria-expanded={expandedSections.language}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{t('settingsSectionLanguage')}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300">
                  {lang === 'en' ? 'English' : 'தமிழ்'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">{t('languageDesc')}</p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
              expandedSections.language ? 'rotate-180 text-cyan-400' : ''
            }`}
          />
        </button>

        {expandedSections.language && (
          <div className="px-6 pb-6 sm:px-8 sm:pb-8 pt-0 border-t border-slate-800/60 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {/* English Option */}
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`p-5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  lang === 'en'
                    ? 'bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/30 text-white'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <span className="text-sm font-bold block">English</span>
                  <span className="text-xs text-slate-400">Standard English interface & Romanized station codes</span>
                </div>
                {lang === 'en' ? (
                  <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-slate-950 shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border border-slate-700 shrink-0" />
                )}
              </button>

              {/* Tamil Option */}
              <button
                type="button"
                onClick={() => setLang('ta')}
                className={`p-5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  lang === 'ta'
                    ? 'bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/30 text-white'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <span className="text-sm font-bold block font-tamil">தமிழ் (Tamil)</span>
                  <span className="text-xs text-slate-400">முழுமையான தமிழ் இடைமுகம் & தமிழ் நிலையப் பெயர்கள்</span>
                </div>
                {lang === 'ta' ? (
                  <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-slate-950 shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border border-slate-700 shrink-0" />
                )}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: DATA SOURCES & RESEARCH REGISTRY */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden transition-all shadow-lg">
        <button
          onClick={() => toggleSection('sources')}
          className="w-full p-6 sm:p-8 flex items-center justify-between text-left hover:bg-slate-850/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 min-h-[44px]"
          aria-expanded={expandedSections.sources}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{t('settingsSectionSources')}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-700/50 text-purple-300">
                  {sources.length} Audited Portals
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Authoritative statutory references, railway working timetables, and official project reports
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
              expandedSections.sources ? 'rotate-180 text-purple-400' : ''
            }`}
          />
        </button>

        {expandedSections.sources && (
          <div className="px-6 pb-6 sm:px-8 sm:pb-8 pt-0 border-t border-slate-800/60 mt-2 space-y-5">
            {/* Search Input */}
            <div className="pt-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={sourceSearch}
                  onChange={(e) => setSourceSearch(e.target.value)}
                  placeholder={t('sourcesSearchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-400 min-h-[44px]"
                />
                {sourceSearch && (
                  <button
                    onClick={() => setSourceSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-2">
              {categoryChips.map((chip) => {
                const active = selectedCategory === chip.id;
                return (
                  <button
                    key={chip.id}
                    onClick={() => setSelectedCategory(chip.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[36px] flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                      active
                        ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        active ? 'bg-purple-800 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {chip.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sources List */}
            {sourcesLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading verified data sources registry...</div>
            ) : filteredSources.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800/60 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">No data sources matched your filter criteria.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSourceSearch('');
                  }}
                  className="text-xs text-purple-400 hover:underline"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 pt-1">
                {filteredSources.map((source) => {
                  const isCopied = copiedId === source.id;
                  const catClass = getCategoryColor(source.category);

                  return (
                    <div
                      key={source.id}
                      className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3.5 hover:border-slate-700 transition-colors"
                    >
                      {/* Top Row: Title + Badges */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${catClass}`}>
                              {source.category.replace('_', ' ').toUpperCase()}
                            </span>
                            {source.is_official ? (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-800/60 bg-emerald-950/40 text-emerald-400 flex items-center gap-1">
                                <FileCheck className="w-3 h-3" />
                                <span>{t('statusOfficial')}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800/60 text-slate-300">
                                {t('statusThirdParty')}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 font-medium">
                              {t('lastVerifiedOn')}: <strong className="text-slate-300">{source.last_verified}</strong>
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-white tracking-tight pt-0.5">
                            {source.title}
                          </h3>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(source.specific_page_url || source.url, source.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                            title={t('copySourceLink')}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">{t('copied')}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>{t('copySourceLink')}</span>
                              </>
                            )}
                          </button>

                          <a
                            href={source.specific_page_url || source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-purple-600/90 hover:bg-purple-600 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                          >
                            <span>{t('openSource')}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Organization & Description */}
                      <div className="text-xs space-y-1.5">
                        <div className="text-slate-400">
                          <span className="text-slate-500">Authority:</span>{' '}
                          <span className="text-slate-300 font-semibold">{source.organization}</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {source.description}
                        </p>
                      </div>

                      {/* Supports Data Box */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 text-xs space-y-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{t('supportsDataLabel')}</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
                          {source.supports_data}
                        </p>
                      </div>

                      {source.notes && (
                        <div className="text-[11px] text-slate-500 italic">
                          Note: {source.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* SECTION 3: DATA TRANSPARENCY & NETWORK INTEGRITY AUDIT */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden transition-all shadow-lg">
        <button
          onClick={() => toggleSection('transparency')}
          className="w-full p-6 sm:p-8 flex items-center justify-between text-left hover:bg-slate-850/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 min-h-[44px]"
          aria-expanded={expandedSections.transparency}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{t('settingsSectionVerification')}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300">
                  Strict Corroboration
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Segregation of revenue service corridors vs under-construction DPR masterplan alignments
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
              expandedSections.transparency ? 'rotate-180 text-emerald-400' : ''
            }`}
          />
        </button>

        {expandedSections.transparency && (
          <div className="px-6 pb-6 sm:px-8 sm:pb-8 pt-0 border-t border-slate-800/60 mt-2 space-y-4">
            <div className="pt-4 space-y-3 text-xs leading-relaxed text-slate-300">
              <p>
                Chennai Transit enforces strict data integrity rules. We do not invent fictional train frequencies, simulated radar beacons, or non-existent direct routes across disconnected lines.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-emerald-800/40 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Operational Revenue Network (Eligible for Route Finding)</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                    <li><strong>Blue Line (Corridor 1):</strong> Wimco Nagar Depot ↔ Airport (26 stations)</li>
                    <li><strong>Green Line (Corridor 2):</strong> Chennai Central ↔ St. Thomas Mount (17 stations)</li>
                    <li><strong>Suburban North Line:</strong> Chennai Central (MASS) ↔ Sullurupeta (22 stations)</li>
                    <li><strong>Suburban South Line:</strong> Chennai Beach ↔ Chengalpattu Junction (28 stations)</li>
                    <li><strong>Suburban West Line:</strong> Chennai Central (MASS) ↔ Arakkonam Junction (31 stations)</li>
                    <li><strong>West–South Link:</strong> Chengalpattu (CGL) ↔ Arakkonam (AJJ) via Kanchipuram (13 stations)</li>
                    <li><strong>MRTS Elevated:</strong> Chennai Beach ↔ Velachery (18 stations)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-amber-800/40 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Under Construction Phase II (Informational Only)</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Corridor 3 (Madhavaram–SIPCOT), Corridor 4 (Poonamallee–Lighthouse), and Corridor 5 (Madhavaram–Sholinganallur) are actively under civil construction by CMRL.
                  </p>
                  <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-[11px] text-amber-200">
                    <strong>Routing Safeguard:</strong> Unopened Phase II stations are cataloged for civic awareness and future planning, but are segregated from active Dijkstra journey calculations to prevent commuters from being directed to inactive tracks.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 4: ACCESSIBILITY & DISPLAY PREFERENCES */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden transition-all shadow-lg">
        <button
          onClick={() => toggleSection('accessibility')}
          className="w-full p-6 sm:p-8 flex items-center justify-between text-left hover:bg-slate-850/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 min-h-[44px]"
          aria-expanded={expandedSections.accessibility}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{t('settingsSectionAccessibility')}</span>
              </h2>
              <p className="text-xs text-slate-400">
                Visual comfort, contrast enhancements, and reduced motion settings
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
              expandedSections.accessibility ? 'rotate-180 text-blue-400' : ''
            }`}
          />
        </button>

        {expandedSections.accessibility && (
          <div className="px-6 pb-6 sm:px-8 sm:pb-8 pt-0 border-t border-slate-800/60 mt-2 space-y-4">
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* High Contrast Toggle */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-white block">{t('highContrast')}</span>
                  <span className="text-[11px] text-slate-400 block leading-relaxed">{t('highContrastDesc')}</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleHighContrast}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 min-h-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                    highContrast ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                  aria-pressed={highContrast}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      highContrast ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Reduced Motion Toggle */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-white block">{t('reducedMotion')}</span>
                  <span className="text-[11px] text-slate-400 block leading-relaxed">{t('reducedMotionDesc')}</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleReducedMotion}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 min-h-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                    reducedMotion ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                  aria-pressed={reducedMotion}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      reducedMotion ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Text Scaling */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-white block">{t('fontSize')}</span>
                  <span className="text-[11px] text-slate-400 block leading-relaxed">
                    Adjust base typographic scaling for comfortable readability on handheld devices.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleFontScale('normal')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer min-h-[36px] ${
                      !largeFont
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t('fontSizeNormal')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleFontScale('large')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer min-h-[36px] ${
                      largeFont
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t('fontSizeLarge')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 5: GENERAL & CACHE MANAGEMENT */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden transition-all shadow-lg">
        <button
          onClick={() => toggleSection('cache')}
          className="w-full p-6 sm:p-8 flex items-center justify-between text-left hover:bg-slate-850/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 min-h-[44px]"
          aria-expanded={expandedSections.cache}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{t('settingsSectionGeneral')}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-950/80 border border-teal-700/50 text-teal-300">
                  SQLite & LocalStorage
                </span>
              </h2>
              <p className="text-xs text-slate-400">{t('cacheDesc')}</p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
              expandedSections.cache ? 'rotate-180 text-teal-400' : ''
            }`}
          />
        </button>

        {expandedSections.cache && (
          <div className="px-6 pb-6 sm:px-8 sm:pb-8 pt-0 border-t border-slate-800/60 mt-2 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Storage Engine</span>
                <span className="font-bold text-teal-400">
                  {cacheStatus.isCached ? 'ACTIVE & CACHED' : 'INITIALIZING'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Cached Stations</span>
                <span className="font-bold text-white font-mono">{cacheStatus.stationCount}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-slate-500 block text-[11px]">Corridors Active</span>
                <span className="font-bold text-white font-mono">{cacheStatus.lineCount} Lines</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Purging & Reloading...' : t('clearAllCache')}</span>
              </button>

              {refreshSuccess && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{t('clearAllCacheSuccess')}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
