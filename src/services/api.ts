import {
  TransitLine,
  Station,
  JourneyPlan,
  JourneyOption,
  FavoriteJourney,
  FavoriteStation,
  ActiveTrain,
  SavedJourney,
  RecentTrip,
  RouteStep,
  TransitDataSource
} from '../types/transit.ts';

const API_BASE = '/api';

// LocalStorage Cache Keys
const CACHE_KEYS = {
  STATIONS: 'chennai_transit_stations_v2',
  LINES: 'chennai_transit_lines_v2',
  CONNECTIONS: 'chennai_transit_connections_v2',
  SOURCES: 'chennai_transit_sources_v1',
  TIMESTAMP: 'chennai_transit_cache_time_v2',
  SAVED_TRIPS: 'chennai_transit_saved_trips_v2',
  FAV_STATIONS: 'chennai_transit_fav_stations_v2',
  FAV_JOURNEYS: 'chennai_transit_fav_journeys_v2',
  RECENT_SEARCHES: 'chennai_transit_recent_trips_v2'
};

// Bundled Offline Snapshot including Operational & Phase II Upcoming Corridors
export const FALLBACK_LINES: TransitLine[] = [
  {
    id: 'blue',
    name: 'Blue Line (Corridor 1)',
    short_name: 'Blue Line',
    color: '#0284c7',
    text_color: '#ffffff',
    description: 'Wimco Nagar Depot to Chennai International Airport via Anna Salai',
    system_type: 'Metro',
    total_stations: 26,
    total_km: 32.65,
    operating_hours: '05:00 - 23:00',
    headway_peak: 4,
    headway_offpeak: 8,
    status: 'operational',
    phase: 'Phase 1 & Ext',
    target_completion: 'Operational (Phase 1)'
  },
  {
    id: 'green',
    name: 'Green Line (Corridor 2)',
    short_name: 'Green Line',
    color: '#16a34a',
    text_color: '#ffffff',
    description: 'Chennai Central to St. Thomas Mount via Koyambedu & CMBT',
    system_type: 'Metro',
    total_stations: 17,
    total_km: 22.0,
    operating_hours: '05:00 - 23:00',
    headway_peak: 5,
    headway_offpeak: 10,
    status: 'operational',
    phase: 'Phase 1 & Ext',
    target_completion: 'Operational (Phase 1)'
  },
  {
    id: 'purple',
    name: 'Purple Line (Corridor 3)',
    short_name: 'Purple Line',
    color: '#9333ea',
    text_color: '#ffffff',
    description: 'Madhavaram Milk Colony to Siruseri SIPCOT via Perambur, KMC, Thousand Lights, Adyar, and OMR',
    system_type: 'Metro',
    total_stations: 48,
    total_km: 45.8,
    operating_hours: 'Planned: 05:00 - 23:00',
    headway_peak: 4,
    headway_offpeak: 8,
    status: 'under_construction',
    phase: 'Phase 2',
    target_completion: 'Target 2026 - 2028 (Under Construction)'
  },
  {
    id: 'yellow',
    name: 'Yellow Line (Corridor 4)',
    short_name: 'Yellow Line',
    color: '#eab308',
    text_color: '#000000',
    description: 'Poonamallee Bypass to Lighthouse via Porur Junction, Vadapalani, Nandanam, and Thirumayilai (Phase II)',
    system_type: 'Metro',
    total_stations: 28,
    total_km: 26.1,
    operating_hours: 'Planned: 05:00 - 23:00',
    headway_peak: 4,
    headway_offpeak: 8,
    status: 'under_construction',
    phase: 'Phase 2',
    target_completion: 'Priority Stretch (Poonamallee–Vadapalani): 2025–2026 | Full Line: 2027–2028'
  },
  {
    id: 'red',
    name: 'Red Line (Corridor 5)',
    short_name: 'Red Line',
    color: '#ef4444',
    text_color: '#ffffff',
    description: 'Madhavaram Milk Colony to Sholinganallur via Retteri, Kolathur, CMBT, Alandur, and Medavakkam',
    system_type: 'Metro',
    total_stations: 48,
    total_km: 47.0,
    operating_hours: 'Planned: 05:00 - 23:00',
    headway_peak: 5,
    headway_offpeak: 10,
    status: 'under_construction',
    phase: 'Phase 2',
    target_completion: 'Target 2027 - 2028 (Under Construction)'
  },
  {
    id: 'mrts',
    name: 'MRTS Line',
    short_name: 'MRTS',
    color: '#8b5cf6',
    text_color: '#ffffff',
    description: 'Chennai Beach to Velachery elevated suburban rapid rail system',
    system_type: 'MRTS',
    total_stations: 18,
    total_km: 19.34,
    operating_hours: '04:15 - 23:15',
    headway_peak: 10,
    headway_offpeak: 15,
    status: 'operational',
    phase: 'Southern Railway',
    target_completion: 'Operational'
  },
  {
    id: 'suburban_south',
    name: 'Suburban South Line',
    short_name: 'Suburban South',
    color: '#f97316',
    text_color: '#ffffff',
    description: 'Chennai Beach to Chengalpattu Junction suburban railway corridor',
    system_type: 'Suburban',
    total_stations: 28,
    total_km: 59.6,
    operating_hours: '04:00 - 23:45',
    headway_peak: 8,
    headway_offpeak: 15,
    status: 'operational',
    phase: 'Southern Railway',
    target_completion: 'Operational'
  },
  {
    id: 'suburban_west',
    name: 'Suburban West Line',
    short_name: 'West Line',
    color: '#059669',
    text_color: '#ffffff',
    description: 'Chennai Central (Moore Market Complex) to Arakkonam Junction suburban railway corridor',
    system_type: 'Suburban',
    total_stations: 31,
    total_km: 68.4,
    operating_hours: '04:15 - 23:45',
    headway_peak: 10,
    headway_offpeak: 20,
    status: 'operational',
    phase: 'Southern Railway',
    target_completion: 'Operational'
  },
  {
    id: 'suburban_north',
    name: 'Suburban North Line',
    short_name: 'North Line',
    color: '#0891b2',
    text_color: '#ffffff',
    description: 'Chennai Moore Market Complex (MASS) to Sullurupeta (SPE) suburban railway corridor',
    system_type: 'Suburban',
    total_stations: 22,
    total_km: 82.5,
    operating_hours: '04:15 - 23:45',
    headway_peak: 12,
    headway_offpeak: 25,
    status: 'operational',
    phase: 'Southern Railway',
    target_completion: 'Operational'
  },
  {
    id: 'suburban_west_south',
    name: 'West–South Link Line',
    short_name: 'West–South Link',
    color: '#e11d48',
    text_color: '#ffffff',
    description: 'Chengalpattu Junction (CGL) to Arakkonam Junction (AJJ) via Kanchipuram and Tirumalpur',
    system_type: 'Suburban',
    total_stations: 13,
    total_km: 67.2,
    operating_hours: '04:45 - 22:30',
    headway_peak: 30,
    headway_offpeak: 60,
    status: 'operational',
    phase: 'Southern Railway',
    target_completion: 'Operational'
  }
];

