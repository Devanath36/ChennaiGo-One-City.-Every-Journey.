import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const DB_PATH = path.resolve(process.cwd(), 'data', 'chennai_transit.db');
console.log(`[Migration] Adding West–South Link Corridor (CGL to AJJ) to SQLite: ${DB_PATH}`);

const db = new DatabaseSync(DB_PATH);

// 1. Insert or update transit line for suburban_west_south
db.prepare(`
  INSERT INTO transit_lines (
    id, name, short_name, color, text_color, description, system_type,
    total_stations, total_km, operating_hours, headway_peak, headway_offpeak,
    status, phase, target_completion
  ) VALUES (
    'suburban_west_south',
    'West–South Link Line',
    'West–South Link',
    '#e11d48',
    '#ffffff',
    'Chengalpattu Junction (CGL) to Arakkonam Junction (AJJ) via Palur, Walajabad, Kanchipuram, and Tirumalpur',
    'Suburban',
    13,
    67.2,
    '04:45 - 22:30',
    30,
    60,
    'operational',
    'Southern Railway',
    'Operational'
  )
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    short_name = excluded.short_name,
    color = excluded.color,
    description = excluded.description,
    total_stations = excluded.total_stations,
    total_km = excluded.total_km,
    operating_hours = excluded.operating_hours,
    headway_peak = excluded.headway_peak,
    headway_offpeak = excluded.headway_offpeak,
    status = excluded.status,
    phase = excluded.phase,
    target_completion = excluded.target_completion;
`).run();
console.log('[Migration] Inserted transit_lines record for suburban_west_south.');

// 2. Ensure existing endpoint stations SB28 (CGL) and SW31 (AJJ) have updated interchange notes
db.prepare(`
  UPDATE stations 
  SET is_interchange = 1,
      interchange_info = 'Major Southern Railway Junction connecting Suburban South Line (Chennai Beach–Chengalpattu) and West–South Link Corridor to Kanchipuram & Arakkonam Junction'
  WHERE id = 'SB28';
`).run();

db.prepare(`
  UPDATE stations 
  SET is_interchange = 1,
      interchange_info = 'Major Southern Railway Divisional Junction & Suburban Terminal connecting Suburban West Line (MMC–Arakkonam) and West–South Link Corridor to Kanchipuram & Chengalpattu'
  WHERE id = 'SW31';
`).run();

