import React, { useState } from 'react';
import {
  Navigation,
  Train,
  ArrowRight,
  ArrowLeft,
  ArrowUpDown,
  Clock,
  IndianRupee,
  Layers,
  Compass,
  AlertTriangle,
  Hammer,
  Info,
  ChevronDown,
  ChevronUp,
  MapPin,
  RotateCcw,
  Star,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { JourneyPlan, TransitLine, Station } from '../types/transit.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface VisualJourneyTimelineProps {
  plan: JourneyPlan | null;
  isLoading: boolean;
  error?: string | null;
  lines: TransitLine[];
  stations: Station[];
  onSwapDirection?: () => void;
  onPlanAnother?: () => void;
  onReturnToNetwork?: () => void;
  onSelectStationModal?: (station: Station) => void;
  onSaveToFavorites?: (origin: Station, dest: Station) => void;
  isFavorited?: boolean;
  onBackToComparison?: () => void;
  onEditJourney?: () => void;
  routeTitle?: string;
  rankingReason?: string;
}

export const VisualJourneyTimeline: React.FC<VisualJourneyTimelineProps> = ({
  plan,
  isLoading,
  error,
  lines,
  stations,
  onSwapDirection,
  onPlanAnother,
  onReturnToNetwork,
  onSelectStationModal,
  onSaveToFavorites,
  isFavorited = false,
  onBackToComparison,
  onEditJourney,
  routeTitle,
  rankingReason
}) => {
  const { lang, t } = useLanguage();

  // Expanded intermediate stops view
  const [showAllIntermediate, setShowAllIntermediate] = useState<boolean>(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <div>
          <h3 className="text-base font-bold text-white">Calculating Verified Transit Route</h3>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing timetable connections across Metro, Suburban Railway, and MRTS networks...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-700/60 rounded-3xl text-xs text-red-200 space-y-3 shadow-xl">
        <div className="flex items-center gap-2 text-sm font-bold text-red-300">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>Route Calculation Notice</span>
        </div>
        <p className="leading-relaxed text-red-300/90">{error}</p>
        {onPlanAnother && (
          <button
            onClick={onPlanAnother}
            className="px-3.5 py-1.5 bg-red-900/60 hover:bg-red-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Another Route</span>
          </button>
        )}
      </div>
    );
  }

  // Empty state before route is calculated
  if (!plan) {
    return null;
  }

  // Extract legs from steps (legs change when line_id changes or is_transfer is true)
  const steps = plan.steps || [];
  const originStation = plan.origin;
  const destStation = plan.destination;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
      {/* Back to Route Comparison Bar */}
      {onBackToComparison && (
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <button
            type="button"
            onClick={onBackToComparison}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-800/80 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Route Comparison</span>
          </button>

          {onEditJourney && (
            <button
              type="button"
              onClick={onEditJourney}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Edit Journey</span>
            </button>
          )}
        </div>
      )}

      {/* 1. Header & Actions Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <Navigation className="w-3.5 h-3.5" />
              <span>Step-by-Step Commuter Guide</span>
            </div>
            {routeTitle && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                {routeTitle}
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex flex-wrap items-center gap-2">
            <span>{lang === 'ta' && originStation.name_ta ? originStation.name_ta : originStation.name}</span>
            <ArrowRight className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <span>{lang === 'ta' && destStation.name_ta ? destStation.name_ta : destStation.name}</span>
          </h2>

          {/* Lines Used Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {plan.lines_used.map((lid) => {
              const lineInfo = lines.find((l) => l.id === lid);
              return (
                <span
                  key={lid}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-sm flex items-center gap-1.5"
                  style={{ backgroundColor: lineInfo?.color || '#0284c7' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                  <span>{lineInfo?.short_name || lid.toUpperCase()}</span>
                </span>
              );
            })}
          </div>

          {rankingReason && (
            <p className="text-xs text-slate-400 pt-1 leading-relaxed">
              <strong className="text-slate-300">Route Feature:</strong> {rankingReason}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          {onSwapDirection && (
            <button
              onClick={onSwapDirection}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
              title="Reverse origin and destination"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Swap Direction</span>
            </button>
          )}

          {onSaveToFavorites && (
            <button
              onClick={() => onSaveToFavorites(originStation, destStation)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                isFavorited
                  ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                  : 'bg-slate-950 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
              }`}
              title={isFavorited ? 'Saved in Favourites' : 'Save to Quick Commute'}
            >
              <Star className={`w-3.5 h-3.5 ${isFavorited ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>{isFavorited ? 'Saved' : 'Save'}</span>
            </button>
          )}

          {onReturnToNetwork && (
            <button
              onClick={onReturnToNetwork}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80 text-cyan-300 transition flex items-center gap-1.5 cursor-pointer"
              title="View on 2D Rail Diagram"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Explore on Diagram</span>
            </button>
          )}

          {onPlanAnother && (
            <button
              onClick={onPlanAnother}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
              title="Reset and plan another route"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Search</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>{t('estimatedDuration')}</span>
          </div>
          <p className="text-xl font-black text-white font-mono">
            ~{plan.estimated_duration_mins} mins
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>{t('totalDistance')}</span>
          </div>
          <p className="text-xl font-black text-white font-mono">
            {plan.total_distance_km} km
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <IndianRupee className="w-4 h-4 text-emerald-400" />
            <span>{t('estimatedFare')}</span>
          </div>
          <p className="text-xl font-black text-emerald-400 font-mono">
            ₹{plan.fare_inr}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Navigation className="w-4 h-4 text-purple-400" />
            <span>{t('transfers')}</span>
          </div>
          <p className="text-xl font-black text-white font-mono">
            {plan.interchange_count === 0 ? 'Direct Route' : `${plan.interchange_count} change${plan.interchange_count > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* 3. Direction and Stop Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              {t('directionOfTravel')}
            </span>
            <span className="font-bold text-white text-sm">
              {lang === 'ta' && plan.direction_ta ? plan.direction_ta : plan.direction || `Towards ${destStation.name}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Train className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              {t('intermediateStopsCount')}
            </span>
            <span className="font-bold text-emerald-400 text-sm font-mono">
              {plan.intermediate_stops_count ?? Math.max(0, plan.stops_count - 2)} intermediate stops
            </span>
          </div>
        </div>
      </div>

      {/* 4. Special Infrastructure Notices */}
      {!plan.is_fully_operational && (
        <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl text-xs text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <Hammer className="w-4 h-4" />
            <span>{t('upcomingNotice')}</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {plan.notice}
          </p>
          {plan.alternative_note && (
            <div className="pt-2 border-t border-amber-500/20">
              <span className="font-bold text-amber-300">{t('operationalAlternative')}: </span>
              <span className="text-slate-300 leading-relaxed">{plan.alternative_note}</span>
            </div>
          )}
        </div>
      )}

      {plan.notice && plan.notice.includes('Pattabiram') && (
        <div className="p-4 bg-teal-950/40 border border-teal-500/40 rounded-2xl text-xs text-teal-200 space-y-1">
          <div className="flex items-center gap-2 font-bold text-teal-300">
            <Train className="w-4 h-4" />
            <span>{t('pattabiramTrainConnection')} • Pattabiram Spur Rail Service</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {plan.notice}
          </p>
        </div>
      )}

      {/* 5. Step-by-Step Vertical Visual Timeline */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Visual Route Progression</span>
          </h3>

          <button
            onClick={() => setShowAllIntermediate((prev) => !prev)}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition cursor-pointer"
          >
            <span>{showAllIntermediate ? 'Compact Summary' : 'View All Stops'}</span>
            {showAllIntermediate ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Timeline Line */}
        <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
          {steps.map((step, idx) => {
            const isStart = idx === 0;
            const isEnd = idx === steps.length - 1;
            const isTransfer = step.is_transfer;
            const isIntermediate = !isStart && !isEnd && !isTransfer;

            // When in compact view, collapse non-transfer intermediate stations
            if (!showAllIntermediate && isIntermediate) {
              // Only render if previous station was not collapsed, show a collapsed badge
              const prevIsIntermediate = idx > 1 && !steps[idx - 1].is_transfer;
              if (prevIsIntermediate) return null;

              // Count consecutive intermediate stops
              let intermediateCount = 0;
              for (let j = idx; j < steps.length - 1 && !steps[j].is_transfer; j++) {
                intermediateCount++;
              }

              return (
                <div key={`collapsed-${idx}`} className="relative group">
                  <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-slate-800 text-slate-400 ring-4 ring-slate-900">
                    ···
                  </div>
                  <button
                    onClick={() => setShowAllIntermediate(true)}
                    className="w-full text-left p-3 rounded-2xl bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/60 hover:border-slate-700 transition flex items-center justify-between text-xs text-slate-400 cursor-pointer"
                  >
                    <span>Pass through {intermediateCount} intermediate stations</span>
                    <span className="text-cyan-400 font-semibold flex items-center gap-1">
                      <span>Expand</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </div>
              );
            }

            return (
              <div key={idx} className="relative group">
                {/* Timeline node */}
                <div
                  className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-4 ring-slate-900 ${
                    isStart
                      ? 'bg-cyan-500'
                      : isEnd
                      ? 'bg-emerald-500'
                      : isTransfer
                      ? 'bg-purple-500 ring-purple-900'
                      : 'bg-slate-700'
                  }`}
                >
                  {isStart ? 'A' : isEnd ? 'B' : isTransfer ? '⇄' : idx + 1}
                </div>

                {/* Step Card */}
                <div
                  className={`p-4 rounded-2xl transition-all border ${
                    isTransfer
                      ? 'bg-purple-950/20 border-purple-500/40'
                      : isStart || isEnd
                      ? 'bg-slate-950/80 border-slate-700'
                      : 'bg-slate-950/60 border-slate-800/80 group-hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: step.line_color }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const s = stations.find((st) => st.id === step.station_id);
                          if (s && onSelectStationModal) onSelectStationModal(s);
                        }}
                        className="text-sm font-bold text-white hover:text-cyan-400 transition-colors text-left cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg px-1 py-0.5"
                        title="View detailed station facilities"
                      >
                        <span>{lang === 'ta' && step.station_name_ta ? step.station_name_ta : step.station_name}</span>
                        <MapPin className="w-3 h-3 text-cyan-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      {idx > 0 && (
                        <span>+{step.distance_from_prev} km (~{step.time_from_prev}m)</span>
                      )}
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                        style={{ backgroundColor: step.line_color }}
                      >
                        {step.line_name}
                      </span>
                    </div>
                  </div>

                  {/* Instruction description */}
                  <p className="text-xs text-slate-300 font-medium mt-1">
                    {step.instruction || (isTransfer ? `Transfer to ${step.line_name}` : isStart ? `Board at ${step.station_name}` : `Arrive at ${step.station_name}`)}
                  </p>

                  {step.status !== 'operational' && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Phase II Under Construction
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Static Timetable Notice */}
      <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-start gap-2.5 text-xs text-slate-400">
        <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-300">Timetable Notice:</strong> Route sequence and interchange paths are verified against Chennai Metro Rail Limited (CMRL) and Southern Railway alignments. Always check real-time service announcements at stations before boarding.
        </p>
      </div>
    </div>
  );
};