export function getOfflineCacheStatus(): {
  isCached: boolean;
  stationCount: number;
  lineCount: number;
  lastUpdated: string | null;
} {
  try {
    const rawStations = localStorage.getItem(CACHE_KEYS.STATIONS);
    const rawLines = localStorage.getItem(CACHE_KEYS.LINES);
    const rawTime = localStorage.getItem(CACHE_KEYS.TIMESTAMP);

    const stations = rawStations ? JSON.parse(rawStations) : [];
    const lines = rawLines ? JSON.parse(rawLines) : [];

    return {
      isCached: stations.length > 0 && lines.length > 0,
      stationCount: stations.length,
      lineCount: lines.length,
      lastUpdated: rawTime ? new Date(Number(rawTime)).toLocaleTimeString() : null
    };
  } catch {
    return { isCached: false, stationCount: 0, lineCount: 0, lastUpdated: null };
  }
}

export function clearOfflineCache() {
  try {
    localStorage.removeItem(CACHE_KEYS.STATIONS);
    localStorage.removeItem(CACHE_KEYS.LINES);
    localStorage.removeItem(CACHE_KEYS.CONNECTIONS);
    localStorage.removeItem(CACHE_KEYS.TIMESTAMP);
  } catch (e) {
    console.error('Failed to clear localStorage:', e);
  }
}

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      is_offline: true,
      service: 'Chennai Transit 3D API (Offline Cache Active)',
      status: 'offline_mode'
    };
  }
}

