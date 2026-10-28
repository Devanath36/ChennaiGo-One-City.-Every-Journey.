import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  MapPin,
  Train,
  Layers,
  Star,
  Check,
  ChevronDown,
  Hammer,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { Station, TransitLine } from '../types/transit.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface SmartStationSearchProps {
  label: string;
  placeholder: string;
  selectedStation: Station | null;
  onSelectStation: (station: Station | null) => void;
  stations: Station[];
  lines?: TransitLine[];
  favoriteStationIds?: string[];
  onToggleFavorite?: (stationId: string) => void;
  idPrefix: string;
  helperText?: string;
  autoFocus?: boolean;
}

// Synonyms and colloquial keywords for Chennai commuters
const STATION_ALIASES: Record<string, string[]> = {
  'GL01': ['central', 'chennai central', 'mgr central', 'puratchi thalaivar', 'railway central', 'metro central'],
  'SW01': ['mmc', 'moore market', 'mass', 'central suburban', 'suburban central', 'chennai central suburban'],
  'BL13': ['central metro', 'chennai central blue', 'central underground'],
  'BL26': ['airport', 'chennai airport', 'flight', 'domestic airport', 'international airport', 'meenambakkam airport'],
  'SB14': ['tirusulam', 'airport suburban', 'airport train', 'tirusulam airport'],
  'SB01': ['beach', 'chennai beach', 'beach station', 'harbour'],
  'MR01': ['beach mrts', 'chennai beach elevated'],
  'GL02': ['egmore', 'chennai egmore', 'egmore metro', 'egmore railway'],
  'SB04': ['egmore suburban', 'egmore local train'],
  'BL22': ['guindy', 'guindy metro', 'guindy bus terminus', 'olympia tech park'],
  'SB11': ['guindy suburban', 'guindy local train', 'guindy station'],
  'BL23': ['alandur', 'alandur metro junction', 'alandur interchange', 'kathipara'],
  'GL16': ['alandur green line'],
  'GL07': ['koyambedu', 'koyambedu market', 'koyambedu metro'],
  'GL06': ['cmbt', 'koyambedu bus terminus', 'mofussil bus terminus'],
  'GL08': ['vadapalani', 'forum mall', 'vadapalani metro', 'vadapalani junction'],
  'SB18': ['tambaram', 'tbm', 'tambaram junction', 'tambaram sanatorium', 'mepz'],
  'SB28': ['chengalpattu', 'cgl', 'chengalpet', 'chengalpattu junction'],
  'SW31': ['arakkonam', 'ajj', 'arakkonam junction'],
  'SW13': ['avadi', 'avd', 'hvf avadi', 'avadi bus stand', 'avadi suburban'],
  'SW04': ['perambur', 'per', 'perambur railway', 'icf perambur'],
  'SN17': ['gummidipoondi', 'gpd', 'gummidipundi'],
  'SN22': ['sullurupeta', 'spe', 'sullurpeta', 'sriharikota', 'shar'],
  'WS09': ['kanchipuram', 'kanchi', 'cj', 'temple city', 'kanchipuram silk'],
  'MR18': ['velachery', 'velachery mrts', 'phoenix marketcity'],
  'MR15': ['thiruvanmiyur', 'thiruvanmiyur mrts', 'tidel park', 'omr'],
  'MR07': ['thirumayilai', 'mylapore', 'kapaleeshwarar', 'thirumayilai mrts'],
  'YL28': ['poonamallee', 'poonamallee bypass', 'porur poonamallee'],
  'YL29': ['poonamallee bypass', 'poonamallee depot']
};

