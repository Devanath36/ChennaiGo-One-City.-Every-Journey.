import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Clock,
  Train,
  ArrowRight,
  ShieldCheck,
  Hammer,
  Navigation,
  Compass,
  Zap,
  Car,
  Bus,
  Accessibility,
  Building2,
  Calendar,
  Star
} from 'lucide-react';
import { Station, TransitLine } from '../types/transit.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { isFavoriteStation, toggleFavoriteStation } from '../services/api.ts';
import { TransitGoogleMap } from './TransitGoogleMap.tsx';

interface StationDetailModalProps {
  station: Station | null;
  lines: TransitLine[];
  onClose: () => void;
  onSetOrigin: (station: Station) => void;
  onSetDestination: (station: Station) => void;
}

export const StationDetailModal: React.FC<StationDetailModalProps> = ({
  station,
  lines,
  onClose,
  onSetOrigin,
  onSetDestination
}) => {
  const { lang, t } = useLanguage();
  const [isFav, setIsFav] = useState<boolean>(false);

  useEffect(() => {
    if (station) {
      setIsFav(isFavoriteStation(station.id));
    }
  }, [station]);

  const handleToggleFav = () => {
    if (!station) return;
    const updated = toggleFavoriteStation(station.id);
    setIsFav(updated.includes(station.id));
  };

  if (!station) return null;

  const line = lines.find((l) => l.id === station.line_id);
  const isOperational = station.status === 'operational';
  const lineColor = station.line_color || line?.color || '#0284c7';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Header with Line Color Bar */}
        <div
          className="h-3 w-full rounded-t-3xl"
          style={{ backgroundColor: lineColor }}
        />

        {/* Top Action Buttons (Favorite Star & Close) */}
        <div className="absolute top-5 right-5 flex items-center gap-2">
          <button
            onClick={handleToggleFav}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isFav
                ? 'bg-amber-950/80 text-amber-300 border border-amber-600/60'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-amber-400'
            }`}
            title={isFav ? 'Remove from favorite stations' : 'Save to favorite stations'}
            aria-label={isFav ? 'Remove from favorite stations' : 'Save to favorite stations'}
          >
            <Star className={`w-5 h-5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer"
            aria-label={t('close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Station Title & Line Info */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className="px-2.5 py-1 rounded-md text-xs font-bold text-white font-mono flex items-center gap-1.5 shadow-sm"
                style={{ backgroundColor: lineColor }}
              >
                <Train className="w-3.5 h-3.5" />
                <span>{station.line_short_name || line?.short_name || station.line_id.toUpperCase()}</span>
              </span>

              <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">
                {station.system_type}
              </span>

              <span
                className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${
                  isOperational
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isOperational ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t('statusOperational')}</span>
                  </>
                ) : (
                  <>
                    <Hammer className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('statusUnderConstruction')}</span>
                  </>
                )}
              </span>

              {station.code && (
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono font-bold text-slate-400 border border-slate-700">
                  CODE: {station.code}
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {lang === 'ta' && station.name_ta ? station.name_ta : station.name}
            </h2>
            {lang === 'ta' && station.name_ta && (
              <p className="text-sm font-medium text-slate-400 mt-0.5">{station.name}</p>
            )}
            {lang === 'en' && station.name_ta && (
              <p className="text-sm font-medium text-slate-400 mt-0.5">{station.name_ta}</p>
            )}
          </div>

          {/* Pattabiram Spur Connection Notice */}
          {(station.id === 'SW16' || station.id === 'SW17') && (
            <div className="p-4 bg-teal-950/40 border border-teal-500/40 rounded-2xl flex items-start gap-3 text-teal-200 text-xs leading-relaxed">
              <Train className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-teal-300">Pattabiram Spur Railway Train Connection</p>
                <p className="mt-0.5 text-slate-300">
                  {t('pattabiramConnectionNotice')}
                </p>
              </div>
            </div>
          )}

          {/* Construction / Upcoming Notice */}
          {!isOperational && (
            <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-start gap-3 text-amber-200 text-xs leading-relaxed">
              <Hammer className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300">Phase II Upcoming Corridor</p>
                <p className="mt-0.5 text-slate-300">
                  {station.target_completion || 'Under Construction by CMRL.'} Passenger revenue service is not yet open on this station. Timetable schedules and journey steps are verified planning benchmarks.
                </p>
              </div>
            </div>
          )}

          {/* Key Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('zone')}</span>
              </div>
              <p className="text-xs font-semibold text-white truncate">{station.zone || 'Chennai Metro Area'}</p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('platforms')}</span>
              </div>
              <p className="text-xs font-semibold text-white">{station.platform_count || 2} Platforms</p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('operatingHours')}</span>
              </div>
              <p className="text-xs font-semibold text-white font-mono">
                {station.line_operating_hours || line?.operating_hours || '05:00 - 23:00'}
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('peakHeadway')}</span>
              </div>
              <p className="text-xs font-semibold text-white font-mono">
                {station.headway_peak || line?.headway_peak
                  ? `${station.headway_peak || line?.headway_peak} mins`
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Timings & Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Timetable Schedules</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">{t('firstTrain')}:</span>
                  <p className="font-semibold text-white font-mono">{station.first_train || '05:00'}</p>
                </div>
                <div>
                  <span className="text-slate-500">{t('lastTrain')}:</span>
                  <p className="font-semibold text-white font-mono">{station.last_train || '23:00'}</p>
                </div>
                <div>
                  <span className="text-slate-500">{t('peakHeadway')}:</span>
                  <p className="font-semibold text-cyan-400 font-mono">
                    {station.headway_peak || line?.headway_peak || 5}m (Peak)
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">{t('offPeakHeadway')}:</span>
                  <p className="font-semibold text-slate-300 font-mono">
                    {station.headway_offpeak || line?.headway_offpeak || 10}m (Normal)
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>{t('coordinates')}</span>
              </h4>
              <p className="text-xs font-mono text-slate-300">
                {station.lat.toFixed(5)}° N, {station.lon.toFixed(5)}° E
              </p>
              {station.interchange_info ? (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{station.is_interchange ? t('interchangeConnections') : 'Connectivity & Transfer Note'}:</span>
                  </span>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {station.interchange_info}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Standard stop on line corridor.</p>
              )}
            </div>
          </div>

          {/* Verified Station Facilities */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('facilities')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div
                className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                  station.has_parking
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>{t('facilityParking')}</span>
              </div>

              <div
                className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                  station.has_feeder_bus
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                <Bus className="w-4 h-4" />
                <span>{t('facilityFeederBus')}</span>
              </div>

              <div
                className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                  station.has_wheelchair
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                <Accessibility className="w-4 h-4" />
                <span>{t('facilityWheelchair')}</span>
              </div>

              <div
                className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                  station.has_lifts
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>{t('facilityLifts')}</span>
              </div>
            </div>
          </div>

          {/* Geographic Location on Google Maps */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Geographic Location (Google Maps)</span>
              </span>
              <span className="font-mono text-[11px] text-cyan-400">
                {station.lat.toFixed(4)}°N, {station.lon.toFixed(4)}°E
              </span>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-md">
              <TransitGoogleMap
                stations={[station]}
                lines={lines}
                selectedStation={station}
                height="220px"
                compactMode={true}
                showSearch={false}
                showFilters={false}
                showLegend={false}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => {
                onSetOrigin(station);
                onClose();
              }}
              className="py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>{t('planFromHere')}</span>
            </button>

            <button
              onClick={() => {
                onSetDestination(station);
                onClose();
              }}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700"
            >
              <ArrowRight className="w-4 h-4" />
              <span>{t('setAsDestination')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