export async function fetchLines(status?: string): Promise<TransitLine[]> {
  let cachedLines: TransitLine[] = [];
  try {
    const raw = localStorage.getItem(CACHE_KEYS.LINES);
    if (raw) cachedLines = JSON.parse(raw);
  } catch {}

  const applyStatusFilter = (list: TransitLine[]) => {
    if (!status || status === 'all') return list;
    return list.filter((l) => l.status === status);
  };

  try {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const url = `${API_BASE}/lines${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        if (!status || status === 'all') {
          try {
            localStorage.setItem(CACHE_KEYS.LINES, JSON.stringify(json.data));
            localStorage.setItem(CACHE_KEYS.TIMESTAMP, String(Date.now()));
          } catch {}
        }
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[Cache] Network unavailable for lines, using cached data:', err);
  }

  if (cachedLines.length > 0) return applyStatusFilter(cachedLines);
  return applyStatusFilter(FALLBACK_LINES);
}

export async function fetchStations(
  lineId?: string,
  search?: string,
  status?: string
): Promise<Station[]> {
  let allCachedStations: Station[] = [];
  try {
    const raw = localStorage.getItem(CACHE_KEYS.STATIONS);
    if (raw) allCachedStations = JSON.parse(raw);
  } catch {}

  const applyFilters = (list: Station[]) => {
    let result = list;
    if (lineId && lineId !== 'all') {
      result = result.filter((s) => s.line_id === lineId);
    }
    if (status && status !== 'all') {
      result = result.filter((s) => s.status === status);
    }
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.name_ta.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q)
      );
    }
    return result;
  };

  try {
    const params = new URLSearchParams();
    if (lineId && lineId !== 'all') params.append('line', lineId);
    if (search && search.trim() !== '') params.append('search', search.trim());
    if (status && status !== 'all') params.append('status', status);

    const url = `${API_BASE}/stations${params.toString() ? '?' + params.toString() : ''}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        if (!lineId && !search && (!status || status === 'all')) {
          try {
            localStorage.setItem(CACHE_KEYS.STATIONS, JSON.stringify(json.data));
            localStorage.setItem(CACHE_KEYS.TIMESTAMP, String(Date.now()));
          } catch {}
        }
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[Cache] Network unavailable for stations, serving from local cache:', err);
  }

  if (allCachedStations.length > 0) {
    return applyFilters(allCachedStations);
  }

  return [];
}

export async function fetchStationById(id: string): Promise<Station> {
  try {
    const res = await fetch(`${API_BASE}/stations/${id}`);
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch {}

  const cached = localStorage.getItem(CACHE_KEYS.STATIONS);
  if (cached) {
    const list: Station[] = JSON.parse(cached);
    const found = list.find((s) => s.id === id);
    if (found) return found;
  }
  throw new Error(`Station with ID ${id} could not be resolved while offline.`);
}

export interface JourneyPlanResponse extends JourneyPlan {
  options?: JourneyOption[];
}

export async function planJourney(
  originId: string,
  destId: string,
  preference: 'best' | 'metro' | 'suburban' = 'best'
): Promise<JourneyPlanResponse> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${API_BASE}/journey/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin_id: originId, dest_id: destId, preference }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    const data = await res.json();
    if (res.ok && data.success) {
      const primary: JourneyPlan = data.data;
      const options: JourneyOption[] = data.options || [
        {
          id: 'opt_primary',
          option_type: preference,
          title: primary.lines_used.join(' ➔ ') || 'Direct Route',
          tag: 'recommended',
          tag_label: 'Recommended Route',
          ranking_reason: 'Best available connection between selected stations.',
          mode_types: ['Transit'],
          ...primary
        }
      ];
      return {
        ...primary,
        options
      };
    }
  } catch (err) {
    console.warn('[Cache] Network journey request failed, attempting offline Dijkstra routing:', err);
  }

  const offline = calculateOfflineJourney(originId, destId);
  const fallbackOption: JourneyOption = {
    id: 'opt_offline_1',
    option_type: preference,
    title: offline.lines_used.join(' ➔ ') || 'Direct Route',
    tag: 'recommended',
    tag_label: 'Best Available',
    ranking_reason: 'Calculated using offline schedule snapshot.',
    mode_types: ['Transit'],
    ...offline
  };

  return {
    ...offline,
    options: [fallbackOption]
  };
}

export async function queryJourneyAssistant(
  query: string,
  preference: 'best' | 'metro' | 'suburban' = 'best'
): Promise<{ success: boolean; matched_origin?: Station; matched_destination?: Station; plan?: JourneyPlan; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/journey/assist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, preference })
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: 'Unable to reach transport assistant server. Please check your network connection.'
    };
  }
}

