import React from 'react';
import {
  Train,
  Navigation,
  MapPin,
  Clock,
  IndianRupee,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { Station, TransitLine } from '../types/transit.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface MRTSViewProps {
  lines: TransitLine[];
  stations: Station[];
  onSelectStation: (station: Station) => void;
  onSetOrigin: (station: Station) => void;
  onSetDestination: (station: Station) => void;
  onNavigateToPlanner: (origin?: Station, dest?: Station) => void;
}

export const MRTSView: React.FC<MRTSViewProps> = ({
  lines,
  stations,
  onSelectStation,
  onSetOrigin,
  onSetDestination,
  onNavigateToPlanner
}) => {
  const { lang, t } = useLanguage();

  const mrtsLine = lines.find((l) => l.id === 'mrts') || lines.find((l) => l.system_type === 'MRTS');
  const mrtsStations = stations.filter((s) => s.line_id === 'mrts');

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 border border-purple-900/40 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950 border border-purple-800 text-xs font-bold text-purple-300">
              <Train className="w-3.5 h-3.5 text-orange-400" />
              <span>Mass Rapid Transit System (MRTS)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {t('navMRTS')} — {lang === 'ta' ? 'சென்னை பறக்கும் ரயில்' : 'Chennai Elevated MRTS'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              India's pioneering elevated railway line running from Chennai Beach to Velachery along the Buckingham Canal, connecting Mylapore, Chepauk, and South Chennai IT corridors.
            </p>
          </div>

          <button
            onClick={() => {
              if (mrtsStations.length >= 2) {
                onNavigateToPlanner(mrtsStations[0], mrtsStations[mrtsStations.length - 1]);
              } else {
                onNavigateToPlanner();
              }
            }}
            className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-all cursor-pointer self-start md:self-center"
          >
            <Navigation className="w-4 h-4" />
            <span>{t('planJourney')}</span>
          </button>
        </div>
      </div>

      {/* Corridor Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-orange-400 uppercase tracking-wider">
              Elevated Rapid Transit Corridor
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Chennai Beach ↔ Velachery
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {mrtsStations.length} Verified Elevated Stations • 19.34 km Route Length • Southern Railway
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 self-start sm:self-center">
            OPERATIONAL SERVICE
          </span>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              <span>Timings & Headway</span>
            </div>
            <p className="text-sm font-semibold text-white">04:15 AM — 23:15 PM</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trains run every 10–15 minutes between Chennai Beach and Velachery terminal.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
              <IndianRupee className="w-4 h-4" />
              <span>Affordable Fares</span>
            </div>
            <p className="text-sm font-semibold text-white font-mono">₹5 (0-10 km) • ₹10 (10+ km)</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Second-class suburban railway fare structure applicable across all MRTS elevated stations.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
              <Navigation className="w-4 h-4" />
              <span>Strategic Interchanges</span>
            </div>
            <p className="text-sm font-semibold text-white">Beach, Fort, Park Town, Thirumayilai</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Direct skywalks to Chennai Central & Park, with upcoming integration to Phase 2 Metro at Thirumayilai.
            </p>
          </div>
        </div>

        {/* Complete Station Sequence */}
        <div className="pt-4 space-y-3">
          <h3 className="text-base font-bold text-white tracking-tight">
            Complete Station Sequence (Chennai Beach to Velachery)
          </h3>

          <div className="space-y-3">
            {mrtsStations.map((station, idx) => (
              <div
                key={station.id}
                className="p-4 bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 text-white shadow-sm">
                    {idx + 1}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onSelectStation(station)}
                        className="text-base font-bold text-white group-hover:text-orange-400 transition-colors text-left cursor-pointer"
                      >
                        {lang === 'ta' && station.name_ta ? station.name_ta : station.name}
                      </button>
                      {station.code && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
                          {station.code}
                        </span>
                      )}
                    </div>

                    {lang === 'ta' && station.name_ta && (
                      <p className="text-xs text-slate-400">{station.name}</p>
                    )}
                    {lang === 'en' && station.name_ta && (
                      <p className="text-xs text-slate-400">{station.name_ta}</p>
                    )}

                    {station.is_interchange ? (
                      <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                        <Navigation className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{station.interchange_info || 'Interchange Hub'}</span>
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onSelectStation(station)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                  >
                    {t('details')}
                  </button>
                  <button
                    onClick={() => onSetOrigin(station)}
                    className="px-3 py-1.5 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-800 text-xs font-bold text-purple-300 transition-colors cursor-pointer"
                  >
                    {t('planFromHere')}
                  </button>
                  <button
                    onClick={() => onSetDestination(station)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                  >
                    {t('setAsDestination')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