// 3. Insert intermediate stations (WS02 through WS12)
const insertStation = db.prepare(`
  INSERT OR REPLACE INTO stations (
    id, name, name_ta, code, line_id, lat, lon, is_interchange, interchange_info,
    system_type, zone, platform_count, has_parking, has_feeder_bus, has_wheelchair,
    has_lifts, has_ev_charging, first_train, last_train, status, phase, target_completion
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const intermediateStations = [
  {
    id: 'WS02',
    name: 'Reddipalayam',
    name_ta: 'ரெட்டிபாளையம்',
    code: 'RDY',
    lat: 12.7050,
    lon: 79.9480,
    is_interchange: 0,
    interchange_info: 'Suburban railway stop serving Reddipalayam agricultural & residential catchment',
    zone: 'Chengalpattu Taluk'
  },
  {
    id: 'WS03',
    name: 'Villiyambakkam',
    name_ta: 'வில்லியம்பாக்கம்',
    code: 'VB',
    lat: 12.7210,
    lon: 79.9190,
    is_interchange: 0,
    interchange_info: 'Suburban halt serving Villiyambakkam and surrounding rural settlements',
    zone: 'Chengalpattu Taluk'
  },
  {
    id: 'WS04',
    name: 'Palur',
    name_ta: 'பாலூர்',
    code: 'PALR',
    lat: 12.7480,
    lon: 79.8820,
    is_interchange: 0,
    interchange_info: 'Suburban station serving Palur agricultural and handloom cluster along Palar River basin',
    zone: 'Chengalpattu Taluk'
  },
  {
    id: 'WS05',
    name: 'Pazhaya Seevaram',
    name_ta: 'பழைய சீவரம்',
    code: 'PYV',
    lat: 12.7830,
    lon: 79.8450,
    is_interchange: 0,
    interchange_info: 'Historical locality also known as Palayasivaram; home to Sri Lakshmi Narasimha Swamy Temple',
    zone: 'Walajabad Taluk'
  },
  {
    id: 'WS06',
    name: 'Walajabad',
    name_ta: 'வாலாஜாபாத்',
    code: 'WJ',
    lat: 12.8020,
    lon: 79.8130,
    is_interchange: 1,
    interchange_info: 'Suburban town station and key automobile freight hub with MTC/TNSTC bus connectivity',
    zone: 'Walajabad Taluk'
  },
  {
    id: 'WS07',
    name: 'Nathapettai',
    name_ta: 'நாதப்பேட்டை',
    code: 'NTT',
    lat: 12.8210,
    lon: 79.7420,
    is_interchange: 0,
    interchange_info: 'Suburban stop approaching Kanchipuram eastern industrial and weaving outskirts',
    zone: 'Kanchipuram District'
  },
  {
    id: 'WS08',
    name: 'Kanchipuram East',
    name_ta: 'காஞ்சிபுரம் கிழக்கு',
    code: 'CJE',
    lat: 12.8360,
    lon: 79.7210,
    is_interchange: 0,
    interchange_info: 'Suburban station serving Kanchipuram eastern residential areas, silk weaving co-operatives, and Collectorate office',
    zone: 'Kanchipuram Urban'
  },
  {
    id: 'WS09',
    name: 'Kanchipuram',
    name_ta: 'காஞ்சிபுரம்',
    code: 'CJ',
    lat: 12.8420,
    lon: 79.7020,
    is_interchange: 1,
    interchange_info: 'Major historical temple city & silk capital. Key junction for Sri Kamakshi Amman, Ekambareswarar & Varadharaja Perumal temples with bus connections to Vellore & Bengaluru',
    zone: 'Kanchipuram Urban'
  },
  {
    id: 'WS10',
    name: 'Tirumalpur',
    name_ta: 'திருமால்பூர்',
    code: 'TMLP',
    lat: 12.9230,
    lon: 79.6910,
    is_interchange: 1,
    interchange_info: 'Major suburban terminus station; originating/terminating point for Chennai Beach–Tirumalpur EMU locals with yard and loop tracks',
    zone: 'Nemili Taluk'
  },
  {
    id: 'WS11',
    name: 'Takkolam',
    name_ta: 'தக்கோலம்',
    code: 'TKO',
    lat: 13.0120,
    lon: 79.6840,
    is_interchange: 0,
    interchange_info: 'Historical township (Battle of Takkolam, 949 CE); serving Central Industrial Security Force (CISF) RTC base and Sri Jalanatheeswarar Temple',
    zone: 'Ranipet District'
  },
  {
    id: 'WS12',
    name: 'Melpakkam',
    name_ta: 'மேல்பாக்கம்',
    code: 'MLPM',
    lat: 13.0610,
    lon: 79.6730,
    is_interchange: 0,
    interchange_info: 'Suburban cabin and halt preceding Arakkonam Junction; junction for freight chords bypassing AJJ towards Renigunta/Katpadi',
    zone: 'Arakkonam Taluk'
  }
];

for (const s of intermediateStations) {
  insertStation.run(
    s.id,
    s.name,
    s.name_ta,
    s.code,
    'suburban_west_south',
    s.lat,
    s.lon,
    s.is_interchange,
    s.interchange_info,
    'Suburban',
    s.zone,
    3,
    1,
    1,
    1,
    1,
    0,
    '04:45',
    '22:30',
    'operational',
    'Southern Railway',
    'Operational'
  );
}
console.log('[Migration] Inserted 11 intermediate stations (WS02 through WS12).');

// 4. Connect all 13 stations in sequence
// Sequence: SB28 -> WS02 -> WS03 -> WS04 -> WS05 -> WS06 -> WS07 -> WS08 -> WS09 -> WS10 -> WS11 -> WS12 -> SW31
const insertConn = db.prepare(`
  INSERT INTO connections (from_station_id, to_station_id, line_id, distance_km, travel_time_mins, is_transfer)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const safeAddConn = (from: string, to: string, dist: number, time: number) => {
  const exists = db.prepare('SELECT count(*) as count FROM connections WHERE from_station_id = ? AND to_station_id = ? AND line_id = ?').get(from, to, 'suburban_west_south') as any;
  if (!exists || exists.count === 0) {
    try {
      insertConn.run(from, to, 'suburban_west_south', dist, time, 0);
      insertConn.run(to, from, 'suburban_west_south', dist, time, 0);
    } catch (e) {}
  }
};

const linkSegments = [
  { from: 'SB28', to: 'WS02', dist: 4.5, time: 6 },  // Chengalpattu Junction <-> Reddipalayam
  { from: 'WS02', to: 'WS03', dist: 4.1, time: 5 },  // Reddipalayam <-> Villiyambakkam
  { from: 'WS03', to: 'WS04', dist: 4.9, time: 6 },  // Villiyambakkam <-> Palur
  { from: 'WS04', to: 'WS05', dist: 5.8, time: 7 },  // Palur <-> Pazhaya Seevaram
  { from: 'WS05', to: 'WS06', dist: 4.3, time: 5 },  // Pazhaya Seevaram <-> Walajabad
  { from: 'WS06', to: 'WS07', dist: 8.5, time: 10 }, // Walajabad <-> Nathapettai
  { from: 'WS07', to: 'WS08', dist: 2.6, time: 4 },  // Nathapettai <-> Kanchipuram East
  { from: 'WS08', to: 'WS09', dist: 2.4, time: 4 },  // Kanchipuram East <-> Kanchipuram
  { from: 'WS09', to: 'WS10', dist: 9.8, time: 11 }, // Kanchipuram <-> Tirumalpur
  { from: 'WS10', to: 'WS11', dist: 10.5, time: 12 },// Tirumalpur <-> Takkolam
  { from: 'WS11', to: 'WS12', dist: 5.8, time: 7 },  // Takkolam <-> Melpakkam
  { from: 'WS12', to: 'SW31', dist: 4.0, time: 5 }   // Melpakkam <-> Arakkonam Junction
];

for (const seg of linkSegments) {
  safeAddConn(seg.from, seg.to, seg.dist, seg.time);
}
console.log('[Migration] Added all track connections for West–South Link Corridor.');

console.log('[Migration] Migration complete!');
