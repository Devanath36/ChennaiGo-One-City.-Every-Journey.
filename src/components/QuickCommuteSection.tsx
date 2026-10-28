import React, { useState, useEffect } from 'react';
import {
  Zap,
  ArrowRight,
  ArrowUpDown,
  Star,
  Clock,
  Navigation,
  Trash2,
  Train,
  CheckCircle2,
  MapPin,
  RotateCcw
} from 'lucide-react';
import { Station, TransportPreference } from '../types/transit.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface QuickCommuteSectionProps {
  stations: Station[];
  onPlanTrip: (origin: Station, destination: Station, preference?: TransportPreference) => void;
  onSetOrigin: (station: Station) => void;
  onSetDestination: (station: Station) => void;
}

interface PopularRoute {
  id: string;
  originId: string;
  destId: string;
  label: string;
  labelTa?: string;
  lineName: string;
  lineColor: string;
  mode: 'Metro' | 'Suburban' | 'Spur';
  estDuration: number;
  fare: number;
  preference: TransportPreference;
  description: string;
}

export const QuickCommuteSection: React.FC<QuickCommuteSectionProps> = ({
  stations,
  onPlanTrip,
  onSetOrigin,
  onSetDestination
}) => {
  const { lang, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'popular' | 'favorites' | 'recent_stations'>('popular');

  // Favorites stored in localStorage
  const [favoriteJourneys, setFavoriteJourneys] = useState<Array<{
    id: string;
    origId: string;
    destId: string;
    origName: string;
    destName: string;
  }>>(() => {
    try {
      const raw = localStorage.getItem('chennai_transit_fav_journeys_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Recently searched stations in localStorage
  const [recentStations, setRecentStations] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('chennai_transit_recent_stations_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Verified popular routes based on actual railway alignment and timetable topology
  const verifiedPopularRoutes: PopularRoute[] = [
    {
      id: 'central-airport',
      originId: 'BL13',
      destId: 'BL26',
      label: 'Chennai Central ➔ Airport',
      labelTa: 'சென்னை சென்ட்ரல் ➔ விமான நிலையம்',
      lineName: 'Blue Line (C-1)',
      lineColor: '#0284c7',
      mode: 'Metro',
      estDuration: 38,
      fare: 50,
      preference: 'metro',
      description: 'Direct air-conditioned metro via Anna Salai and Guindy'
    },
    {
      id: 'beach-chengalpattu',
      originId: 'SB01',
      destId: 'SB28',
      label: 'Chennai Beach ➔ Chengalpattu Junction',
      labelTa: 'சென்னை கடற்கரை ➔ செங்கல்பட்டு சந்திப்பு',
      lineName: 'Suburban South Line',
      lineColor: '#ea580c',
      mode: 'Suburban',
      estDuration: 105,
      fare: 20,
      preference: 'suburban',
      description: 'Key southern arterial commuter corridor via Tambaram, Guindy & Tirusulam'
    },
    {
      id: 'mmc-arakkonam',
      originId: 'SW01',
      destId: 'SW31',
      label: 'Central (MMC) ➔ Arakkonam Junction',
      labelTa: 'சென்ட்ரல் (MMC) ➔ அரக்கோணம் சந்திப்பு',
      lineName: 'Suburban West Line',
      lineColor: '#059669',
      mode: 'Suburban',
      estDuration: 95,
      fare: 20,
      preference: 'suburban',
      description: 'Direct Southern Railway mainline EMU through Avadi & Tiruvallur'
    },
    {
      id: 'central-sullurupeta',
      originId: 'SN01',
      destId: 'SN22',
      label: 'Central (MASS) ➔ Sullurupeta',
      labelTa: 'சென்ட்ரல் (MASS) ➔ சூளூர்பேட்டை',
      lineName: 'Suburban North Line',
      lineColor: '#0ea5e9',
      mode: 'Suburban',
      estDuration: 85,
      fare: 20,
      preference: 'suburban',
      description: 'Northern mainline EMU via Ennore, Minjur & Gummidipoondi'
    },
    {
      id: 'cgl-kanchipuram',
      originId: 'SB28',
      destId: 'WS09',
      label: 'Chengalpattu ➔ Kanchipuram (Silk City)',
      labelTa: 'செங்கல்பட்டு ➔ காஞ்சிபுரம்',
      lineName: 'West–South Link Line',
      lineColor: '#e11d48',
      mode: 'Suburban',
      estDuration: 43,
      fare: 15,
      preference: 'suburban',
      description: 'Direct circumferential link corridor through Palur & Walajabad'
    },
    {
      id: 'central-vadapalani',
      originId: 'GL01',
      destId: 'GL13',
      label: 'Chennai Central ➔ Vadapalani Hub',
      labelTa: 'சென்னை சென்ட்ரல் ➔ வடபழனி சந்திப்பு',
      lineName: 'Green Line (C-2)',
      lineColor: '#16a34a',
      mode: 'Metro',
      estDuration: 22,
      fare: 40,
      preference: 'metro',
      description: 'Rapid link via Koyambedu and CMBT bus interchange'
    },
    {
      id: 'egmore-airport',
      originId: 'BL14',
      destId: 'BL26',
      label: 'Chennai Egmore ➔ Airport',
      labelTa: 'சென்னை எழும்பூர் ➔ விமான நிலையம்',
      lineName: 'Blue Line (C-1)',
      lineColor: '#0284c7',
      mode: 'Metro',
      estDuration: 32,
      fare: 40,
      preference: 'metro',
      description: 'Express connection between main railway terminus and airport'
    },
    {
      id: 'ptms-pres-spur',
      originId: 'SW16',
      destId: 'SW17',
      label: 'Pattabiram PTMS ⇄ PRES (Spur)',
      labelTa: 'பட்டாபிராம் PTMS ⇄ PRES (ரயில் இணைப்பு)',
      lineName: 'Pattabiram Spur Connection',
      lineColor: '#0d9488',
      mode: 'Spur',
      estDuration: 8,
      fare: 5,
      preference: 'suburban',
      description: 'Verified dedicated Southern Railway spur train shuttle'
    },
    {
      id: 'beach-velachery',
      originId: 'MR01',
      destId: 'MR18',
      label: 'Chennai Beach ➔ Velachery (MRTS)',
      labelTa: 'சென்னை கடற்கரை ➔ வேளச்சேரி (MRTS)',
      lineName: 'MRTS Elevated Line',
      lineColor: '#8b5cf6',
      mode: 'Suburban',
      estDuration: 42,
      fare: 10,
      preference: 'suburban',
      description: 'Elevated coastal link through Chepauk, Mylapore & IT corridor'
    }
  ];

  // Run popular route
  const handleRunPopularRoute = (route: PopularRoute, reverse = false) => {
    const oId = reverse ? route.destId : route.originId;
    const dId = reverse ? route.originId : route.destId;
    const orig = stations.find((s) => s.id === oId);
    const dest = stations.find((s) => s.id === dId);
    if (orig && dest) {
      onPlanTrip(orig, dest, route.preference);
    }
  };

  // Toggle favorite journey
  const handleToggleFavorite = (route: PopularRoute) => {
    setFavoriteJourneys((prev) => {
      const exists = prev.some((j) => j.origId === route.originId && j.destId === route.destId);
      let updated;
      if (exists) {
        updated = prev.filter((j) => !(j.origId === route.originId && j.destId === route.destId));
      } else {
        updated = [
          ...prev,
          {
            id: route.id,
            origId: route.originId,
            destId: route.destId,
            origName: route.label.split('➔')[0].trim(),
            destName: route.label.split('➔')[1]?.trim() || ''
          }
        ];
      }
      try {
        localStorage.setItem('chennai_transit_fav_journeys_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Clear commute storage
  const handleClearCommuteData = () => {
    setFavoriteJourneys([]);
    setRecentStations([]);
    try {
      localStorage.removeItem('chennai_transit_fav_journeys_v1');
      localStorage.removeItem('chennai_transit_recent_stations_v1');
    } catch {}
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-xs font-bold text-cyan-400 mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>Smart Commuter Shortcuts</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Quick Commute
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Verified popular corridors, starred favorites, and single-click journey planning.
          </p>
        </div>

        {/* Clear Data Button */}
        {(favoriteJourneys.length > 0 || recentStations.length > 0) && (
          <button
            onClick={handleClearCommuteData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-red-400 bg-slate-950 hover:bg-red-950/30 border border-slate-800 hover:border-red-800/60 rounded-xl transition cursor-pointer self-start sm:self-center"
            title="Clear saved favorites and recent stations"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Saved Data</span>
          </button>
        )}
      </div>

      {/* Segmented Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setActiveTab('popular')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'popular'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-950'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Verified Popular Journeys</span>
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'favorites'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-950'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>Favorites ({favoriteJourneys.length})</span>
        </button>

        {recentStations.length > 0 && (
          <button
            onClick={() => setActiveTab('recent_stations')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'recent_stations'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-950'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Recent Stations ({recentStations.length})</span>
          </button>
        )}
      </div>

      {/* Tab: Popular Journeys */}
      {activeTab === 'popular' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {verifiedPopularRoutes.map((route) => {
            const isFav = favoriteJourneys.some(
              (j) => j.origId === route.originId && j.destId === route.destId
            );

            return (
              <div
                key={route.id}
                onClick={() => handleRunPopularRoute(route, false)}
                className="group relative p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800/90 hover:border-cyan-500/50 transition-all cursor-pointer shadow-sm space-y-2.5"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRunPopularRoute(route, false);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: route.lineColor }}
                      />
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {lang === 'ta' && route.labelTa ? route.labelTa : route.label}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {route.description}
                    </p>
                  </div>

                  {/* Actions: Favorite & Reverse */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(route);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-900 transition cursor-pointer"
                      title={isFav ? 'Remove from favorites' : 'Save to favorites'}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunPopularRoute(route, true);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-900 transition cursor-pointer"
                      title="Plan reverse route"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Route Metadata (Clean unboxed line with typographic separators) */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-400 font-mono">
                    <span className="text-slate-300">~{route.estDuration}m</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-emerald-400 font-medium">₹{route.fare}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-slate-400 font-sans">{route.mode}</span>
                  </div>

                  <span className="text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-[11px]">
                    <span>Plan Route</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Favorites */}
      {activeTab === 'favorites' && (
        <div className="space-y-3">
          {favoriteJourneys.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 border border-slate-800/60 rounded-2xl space-y-2">
              <Star className="w-6 h-6 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">
                No favorite journeys saved yet. Click the star icon on any popular route or calculated journey to bookmark it here for single-click access.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {favoriteJourneys.map((fav) => (
                <div
                  key={fav.id}
                  onClick={() => {
                    const orig = stations.find((s) => s.id === fav.origId);
                    const dest = stations.find((s) => s.id === fav.destId);
                    if (orig && dest) onPlanTrip(orig, dest);
                  }}
                  className="p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400 flex-shrink-0" />
                    <span className="text-sm font-bold text-white">
                      {fav.origName} ➔ {fav.destName}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                    <span>Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Recent Stations */}
      {activeTab === 'recent_stations' && (
        <div className="flex flex-wrap gap-2">
          {recentStations.map((stId) => {
            const st = stations.find((s) => s.id === stId);
            if (!st) return null;
            return (
              <div
                key={stId}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs"
              >
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold text-white">{st.name}</span>
                <span className="text-[10px] font-mono text-slate-500">[{st.code}]</span>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => onSetOrigin(st)}
                    className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 rounded text-[10px] text-cyan-300 font-semibold cursor-pointer"
                  >
                    From
                  </button>
                  <button
                    onClick={() => onSetDestination(st)}
                    className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 rounded text-[10px] text-emerald-300 font-semibold cursor-pointer"
                  >
                    To
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
