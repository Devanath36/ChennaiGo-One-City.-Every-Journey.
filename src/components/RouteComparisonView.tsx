import React from 'react';
import {
  Navigation,
  Train,
  Layers,
  Clock,
  IndianRupee,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowUpDown,
  Filter,
  Check
} from 'lucide-react';
import { JourneyOption, TransitLine, Station, TransportPreference } from '../types/transit.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface RouteComparisonViewProps {
  options: JourneyOption[];
  selectedOptionId: string | null;
  onSelectOption: (option: JourneyOption) => void;
  lines: TransitLine[];
  stations: Station[];
  activeFilter: 'all' | 'best' | 'fewest_transfers' | 'metro' | 'suburban';
  onFilterChange: (filter: 'all' | 'best' | 'fewest_transfers' | 'metro' | 'suburban') => void;
  onEditJourney?: () => void;
}

export const RouteComparisonView: React.FC<RouteComparisonViewProps> = ({
  options,
  selectedOptionId,
  onSelectOption,
  lines,
  stations,
  activeFilter,
  onFilterChange,
  onEditJourney
}) => {
  const { lang, t } = useLanguage();

  const lineMap = React.useMemo(() => {
    const map = new Map<string, TransitLine>();
    lines.forEach((l) => map.set(l.id, l));
    return map;
  }, [lines]);

  // Filter options based on active tab
  const filteredOptions = React.useMemo(() => {
    if (activeFilter === 'all') return options;
    if (activeFilter === 'fewest_transfers') {
      const minTransfers = Math.min(...options.map((o) => o.interchange_count));
      return options.filter((o) => o.interchange_count === minTransfers || o.tag === 'fewest_transfers');
    }
    if (activeFilter === 'metro') {
      const metroOpts = options.filter(
        (o) => o.tag === 'metro_preferred' || o.lines_used.some((l) => ['blue', 'green', 'purple', 'yellow', 'red'].includes(l))
      );
      return metroOpts.length > 0 ? metroOpts : options;
    }
    if (activeFilter === 'suburban') {
      const subOpts = options.filter(
        (o) => o.tag === 'suburban_preferred' || o.lines_used.some((l) => l.startsWith('suburban') || l === 'mrts')
      );
      return subOpts.length > 0 ? subOpts : options;
    }
    return options;
  }, [options, activeFilter]);

  const getTagBadgeStyles = (tag: string) => {
    switch (tag) {
      case 'recommended':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
      case 'fewest_transfers':
        return 'bg-purple-950/80 text-purple-300 border-purple-800';
      case 'metro_preferred':
        return 'bg-blue-950/80 text-blue-300 border-blue-800';
      case 'suburban_preferred':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'fastest':
      default:
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Header Toolbar & Route Comparison Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Compare Route Options</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-cyan-400">
                {filteredOptions.length} alternative{filteredOptions.length > 1 ? 's' : ''}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Ranked by travel duration, transfer convenience, and transit network preferences
            </p>
          </div>
        </div>

        {onEditJourney && (
          <button
            type="button"
            onClick={onEditJourney}
            className="self-start sm:self-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer flex items-center gap-1.5"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Edit Stations</span>
          </button>
        )}
      </div>

      {/* 2. Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-slate-500 font-semibold px-1 hidden sm:inline flex-shrink-0">
          Filter by:
        </span>
        <button
          type="button"
          onClick={() => onFilterChange('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer min-h-[36px] ${
            activeFilter === 'all'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <span>All Available Routes</span>
          <span className="text-[10px] opacity-80">({options.length})</span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('fewest_transfers')}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer min-h-[36px] ${
            activeFilter === 'fewest_transfers'
              ? 'bg-purple-500 text-white shadow-md font-black'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Fewest Transfers</span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('metro')}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer min-h-[36px] ${
            activeFilter === 'metro'
              ? 'bg-blue-500 text-white shadow-md font-black'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Metro Preferred</span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('suburban')}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer min-h-[36px] ${
            activeFilter === 'suburban'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Train className="w-3.5 h-3.5" />
          <span>Local Train Preferred</span>
        </button>
      </div>

      {/* 3. Route Cards Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredOptions.map((opt, index) => {
          const isSelected = selectedOptionId === opt.id;
          const isDirect = opt.interchange_count === 0;

          return (
            <div
              key={opt.id}
              onClick={() => onSelectOption(opt)}
              className={`p-5 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 shadow-lg group ${
                isSelected
                  ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-cyan-500 ring-2 ring-cyan-500/30'
                  : 'bg-slate-900/90 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getTagBadgeStyles(
                        opt.tag
                      )}`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{lang === 'ta' && opt.tag_label_ta ? opt.tag_label_ta : opt.tag_label}</span>
                    </span>

                    {/* Mode Types Badges */}
                    {opt.mode_types && (
                      <div className="flex items-center gap-1">
                        {opt.mode_types.map((mode) => (
                          <span
                            key={mode}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950 border border-slate-800 text-slate-300"
                          >
                            {mode}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-2.5 py-0.5 rounded-full">
                      <Check className="w-3.5 h-3.5" />
                      <span>Active Selection</span>
                    </span>
                  )}
                </div>

                {/* Route Title & Lines Used */}
                <div>
                  <h4 className="text-base sm:text-lg font-black text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2 flex-wrap">
                    <span>{lang === 'ta' && opt.title_ta ? opt.title_ta : opt.title}</span>
                  </h4>

                  {/* Lines Used Badges with Color Dots */}
                  <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                    {opt.lines_used.map((lid) => {
                      const lineObj = lineMap.get(lid);
                      return (
                        <span
                          key={lid}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-xs flex items-center gap-1"
                          style={{ backgroundColor: lineObj?.color || '#0284c7' }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          <span>{lineObj?.short_name || lid.toUpperCase()}</span>
                        </span>
                      );
                    })}

                    <span className="text-[11px] text-slate-400 font-medium pl-1">
                      {isDirect ? '• Direct single-seat ride' : `• ${opt.interchange_count} transfer`}
                    </span>
                  </div>
                </div>

                {/* Key Numbers Grid */}
                <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block font-medium">Duration</span>
                    <span className="text-sm font-black text-white font-mono">~{opt.estimated_duration_mins}m</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block font-medium">Fare</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">₹{opt.fare_inr}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block font-medium">Transfers</span>
                    <span className="text-sm font-black text-white font-mono">
                      {isDirect ? '0' : opt.interchange_count}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block font-medium">Stops</span>
                    <span className="text-sm font-black text-white font-mono">{opt.stops_count}</span>
                  </div>
                </div>

                {/* Ranking Criteria Explanation Rationale Box */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 text-xs text-slate-300 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Why this route:
                  </span>
                  <p className="leading-relaxed">
                    {lang === 'ta' && opt.ranking_reason_ta ? opt.ranking_reason_ta : opt.ranking_reason}
                  </p>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  {opt.total_distance_km} km distance
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectOption(opt);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md'
                      : 'bg-slate-800 hover:bg-cyan-600 text-white'
                  }`}
                >
                  <span>{isSelected ? 'View Guide' : 'Select Route'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