function calculateOfflineJourney(originId: string, destId: string): JourneyPlan {
  const rawStations = localStorage.getItem(CACHE_KEYS.STATIONS);
  if (!rawStations) {
    throw new Error('Offline error: No cached station data available.');
  }

  const allStations: Station[] = JSON.parse(rawStations);
  const stationMap = new Map<string, Station>();
  allStations.forEach((s) => stationMap.set(s.id, s));

  const orig = stationMap.get(originId);
  const dest = stationMap.get(destId);

  if (!orig || !dest) {
    throw new Error('Selected origin or destination station is not found in local cache.');
  }

  const dist = +(
    Math.sqrt(Math.pow(dest.lat - orig.lat, 2) + Math.pow(dest.lon - orig.lon, 2)) * 111
  ).toFixed(2);
  const time = Math.max(4, Math.round(dist * 1.8));

  let fare = 10;
  if (dist > 9) fare = 50;
  else if (dist > 6) fare = 40;
  else if (dist > 4) fare = 30;
  else if (dist > 2) fare = 20;

  const isTransfer = orig.line_id !== dest.line_id;
  const isFullyOperational = orig.status === 'operational' && dest.status === 'operational';

  const steps: RouteStep[] = [
    {
      station_id: orig.id,
      station_name: orig.name,
      station_name_ta: orig.name_ta,
      line_id: orig.line_id,
      line_name: orig.system_type,
      line_color: '#0284c7',
      lat: orig.lat,
      lon: orig.lon,
      distance_from_prev: 0,
      time_from_prev: 0,
      is_transfer: false,
      instruction: `Board at ${orig.name}`,
      status: orig.status
    },
    {
      station_id: dest.id,
      station_name: dest.name,
      station_name_ta: dest.name_ta,
      line_id: dest.line_id,
      line_name: dest.system_type,
      line_color: dest.line_id === 'green' ? '#16a34a' : '#0284c7',
      lat: dest.lat,
      lon: dest.lon,
      distance_from_prev: dist,
      time_from_prev: time,
      is_transfer: isTransfer,
      instruction: `Arrive at destination: ${dest.name}`,
      status: dest.status
    }
  ];

  return {
    origin: orig,
    destination: dest,
    total_distance_km: dist,
    estimated_duration_mins: time,
    fare_inr: fare,
    interchange_count: isTransfer ? 1 : 0,
    stops_count: 2,
    steps,
    lines_used: [orig.line_id, dest.line_id],
    is_fully_operational: isFullyOperational,
    notice: !isFullyOperational ? 'Note: Route contains upcoming Phase II stations under construction.' : undefined
  };
}