export const SmartStationSearch: React.FC<SmartStationSearchProps> = ({
  label,
  placeholder,
  selectedStation,
  onSelectStation,
  stations,
  lines = [],
  favoriteStationIds = [],
  onToggleFavorite,
  idPrefix,
  helperText,
  autoFocus = false
}) => {
  const { lang } = useLanguage();
  const [query, setQuery] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [highlightIndex, setHighlightIndex] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Line lookup map
  const lineMap = useMemo(() => {
    const map = new Map<string, TransitLine>();
    lines.forEach((l) => map.set(l.id, l));
    return map;
  }, [lines]);

  // Filter and rank suggestions
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      // Default view when input is focused with no query:
      // Show favorite stations first (if any), then major operational hubs
      const favList = stations.filter((s) => favoriteStationIds.includes(s.id));
      const majorHubIds = ['GL01', 'BL26', 'SB01', 'SB18', 'GL08', 'BL22', 'SW01', 'MR18', 'SW13', 'SW31', 'SB28'];
      const majorHubs = stations.filter((s) => majorHubIds.includes(s.id) && !favoriteStationIds.includes(s.id));
      return [...favList, ...majorHubs].slice(0, 10);
    }

    const matches: Array<{ station: Station; score: number }> = [];

    for (const station of stations) {
      let score = 0;
      const sName = station.name.toLowerCase();
      const sTa = (station.name_ta || '').toLowerCase();
      const sCode = (station.code || '').toLowerCase();
      const sId = station.id.toLowerCase();
      const lineInfo = lineMap.get(station.line_id);
      const sLineName = lineInfo ? lineInfo.name.toLowerCase() : '';
      const sLineShort = lineInfo ? lineInfo.short_name.toLowerCase() : '';

      // 1. Exact station code match (highest priority, e.g. "MAS", "TBM", "BL13")
      if (sCode === q || sId === q) {
        score += 150;
      } else if (sCode.startsWith(q)) {
        score += 90;
      }

      // 2. Exact or prefix station name match
      if (sName === q || sTa === q) {
        score += 120;
      } else if (sName.startsWith(q) || sTa.startsWith(q)) {
        score += 80;
      } else if (sName.includes(q) || sTa.includes(q)) {
        score += 45;
      }

      // 3. Synonym / colloquial alias match (e.g. "airport" -> BL26, "central" -> GL01)
      const aliases = STATION_ALIASES[station.id] || [];
      for (const alias of aliases) {
        if (alias === q) {
          score += 110;
          break;
        } else if (alias.startsWith(q)) {
          score += 70;
          break;
        } else if (alias.includes(q)) {
          score += 35;
          break;
        }
      }

      // 4. Line name match (e.g. "blue line", "suburban")
      if (sLineName.includes(q) || sLineShort.includes(q)) {
        score += 25;
      }

      // 5. Prefer operational stations slightly over under-construction ones
      if (station.status === 'operational') {
        score += 10;
      }

      // 6. Prefer interchange hubs
      if (station.is_interchange === 1) {
        score += 5;
      }

      // 7. Favorite boost
      if (favoriteStationIds.includes(station.id)) {
        score += 15;
      }

      if (score > 0) {
        matches.push({ station, score });
      }
    }

    // Sort descending by score
    matches.sort((a, b) => b.score - a.score);

    // Limit to top 15 suggestions
    return matches.map((m) => m.station).slice(0, 15);
  }, [stations, query, favoriteStationIds, lineMap]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation inside suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const picked = suggestions[highlightIndex];
      if (picked) {
        handleSelect(picked);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (station: Station) => {
    onSelectStation(station);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectStation(null);
    setQuery('');
    setIsOpen(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const getLineColor = (lineId: string): string => {
    const line = lineMap.get(lineId);
    return line?.color || '#0284c7';
  };

  const getLineShortName = (lineId: string): string => {
    const line = lineMap.get(lineId);
    return line?.short_name || lineId.toUpperCase();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-full min-w-0 box-border">
      {/* Label & Helper */}
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor={`${idPrefix}-input`}
          className="text-xs font-bold text-slate-300 flex items-center gap-1.5 truncate"
        >
          <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span>{label}</span>
        </label>
        {selectedStation && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
            {selectedStation.code}
          </span>
        )}
      </div>

      {/* Input Box / Active Station Selector */}
      <div
        className={`relative w-full rounded-2xl border transition-all duration-150 box-border ${
          isOpen
            ? 'bg-slate-900 border-cyan-500 ring-2 ring-cyan-500/30'
            : selectedStation
            ? 'bg-slate-950/90 border-slate-700 hover:border-slate-600'
            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
        }`}
      >
        {selectedStation && !isOpen ? (
          // Display active selected station badge
          <div
            onClick={() => {
              setIsOpen(true);
              setQuery('');
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            className="w-full flex items-center justify-between p-3 min-h-[46px] cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                style={{ backgroundColor: getLineColor(selectedStation.line_id) }}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white truncate">
                    {lang === 'ta' && selectedStation.name_ta ? selectedStation.name_ta : selectedStation.name}
                  </span>
                  <span
                    className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-xs flex-shrink-0"
                    style={{ backgroundColor: getLineColor(selectedStation.line_id) }}
                  >
                    {getLineShortName(selectedStation.line_id)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="font-mono text-cyan-400 font-semibold">{selectedStation.code}</span>
                  <span>•</span>
                  <span>{selectedStation.system_type}</span>
                  {selectedStation.status !== 'operational' && (
                    <>
                      <span>•</span>
                      <span className="text-amber-400 font-medium">Phase 2 Planned</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(selectedStation.id);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition cursor-pointer"
                  title={favoriteStationIds.includes(selectedStation.id) ? 'Remove favorite' : 'Add to favorites'}
                >
                  <Star
                    className={`w-4 h-4 ${
                      favoriteStationIds.includes(selectedStation.id)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-400'
                    }`}
                  />
                </button>
              )}
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Clear selection"
                aria-label="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="pl-1 text-slate-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        ) : (
          // Search input field
          <div className="flex items-center px-3 min-h-[46px]">
            <Search className="w-4 h-4 text-slate-500 mr-2 flex-shrink-0" />
            <input
              ref={inputRef}
              id={`${idPrefix}-input`}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
                setHighlightIndex(0);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              autoFocus={autoFocus}
              autoComplete="off"
              className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none min-w-0"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
                aria-label="Clear search input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {helperText && !isOpen && (
        <p className="text-[11px] text-slate-500 mt-1 pl-1 truncate">{helperText}</p>
      )}

      {/* Autocomplete Suggestions Dropdown Popup */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-72 sm:max-h-80 flex flex-col animate-in fade-in zoom-in-95 duration-100">
          {/* Header indicator */}
          <div className="px-3.5 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              {query.trim()
                ? `Matching stations (${suggestions.length})`
                : favoriteStationIds.length > 0
                ? '⭐ Starred & Major Transfer Hubs'
                : 'Major Transit Hubs'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
              Type code (e.g. MAS, TBM) or name
            </span>
          </div>

          {/* Suggestions List */}
          <ul
            ref={listRef}
            role="listbox"
            className="overflow-y-auto divide-y divide-slate-800/50 flex-1 p-1"
          >
            {suggestions.length === 0 ? (
              <li className="p-4 text-center text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">No stations found matching &ldquo;{query}&rdquo;</p>
                <p className="text-[11px] text-slate-500">
                  Try searching by line name (e.g. Blue Line, Suburban West) or verified station code.
                </p>
              </li>
            ) : (
              suggestions.map((st, index) => {
                const isHighlighted = index === highlightIndex;
                const isSelected = selectedStation?.id === st.id;
                const isFav = favoriteStationIds.includes(st.id);
                const lineColor = getLineColor(st.line_id);

                return (
                  <li
                    key={st.id}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightIndex(index)}
                    onClick={() => handleSelect(st)}
                    className={`px-3 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs ${
                      isHighlighted
                        ? 'bg-slate-800 text-white'
                        : isSelected
                        ? 'bg-cyan-950/40 text-cyan-200'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Line color indicator pill */}
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: lineColor }}
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">
                            {lang === 'ta' && st.name_ta ? st.name_ta : st.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950 text-cyan-400 border border-slate-800">
                            {st.code}
                          </span>
                          {st.is_interchange === 1 && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800">
                              Interchange
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span
                            className="font-semibold text-[10px] px-1.5 py-0.2 rounded"
                            style={{
                              color: lineColor,
                              backgroundColor: `${lineColor}15`
                            }}
                          >
                            {getLineShortName(st.line_id)}
                          </span>
                          <span>•</span>
                          <span>{st.system_type}</span>
                          {st.status !== 'operational' ? (
                            <>
                              <span>•</span>
                              <span className="text-amber-400 font-medium flex items-center gap-1">
                                <Hammer className="w-3 h-3" />
                                <span>Phase 2 (Under Const)</span>
                              </span>
                            </>
                          ) : (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400 flex items-center gap-0.5">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Operational</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side actions: Favorite star & Selected check */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {onToggleFavorite && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(st.id);
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-900 transition cursor-pointer"
                          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-500'
                            }`}
                          />
                        </button>
                      )}
                      {isSelected ? (
                        <Check className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300" />
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
