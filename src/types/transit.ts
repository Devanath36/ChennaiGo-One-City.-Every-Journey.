export type CorridorStatus = 'operational' | 'under_construction' | 'planned';
export type TransportPreference = 'best' | 'metro' | 'suburban';

export type VerificationStatus = 'verified' | 'partially_verified' | 'unverified' | 'needs_review';

export type SourceCategory =
  | 'metro'
  | 'suburban_north'
  | 'suburban_south'
  | 'suburban_west'
  | 'suburban_west_south'
  | 'mrts'
  | 'bus'
  | 'general';

export interface TransitDataSource {
  id: string;
  title: string;
  category: SourceCategory;
  organization: string;
  url: string;
  specific_page_url?: string;
  description: string;
  supports_data: string;
  last_verified: string;
  verification_status: VerificationStatus;
  is_official: boolean | number;
  notes?: string;
}

export interface TransitLine {
  id: string;
  name: string;
  short_name: string;
  color: string;
  text_color: string;
  description: string;
  system_type: 'Metro' | 'MRTS' | 'Suburban';
  total_stations: number;
  total_km: number;
  operating_hours: string;
  headway_peak: number;
  headway_offpeak: number;
  status: CorridorStatus;
  phase: string;
  target_completion?: string;
  primary_source_id?: string;
}

export interface Station {
  id: string;
  name: string;
  name_ta: string;
  code: string;
  line_id: string;
  lat: number;
  lon: number;
  is_interchange: number;
  interchange_info: string | null;
  system_type: string;
  zone: string;
  platform_count: number;
  has_parking: number;
  has_feeder_bus: number;
  has_wheelchair: number;
  has_lifts: number;
  has_ev_charging: number;
  first_train: string;
  last_train: string;
  status: CorridorStatus;
  phase: string;
  target_completion?: string;
  line_name?: string;
  line_short_name?: string;
  line_color?: string;
  headway_peak?: number;
  headway_offpeak?: number;
  line_operating_hours?: string;
  primary_source_id?: string;
}

export interface RouteConnection {
  id: number;
  from_station_id: string;
  to_station_id: string;
  line_id: string;
  distance_km: number;
  travel_time_mins: number;
  is_transfer: number;
}

export interface RouteStep {
  station_id: string;
  station_name: string;
  station_name_ta: string;
  line_id: string;
  line_name: string;
  line_color: string;
  lat: number;
  lon: number;
  distance_from_prev: number;
  time_from_prev: number;
  is_transfer: boolean;
  instruction?: string;
  status?: CorridorStatus;
}

export interface JourneyPlan {
  origin: Station;
  destination: Station;
  total_distance_km: number;
  estimated_duration_mins: number;
  fare_inr: number;
  interchange_count: number;
  stops_count: number;
  intermediate_stops_count?: number;
  direction?: string;
  direction_ta?: string;
  steps: RouteStep[];
  lines_used: string[];
  is_fully_operational: boolean;
  notice?: string;
  alternative_note?: string;
}

export type JourneyOptionTag = 'recommended' | 'fewest_transfers' | 'metro_preferred' | 'suburban_preferred' | 'fastest';

export interface JourneyOption extends JourneyPlan {
  id: string;
  option_type: 'best' | 'fewest_transfers' | 'metro' | 'suburban' | 'alternative';
  title: string;
  title_ta?: string;
  tag: JourneyOptionTag;
  tag_label: string;
  tag_label_ta?: string;
  ranking_reason: string;
  ranking_reason_ta?: string;
  mode_types: string[];
}

export interface FavoriteStation {
  station_id: string;
  added_at: number;
}

export interface FavoriteJourney {
  id: string;
  origin_station_id: string;
  dest_station_id: string;
  origin_name: string;
  origin_name_ta?: string;
  dest_name: string;
  dest_name_ta?: string;
  preference?: TransportPreference;
  added_at: number;
}

export interface SavedJourney {
  id: number;
  origin_station_id: string;
  dest_station_id: string;
  origin_name: string;
  dest_name: string;
  created_at: string;
}

export interface RecentTrip {
  id: string;
  origin_id: string;
  origin_name: string;
  origin_name_ta?: string;
  origin_code?: string;
  origin_line_id?: string;
  dest_id: string;
  dest_name: string;
  dest_name_ta?: string;
  dest_code?: string;
  dest_line_id?: string;
  preference: TransportPreference;
  duration_mins?: number;
  distance_km?: number;
  fare_inr?: number;
  interchange_count?: number;
  lines_used?: string[];
  is_fully_operational?: boolean;
  timestamp: number;
}

export interface ActiveTrain {
  id: string;
  line_id: string;
  train_number: string;
  model: string;
  current_status: string;
  speed_kmh: number;
  origin_station_id: string;
  dest_station_id: string;
  current_station_id: string;
  next_station_id: string;
  progress_pct: number;
  current_lat: number;
  current_lon: number;
  current_station_name: string;
  next_station_name: string;
  eta_mins: number;
  is_simulated: boolean;
  simulation_notice: string;
}