export async function fetchLiveTrains(): Promise<{
  trains: ActiveTrain[];
  disclaimer: string;
  trackingMode: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${API_BASE}/trains/live`, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return {
        trains: data.data || [],
        disclaimer: data.disclaimer || '',
        trackingMode: data.tracking_mode || 'SCHEDULE_BASED_SIMULATION'
      };
    }
  } catch (err) {}

  return {
    trains: [],
    disclaimer: 'Live train telemetry is available for operational corridors (Blue and Green lines).',
    trackingMode: 'OPERATIONAL_FLEET_SIMULATION'
  };
}

// Favorite Stations (Public, LocalStorage)
export function getFavoriteStations(): string[] {
  try {
    const raw = localStorage.getItem(CACHE_KEYS.FAV_STATIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isFavoriteStation(stationId: string): boolean {
  const favs = getFavoriteStations();
  return favs.includes(stationId);
}

export function toggleFavoriteStation(stationId: string): string[] {
  const current = getFavoriteStations();
  let updated: string[];
  if (current.includes(stationId)) {
    updated = current.filter((id) => id !== stationId);
  } else {
    updated = [stationId, ...current].slice(0, 30);
  }
  try {
    localStorage.setItem(CACHE_KEYS.FAV_STATIONS, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function removeFavoriteStation(stationId: string): string[] {
  const current = getFavoriteStations();
  const updated = current.filter((id) => id !== stationId);
  try {
    localStorage.setItem(CACHE_KEYS.FAV_STATIONS, JSON.stringify(updated));
  } catch {}
  return updated;
}

// Favorite Journeys (Public, LocalStorage)
export function getFavoriteJourneys(): FavoriteJourney[] {
  try {
    const raw = localStorage.getItem(CACHE_KEYS.FAV_JOURNEYS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isFavoriteJourney(origId: string, destId: string): boolean {
  const favs = getFavoriteJourneys();
  return favs.some((j) => j.origin_station_id === origId && j.dest_station_id === destId);
}

export function saveFavoriteJourney(
  originStation: Station,
  destStation: Station,
  preference?: any
): FavoriteJourney[] {
  const current = getFavoriteJourneys();
  const exists = current.some(
    (j) => j.origin_station_id === originStation.id && j.dest_station_id === destStation.id
  );
  if (!exists) {
    const newFav: FavoriteJourney = {
      id: `fav_${originStation.id}_${destStation.id}_${Date.now()}`,
      origin_station_id: originStation.id,
      dest_station_id: destStation.id,
      origin_name: originStation.name,
      origin_name_ta: originStation.name_ta,
      dest_name: destStation.name,
      dest_name_ta: destStation.name_ta,
      preference,
      added_at: Date.now()
    };
    const updated = [newFav, ...current].slice(0, 20);
    try {
      localStorage.setItem(CACHE_KEYS.FAV_JOURNEYS, JSON.stringify(updated));
    } catch {}
    return updated;
  }
  return current;
}

export function removeFavoriteJourney(id: string): FavoriteJourney[] {
  const current = getFavoriteJourneys();
  const updated = current.filter((j) => j.id !== id);
  try {
    localStorage.setItem(CACHE_KEYS.FAV_JOURNEYS, JSON.stringify(updated));
  } catch {}
  return updated;
}

// Local Saved Journeys (No login required - legacy wrapper)
export function getLocalSavedJourneys(): SavedJourney[] {
  try {
    const raw = localStorage.getItem(CACHE_KEYS.SAVED_TRIPS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalJourney(originStation: Station, destStation: Station): SavedJourney[] {
  const current = getLocalSavedJourneys();
  const exists = current.some(
    (j) => j.origin_station_id === originStation.id && j.dest_station_id === destStation.id
  );
  if (!exists) {
    const newTrip: SavedJourney = {
      id: Date.now(),
      origin_station_id: originStation.id,
      dest_station_id: destStation.id,
      origin_name: originStation.name,
      dest_name: destStation.name,
      created_at: new Date().toISOString()
    };
    const updated = [newTrip, ...current].slice(0, 15);
    localStorage.setItem(CACHE_KEYS.SAVED_TRIPS, JSON.stringify(updated));
    return updated;
  }
  return current;
}

export function removeLocalSavedJourney(id: number): SavedJourney[] {
  const current = getLocalSavedJourneys();
  const updated = current.filter((j) => j.id !== id);
  localStorage.setItem(CACHE_KEYS.SAVED_TRIPS, JSON.stringify(updated));
  return updated;
}

// Recent Completed Journey Searches (Up to 10, LocalStorage)
export function getRecentTrips(): RecentTrip[] {
  try {
    const raw = localStorage.getItem(CACHE_KEYS.RECENT_SEARCHES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch (err) {
    console.warn('Failed to parse recent trips:', err);
    return [];
  }
}

export function saveRecentTrip(trip: Omit<RecentTrip, 'id' | 'timestamp'>): RecentTrip[] {
  try {
    const current = getRecentTrips();
    // Filter out if already exists with identical origin and destination
    const filtered = current.filter(
      (t) => !(t.origin_id === trip.origin_id && t.dest_id === trip.dest_id)
    );
    const newEntry: RecentTrip = {
      ...trip,
      id: `${trip.origin_id}_${trip.dest_id}_${Date.now()}`,
      timestamp: Date.now()
    };
    const updated = [newEntry, ...filtered].slice(0, 10);
    localStorage.setItem(CACHE_KEYS.RECENT_SEARCHES, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to save recent trip:', err);
    return [];
  }
}

export function clearRecentTrips(): void {
  try {
    localStorage.removeItem(CACHE_KEYS.RECENT_SEARCHES);
  } catch (err) {
    console.warn('Failed to clear recent trips:', err);
  }
}

export function removeRecentTrip(tripId: string): RecentTrip[] {
  try {
    const current = getRecentTrips();
    const updated = current.filter((t) => t.id !== tripId);
    localStorage.setItem(CACHE_KEYS.RECENT_SEARCHES, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to remove recent trip:', err);
    return [];
  }
}

// Fallback Data Sources Registry
export const FALLBACK_SOURCES: TransitDataSource[] = [
  {
    id: 'cmrl_official',
    title: 'Chennai Metro Rail Limited (CMRL) Official Portal',
    category: 'metro',
    organization: 'Chennai Metro Rail Limited (CMRL)',
    url: 'https://chennaimetrorail.org/',
    specific_page_url: 'https://chennaimetrorail.org/route-map/',
    description: 'Official statutory website of CMRL detailing operational Blue Line and Green Line alignments, train frequency, smartcard fares, and station amenities.',
    supports_data: 'Phase 1 & Phase 1 Ext Blue Line (Wimco Nagar–Airport, 26 stations) and Green Line (Central–St. Thomas Mount, 17 stations) timetable, station facilities, and fare slabs.',
    last_verified: 'October 2026',
    verification_status: 'verified',
    is_official: 1,
    notes: 'Primary statutory authority for all Chennai Metro rapid transit services.'
  },
  {
    id: 'cmrl_phase2',
    title: 'CMRL Phase II Detailed Project Alignment & Corridor Plan',
    category: 'metro',
    organization: 'Chennai Metro Rail Limited (CMRL)',
    url: 'https://chennaimetrorail.org/',
    specific_page_url: 'https://chennaimetrorail.org/phase-ii-project/',
    description: 'Official Detailed Project Report (DPR) alignment covering 118.9 km across Corridor 3 (Madhavaram–SIPCOT), Corridor 4 (Poonamallee–Lighthouse), and Corridor 5 (Madhavaram–Sholinganallur).',
    supports_data: 'Phase II station sequences, interchange hubs (Vadapalani, Alandur, Thirumayilai, Porur Junction), tunnel construction milestones, and projected completion schedules.',
    last_verified: 'October 2026',
    verification_status: 'partially_verified',
    is_official: 1,
    notes: 'Corridors currently under active phased construction; non-revenue segments excluded from active journey calculations.'
  },
  {
    id: 'sr_north_line',
    title: 'Southern Railway Chennai Division — Northern EMU Suburban Timetable',
    category: 'suburban_north',
    organization: 'Southern Railway (SR) / Indian Railways',
    url: 'https://sr.indianrailways.gov.in/',
    specific_page_url: 'https://sr.indianrailways.gov.in/view_section.jsp?lang=0&id=0,4,268',
    description: 'Official Southern Railway suburban working timetable for the Moore Market Complex (MASS) to Sullurupeta (SPE) northern route.',
    supports_data: 'Complete 22-station sequence (MASS to SPE), Gummidipoondi major terminating EMU turnover loops, and interstate reach into Andhra Pradesh.',
    last_verified: 'October 2026',
    verification_status: 'verified',
    is_official: 1,
    notes: 'Official government timetable for unreserved EMU local passenger services.'
  },
  {
    id: 'railyatri_north',
    title: 'RailYatri Chennai Suburban North Timetable & Stopping Patterns',
    category: 'suburban_north',
    organization: 'RailYatri (Stelling Technologies Pvt. Ltd.)',
    url: 'https://www.railyatri.in/',
    specific_page_url: 'https://www.railyatri.in/local-trains/chennai-local-train-time-table',
    description: 'Independent railway informatics portal tracking local EMU running patterns, station codes, platform arrangements, and intermediate halt durations.',
    supports_data: 'Station codes (VOC, KAV, ENR, MJR, PON, GPD, TADA, SPE), track arrangements, and commuter stopping frequencies.',
    last_verified: 'October 2026',
    verification_status: 'verified',
    is_official: 0,
    notes: 'Third-party timetable reference; corroborated against Southern Railway operational records.'
  },
  {
    id: 'sr_south_line',
    title: 'Southern Railway — Chennai Beach to Chengalpattu Suburban Corridor',
    category: 'suburban_south',
    organization: 'Southern Railway (SR) / Indian Railways',
    url: 'https://sr.indianrailways.gov.in/',
    specific_page_url: 'https://sr.indianrailways.gov.in/view_section.jsp?lang=0&id=0,4,268',
    description: 'Southern Railway official timetable for the premier southern arterial commuter corridor serving IT and automotive corridors.',
    supports_data: '28 verified stations from Chennai Beach (MSB) to Chengalpattu Junction (CGL) via Tambaram, Guindy, and Tirusulam (Airport), plus peak 8-15 min headways.',
    last_verified: 'October 2026',
    verification_status: 'verified',
    is_official: 1,
    notes: 'Broad-gauge electrified quadruple-track suburban line with dedicated local tracks.'
  },
  {
    id: 'erail_south',
    title: 'eRail Chennai Beach–Tambaram–Chengalpattu Suburban EMU Directory',
    category: 'suburban_south',
    organization: 'eRail.in',
    url: 'https://erail.in/',
    specific_page_url: 'https://erail.in/local-trains/chennai-beach-to-chengalpattu',
    description: 'Comprehensive train search platform cataloging intermediate distances, platform lines, and Southern Railway EMU train numbers.',
    supports_data: 'Official station codes (MSB, MS, MBM, TBM, PRGL, CGL), distances in kilometers, and express vs slow local schedules.',
    last_verified: 'October 2026',
    verification_status: 'verified',
    is_official: 0,
    notes: 'Widely used unreserved timetable mirror platform.'
  },
  {
    id: 'sr_west_line',
    title: 'Southern Railway Chennai Division — Western Suburban Mainline',
    category: 'suburban_west',
    organization: 'Southern Railway (SR) / Indian Railways',
    url: 'https://sr.indianrailways.gov.in/',
    specific_page_url: 'https://sr.indianrailways.gov.in/view_section.jsp?lang=0&id=0,4,268',
    description: 'Official Southern Railway suburban service timetable from Chennai Central (Moore Market Complex) to Arakkonam Junction.',
    supports_data: '31 verified stations (MASS to AJJ), Avadi and Tiruvallur turnaround loops, and Pattabiram Military Siding (PTMS) & East Depot (PRES) defense spur connection.',
    last_verified: 'October 2026',
    verification_status: 'verified',
    is_official: 1,
    notes: 'Heavy-density four-track trunk corridor with segregated suburban EMU operations.'
  },
  {
    id: 'erail_west',
    title: 'eRail Chennai Central MMC to Arakkonam Junction EMU Schedule',
    category: 'suburban_west',
    organization: 'eRail.in',
    url: 'https://erail.in/',
    specific_page_url: 'https://erail.in/local-trains/chennai-central-to-arakkonam',
    description: 'Independent schedule database detailing running times, fast local stopping patterns, and Arakkonam terminal platform allocations.',
    supports_data: 'Intermediate running durations, station codes (MASS, BBQ, PER, VLK, AVD, TRL, AJJ), and suburban fare stages.',
    last_verified: 'October 2026',
    verification_status: 'verified',
    is_official: 0,
    notes: 'Corroborates Southern Railway timetable for Western division.'
  },
  {
    id: 'sr_cgl_ajj_link',
    title: 'Southern Railway — Chengalpattu Junction to Arakkonam Junction Link Corridor',
    category: 'suburban_west_south',
    organization: 'Southern Railway (SR) / Indian Railways',
    url: 'https://sr.indianrailways.gov.in/',
    specific_page_url: 'https://sr.indianrailways.gov.in/view_section.jsp?lang=0&id=0,4,268',
    description: 'Official Southern Railway divisional operational records for the single/double electrified line connecting South and West suburban networks via Kanchipuram.',
    supports_data: '13 stations sequence: Chengalpattu Junction (CGL), Reddipalayam, Villiyambakkam, Palur, Pazhaya Seevaram, Walajabad, Nathapettai, Kanchipuram East, Kanchipuram (CJ), Tirumalpur (TMLP), Takkolam, Melpakkam, and Arakkonam Junction (AJJ).',
    last_verified: 'October 2026',
    verification_status: 'verified',
    is_official: 1,
    notes: 'Key circumferential rail connector enabling loop services between Chennai Beach and Central.'
  },
  {
    id: 'erail_cgl_ajj',
    title: 'eRail Chengalpattu–Kanchipuram–Tirumalpur–Arakkonam Passenger Services',
    category: 'suburban_west_south',
    organization: 'eRail.in',
    url: 'https://erail.in/',
    specific_page_url: 'https://erail.in/trains-between-stations/chengalpattu-cgl/arakkonam-ajj',
    description: 'Railway routing database tracking passenger shuttles and Chennai Beach–Tirumalpur–Arakkonam circular EMU train runs.',
    supports_data: 'Station codes (CGL, PALR, WJ, CJE, CJ, TMLP, TKO, MLPM, AJJ), 67.2 km route distance, and Tirumalpur EMU turnaround schedules.',
    last_verified: 'October 2026',
    verification_status: 'verified',
    is_official: 0,
    notes: 'Reference for through-EMU services linking Kanchipuram silk weaving hub directly to Chennai metropolitan area.'
  },
  {
    id: 'sr_mrts',
    title: 'Southern Railway Chennai Beach – Velachery Elevated MRTS Division',
    category: 'mrts',
    organization: 'Southern Railway / CMRL Integration Team',
    url: 'https://sr.indianrailways.gov.in/',
    specific_page_url: 'https://sr.indianrailways.gov.in/view_section.jsp?lang=0&id=0,4,268',
    description: 'Official Southern Railway MRTS timetable and operational notices regarding the Chennai Beach to Velachery elevated railway line.',
    supports_data: '18 stations from Chennai Beach (MR01) to Velachery (MR18) via Chepauk, Thirumayilai (Mylapore), Kasturba Nagar, and Thiruvanmiyur; includes St. Thomas Mount final link status.',
    last_verified: 'October 2026',
    verification_status: 'verified',
    is_official: 1,
    notes: 'Dedicated grade-separated broad-gauge elevated corridor under handover integration with CMRL.'
  },
  {
    id: 'mtc_official',
    title: 'Metropolitan Transport Corporation (Chennai) Limited (MTC)',
    category: 'bus',
    organization: 'Metropolitan Transport Corporation (MTC)',
    url: 'https://mtcbus.tn.gov.in/',
    specific_page_url: 'https://mtcbus.tn.gov.in/Home/busroutes',
    description: 'Official public bus transit operator for Chennai Metropolitan Area providing inter-modal feeder services to Metro and suburban rail hubs.',
    supports_data: 'Feeder bus route schedules connecting Koyambedu CMBT, Chennai Central, Guindy, Airport, Tambaram, and Poonamallee corridors (Routes 54, 88K, 101, 70V).',
    last_verified: 'October 2026',
    verification_status: 'verified',
    is_official: 1,
    notes: 'Primary road-based feeder network for Chennai multimodal transit.'
  },
  {
    id: 'indian_railways',
    title: 'Ministry of Railways / Indian Railways Official Portal',
    category: 'general',
    organization: 'Government of India',
    url: 'https://indianrailways.gov.in/',
    specific_page_url: 'https://indianrailways.gov.in/',
    description: 'National apex railway portal establishing standard suburban second-class fare slabs, passenger safety guidelines, and station classifications.',
    supports_data: 'Standard ₹5 (0-10km), ₹10 (10-25km), ₹15 (25-45km), ₹20 (45+km) suburban fare slabs applied uniformly across Southern Railway Chennai Division.',
    last_verified: 'October 2026',
    verification_status: 'verified',
    is_official: 1,
    notes: 'Statutory fare and safety framework governing all suburban railway operations.'
  },
  {
    id: 'cris_uts',
    title: 'Centre for Railway Information Systems (CRIS) — UTS on Mobile',
    category: 'general',
    organization: 'CRIS / Indian Railways',
    url: 'https://www.utsonmobile.indianrail.gov.in/',
    specific_page_url: 'https://www.utsonmobile.indianrail.gov.in/',
    description: 'Official unreserved paperless ticket booking system for Southern Railway suburban train services in the Chennai Metropolitan Area.',
    supports_data: 'Digital suburban ticketing guidelines, monthly season pass rules, and geo-fenced QR ticketing rules.',
    last_verified: 'October 2026',
    verification_status: 'verified',
    is_official: 1,
    notes: 'Official digital ticketing platform for suburban railway passengers.'
  }
];

// Fetch Data Sources from Backend or Fallback Cache
export async function fetchDataSources(category?: string): Promise<TransitDataSource[]> {
  try {
    const url = category && category !== 'all' ? `${API_BASE}/sources?category=${encodeURIComponent(category)}` : `${API_BASE}/sources`;
    const res = await fetch(url);
    const json = await res.json();
    const items = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
    if (items.length > 0) {
      try {
        localStorage.setItem(CACHE_KEYS.SOURCES, JSON.stringify(items));
      } catch {}
      return items;
    }
  } catch (err) {
    console.warn('Backend /api/sources fetch failed, using fallback sources:', err);
  }

  // Attempt local cache
  try {
    const cached = localStorage.getItem(CACHE_KEYS.SOURCES);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (category && category !== 'all') {
          return parsed.filter((s: TransitDataSource) => s.category === category);
        }
        return parsed;
      }
    }
  } catch {}

  // Fallback constant
  if (category && category !== 'all') {
    return FALLBACK_SOURCES.filter((s) => s.category === category);
  }
  return FALLBACK_SOURCES;
}

