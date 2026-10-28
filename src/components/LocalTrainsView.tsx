import React, { useState, useMemo } from 'react';
import {
  Train,
  Navigation,
  MapPin,
  Clock,
  IndianRupee,
  ShieldCheck,
  ArrowRight,
  Compass,
  Layers,
  Search,
  X,
  Sparkles,
  Info,
  GitBranch,
  AlertCircle
} from 'lucide-react';
import { Station, TransitLine } from '../types/transit.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface LocalTrainsViewProps {
  lines: TransitLine[];
  stations: Station[];
  defaultCorridor?: string;
  onSelectStation: (station: Station) => void;
  onSetOrigin: (station: Station) => void;
  onSetDestination: (station: Station) => void;
  onNavigateToPlanner: (origin?: Station, dest?: Station) => void;
}

export const LocalTrainsView: React.FC<LocalTrainsViewProps> = ({
  lines,
  stations,
  defaultCorridor,
  onSelectStation,
  onSetOrigin,
  onSetDestination,
  onNavigateToPlanner
}) => {
  const { lang, t } = useLanguage();

  // Suburban lines: suburban_south & suburban_west
  const suburbanLines = lines.filter((l) => l.system_type === 'Suburban');
  const [selectedSuburbanLine, setSelectedSuburbanLine] = useState<string>(
    defaultCorridor || 'suburban_west'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeLine = suburbanLines.find((l) => l.id === selectedSuburbanLine) || suburbanLines[0];

  const isSouthLine = selectedSuburbanLine === 'suburban_south';
  const isWestLine = selectedSuburbanLine === 'suburban_west';
  const isNorthLine = selectedSuburbanLine === 'suburban_north';
  const isLinkLine = selectedSuburbanLine === 'suburban_west_south';

  // Filter stations strictly belonging to this corridor, ordered sequentially by verified corridor topology
  const rawLineStations = useMemo(() => {
    if (isLinkLine) {
      // West-South Link Corridor connects Chengalpattu Junction (SB28) to Arakkonam Junction (SW31) via Kanchipuram
      const cglStation = stations.find((s) => s.id === 'SB28');
      const ajjStation = stations.find((s) => s.id === 'SW31');
      const intermediate = stations
        .filter((s) => s.line_id === 'suburban_west_south')
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

      const orderedList: Station[] = [];
      if (cglStation) orderedList.push(cglStation);
      orderedList.push(...intermediate);
      if (ajjStation) orderedList.push(ajjStation);
      return orderedList;
    }

    return stations
      .filter((s) => s.line_id === selectedSuburbanLine)
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  }, [stations, selectedSuburbanLine, isLinkLine]);

  // Filter stations by user search query (name or code)
  const filteredStations = useMemo(() => {
    if (!searchQuery.trim()) return rawLineStations;
    const q = searchQuery.toLowerCase().trim();
    return rawLineStations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.name_ta && s.name_ta.toLowerCase().includes(q)) ||
        (s.code && s.code.toLowerCase().includes(q))
    );
  }, [rawLineStations, searchQuery]);

  const totalStationCount = rawLineStations.length;

  // Helper to compute adjacent stations for all suburban lines
  const getAdjacentStationInfo = (station: Station, index: number) => {
    if (isLinkLine) {
      if (station.id === 'SB28') {
        return {
          prev: null,
          next: 'Reddipalayam (RDY)',
          extra: 'Southern Terminus: Interchange with South Line & Mainline Trains'
        };
      }
      if (station.id === 'WS08') {
        return {
          prev: 'Nathapettai (NTT)',
          next: 'Kanchipuram (CJ)',
          extra: 'Heritage Temple Town Eastern Stop'
        };
      }
      if (station.id === 'WS09') {
        return {
          prev: 'Kanchipuram East (CJE)',
          next: 'Tirumalpur (TMLP)',
          extra: 'Major Hub: Historic Silk City & Temple District Center'
        };
      }
      if (station.id === 'WS10') {
        return {
          prev: 'Kanchipuram (CJ)',
          next: 'Takkolam (TKO)',
          extra: 'EMU Terminating Loop Hub (Direct Beach / MMC Services)'
        };
      }
      if (station.id === 'SW31') {
        return {
          prev: 'Melpakkam (MLPM)',
          next: null,
          extra: 'Western Terminus: Major Division Junction & West Line Interchange'
        };
      }
    }

    if (isWestLine) {
      // Special verified topology for Pattabiram area
      if (station.id === 'SW15') {
        // Pattabiram
        return {
          prev: 'Hindu College (HC)',
          next: 'Nemilichery (NEC) [Mainline]',
          extra: 'Spur Branch: Pattabiram Military Siding (PTMS)'
        };
      }
      if (station.id === 'SW16') {
        // Pattabiram Military Siding
        return {
          prev: 'Pattabiram (PAB) [Mainline Junction]',
          next: null,
          trainConnection: 'Pattabiram East Depot (PRES) [Dedicated Train Connection]'
        };
      }
      if (station.id === 'SW17') {
        // Pattabiram East Depot
        return {
          prev: null,
          next: null,
          trainConnection: 'Pattabiram Military Siding (PTMS) [Dedicated Train Connection]'
        };
      }
      if (station.id === 'SW18') {
        // Nemilichery
        return {
          prev: 'Pattabiram (PAB)',
          next: 'Thiruninravur (TI)'
        };
      }
    }

    if (isNorthLine) {
      if (station.id === 'SN01') {
        return {
          prev: null,
          next: 'Basin Bridge Junction (BBQ)',
          extra: 'Moore Market Complex: Interchange with Metro Blue/Green & Suburban West/South'
        };
      }
      if (station.id === 'SN02') {
        return {
          prev: 'Chennai Moore Market Complex (MASS)',
          next: 'Korukkupet (KOK)',
          extra: 'Interchange with Suburban West Line'
        };
      }
      if (station.id === 'SN06') {
        return {
          prev: 'V. O. C. Nagar (VOC)',
          next: 'Wimco Nagar (WCN)',
          extra: 'Interchange with Blue Line Metro (Tiruvottiyur)'
        };
      }
      if (station.id === 'SN07') {
        return {
          prev: 'Tiruvottiyur (TVT)',
          next: 'Kathivakkam (KAV)',
          extra: 'Interchange with Blue Line Metro (Wimco Nagar BL02)'
        };
      }
      if (station.id === 'SN17') {
        return {
          prev: 'Kavaraipettai (KVP)',
          next: 'Elavur (ELR)',
          extra: 'Major Terminating Hub & EMU Turnover Junction'
        };
      }
      if (station.id === 'SN22') {
        return {
          prev: 'Akkampet (AKAT)',
          next: null,
          extra: 'Northern Terminal (Interstate local to Andhra Pradesh)'
        };
      }
    }

    const prevSt = index > 0 ? rawLineStations[index - 1] : null;
    const nextSt = index < rawLineStations.length - 1 ? rawLineStations[index + 1] : null;

    return {
      prev: prevSt ? `${prevSt.name} (${prevSt.code})` : null,
      next: nextSt ? `${nextSt.name} (${nextSt.code})` : null
    };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Category Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <span className="text-slate-500">{t('categorySuburban')}</span>
        <span>→</span>
        <span
          className={
            isLinkLine
              ? 'text-rose-400 font-bold'
              : isNorthLine
              ? 'text-cyan-400 font-bold'
              : isWestLine
              ? 'text-emerald-400 font-bold'
              : 'text-orange-400 font-bold'
          }
        >
          {isLinkLine
            ? t('suburbanWestSouthTitle')
            : isNorthLine
            ? t('suburbanNorthTitle')
            : isWestLine
            ? t('suburbanWestTitle')
            : isSouthLine
            ? t('suburbanSouthTitle')
            : activeLine?.name}
        </span>
      </div>

      {/* Sub-Corridor Navigation Switcher Bar */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl">
        <button
          onClick={() => {
            setSelectedSuburbanLine('suburban_north');
            setSearchQuery('');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            isNorthLine
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-400/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Train className="w-4 h-4" />
          <span>{t('suburbanNorthTitle')}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-950/60 text-cyan-300 font-mono">
            22 Stations
          </span>
        </button>

        <button
          onClick={() => {
            setSelectedSuburbanLine('suburban_west');
            setSearchQuery('');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            isWestLine
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-400/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Train className="w-4 h-4" />
          <span>{t('suburbanWestTitle')}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-950/60 text-emerald-300 font-mono">
            31 Stations
          </span>
        </button>

        <button
          onClick={() => {
            setSelectedSuburbanLine('suburban_south');
            setSearchQuery('');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            isSouthLine
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/50 ring-1 ring-orange-400/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Train className="w-4 h-4" />
          <span>{t('suburbanSouthTitle')}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-950/60 text-orange-300 font-mono">
            28 Stations
          </span>
        </button>

        <button
          onClick={() => {
            setSelectedSuburbanLine('suburban_west_south');
            setSearchQuery('');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            isLinkLine
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50 ring-1 ring-rose-400/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Train className="w-4 h-4" />
          <span>{t('suburbanWestSouthTitle')}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-950/60 text-rose-300 font-mono">
            13 Stations
          </span>
        </button>
      </div>

      {/* Dedicated Suburban Header Banner */}
      <div
        className={`border rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl transition-colors ${
          isLinkLine
            ? 'bg-gradient-to-r from-rose-950/70 via-slate-900 to-slate-950 border-rose-900/50'
            : isNorthLine
            ? 'bg-gradient-to-r from-cyan-950/70 via-slate-900 to-slate-950 border-cyan-900/50'
            : isWestLine
            ? 'bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border-emerald-900/50'
            : 'bg-gradient-to-r from-orange-950/70 via-slate-900 to-slate-950 border-orange-900/40'
        }`}
      >
        <div
          className={`absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
            isLinkLine
              ? 'bg-rose-600/10'
              : isNorthLine
              ? 'bg-cyan-600/10'
              : isWestLine
              ? 'bg-emerald-600/10'
              : 'bg-orange-600/10'
          }`}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                isLinkLine
                  ? 'bg-rose-950/90 border border-rose-800 text-rose-400'
                  : isNorthLine
                  ? 'bg-cyan-950/90 border border-cyan-800 text-cyan-400'
                  : isWestLine
                  ? 'bg-emerald-950/90 border border-emerald-800 text-emerald-400'
                  : 'bg-orange-950/90 border border-orange-800 text-orange-400'
              }`}
            >
              <Train className="w-3.5 h-3.5" />
              <span>
                {isLinkLine
                  ? 'Southern Railway (SR) • Chennai Division • West–South Link Corridor'
                  : isNorthLine
                  ? 'Southern Railway (SR) • Chennai Division • Northern EMU Corridor'
                  : isWestLine
                  ? 'Southern Railway (SR) • Chennai Division • Western EMU Corridor'
                  : 'Southern Railway (SR) • Chennai Division • Southern EMU Corridor'}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {isLinkLine
                  ? t('suburbanWestSouthTitle')
                  : isNorthLine
                  ? t('suburbanNorthTitle')
                  : isWestLine
                  ? t('suburbanWestTitle')
                  : isSouthLine
                  ? t('suburbanSouthTitle')
                  : activeLine?.name}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  isLinkLine
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : isNorthLine
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    : isWestLine
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                }`}
              >
                {isLinkLine
                  ? t('suburbanWestSouthCounter')
                  : isNorthLine
                  ? t('suburbanNorthCounter')
                  : isWestLine
                  ? t('suburbanWestCounter')
                  : t('suburbanSouthCounter')}
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              {isLinkLine
                ? t('suburbanWestSouthSubtitle')
                : isNorthLine
                ? t('suburbanNorthSubtitle')
                : isWestLine
                ? t('suburbanWestSubtitle')
                : isSouthLine
                ? t('suburbanSouthSubtitle')
                : activeLine?.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {t('statusOperational')}
              </span>
              <span>•</span>
              <span>
                Route Distance:{' '}
                <strong className="text-white font-mono">
                  {activeLine?.total_km || (isLinkLine ? 67.2 : isNorthLine ? 82.5 : isWestLine ? 68.4 : 59.6)} km
                </strong>
              </span>
              <span>•</span>
              <span>
                Peak Frequency:{' '}
                <strong
                  className={
                    isLinkLine
                      ? 'text-rose-400 font-mono'
                      : isNorthLine
                      ? 'text-cyan-400 font-mono'
                      : isWestLine
                      ? 'text-emerald-400 font-mono'
                      : 'text-orange-400 font-mono'
                  }
                >
                  {isLinkLine ? '30-60 mins' : isNorthLine ? '12-25 mins' : isWestLine ? '10-15 mins' : '8-15 mins'}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 self-start md:self-center">
            <button
              onClick={() => onNavigateToPlanner()}
              className={`px-6 py-3.5 rounded-2xl text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                isLinkLine
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40'
                  : isNorthLine
                  ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-950/40'
                  : isWestLine
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40'
                  : 'bg-orange-600 hover:bg-orange-500 shadow-orange-950/40'
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>{t('planJourney')}</span>
            </button>
            <div className="px-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                Total Verified Stations
              </span>
              <span className="text-xl font-black text-white font-mono">
                {totalStationCount} Stations
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Special Feature Callout for North Line (Gummidipoondi Hub & Sullurupeta Reach) */}
      {isNorthLine && (
        <div className="p-5 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-700/50 rounded-3xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <GitBranch className="w-4 h-4" />
              <span>Suburban North Service Operations: Gummidipoondi Hub & Sullurupeta Reach</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500 text-slate-950 uppercase tracking-wider">
              EMU Operations Pattern
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {t('northLineServiceNotice')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <strong className="text-white">Gummidipoondi (GPD)</strong>
                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-cyan-400">Stop #17</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Major terminating hub, EMU turnover loops, and SIPCOT industrial estate center. Most suburban local trains from Moore Market Complex terminate and turn back here.
              </p>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <strong className="text-white">Sullurupeta (SPE)</strong>
                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-cyan-400">Stop #22</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Northern suburban terminus across the Andhra Pradesh border. Gateway to ISRO Satish Dhawan Space Centre (Sriharikota) & Pulicat Lake, served by scheduled through-EMUs and passenger shuttles.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Special Feature Callout for Pattabiram Spur (West Line Only) */}
      {isWestLine && (
        <div className="p-5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-700/50 rounded-3xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <GitBranch className="w-4 h-4" />
              <span>Special Railway Connection: Pattabiram Corridor & Spur</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 uppercase tracking-wider">
              {t('pattabiramTrainConnection')}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {t('pattabiramConnectionNotice')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <strong className="text-white">Pattabiram Military Siding (PTMS)</strong>
                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-emerald-400">Stop #16</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Spur branch station serving defense sector establishments. Connected via dedicated train connection to Pattabiram East Depot.
              </p>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <strong className="text-white">Pattabiram East Depot (PRES)</strong>
                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-emerald-400">Stop #17</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Spur terminal depot station. Connected via dedicated train connection to Pattabiram Military Siding.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Special Feature Callout for West-South Link Corridor (Kanchipuram & Tirumalpur) */}
      {isLinkLine && (
        <div className="p-5 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-950 border border-rose-700/50 rounded-3xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <GitBranch className="w-4 h-4" />
              <span>West–South Link Corridor: Kanchipuram Heritage Hub & Tirumalpur Operations</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-slate-950 uppercase tracking-wider">
              Corridor Operations
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {t('westSouthServiceNotice')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <strong className="text-white">Kanchipuram (CJ) & East (CJE)</strong>
                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-rose-400">Stops #8 & #9</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                World-renowned Silk City and temple heritage center. Connects pilgrims, tourists, and daily commuters with both Chennai Beach and Chennai Central via Chengalpattu & Arakkonam loops.
              </p>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <strong className="text-white">Tirumalpur (TMLP)</strong>
                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-rose-400">Stop #10</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Key suburban EMU turnaround hub. Designated origin/terminating point for several Chennai Beach – Tirumalpur – Arakkonam suburban local round-trip services.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Corridor Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
          <div
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
              isLinkLine
                ? 'text-rose-400'
                : isNorthLine
                ? 'text-cyan-400'
                : isWestLine
                ? 'text-emerald-400'
                : 'text-orange-400'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Operational Hours</span>
          </div>
          <p className="text-sm font-semibold text-white">
            {isLinkLine
              ? '05:00 AM — 22:30 PM Daily'
              : isNorthLine
              ? '04:15 AM — 23:45 PM Daily'
              : isWestLine
              ? '04:15 AM — 23:45 PM Daily'
              : '04:00 AM — 23:45 PM Daily'}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isLinkLine
              ? 'Electric Multiple Unit (EMU) and Passenger shuttle services connecting Chengalpattu Junction, Walajabad, Kanchipuram, Tirumalpur, and Arakkonam Junction.'
              : isNorthLine
              ? 'Electric Multiple Unit (EMU) services operating between Chennai Moore Market Complex (MASS), Basin Bridge, Ennore, Gummidipoondi, and Sullurupeta.'
              : isWestLine
              ? 'Electric Multiple Unit (EMU) services operating between Chennai Central (Moore Market Complex), Avadi, Tiruvallur, and Arakkonam Junction.'
              : 'Electric Multiple Unit (EMU) services operating between Chennai Beach, Tambaram, and Chengalpattu Junction.'}
          </p>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <IndianRupee className="w-4 h-4" />
            <span>Suburban Rail Fares</span>
          </div>
          <p className="text-sm font-semibold text-white font-mono">
            ₹5 (0-10km) • ₹10 (10-25km) • ₹15 (25-45km) • ₹20 (45+km)
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Standard Southern Railway second-class suburban fares. Tickets bookable via the UTS mobile app and physical station counters.
          </p>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
          <div
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
              isLinkLine ? 'text-rose-400' : 'text-cyan-400'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>Interchange Gateways</span>
          </div>
          <p className="text-sm font-semibold text-white">
            {isLinkLine
              ? 'Chengalpattu Junction (CGL), Arakkonam Junction (AJJ)'
              : isWestLine
              ? 'MMC / Central, Basin Bridge, Perambur, Villivakkam, Tiruvallur, Arakkonam'
              : 'Beach, Fort, Park, Egmore, Guindy, Mount, Chengalpattu'}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isLinkLine
              ? 'Seamless physical interchanges at Chengalpattu Junction (South Line to Beach & Tambaram) and Arakkonam Junction (West Line to Chennai Central / MMC).'
              : isWestLine
              ? 'Interchanges with Chennai Metro Blue & Green lines (Central), North Line (Basin Bridge), and future Phase 2 Purple/Red lines (Perambur, Villivakkam).'
              : 'Direct skywalks and pedestrian subways connecting suburban stations to Chennai Metro Blue & Green lines and MRTS.'}
          </p>
        </div>
      </div>

      {/* Static Timetable Notice */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-white block">Official Timetable & Service Notice</span>
          <p className="text-slate-400 leading-relaxed">{t('timetableNotice')}</p>
        </div>
      </div>

      {/* Station List Section with Search Bar */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-3.5 h-3.5 rounded-full"
                style={{
                  backgroundColor: isLinkLine
                    ? '#e11d48'
                    : isNorthLine
                    ? '#0891b2'
                    : isWestLine
                    ? '#059669'
                    : '#f97316'
                }}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                {isLinkLine
                  ? 'Suburban West–South Link Corridor Sequence'
                  : isNorthLine
                  ? 'Suburban North Line Station Sequence'
                  : isWestLine
                  ? 'Suburban West Line Station Sequence'
                  : 'Suburban South Line Station Sequence'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isLinkLine
                ? t('suburbanWestSouthTitle')
                : isNorthLine
                ? t('suburbanNorthTitle')
                : isWestLine
                ? t('suburbanWestTitle')
                : isSouthLine
                ? t('suburbanSouthTitle')
                : activeLine?.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {isLinkLine
                ? 'Complete verified sequence of all 13 stations connecting Chengalpattu Junction (CGL) to Arakkonam Junction (AJJ) via Kanchipuram'
                : isNorthLine
                ? 'Complete verified sequence of all 22 stations from Chennai Moore Market Complex to Sullurupeta'
                : isWestLine
                ? 'Complete verified sequence of all 31 stations from Chennai Central (Moore Market Complex) to Arakkonam Junction'
                : 'Complete verified sequence of all 28 stations from Chennai Beach to Chengalpattu Junction'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              Showing <strong className="text-white">{filteredStations.length}</strong> of{' '}
              <strong
                className={
                  isLinkLine
                    ? 'text-rose-400'
                    : isNorthLine
                    ? 'text-cyan-400'
                    : isWestLine
                    ? 'text-emerald-400'
                    : 'text-orange-400'
                }
              >
                {rawLineStations.length}
              </strong>{' '}
              stations
            </div>
          </div>
        </div>

        {/* Real-time Station Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isLinkLine
                ? t('searchWestSouthStations')
                : isNorthLine
                ? t('searchNorthStations')
                : isWestLine
                ? t('searchWestStations')
                : isSouthLine
                ? t('searchStations')
                : `Search ${activeLine?.name || 'suburban'} stations by name or code...`
            }
            className={`w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-11 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
              isLinkLine
                ? 'focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                : isNorthLine
                ? 'focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                : isWestLine
                ? 'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                : 'focus:border-orange-500 focus:ring-1 focus:ring-orange-500'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Station Sequence Cards */}
        {filteredStations.length === 0 ? (
          <div className="p-12 text-center bg-slate-950/40 rounded-2xl border border-slate-800 space-y-2">
            <p className="text-sm font-semibold text-slate-300">
              No stations match &ldquo;{searchQuery}&rdquo; on this corridor.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className={`text-xs hover:underline font-semibold cursor-pointer ${
                isLinkLine
                  ? 'text-rose-400'
                  : isNorthLine
                  ? 'text-cyan-400'
                  : isWestLine
                  ? 'text-emerald-400'
                  : 'text-orange-400'
              }`}
            >
              Clear search filter
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStations.map((station) => {
              // Exact index in the sequential list
              const trueIndex = rawLineStations.findIndex((s) => s.id === station.id);
              const stationNumber = trueIndex !== -1 ? trueIndex + 1 : 1;

              // Terminals
              const isFirst = stationNumber === 1;
              const isFinal = stationNumber === totalStationCount;
              const isGPD = station.id === 'SN17';
              const isKanchipuram = station.id === 'WS09';
              const isTirumalpur = station.id === 'WS10';

              // Special Pattabiram siding check
              const isPattabiramSpur = station.id === 'SW16' || station.id === 'SW17';
              const adjacent = getAdjacentStationInfo(station, trueIndex);

              return (
                <div
                  key={station.id}
                  className={`p-4 sm:p-5 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                    isFirst
                      ? isLinkLine
                        ? 'bg-gradient-to-r from-rose-950/50 to-slate-950 border-2 border-rose-500/80 shadow-lg shadow-rose-950/30'
                        : isNorthLine
                        ? 'bg-gradient-to-r from-cyan-950/50 to-slate-950 border-2 border-cyan-500/80 shadow-lg shadow-cyan-950/30'
                        : 'bg-gradient-to-r from-emerald-950/40 to-slate-950 border-2 border-emerald-500/80 shadow-lg shadow-emerald-950/30'
                      : isFinal
                      ? isLinkLine
                        ? 'bg-gradient-to-r from-red-950/50 to-slate-950 border-2 border-red-500/80 shadow-lg shadow-red-950/30'
                        : isNorthLine
                        ? 'bg-gradient-to-r from-teal-950/50 to-slate-950 border-2 border-teal-500/80 shadow-lg shadow-teal-950/30'
                        : 'bg-gradient-to-r from-orange-950/40 to-slate-950 border-2 border-orange-500/80 shadow-lg shadow-orange-950/30'
                      : isKanchipuram
                      ? 'bg-gradient-to-r from-rose-950/30 to-slate-950 border border-rose-600/60 shadow-md'
                      : isTirumalpur
                      ? 'bg-gradient-to-r from-amber-950/30 to-slate-950 border border-amber-600/60 shadow-md'
                      : isGPD
                      ? 'bg-gradient-to-r from-cyan-950/30 to-slate-950 border border-cyan-600/60 shadow-md'
                      : isPattabiramSpur
                      ? 'bg-gradient-to-r from-teal-950/30 to-slate-950 border border-teal-600/60 shadow-md'
                      : 'bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Station Number Badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-mono font-black flex-shrink-0 text-white shadow-md ${
                        isFirst
                          ? isLinkLine
                            ? 'bg-rose-600 ring-2 ring-rose-400/40'
                            : isNorthLine
                            ? 'bg-cyan-600 ring-2 ring-cyan-400/40'
                            : 'bg-emerald-600 ring-2 ring-emerald-400/40'
                          : isFinal
                          ? isLinkLine
                            ? 'bg-red-600 ring-2 ring-red-400/40'
                            : isNorthLine
                            ? 'bg-teal-600 ring-2 ring-teal-400/40'
                            : 'bg-orange-600 ring-2 ring-orange-400/40'
                          : isKanchipuram
                          ? 'bg-rose-700 text-rose-100 ring-1 ring-rose-500/40'
                          : isTirumalpur
                          ? 'bg-amber-700 text-amber-100 ring-1 ring-amber-500/40'
                          : isGPD
                          ? 'bg-cyan-700 text-cyan-100 ring-1 ring-cyan-500/40'
                          : isPattabiramSpur
                          ? 'bg-teal-700 text-teal-100 ring-1 ring-teal-500/40'
                          : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      {stationNumber}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => onSelectStation(station)}
                          className={`text-base sm:text-lg font-bold text-white transition-colors text-left cursor-pointer ${
                            isLinkLine
                              ? 'group-hover:text-rose-400'
                              : isNorthLine
                              ? 'group-hover:text-cyan-400'
                              : isWestLine
                              ? 'group-hover:text-emerald-400'
                              : 'group-hover:text-orange-400'
                          }`}
                        >
                          {lang === 'ta' && station.name_ta ? station.name_ta : station.name}
                        </button>

                        {station.code && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-bold text-slate-300 border border-slate-700">
                            {station.code}
                          </span>
                        )}

                        {/* Transport Type & Corridor Badges */}
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {t('transportTypeSuburban')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            isLinkLine
                              ? 'bg-rose-950/60 border-rose-800/60 text-rose-300'
                              : isNorthLine
                              ? 'bg-cyan-950/60 border-cyan-800/60 text-cyan-300'
                              : isWestLine
                              ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
                              : 'bg-orange-950/60 border-orange-800/60 text-orange-300'
                          }`}
                        >
                          {isLinkLine
                            ? t('corridorWestSouthLine')
                            : isNorthLine
                            ? t('corridorNorthLine')
                            : isWestLine
                            ? t('corridorWestLine')
                            : t('corridorSouthLine')}
                        </span>

                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
                          Stop {stationNumber} of {totalStationCount}
                        </span>

                        {/* First Station Highlight Badge */}
                        {isFirst && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500 text-slate-950 uppercase tracking-wider flex items-center gap-1 shadow-sm">
                            <Sparkles className="w-3 h-3" />
                            <span>
                              {t('firstStation')} •{' '}
                              {isLinkLine
                                ? 'Chengalpattu Junction (CGL)'
                                : isNorthLine
                                ? 'Chennai Moore Market Complex (MASS)'
                                : isWestLine
                                ? 'Chennai Central (MMC)'
                                : 'Chennai Beach'}
                            </span>
                          </span>
                        )}

                        {/* Final Station Highlight Badge */}
                        {isFinal && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-500 text-slate-950 uppercase tracking-wider flex items-center gap-1 shadow-sm">
                            <Sparkles className="w-3 h-3" />
                            <span>
                              {t('finalStation')} •{' '}
                              {isLinkLine
                                ? 'Arakkonam Junction (AJJ)'
                                : isNorthLine
                                ? 'Sullurupeta (SPE)'
                                : isWestLine
                                ? 'Arakkonam Junction'
                                : 'Chengalpattu Junction'}
                            </span>
                          </span>
                        )}

                        {/* Special Kanchipuram Hub Badge */}
                        {isKanchipuram && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>{t('kanchipuramHeritageHub')}</span>
                          </span>
                        )}

                        {/* Special Tirumalpur Terminus Badge */}
                        {isTirumalpur && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            <span>{t('tirumalpurTerminusNotice')}</span>
                          </span>
                        )}

                        {/* Special Gummidipoondi Hub Badge */}
                        {isGPD && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>{t('gummidipoondiTerminatingHub')}</span>
                          </span>
                        )}

                        {/* Special Pattabiram Train Connection Badge */}
                        {isPattabiramSpur && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            <span>{t('pattabiramTrainConnection')}</span>
                          </span>
                        )}
                      </div>

                      {/* Bilingual Alternative Name */}
                      {lang === 'ta' && station.name_ta && (
                        <p className="text-xs text-slate-400 font-medium">{station.name}</p>
                      )}
                      {lang === 'en' && station.name_ta && (
                        <p className="text-xs text-slate-400 font-medium">{station.name_ta}</p>
                      )}

                      {/* Verified Adjacent Stations */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                        {adjacent.prev && (
                          <span className="flex items-center gap-1">
                            <span className="text-slate-500">Prev:</span>
                            <span className="text-slate-300 font-medium">{adjacent.prev}</span>
                          </span>
                        )}
                        {adjacent.prev && adjacent.next && <span>•</span>}
                        {adjacent.next && (
                          <span className="flex items-center gap-1">
                            <span className="text-slate-500">Next:</span>
                            <span className="text-slate-300 font-medium">{adjacent.next}</span>
                          </span>
                        )}
                        {adjacent.trainConnection && (
                          <span className="flex items-center gap-1 text-teal-400 font-semibold">
                            <GitBranch className="w-3 h-3" />
                            <span>Train Connection: {adjacent.trainConnection}</span>
                          </span>
                        )}
                        {adjacent.extra && (
                          <span className="text-emerald-400 font-medium">({adjacent.extra})</span>
                        )}
                      </div>

                      {/* Interchange Information */}
                      {station.is_interchange ? (
                        <p className="text-xs text-emerald-400 flex items-center gap-1.5 font-semibold pt-0.5">
                          <Navigation className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{station.interchange_info || 'Interchange Hub'}</span>
                        </p>
                      ) : station.interchange_info ? (
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5">
                          <Info className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                          <span>{station.interchange_info}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Station Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                    <button
                      onClick={() => onSelectStation(station)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                    >
                      {t('details')}
                    </button>

                    <button
                      onClick={() => {
                        onSetOrigin(station);
                        onNavigateToPlanner(station);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isLinkLine
                          ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40'
                          : isNorthLine
                          ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-950/40'
                          : isWestLine
                          ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40'
                          : 'bg-orange-600 hover:bg-orange-500 shadow-orange-950/40'
                      }`}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{t('planJourney')}</span>
                    </button>

                    <button
                      onClick={() => onSetOrigin(station)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                      title={t('planFromHere')}
                    >
                      From Here
                    </button>

                    <button
                      onClick={() => onSetDestination(station)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                      title={t('setAsDestination')}
                    >
                      To Here
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
