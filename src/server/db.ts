import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.resolve(DB_DIR, 'chennai_transit.db');
console.log(`[Database] Initializing SQLite database at ${DB_PATH}`);

export const db = new DatabaseSync(DB_PATH);

// Run migrations & table creations
db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS transit_lines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    color TEXT NOT NULL,
    text_color TEXT NOT NULL DEFAULT '#ffffff',
    description TEXT,
    system_type TEXT NOT NULL,
    total_stations INTEGER NOT NULL,
    total_km REAL NOT NULL,
    operating_hours TEXT NOT NULL,
    headway_peak INTEGER NOT NULL,
    headway_offpeak INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'operational',
    phase TEXT NOT NULL DEFAULT 'Phase 1',
    target_completion TEXT
  );

  CREATE TABLE IF NOT EXISTS stations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_ta TEXT NOT NULL,
    code TEXT NOT NULL,
    line_id TEXT NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    is_interchange INTEGER NOT NULL DEFAULT 0,
    interchange_info TEXT,
    system_type TEXT NOT NULL,
    zone TEXT NOT NULL,
    platform_count INTEGER NOT NULL DEFAULT 2,
    has_parking INTEGER NOT NULL DEFAULT 1,
    has_feeder_bus INTEGER NOT NULL DEFAULT 1,
    has_wheelchair INTEGER NOT NULL DEFAULT 1,
    has_lifts INTEGER NOT NULL DEFAULT 1,
    has_ev_charging INTEGER NOT NULL DEFAULT 0,
    first_train TEXT NOT NULL,
    last_train TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'operational',
    phase TEXT NOT NULL DEFAULT 'Phase 1',
    target_completion TEXT,
    FOREIGN KEY(line_id) REFERENCES transit_lines(id)
  );

  CREATE TABLE IF NOT EXISTS connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_station_id TEXT NOT NULL,
    to_station_id TEXT NOT NULL,
    line_id TEXT NOT NULL,
    distance_km REAL NOT NULL,
    travel_time_mins REAL NOT NULL,
    is_transfer INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(from_station_id) REFERENCES stations(id),
    FOREIGN KEY(to_station_id) REFERENCES stations(id)
  );

  CREATE TABLE IF NOT EXISTS trains (
    id TEXT PRIMARY KEY,
    line_id TEXT NOT NULL,
    train_number TEXT NOT NULL,
    model TEXT NOT NULL,
    current_status TEXT NOT NULL,
    speed_kmh REAL NOT NULL,
    origin_station_id TEXT NOT NULL,
    dest_station_id TEXT NOT NULL,
    current_station_id TEXT NOT NULL,
    next_station_id TEXT NOT NULL,
    progress_pct REAL NOT NULL,
    is_simulated INTEGER NOT NULL DEFAULT 1,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS saved_journeys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    origin_station_id TEXT NOT NULL,
    dest_station_id TEXT NOT NULL,
    origin_name TEXT NOT NULL,
    dest_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS data_sources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    organization TEXT NOT NULL,
    url TEXT NOT NULL,
    specific_page_url TEXT,
    description TEXT NOT NULL,
    supports_data TEXT NOT NULL,
    last_verified TEXT NOT NULL,
    verification_status TEXT NOT NULL,
    is_official INTEGER NOT NULL DEFAULT 1,
    notes TEXT
  );
`);

// Safe column migrations in case tables were previously created without status columns
try {
  db.exec("ALTER TABLE transit_lines ADD COLUMN status TEXT NOT NULL DEFAULT 'operational';");
} catch {}
try {
  db.exec("ALTER TABLE transit_lines ADD COLUMN phase TEXT NOT NULL DEFAULT 'Phase 1';");
} catch {}
try {
  db.exec("ALTER TABLE transit_lines ADD COLUMN target_completion TEXT;");
} catch {}
try {
  db.exec("ALTER TABLE transit_lines ADD COLUMN primary_source_id TEXT;");
} catch {}
try {
  db.exec("ALTER TABLE stations ADD COLUMN status TEXT NOT NULL DEFAULT 'operational';");
} catch {}
try {
  db.exec("ALTER TABLE stations ADD COLUMN phase TEXT NOT NULL DEFAULT 'Phase 1';");
} catch {}
try {
  db.exec("ALTER TABLE stations ADD COLUMN target_completion TEXT;");
} catch {}
try {
  db.exec("ALTER TABLE stations ADD COLUMN primary_source_id TEXT;");
} catch {}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_stations_line ON stations(line_id);
  CREATE INDEX IF NOT EXISTS idx_stations_status ON stations(status);
  CREATE INDEX IF NOT EXISTS idx_conn_from ON connections(from_station_id);
  CREATE INDEX IF NOT EXISTS idx_conn_to ON connections(to_station_id);
  CREATE INDEX IF NOT EXISTS idx_sources_cat ON data_sources(category);
`);

// Seed authentic data sources
db.exec(`
  INSERT OR REPLACE INTO data_sources (id, title, category, organization, url, specific_page_url, description, supports_data, last_verified, verification_status, is_official, notes)
  VALUES 
  ('cmrl_official', 'Chennai Metro Rail Limited (CMRL) Official Portal', 'metro', 'Chennai Metro Rail Limited (CMRL)', 'https://chennaimetrorail.org/', 'https://chennaimetrorail.org/route-map/', 'Official statutory website of CMRL detailing operational Blue Line and Green Line alignments, train frequency, smartcard fares, and station amenities.', 'Phase 1 & Phase 1 Ext Blue Line (Wimco Nagar–Airport, 26 stations) and Green Line (Central–St. Thomas Mount, 17 stations) timetable, station facilities, and fare slabs.', 'October 2026', 'verified', 1, 'Primary statutory authority for all Chennai Metro rapid transit services.'),
  
  ('cmrl_phase2', 'CMRL Phase II Detailed Project Alignment & Corridor Plan', 'metro', 'Chennai Metro Rail Limited (CMRL)', 'https://chennaimetrorail.org/', 'https://chennaimetrorail.org/phase-ii-project/', 'Official Detailed Project Report (DPR) alignment covering 118.9 km across Corridor 3 (Madhavaram–SIPCOT), Corridor 4 (Poonamallee–Lighthouse), and Corridor 5 (Madhavaram–Sholinganallur).', 'Phase II station sequences, interchange hubs (Vadapalani, Alandur, Thirumayilai, Porur Junction), tunnel construction milestones, and projected completion schedules.', 'October 2026', 'partially_verified', 1, 'Corridors currently under active phased construction; non-revenue segments excluded from active journey calculations.'),
  
  ('sr_north_line', 'Southern Railway Chennai Division — Northern EMU Suburban Timetable', 'suburban_north', 'Southern Railway (SR) / Indian Railways', 'https://sr.indianrailways.gov.in/', 'https://sr.indianrailways.gov.in/view_section.jsp?lang=0&id=0,4,268', 'Official Southern Railway suburban working timetable for the Moore Market Complex (MASS) to Sullurupeta (SPE) northern route.', 'Complete 22-station sequence (MASS to SPE), Gummidipoondi major terminating EMU turnover loops, and interstate reach into Andhra Pradesh.', 'October 2026', 'verified', 1, 'Official government timetable for unreserved EMU local passenger services.'),
  
  ('railyatri_north', 'RailYatri Chennai Suburban North Timetable & Stopping Patterns', 'suburban_north', 'RailYatri (Stelling Technologies Pvt. Ltd.)', 'https://www.railyatri.in/', 'https://www.railyatri.in/local-trains/chennai-local-train-time-table', 'Independent railway informatics portal tracking local EMU running patterns, station codes, platform arrangements, and intermediate halt durations.', 'Station codes (VOC, KAV, ENR, MJR, PON, GPD, TADA, SPE), track arrangements, and commuter stopping frequencies.', 'October 2026', 'verified', 0, 'Third-party timetable reference; corroborated against Southern Railway operational records.'),
  
  ('sr_south_line', 'Southern Railway — Chennai Beach to Chengalpattu Suburban Corridor', 'suburban_south', 'Southern Railway (SR) / Indian Railways', 'https://sr.indianrailways.gov.in/', 'https://sr.indianrailways.gov.in/view_section.jsp?lang=0&id=0,4,268', 'Southern Railway official timetable for the premier southern arterial commuter corridor serving IT and automotive corridors.', '28 verified stations from Chennai Beach (MSB) to Chengalpattu Junction (CGL) via Tambaram, Guindy, and Tirusulam (Airport), plus peak 8-15 min headways.', 'October 2026', 'verified', 1, 'Broad-gauge electrified quadruple-track suburban line with dedicated local tracks.'),
  
  ('erail_south', 'eRail Chennai Beach–Tambaram–Chengalpattu Suburban EMU Directory', 'suburban_south', 'eRail.in', 'https://erail.in/', 'https://erail.in/local-trains/chennai-beach-to-chengalpattu', 'Comprehensive train search platform cataloging intermediate distances, platform lines, and Southern Railway EMU train numbers.', 'Official station codes (MSB, MS, MBM, TBM, PRGL, CGL), distances in kilometers, and express vs slow local schedules.', 'October 2026', 'verified', 0, 'Widely used unreserved timetable mirror platform.'),
  
  ('sr_west_line', 'Southern Railway Chennai Division — Western Suburban Mainline', 'suburban_west', 'Southern Railway (SR) / Indian Railways', 'https://sr.indianrailways.gov.in/', 'https://sr.indianrailways.gov.in/view_section.jsp?lang=0&id=0,4,268', 'Official Southern Railway suburban service timetable from Chennai Central (Moore Market Complex) to Arakkonam Junction.', '31 verified stations (MASS to AJJ), Avadi and Tiruvallur turnaround loops, and Pattabiram Military Siding (PTMS) & East Depot (PRES) defense spur connection.', 'October 2026', 'verified', 1, 'Heavy-density four-track trunk corridor with segregated suburban EMU operations.'),
  
  ('erail_west', 'eRail Chennai Central MMC to Arakkonam Junction EMU Schedule', 'suburban_west', 'eRail.in', 'https://erail.in/', 'https://erail.in/local-trains/chennai-central-to-arakkonam', 'Independent schedule database detailing running times, fast local stopping patterns, and Arakkonam terminal platform allocations.', 'Intermediate running durations, station codes (MASS, BBQ, PER, VLK, AVD, TRL, AJJ), and suburban fare stages.', 'October 2026', 'verified', 0, 'Corroborates Southern Railway timetable for Western division.'),
  
  ('sr_cgl_ajj_link', 'Southern Railway — Chengalpattu Junction to Arakkonam Junction Link Corridor', 'suburban_west_south', 'Southern Railway (SR) / Indian Railways', 'https://sr.indianrailways.gov.in/', 'https://sr.indianrailways.gov.in/view_section.jsp?lang=0&id=0,4,268', 'Official Southern Railway divisional operational records for the single/double electrified line connecting South and West suburban networks via Kanchipuram.', '13 stations sequence: Chengalpattu Junction (CGL), Reddipalayam, Villiyambakkam, Palur, Pazhaya Seevaram, Walajabad, Nathapettai, Kanchipuram East, Kanchipuram (CJ), Tirumalpur (TMLP), Takkolam, Melpakkam, and Arakkonam Junction (AJJ).', 'October 2026', 'verified', 1, 'Key circumferential rail connector enabling loop services between Chennai Beach and Central.'),
  
  ('erail_cgl_ajj', 'eRail Chengalpattu–Kanchipuram–Tirumalpur–Arakkonam Passenger Services', 'suburban_west_south', 'eRail.in', 'https://erail.in/', 'https://erail.in/trains-between-stations/chengalpattu-cgl/arakkonam-ajj', 'Railway routing database tracking passenger shuttles and Chennai Beach–Tirumalpur–Arakkonam circular EMU train runs.', 'Station codes (CGL, PALR, WJ, CJE, CJ, TMLP, TKO, MLPM, AJJ), 67.2 km route distance, and Tirumalpur EMU turnaround schedules.', 'October 2026', 'verified', 0, 'Reference for through-EMU services linking Kanchipuram silk weaving hub directly to Chennai metropolitan area.'),
  
  ('sr_mrts', 'Southern Railway Chennai Beach – Velachery Elevated MRTS Division', 'mrts', 'Southern Railway / CMRL Integration Team', 'https://sr.indianrailways.gov.in/', 'https://sr.indianrailways.gov.in/view_section.jsp?lang=0&id=0,4,268', 'Official Southern Railway MRTS timetable and operational notices regarding the Chennai Beach to Velachery elevated railway line.', '18 stations from Chennai Beach (MR01) to Velachery (MR18) via Chepauk, Thirumayilai (Mylapore), Kasturba Nagar, and Thiruvanmiyur; includes St. Thomas Mount final link status.', 'October 2026', 'verified', 1, 'Dedicated grade-separated broad-gauge elevated corridor under handover integration with CMRL.'),
  
  ('mtc_official', 'Metropolitan Transport Corporation (Chennai) Limited (MTC)', 'bus', 'Metropolitan Transport Corporation (MTC)', 'https://mtcbus.tn.gov.in/', 'https://mtcbus.tn.gov.in/Home/busroutes', 'Official public bus transit operator for Chennai Metropolitan Area providing inter-modal feeder services to Metro and suburban rail hubs.', 'Feeder bus route schedules connecting Koyambedu CMBT, Chennai Central, Guindy, Airport, Tambaram, and Poonamallee corridors (Routes 54, 88K, 101, 70V).', 'October 2026', 'verified', 1, 'Primary road-based feeder network for Chennai multimodal transit.'),
  
  ('indian_railways', 'Ministry of Railways / Indian Railways Official Portal', 'general', 'Government of India', 'https://indianrailways.gov.in/', 'https://indianrailways.gov.in/', 'National apex railway portal establishing standard suburban second-class fare slabs, passenger safety guidelines, and station classifications.', 'Standard ₹5 (0-10km), ₹10 (10-25km), ₹15 (25-45km), ₹20 (45+km) suburban fare slabs applied uniformly across Southern Railway Chennai Division.', 'October 2026', 'verified', 1, 'Statutory fare and safety framework governing all suburban railway operations.'),
  
  ('cris_uts', 'Centre for Railway Information Systems (CRIS) — UTS on Mobile', 'general', 'CRIS / Indian Railways', 'https://www.utsonmobile.indianrail.gov.in/', 'https://www.utsonmobile.indianrail.gov.in/', 'Official unreserved paperless ticket booking system for Southern Railway suburban train services in the Chennai Metropolitan Area.', 'Digital suburban ticketing guidelines, monthly season pass rules, and geo-fenced QR ticketing rules.', 'October 2026', 'verified', 1, 'Official digital ticketing platform for suburban railway passengers.')
;
`);

try {
  db.exec("UPDATE data_sources SET category = 'mrts' WHERE id = 'sr_mrts';");
} catch {}

// Ensure operational corridors have their explicit status set
db.exec(`
  UPDATE transit_lines SET status = 'operational', phase = 'Phase 1 & Ext' WHERE id IN ('blue', 'green');
  UPDATE transit_lines SET status = 'operational', phase = 'Southern Railway' WHERE id IN ('mrts', 'suburban_south');
  UPDATE stations SET status = 'operational', phase = 'Phase 1 & Ext' WHERE line_id IN ('blue', 'green');
  UPDATE stations SET status = 'operational', phase = 'Southern Railway' WHERE line_id IN ('mrts', 'suburban_south');
`);

// Check if Phase II corridors exist, if not seed them
const purpleLineCheck = db.prepare("SELECT count(*) as count FROM transit_lines WHERE id = 'purple'").get() as any;
if (purpleLineCheck.count === 0) {
  console.log('[Database] Seeding verified CMRL Phase II Upcoming Corridors (Purple, Yellow, Red)...');

  const insertLine = db.prepare(`
    INSERT OR REPLACE INTO transit_lines (id, name, short_name, color, text_color, description, system_type, total_stations, total_km, operating_hours, headway_peak, headway_offpeak, status, phase, target_completion)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Corridor 3: Purple Line (Under Construction)
  insertLine.run(
    'purple',
    'Purple Line (Corridor 3)',
    'Purple Line',
    '#9333ea',
    '#ffffff',
    'Madhavaram Milk Colony to Siruseri SIPCOT via Perambur, KMC, Thousand Lights, Adyar, and OMR IT Corridor',
    'Metro',
    48,
    45.8,
    'Planned: 05:00 - 23:00',
    4,
    8,
    'under_construction',
    'Phase 2',
    'Target 2026 - 2028 (Under Construction)'
  );

  // Corridor 4: Yellow Line (Priority Phase 2 Corridor)
  insertLine.run(
    'yellow',
    'Yellow Line (Corridor 4)',
    'Yellow Line',
    '#eab308',
    '#000000',
    'Poonamallee Bypass to Lighthouse via Porur Junction, Vadapalani, Nandanam, and Thirumayilai (Phase II)',
    'Metro',
    28,
    26.1,
    'Planned: 05:00 - 23:00',
    4,
    8,
    'under_construction',
    'Phase 2',
    'Priority Stretch (Poonamallee–Vadapalani): 2025–2026 | Full Line: 2027–2028'
  );

  // Corridor 5: Red Line (Under Construction)
  insertLine.run(
    'red',
    'Red Line (Corridor 5)',
    'Red Line',
    '#ef4444',
    '#ffffff',
    'Madhavaram Milk Colony to Sholinganallur via Retteri, Kolathur, CMBT, Alandur, and Medavakkam',
    'Metro',
    48,
    47.0,
    'Planned: 05:00 - 23:00',
    5,
    10,
    'under_construction',
    'Phase 2',
    'Target 2027 - 2028 (Under Construction)'
  );

  // Suburban West Line (Southern Railway)
  insertLine.run(
    'suburban_west',
    'Suburban West Line',
    'West Line',
    '#059669',
    '#ffffff',
    'Chennai Central (Moore Market Complex) to Avadi & Tiruvallur via Perambur, Villivakkam, and Ambattur',
    'Suburban',
    13,
    21.5,
    '04:30 - 23:30',
    10,
    20,
    'operational',
    'Southern Railway',
    'Operational'
  );

  const insertStation = db.prepare(`
    INSERT OR REPLACE INTO stations (
      id, name, name_ta, code, line_id, lat, lon, is_interchange, interchange_info,
      system_type, zone, platform_count, has_parking, has_feeder_bus, has_wheelchair,
      has_lifts, has_ev_charging, first_train, last_train, status, phase, target_completion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Purple Line Stations (Corridor 3: Madhavaram to Siruseri SIPCOT)
  const purpleStations = [
    { id: 'PL01', name: 'Madhavaram Milk Colony', ta: 'மாதவரம் பால் பண்ணை', code: 'MMC', lat: 13.1510, lon: 80.2285, inter: 1, info: 'Major Phase 2 Interchange with Red Line (Corridor 5) & Depot' },
    { id: 'PL02', name: 'Moolakadai', ta: 'மூலக்கடை', code: 'MKD', lat: 13.1310, lon: 80.2435, inter: 0, info: null },
    { id: 'PL03', name: 'Perambur', ta: 'பெரம்பூர்', code: 'PRB', lat: 13.1075, lon: 80.2450, inter: 1, info: 'Interchange with Southern Railway Suburban West Line' },
    { id: 'PL04', name: 'Otteri', ta: 'ஓட்டேரி', code: 'OTR', lat: 13.0970, lon: 80.2520, inter: 0, info: null },
    { id: 'PL05', name: 'Pattalam', ta: 'பட்டாளம்', code: 'PTL', lat: 13.0910, lon: 80.2570, inter: 0, info: null },
    { id: 'PL06', name: 'Purasaiwakkam', ta: 'புரசைவாக்கம்', code: 'PRW', lat: 13.0865, lon: 80.2580, inter: 0, info: null },
    { id: 'PL07', name: 'Kilpauk (KMC)', ta: 'கீழ்ப்பாக்கம் மருத்துவக் கல்லூரி', code: 'KMC-P', lat: 13.0785, lon: 80.2415, inter: 1, info: 'Underground Interchange with Operational Green Line (Corridor 2)' },
    { id: 'PL08', name: 'Chetpet', ta: 'சேத்துப்பட்டு', code: 'CPT-P', lat: 13.0718, lon: 80.2432, inter: 1, info: 'Interchange with Southern Railway Suburban South Line' },
    { id: 'PL09', name: 'Nungambakkam', ta: 'நுங்கம்பாக்கம்', code: 'NBK-P', lat: 13.0610, lon: 80.2460, inter: 0, info: null },
    { id: 'PL10', name: 'Thousand Lights (Line 3)', ta: 'ஆயிரம் விளக்கு (தடம் 3)', code: 'TSL-P', lat: 13.0560, lon: 80.2520, inter: 1, info: 'Interchange with Operational Blue Line (Corridor 1)' },
    { id: 'PL11', name: 'Gemini (Royapettah)', ta: 'ஜெமினி', code: 'GMN', lat: 13.0515, lon: 80.2550, inter: 0, info: null },
    { id: 'PL12', name: 'Radhakrishnan Salai', ta: 'ராதாகிருஷ்ணன் சாலை', code: 'RKS', lat: 13.0440, lon: 80.2600, inter: 0, info: null },
    { id: 'PL13', name: 'Thirumayilai (Line 3)', ta: 'திருமயிலை (தடம் 3)', code: 'TMY-P', lat: 13.0345, lon: 80.2701, inter: 1, info: 'Multi-level Mega Interchange with Yellow Line (Corridor 4) & MRTS' },
    { id: 'PL14', name: 'Mandaveli (Line 3)', ta: 'மந்தைவெளி (தடம் 3)', code: 'MDV-P', lat: 13.0255, lon: 80.2642, inter: 0, info: null },
    { id: 'PL15', name: 'Adyar Junction', ta: 'அடையாறு சந்திப்பு', code: 'ADY', lat: 13.0065, lon: 80.2560, inter: 0, info: 'Under-river tunnel crossing under the Adyar River' },
    { id: 'PL16', name: 'Thiruvanmiyur (Line 3)', ta: 'திருவான்மியூர் (தடம் 3)', code: 'TVM-P', lat: 12.9868, lon: 80.2582, inter: 1, info: 'Connection with MRTS & East Coast Road' },
    { id: 'PL17', name: 'Taramani (Line 3)', ta: 'தரமணி (தடம் 3)', code: 'TRM-P', lat: 12.9792, lon: 80.2451, inter: 0, info: 'Gateway to TIDEL Park & OMR IT Hub' },
    { id: 'PL18', name: 'Perungudi (Line 3)', ta: 'பெருங்குடி (தடம் 3)', code: 'PRG-P', lat: 12.9721, lon: 80.2365, inter: 0, info: null },
    { id: 'PL19', name: 'Thoraipakkam', ta: 'துரைப்பாக்கம்', code: 'TPK', lat: 12.9610, lon: 80.2350, inter: 0, info: null },
    { id: 'PL20', name: 'Sholinganallur (Line 3)', ta: 'சோழிங்கநல்லூர் (தடம் 3)', code: 'SHL-P', lat: 12.9010, lon: 80.2270, inter: 1, info: 'Major Elevated Junction with Red Line (Corridor 5)' },
    { id: 'PL21', name: 'Navallur', ta: 'நாவலூர்', code: 'NVL', lat: 12.8640, lon: 80.2260, inter: 0, info: null },
    { id: 'PL22', name: 'Siruseri SIPCOT', ta: 'சிறுசேரி சிப்காட்', code: 'SCT', lat: 12.8250, lon: 80.2240, inter: 1, info: 'Southern Terminal serving SIPCOT IT Park' }
  ];

  for (const s of purpleStations) {
    insertStation.run(
      s.id, s.name, s.ta, s.code, 'purple', s.lat, s.lon, s.inter, s.info,
      'Metro', 'North-South IT Corridor', 2, 1, 1, 1, 1, 1, '05:00', '23:00',
      'under_construction', 'Phase 2', 'Target 2026 - 2028'
    );
  }

  // Yellow Line Stations (Corridor 4: Poonamallee Bypass to Lighthouse - 28 Verified Stations West to East)
  const yellowStations = [
    { id: 'YL01', name: 'Poonamallee Bypass', ta: 'பூவிருந்தவல்லி புறவழிச்சாலை', code: 'PNMB', lat: 13.0560, lon: 80.0760, inter: 0, info: 'Western elevated terminal station with CMRL Corridor 4 maintenance depot.' },
    { id: 'YL02', name: 'Poonamallee Bus Stand', ta: 'பூவிருந்தவல்லி பேருந்து நிலையம்', code: 'PNMS', lat: 13.0520, lon: 80.0880, inter: 1, info: 'Direct integration with Poonamallee MTC Bus Terminus hub.' },
    { id: 'YL03', name: 'Poonamallee Government Hospital', ta: 'பூவிருந்தவல்லி அரசு மருத்துவமனை', code: 'PGH', lat: 13.0515, lon: 80.0955, inter: 0, info: 'Serving Poonamallee Government Hospital and Mullaithottam.' },
    { id: 'YL04', name: 'Karayanchavadi', ta: 'கரையான்சாவடி', code: 'KYV', lat: 13.0515, lon: 80.1000, inter: 0, info: null },
    { id: 'YL05', name: 'Kumananchavadi', ta: 'குமணன்சாவடி', code: 'KMC', lat: 13.0520, lon: 80.1080, inter: 0, info: null },
    { id: 'YL06', name: 'Kattupakkam', ta: 'காட்டுப்பாக்கம்', code: 'KTP', lat: 13.0490, lon: 80.1230, inter: 0, info: null },
    { id: 'YL07', name: 'Iyyappanthangal', ta: 'ஐயப்பன்தாங்கல்', code: 'IPT', lat: 13.0440, lon: 80.1380, inter: 1, info: 'Major MTC bus depot transit interchange and depot spur line.' },
    { id: 'YL08', name: 'Thelliyaragaram', ta: 'தெள்ளியரகரம்', code: 'TLG', lat: 13.0410, lon: 80.1430, inter: 0, info: 'Serving Sri Ramachandra Institute of Higher Education & Research (SRMC).' },
    { id: 'YL09', name: 'Porur Bypass', ta: 'போரூர் புறவழிச்சாலை', code: 'PBP', lat: 13.0385, lon: 80.1485, inter: 0, info: null },
    { id: 'YL10', name: 'Porur Junction', ta: 'போரூர் சந்திப்பு', code: 'PRJ', lat: 13.0345, lon: 80.1580, inter: 1, info: 'Future multi-level interchange with Phase 2 Corridor 5 (Madhavaram–Sholinganallur). Double-decker viaduct.' },
    { id: 'YL11', name: 'Alapakkam', ta: 'ஆலப்பாக்கம்', code: 'APK', lat: 13.0380, lon: 80.1630, inter: 1, info: 'Shared double-decker corridor station with Phase 2 Corridor 5 (Red Line).' },
    { id: 'YL12', name: 'Karambakkam', ta: 'காரம்பாக்கம்', code: 'KBK', lat: 13.0420, lon: 80.1690, inter: 1, info: 'Shared double-decker corridor station with Phase 2 Corridor 5 (Red Line).' },
    { id: 'YL13', name: 'Valasaravakkam', ta: 'வளசரவாக்கம்', code: 'VSV', lat: 13.0480, lon: 80.1780, inter: 1, info: 'Shared double-decker corridor station with Phase 2 Corridor 5 (Red Line).' },
    { id: 'YL14', name: 'Alwarthiru Nagar', ta: 'ஆழ்வார்திரு நகர்', code: 'ATN', lat: 13.0510, lon: 80.1830, inter: 1, info: 'Shared double-decker corridor station with Phase 2 Corridor 5 (Red Line).' },
    { id: 'YL15', name: 'Virugambakkam', ta: 'விருகம்பாக்கம்', code: 'VGK', lat: 13.0535, lon: 80.1920, inter: 0, info: 'Serving Virugambakkam and Avichi Higher Secondary School area.' },
    { id: 'YL16', name: 'Natesan Nagar', ta: 'நடேசன் நகர்', code: 'NTN', lat: 13.0525, lon: 80.2015, inter: 0, info: 'Serving Natesan Nagar and Saligramam South residential area.' },
    { id: 'YL17', name: 'Vadapalani', ta: 'வடபழனி', code: 'VDP', lat: 13.0514, lon: 80.2118, inter: 1, info: 'Future multi-level interchange with operational Green Line (GL08) via integrated concourse upon Phase 2 opening.' },
    { id: 'YL18', name: 'Kodambakkam Power House', ta: 'கோடம்பாக்கம் பவர் ஹவுஸ்', code: 'KPH', lat: 13.0513, lon: 80.2155, inter: 0, info: 'Near TNEB Power House; adjacent to Ashok Nagar / Kodambakkam boundary.' },
    { id: 'YL19', name: 'Meenakshi College', ta: 'மீனாட்சி கல்லூரி', code: 'MKC', lat: 13.0512, lon: 80.2190, inter: 0, info: 'Serving Meenakshi College for Women and engineering campus; transition portal.' },
    { id: 'YL20', name: 'Kodambakkam', ta: 'கோடம்பாக்கம்', code: 'KDM', lat: 13.0510, lon: 80.2250, inter: 0, info: 'Distinct underground metro station near Kodambakkam Railway Station (SR07). Separate station facility; planned future pedestrian connection across railway tracks.' },
    { id: 'YL21', name: 'Panagal Park', ta: 'பனகல் பூங்கா', code: 'PNP', lat: 13.0380, lon: 80.2310, inter: 0, info: 'Underground station serving T. Nagar retail district, Pondy Bazaar, and Usman Road.' },
    { id: 'YL22', name: 'Nandanam', ta: 'நந்தனம்', code: 'NDM', lat: 13.0321, lon: 80.2392, inter: 1, info: 'Future multi-level interchange with operational Blue Line (BL19). Direct underground concourse transfer upon Phase 2 completion.' },
    { id: 'YL23', name: 'Boat Club', ta: 'போட் கிளப் (அடையாறு கேட்)', code: 'BTC', lat: 13.0328, lon: 80.2420, inter: 0, info: 'Underground station serving Adyar Gate Junction and residential enclave.' },
    { id: 'YL24', name: 'Bharathidasan Road', ta: 'பாரதிதாசன் சாலை', code: 'BDR', lat: 13.0335, lon: 80.2465, inter: 0, info: null },
    { id: 'YL25', name: 'Alwarpet', ta: 'ஆழ்வார்பேட்டை', code: 'ALW', lat: 13.0340, lon: 80.2540, inter: 0, info: 'Underground station at Alwarpet junction along TTK Road corridor.' },
    { id: 'YL26', name: 'Thirumayilai', ta: 'திருமயிலை', code: 'TMY', lat: 13.0345, lon: 80.2701, inter: 1, info: 'Major future 3-way multi-modal interchange hub connecting Phase 2 Corridor 3 (Purple Line PL11) and Suburban MRTS (MR11).' },
    { id: 'YL27', name: 'Kutchery Road', ta: 'கச்சேரி சாலை', code: 'KCR', lat: 13.0380, lon: 80.2730, inter: 0, info: 'Underground station near historic Mylapore cultural quarter.' },
    { id: 'YL28', name: 'Lighthouse', ta: 'கலங்கரை விளக்கம்', code: 'LHS', lat: 13.0425, lon: 80.2762, inter: 0, info: 'Eastern underground coastal terminal station situated near Marina Beach, Santhome, and Kamarajar Salai.' }
  ];

  for (const s of yellowStations) {
    insertStation.run(
      s.id, s.name, s.ta, s.code, 'yellow', s.lat, s.lon, s.inter, s.info,
      'Metro', 'East-West Corridor', 2, 1, 1, 1, 1, 1, '05:00', '23:00',
      'under_construction', 'Phase 2', 'Target 2025 - 2028 (Phase II Under Construction)'
    );
  }

  // Red Line Stations (Corridor 5: Madhavaram to Sholinganallur via CMBT & Alandur)
  const redStations = [
    { id: 'RL01', name: 'Madhavaram Milk Colony (Line 5)', ta: 'மாதவரம் பால் பண்ணை (தடம் 5)', code: 'MMC-R', lat: 13.1510, lon: 80.2285, inter: 1, info: 'Interchange with Purple Line (Corridor 3)' },
    { id: 'RL02', name: 'Retteri Junction', ta: 'ரெட்டேரி சந்திப்பு', code: 'RTJ', lat: 13.1250, lon: 80.2080, inter: 0, info: null },
    { id: 'RL03', name: 'Kolathur', ta: 'கொளத்தூர்', code: 'KLT', lat: 13.1180, lon: 80.2050, inter: 0, info: null },
    { id: 'RL04', name: 'Villivakkam', ta: 'வில்லிவாக்கம்', code: 'VLV', lat: 13.1080, lon: 80.2060, inter: 1, info: 'Interchange with Southern Railway Suburban West' },
    { id: 'RL05', name: 'Anna Nagar West', ta: 'அண்ணா நகர் மேற்கு', code: 'ANW', lat: 13.0920, lon: 80.2030, inter: 0, info: null },
    { id: 'RL06', name: 'Thirumangalam (Line 5)', ta: 'திருமங்கலம் (தடம் 5)', code: 'TMG-R', lat: 13.0854, lon: 80.1998, inter: 1, info: 'Interchange with Operational Green Line (Corridor 2)' },
    { id: 'RL07', name: 'Koyambedu Market', ta: 'கோயம்பேடு அங்காடி', code: 'KYM-M', lat: 13.0760, lon: 80.1970, inter: 0, info: 'Near wholesale market complex' },
    { id: 'RL08', name: 'CMBT (Line 5)', ta: 'சி.எம்.பி.டி (தடம் 5)', code: 'CMB-R', lat: 13.0673, lon: 80.2052, inter: 1, info: 'Interchange with Operational Green Line (Corridor 2) & Bus Terminus' },
    { id: 'RL09', name: 'Alandur (Line 5)', ta: 'ஆலந்தூர் (தடம் 5)', code: 'ALN-R', lat: 13.0039, lon: 80.2014, inter: 1, info: 'Triple Interchange with Blue Line & Green Line' },
    { id: 'RL10', name: 'St. Thomas Mount (Line 5)', ta: 'பரங்கிமலை (தடம் 5)', code: 'STM-R', lat: 13.0003, lon: 80.1965, inter: 1, info: 'Quadruple Hub with Green Line, MRTS & Suburban' },
    { id: 'RL11', name: 'Adambakkam', ta: 'ஆதம்பாக்கம்', code: 'ADB', lat: 12.9880, lon: 80.2030, inter: 0, info: null },
    { id: 'RL12', name: 'Vanuvampet', ta: 'வாணுவம்பேட்டை', code: 'VNP', lat: 12.9770, lon: 80.2010, inter: 0, info: null },
    { id: 'RL13', name: 'Madipakkam', ta: 'மடிப்பாக்கம்', code: 'MDP', lat: 12.9660, lon: 80.2020, inter: 0, info: null },
    { id: 'RL14', name: 'Kilkattalai', ta: 'கீழ்கட்டளை', code: 'KKT', lat: 12.9550, lon: 80.1980, inter: 0, info: null },
    { id: 'RL15', name: 'Kovilambakkam', ta: 'கோவிலம்பாக்கம்', code: 'KVL', lat: 12.9390, lon: 80.1920, inter: 0, info: null },
    { id: 'RL16', name: 'Medavakkam', ta: 'மேடவாக்கம்', code: 'MDV', lat: 12.9180, lon: 80.1910, inter: 0, info: 'High-density residential corridor' },
    { id: 'RL17', name: 'Sholinganallur (Line 5)', ta: 'சோழிங்கநல்லூர் (தடம் 5)', code: 'SHL-R', lat: 12.9010, lon: 80.2270, inter: 1, info: 'Interchange with Purple Line (Corridor 3)' }
  ];

  for (const s of redStations) {
    insertStation.run(
      s.id, s.name, s.ta, s.code, 'red', s.lat, s.lon, s.inter, s.info,
      'Metro', 'Orbital Ring Corridor', 2, 1, 1, 1, 1, 1, '05:00', '23:00',
      'under_construction', 'Phase 2', 'Target 2027 - 2028'
    );
  }

  // Suburban West Stations (Southern Railway)
  const suburbanWestStations = [
    { id: 'SW01', name: 'Chennai Central (MMC)', ta: 'புரட்சி தலைவர் டாக்டர் எம்.ஜி.ஆர் சென்னை சென்ட்ரல் (எம்.எம்.சி)', code: 'MMC', lat: 13.0833, lon: 80.2755, inter: 1, info: 'Suburban West Terminal at Moore Market Complex, connects to Metro Blue & Green Lines' },
    { id: 'SW02', name: 'Basin Bridge Junction', ta: 'பேசின் பாலம் சந்திப்பு', code: 'BBQ', lat: 13.0970, lon: 80.2710, inter: 1, info: 'Major railway junction' },
    { id: 'SW03', name: 'Vyasarpadi Jeeva', ta: 'வியாசர்பாடி ஜீவா', code: 'VPY', lat: 13.1040, lon: 80.2610, inter: 0, info: null },
    { id: 'SW04', name: 'Perambur', ta: 'பெரம்பூர்', code: 'PER', lat: 13.1075, lon: 80.2450, inter: 1, info: 'Major railway hub, future interchange with Purple Line (Corridor 3)' },
    { id: 'SW05', name: 'Perambur Carriage Works', ta: 'பெரம்பூர் கேரேஜ் ஒர்க்ஸ்', code: 'PCW', lat: 13.1090, lon: 80.2370, inter: 0, info: null },
    { id: 'SW06', name: 'Perambur Loco Works', ta: 'பெரம்பூர் லோகோ ஒர்க்ஸ்', code: 'PEW', lat: 13.1095, lon: 80.2240, inter: 0, info: null },
    { id: 'SW07', name: 'Villivakkam', ta: 'வில்லிவாக்கம்', code: 'VLK', lat: 13.1080, lon: 80.2060, inter: 1, info: 'Suburban station, future interchange with Red Line (Corridor 5)' },
    { id: 'SW08', name: 'Korattur', ta: 'கொரட்டூர்', code: 'KOTR', lat: 13.1110, lon: 80.1870, inter: 0, info: null },
    { id: 'SW09', name: 'Pattaravakkam', ta: 'பட்டரவாக்கம்', code: 'PVM', lat: 13.1130, lon: 80.1690, inter: 0, info: null },
    { id: 'SW10', name: 'Ambattur', ta: 'அம்பத்தூர்', code: 'ABR', lat: 13.1160, lon: 80.1540, inter: 1, info: 'Serving major industrial estate' },
    { id: 'SW11', name: 'Thirumullaivoyal', ta: 'திருமுல்லைவாயல்', code: 'TMVL', lat: 13.1180, lon: 80.1380, inter: 0, info: null },
    { id: 'SW12', name: 'Annanur', ta: 'அண்ணனூர்', code: 'ANNR', lat: 13.1200, lon: 80.1240, inter: 0, info: null },
    { id: 'SW13', name: 'Avadi', ta: 'ஆவடி', code: 'AVD', lat: 13.1220, lon: 80.1010, inter: 1, info: 'Major Suburban Terminal & Defense hub' }
  ];

  for (const s of suburbanWestStations) {
    insertStation.run(
      s.id, s.name, s.ta, s.code, 'suburban_west', s.lat, s.lon, s.inter, s.info,
      'Suburban', 'Western Suburban Corridor', 4, 1, 1, 1, 1, 0, '04:30', '23:30',
      'operational', 'Southern Railway', 'Operational'
    );
  }

  // Connections for lines
  const insertConn = db.prepare(`
    INSERT INTO connections (from_station_id, to_station_id, line_id, distance_km, travel_time_mins, is_transfer)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const addBidirectional = (from: string, to: string, line: string, dist: number, time: number, isTransfer = 0) => {
    insertConn.run(from, to, line, dist, time, isTransfer);
    insertConn.run(to, from, line, dist, time, isTransfer);
  };

  for (let i = 0; i < purpleStations.length - 1; i++) {
    const s1 = purpleStations[i];
    const s2 = purpleStations[i + 1];
    const dist = +(Math.sqrt(Math.pow(s2.lat - s1.lat, 2) + Math.pow(s2.lon - s1.lon, 2)) * 111).toFixed(2);
    const time = Math.max(2, Math.round(dist * 1.8));
    addBidirectional(s1.id, s2.id, 'purple', dist, time, 0);
  }

  for (let i = 0; i < yellowStations.length - 1; i++) {
    const s1 = yellowStations[i];
    const s2 = yellowStations[i + 1];
    const dist = +(Math.sqrt(Math.pow(s2.lat - s1.lat, 2) + Math.pow(s2.lon - s1.lon, 2)) * 111).toFixed(2);
    const time = Math.max(2, Math.round(dist * 1.8));
    addBidirectional(s1.id, s2.id, 'yellow', dist, time, 0);
  }

  for (let i = 0; i < redStations.length - 1; i++) {
    const s1 = redStations[i];
    const s2 = redStations[i + 1];
    const dist = +(Math.sqrt(Math.pow(s2.lat - s1.lat, 2) + Math.pow(s2.lon - s1.lon, 2)) * 111).toFixed(2);
    const time = Math.max(2, Math.round(dist * 1.8));
    addBidirectional(s1.id, s2.id, 'red', dist, time, 0);
  }

  for (let i = 0; i < suburbanWestStations.length - 1; i++) {
    const s1 = suburbanWestStations[i];
    const s2 = suburbanWestStations[i + 1];
    const dist = +(Math.sqrt(Math.pow(s2.lat - s1.lat, 2) + Math.pow(s2.lon - s1.lon, 2)) * 111).toFixed(2);
    const time = Math.max(2, Math.round(dist * 2.2));
    addBidirectional(s1.id, s2.id, 'suburban_west', dist, time, 0);
  }

  // Key Interchange Connections across the Multi-Modal Network
  // Vadapalani: Green Line (GL08) <-> Yellow Line (YL13)
  addBidirectional('GL08', 'YL13', 'interchange', 0.1, 2.0, 1);
  // Nandanam: Blue Line (BL19) <-> Yellow Line (YL07)
  addBidirectional('BL19', 'YL07', 'interchange', 0.1, 2.0, 1);
  // Thirumayilai: MRTS (MR09) <-> Yellow Line (YL03) and Purple Line (PL13)
  addBidirectional('MR09', 'YL03', 'interchange', 0.1, 2.0, 1);
  addBidirectional('PL13', 'YL03', 'interchange', 0.05, 1.5, 1);
  addBidirectional('MR09', 'PL13', 'interchange', 0.1, 2.0, 1);
  // Kodambakkam: Suburban South (SB07) <-> Yellow Line (YL10)
  addBidirectional('SB07', 'YL10', 'interchange', 0.15, 2.5, 1);
  // Kilpauk Medical College (KMC): Green Line (GL04) <-> Purple Line (PL07)
  addBidirectional('GL04', 'PL07', 'interchange', 0.1, 2.0, 1);
  // Thousand Lights: Blue Line (BL18) <-> Purple Line (PL10)
  addBidirectional('BL18', 'PL10', 'interchange', 0.1, 2.0, 1);
  // CMBT: Green Line (GL06) <-> Red Line (RL08)
  addBidirectional('GL06', 'RL08', 'interchange', 0.1, 2.0, 1);
  // Thirumangalam: Green Line (GL09) <-> Red Line (RL06)
  addBidirectional('GL09', 'RL06', 'interchange', 0.1, 2.0, 1);
  // Alandur: Blue (BL23) & Green (GL16) <-> Red Line (RL09)
  addBidirectional('BL23', 'RL09', 'interchange', 0.05, 1.5, 1);
  addBidirectional('GL16', 'RL09', 'interchange', 0.05, 1.5, 1);
  // St. Thomas Mount: Green (GL17) & Suburban (SB11) <-> Red Line (RL10)
  addBidirectional('GL17', 'RL10', 'interchange', 0.1, 2.0, 1);
  addBidirectional('SB11', 'RL10', 'interchange', 0.1, 2.0, 1);
  // Perambur: Suburban West (SW04) <-> Purple Line (PL03)
  addBidirectional('SW04', 'PL03', 'interchange', 0.1, 2.0, 1);
  // Villivakkam: Suburban West (SW07) <-> Red Line (RL04)
  addBidirectional('SW07', 'RL04', 'interchange', 0.1, 2.0, 1);
  // Chennai Central MMC (SW01) <-> Chennai Central Metro (BL13 / GL01) and Park (SB03)
  addBidirectional('SW01', 'BL13', 'interchange', 0.15, 2.5, 1);
  addBidirectional('SW01', 'GL01', 'interchange', 0.15, 2.5, 1);
  addBidirectional('SW01', 'SB03', 'interchange', 0.1, 2.0, 1);

  console.log('[Database] Phase 2 upcoming corridors (Purple, complete Yellow 29 stations, Red, Suburban West) seeded successfully.');
}

// Ensure Yellow Line has verified 28 stations (West to East: Poonamallee Bypass to Lighthouse)
try {
  const currentYellowCount = (db.prepare("SELECT count(*) as count FROM stations WHERE line_id = 'yellow'").get() as any)?.count || 0;
  const firstYellowStation = (db.prepare("SELECT name FROM stations WHERE id = 'YL01'").get() as any)?.name;
  if (currentYellowCount !== 28 || firstYellowStation !== 'Poonamallee Bypass') {
    console.log(`[Database] Upgrading Yellow Line to verified 28 stations (Poonamallee Bypass to Lighthouse)...`);
    
    db.prepare(`
      UPDATE transit_lines
      SET name = 'Yellow Line (Corridor 4)',
          short_name = 'Yellow Line',
          color = '#eab308',
          text_color = '#000000',
          description = 'Poonamallee Bypass to Lighthouse via Porur Junction, Vadapalani, Nandanam, and Thirumayilai (Phase II)',
          total_stations = 28,
          total_km = 26.1,
          operating_hours = 'Planned: 05:00 - 23:00',
          headway_peak = 4,
          headway_offpeak = 8,
          status = 'under_construction',
          phase = 'Phase 2',
          target_completion = 'Priority Stretch (Poonamallee–Vadapalani): 2025–2026 | Full Line: 2027–2028'
      WHERE id = 'yellow'
    `).run();

    db.prepare(`
      DELETE FROM connections
      WHERE line_id = 'yellow'
         OR from_station_id LIKE 'YL%'
         OR to_station_id LIKE 'YL%'
    `).run();

    db.prepare(`DELETE FROM stations WHERE line_id = 'yellow'`).run();

    const insertStation = db.prepare(`
      INSERT OR REPLACE INTO stations (
        id, name, name_ta, code, line_id, lat, lon, is_interchange, interchange_info,
        system_type, zone, platform_count, has_parking, has_feeder_bus, has_wheelchair,
        has_lifts, has_ev_charging, first_train, last_train, status, phase, target_completion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const verified28Stations = [
      { id: 'YL01', name: 'Poonamallee Bypass', ta: 'பூவிருந்தவல்லி புறவழிச்சாலை', code: 'PNMB', lat: 13.0560, lon: 80.0760, inter: 0, info: 'Western elevated terminal station with CMRL Corridor 4 maintenance depot.', zone: 'Section A (Priority Section)', target: 'Target 2025 - 2026 (Priority Section)' },
      { id: 'YL02', name: 'Poonamallee Bus Stand', ta: 'பூவிருந்தவல்லி பேருந்து நிலையம்', code: 'PNMS', lat: 13.0520, lon: 80.0880, inter: 1, info: 'Direct integration with Poonamallee MTC Bus Terminus hub.', zone: 'Section A (Priority Section)', target: 'Target 2025 - 2026 (Priority Section)' },
      { id: 'YL03', name: 'Poonamallee Government Hospital', ta: 'பூவிருந்தவல்லி அரசு மருத்துவமனை', code: 'PGH', lat: 13.0515, lon: 80.0955, inter: 0, info: 'Serving Poonamallee Government Hospital and Mullaithottam.', zone: 'Section A (Priority Section)', target: 'Target 2025 - 2026 (Priority Section)' },
      { id: 'YL04', name: 'Karayanchavadi', ta: 'கரையான்சாவடி', code: 'KYV', lat: 13.0515, lon: 80.1000, inter: 0, info: null, zone: 'Section A (Priority Section)', target: 'Target 2025 - 2026 (Priority Section)' },
      { id: 'YL05', name: 'Kumananchavadi', ta: 'குமணன்சாவடி', code: 'KMC', lat: 13.0520, lon: 80.1080, inter: 0, info: null, zone: 'Section A (Priority Section)', target: 'Target 2025 - 2026 (Priority Section)' },
      { id: 'YL06', name: 'Kattupakkam', ta: 'காட்டுப்பாக்கம்', code: 'KTP', lat: 13.0490, lon: 80.1230, inter: 0, info: null, zone: 'Section A (Priority Section)', target: 'Target 2025 - 2026 (Priority Section)' },
      { id: 'YL07', name: 'Iyyappanthangal', ta: 'ஐயப்பன்தாங்கல்', code: 'IPT', lat: 13.0440, lon: 80.1380, inter: 1, info: 'Major MTC bus depot transit interchange and depot spur line.', zone: 'Section A (Priority Section)', target: 'Target 2025 - 2026 (Priority Section)' },
      { id: 'YL08', name: 'Thelliyaragaram', ta: 'தெள்ளியரகரம்', code: 'TLG', lat: 13.0410, lon: 80.1430, inter: 0, info: 'Serving Sri Ramachandra Institute of Higher Education & Research (SRMC).', zone: 'Section A (Priority Section)', target: 'Target 2025 - 2026 (Priority Section)' },
      { id: 'YL09', name: 'Porur Bypass', ta: 'போரூர் புறவழிச்சாலை', code: 'PBP', lat: 13.0385, lon: 80.1485, inter: 0, info: null, zone: 'Section A (Priority Section)', target: 'Target 2025 - 2026 (Priority Section)' },
      { id: 'YL10', name: 'Porur Junction', ta: 'போரூர் சந்திப்பு', code: 'PRJ', lat: 13.0345, lon: 80.1580, inter: 1, info: 'Future multi-level interchange with Phase 2 Corridor 5 (Madhavaram–Sholinganallur). Double-decker viaduct.', zone: 'Section A (Priority Section)', target: 'Target 2025 - 2026 (Priority Section)' },
      { id: 'YL11', name: 'Alapakkam', ta: 'ஆலப்பாக்கம்', code: 'APK', lat: 13.0380, lon: 80.1630, inter: 1, info: 'Shared double-decker corridor station with Phase 2 Corridor 5 (Red Line).', zone: 'Section B (Intermediate Arcot Road)', target: 'Target 2025 - 2026 (Priority Section)' },
      { id: 'YL12', name: 'Karambakkam', ta: 'காரம்பாக்கம்', code: 'KBK', lat: 13.0420, lon: 80.1690, inter: 1, info: 'Shared double-decker corridor station with Phase 2 Corridor 5 (Red Line).', zone: 'Section B (Intermediate Arcot Road)', target: 'Target 2025 - 2026 (Priority Section)' },
      { id: 'YL13', name: 'Valasaravakkam', ta: 'வளசரவாக்கம்', code: 'VSV', lat: 13.0480, lon: 80.1780, inter: 1, info: 'Shared double-decker corridor station with Phase 2 Corridor 5 (Red Line).', zone: 'Section B (Intermediate Arcot Road)', target: 'Target 2025 - 2026 (Priority Section)' },
      { id: 'YL14', name: 'Alwarthiru Nagar', ta: 'ஆழ்வார்திரு நகர்', code: 'ATN', lat: 13.0510, lon: 80.1830, inter: 1, info: 'Shared double-decker corridor station with Phase 2 Corridor 5 (Red Line).', zone: 'Section B (Intermediate Arcot Road)', target: 'Target 2025 - 2026 (Priority Section)' },
      { id: 'YL15', name: 'Virugambakkam', ta: 'விருகம்பாக்கம்', code: 'VGK', lat: 13.0535, lon: 80.1920, inter: 0, info: 'Serving Virugambakkam and Avichi Higher Secondary School area.', zone: 'Section B (Intermediate Arcot Road)', target: 'Target 2025 - 2026 (Priority Section)' },
      { id: 'YL16', name: 'Natesan Nagar', ta: 'நடேசன் நகர்', code: 'NTN', lat: 13.0525, lon: 80.2015, inter: 0, info: 'Serving Natesan Nagar and Saligramam South residential area.', zone: 'Section B (Intermediate Arcot Road)', target: 'Target 2025 - 2026 (Priority Section)' },
      { id: 'YL17', name: 'Vadapalani', ta: 'வடபழனி', code: 'VDP', lat: 13.0514, lon: 80.2118, inter: 1, info: 'Future multi-level interchange with operational Green Line (GL08) via integrated concourse upon Phase 2 opening.', zone: 'Section A (Terminal of Priority Operating Section)', target: 'Target 2025 - 2026 (Priority Section)' },
      { id: 'YL18', name: 'Kodambakkam Power House', ta: 'கோடம்பாக்கம் பவர் ஹவுஸ்', code: 'KPH', lat: 13.0513, lon: 80.2155, inter: 0, info: 'Near TNEB Power House; adjacent to Ashok Nagar / Kodambakkam boundary.', zone: 'Section B (Intermediate toward city centre)', target: 'Target 2026 - 2027' },
      { id: 'YL19', name: 'Meenakshi College', ta: 'மீனாட்சி கல்லூரி', code: 'MKC', lat: 13.0512, lon: 80.2190, inter: 0, info: 'Serving Meenakshi College for Women and engineering campus; transition portal.', zone: 'Section B (Intermediate toward city centre)', target: 'Target 2026 - 2027' },
      { id: 'YL20', name: 'Kodambakkam', ta: 'கோடம்பாக்கம்', code: 'KDM', lat: 13.0510, lon: 80.2250, inter: 0, info: 'Distinct underground metro station near Kodambakkam Railway Station (SR07). Separate station facility; planned future pedestrian connection across railway tracks.', zone: 'Section B (Intermediate toward city centre)', target: 'Target 2026 - 2027' },
      { id: 'YL21', name: 'Panagal Park', ta: 'பனகல் பூங்கா', code: 'PNP', lat: 13.0380, lon: 80.2310, inter: 0, info: 'Underground station serving T. Nagar retail district, Pondy Bazaar, and Usman Road.', zone: 'Section C (Underground section toward Lighthouse)', target: 'Target 2027 - 2028 (Underground)' },
      { id: 'YL22', name: 'Nandanam', ta: 'நந்தனம்', code: 'NDM', lat: 13.0321, lon: 80.2392, inter: 1, info: 'Future multi-level interchange with operational Blue Line (BL19). Direct underground concourse transfer upon Phase 2 completion.', zone: 'Section C (Underground section toward Lighthouse)', target: 'Target 2027 - 2028 (Underground)' },
      { id: 'YL23', name: 'Boat Club', ta: 'போட் கிளப் (அடையாறு கேட்)', code: 'BTC', lat: 13.0328, lon: 80.2420, inter: 0, info: 'Underground station serving Adyar Gate Junction and residential enclave.', zone: 'Section C (Underground section toward Lighthouse)', target: 'Target 2027 - 2028 (Underground)' },
      { id: 'YL24', name: 'Bharathidasan Road', ta: 'பாரதிதாசன் சாலை', code: 'BDR', lat: 13.0335, lon: 80.2465, inter: 0, info: null, zone: 'Section C (Underground section toward Lighthouse)', target: 'Target 2027 - 2028 (Underground)' },
      { id: 'YL25', name: 'Alwarpet', ta: 'ஆழ்வார்பேட்டை', code: 'ALW', lat: 13.0340, lon: 80.2540, inter: 0, info: 'Underground station at Alwarpet junction along TTK Road corridor.', zone: 'Section C (Underground section toward Lighthouse)', target: 'Target 2027 - 2028 (Underground)' },
      { id: 'YL26', name: 'Thirumayilai', ta: 'திருமயிலை', code: 'TMY', lat: 13.0345, lon: 80.2701, inter: 1, info: 'Major future 3-way multi-modal interchange hub connecting Phase 2 Corridor 3 (Purple Line PL11) and Suburban MRTS (MR11).', zone: 'Section C (Underground section toward Lighthouse)', target: 'Target 2027 - 2028 (Underground)' },
      { id: 'YL27', name: 'Kutchery Road', ta: 'கச்சேரி சாலை', code: 'KCR', lat: 13.0380, lon: 80.2730, inter: 0, info: 'Underground station near historic Mylapore cultural quarter.', zone: 'Section C (Underground section toward Lighthouse)', target: 'Target 2027 - 2028 (Underground)' },
      { id: 'YL28', name: 'Lighthouse', ta: 'கலங்கரை விளக்கம்', code: 'LHS', lat: 13.0425, lon: 80.2762, inter: 0, info: 'Eastern underground coastal terminal station situated near Marina Beach, Santhome, and Kamarajar Salai.', zone: 'Section C (Underground coastal terminal)', target: 'Target 2027 - 2028 (Underground)' }
    ];

    for (const s of verified28Stations) {
      insertStation.run(
        s.id, s.name, s.ta, s.code, 'yellow', s.lat, s.lon, s.inter, s.info,
        'Metro', s.zone, 2, 1, 1, 1, 1, 1, '05:00', '23:00',
        'under_construction', 'Phase 2', s.target
      );
    }

    // Re-link Yellow line connections
    const insertConn = db.prepare(`
      INSERT INTO connections (from_station_id, to_station_id, line_id, distance_km, travel_time_mins, is_transfer)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const addBidirectional = (from: string, to: string, line: string, dist: number, time: number, isTransfer = 0) => {
      try {
        insertConn.run(from, to, line, dist, time, isTransfer);
        insertConn.run(to, from, line, dist, time, isTransfer);
      } catch (e) {}
    };

    for (let i = 0; i < verified28Stations.length - 1; i++) {
      const s1 = verified28Stations[i];
      const s2 = verified28Stations[i + 1];
      const dist = +(Math.sqrt(Math.pow(s2.lat - s1.lat, 2) + Math.pow(s2.lon - s1.lon, 2)) * 111).toFixed(2);
      const time = Math.max(2, Math.round(dist * 1.8));
      addBidirectional(s1.id, s2.id, 'yellow', dist, time, 0);
    }

    // Future Interchange Transfers
    addBidirectional('GL08', 'YL17', 'interchange', 0.1, 2.0, 1);
    addBidirectional('BL19', 'YL22', 'interchange', 0.1, 2.0, 1);
    addBidirectional('MR11', 'YL26', 'interchange', 0.18, 3.5, 1);
    addBidirectional('PL11', 'YL26', 'interchange', 0.1, 2.0, 1);
    console.log('[Database] Verified Yellow Line initialized with 28 stations.');
  }
} catch (e) {
  console.warn('[Database] Yellow Line verification check error:', e);
}

// Ensure Suburban West Line exists
try {
  const westCheck = (db.prepare("SELECT count(*) as count FROM transit_lines WHERE id = 'suburban_west'").get() as any)?.count || 0;
  if (westCheck === 0) {
    db.prepare(`
      INSERT INTO transit_lines (id, name, short_name, color, text_color, description, system_type, total_stations, total_km, operating_hours, headway_peak, headway_offpeak, status, phase, target_completion)
      VALUES ('suburban_west', 'Suburban West Line', 'West Line', '#059669', '#ffffff', 'Chennai Central (Moore Market Complex) to Avadi & Tiruvallur via Perambur, Villivakkam, and Ambattur', 'Suburban', 13, 21.5, '04:30 - 23:30', 10, 20, 'operational', 'Southern Railway', 'Operational')
    `).run();

    const insertStation = db.prepare(`
      INSERT OR REPLACE INTO stations (
        id, name, name_ta, code, line_id, lat, lon, is_interchange, interchange_info,
        system_type, zone, platform_count, has_parking, has_feeder_bus, has_wheelchair,
        has_lifts, has_ev_charging, first_train, last_train, status, phase, target_completion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const suburbanWestStations = [
      { id: 'SW01', name: 'Chennai Central (MMC)', ta: 'புரட்சி தலைவர் டாக்டர் எம்.ஜி.ஆர் சென்னை சென்ட்ரல் (எம்.எம்.சி)', code: 'MMC', lat: 13.0833, lon: 80.2755, inter: 1, info: 'Suburban West Terminal at Moore Market Complex, connects to Metro Blue & Green Lines' },
      { id: 'SW02', name: 'Basin Bridge Junction', ta: 'பேசின் பாலம் சந்திப்பு', code: 'BBQ', lat: 13.0970, lon: 80.2710, inter: 1, info: 'Major railway junction' },
      { id: 'SW03', name: 'Vyasarpadi Jeeva', ta: 'வியாசர்பாடி ஜீவா', code: 'VPY', lat: 13.1040, lon: 80.2610, inter: 0, info: null },
      { id: 'SW04', name: 'Perambur', ta: 'பெரம்பூர்', code: 'PER', lat: 13.1075, lon: 80.2450, inter: 1, info: 'Major railway hub, future interchange with Purple Line (Corridor 3)' },
      { id: 'SW05', name: 'Perambur Carriage Works', ta: 'பெரம்பூர் கேரேஜ் ஒர்க்ஸ்', code: 'PCW', lat: 13.1090, lon: 80.2370, inter: 0, info: null },
      { id: 'SW06', name: 'Perambur Loco Works', ta: 'பெரம்பூர் லோகோ ஒர்க்ஸ்', code: 'PEW', lat: 13.1095, lon: 80.2240, inter: 0, info: null },
      { id: 'SW07', name: 'Villivakkam', ta: 'வில்லிவாக்கம்', code: 'VLK', lat: 13.1080, lon: 80.2060, inter: 1, info: 'Suburban station, future interchange with Red Line (Corridor 5)' },
      { id: 'SW08', name: 'Korattur', ta: 'கொரட்டூர்', code: 'KOTR', lat: 13.1110, lon: 80.1870, inter: 0, info: null },
      { id: 'SW09', name: 'Pattaravakkam', ta: 'பட்டரவாக்கம்', code: 'PVM', lat: 13.1130, lon: 80.1690, inter: 0, info: null },
      { id: 'SW10', name: 'Ambattur', ta: 'அம்பத்தூர்', code: 'ABR', lat: 13.1160, lon: 80.1540, inter: 1, info: 'Serving major industrial estate' },
      { id: 'SW11', name: 'Thirumullaivoyal', ta: 'திருமுல்லைவாயல்', code: 'TMVL', lat: 13.1180, lon: 80.1380, inter: 0, info: null },
      { id: 'SW12', name: 'Annanur', ta: 'அண்ணனூர்', code: 'ANNR', lat: 13.1200, lon: 80.1240, inter: 0, info: null },
      { id: 'SW13', name: 'Avadi', ta: 'ஆவடி', code: 'AVD', lat: 13.1220, lon: 80.1010, inter: 1, info: 'Major Suburban Terminal & Defense hub' }
    ];

    for (const s of suburbanWestStations) {
      insertStation.run(
        s.id, s.name, s.ta, s.code, 'suburban_west', s.lat, s.lon, s.inter, s.info,
        'Suburban', 'Western Suburban Corridor', 4, 1, 1, 1, 1, 0, '04:30', '23:30',
        'operational', 'Southern Railway', 'Operational'
      );
    }

    const insertConn = db.prepare(`
      INSERT INTO connections (from_station_id, to_station_id, line_id, distance_km, travel_time_mins, is_transfer)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const addBidirectional = (from: string, to: string, line: string, dist: number, time: number, isTransfer = 0) => {
      try {
        insertConn.run(from, to, line, dist, time, isTransfer);
        insertConn.run(to, from, line, dist, time, isTransfer);
      } catch (e) {}
    };

    for (let i = 0; i < suburbanWestStations.length - 1; i++) {
      const s1 = suburbanWestStations[i];
      const s2 = suburbanWestStations[i + 1];
      const dist = +(Math.sqrt(Math.pow(s2.lat - s1.lat, 2) + Math.pow(s2.lon - s1.lon, 2)) * 111).toFixed(2);
      const time = Math.max(2, Math.round(dist * 2.2));
      addBidirectional(s1.id, s2.id, 'suburban_west', dist, time, 0);
    }

    addBidirectional('SW01', 'BL13', 'interchange', 0.15, 2.5, 1);
    addBidirectional('SW01', 'GL01', 'interchange', 0.15, 2.5, 1);
    addBidirectional('SW01', 'SB03', 'interchange', 0.1, 2.0, 1);
    addBidirectional('SW04', 'PL03', 'interchange', 0.1, 2.0, 1);
    addBidirectional('SW07', 'RL04', 'interchange', 0.1, 2.0, 1);
    console.log('[Database] Added Suburban West Line successfully.');
  }

  // Ensure key transfer connections exist
  const insertConn = db.prepare(`
    INSERT INTO connections (from_station_id, to_station_id, line_id, distance_km, travel_time_mins, is_transfer)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const safeAddTransfer = (from: string, to: string, dist: number, time: number) => {
    const exists = db.prepare('SELECT count(*) as count FROM connections WHERE from_station_id = ? AND to_station_id = ?').get(from, to) as any;
    if (!exists || exists.count === 0) {
      try {
        insertConn.run(from, to, 'interchange', dist, time, 1);
        insertConn.run(to, from, 'interchange', dist, time, 1);
      } catch (e) {}
    }
  };

  // Vadapalani: Green (GL08) <-> Yellow (YL13)
  safeAddTransfer('GL08', 'YL13', 0.1, 2.0);
  // Nandanam: Blue (BL19) <-> Yellow (YL07)
  safeAddTransfer('BL19', 'YL07', 0.1, 2.0);
  // Thirumayilai: MRTS (MR09) <-> Yellow (YL03) & Purple (PL13)
  safeAddTransfer('MR09', 'YL03', 0.1, 2.0);
  safeAddTransfer('PL13', 'YL03', 0.05, 1.5);
  // Kodambakkam: Suburban (SB07) <-> Yellow (YL10)
  safeAddTransfer('SB07', 'YL10', 0.15, 2.5);
  // Kilpauk KMC: Green (GL04) <-> Purple (PL07)
  safeAddTransfer('GL04', 'PL07', 0.1, 2.0);
  // Thousand Lights: Blue (BL18) <-> Purple (PL10)
  safeAddTransfer('BL18', 'PL10', 0.1, 2.0);
  // CMBT: Green (GL06) <-> Red (RL08)
  safeAddTransfer('GL06', 'RL08', 0.1, 2.0);
  // Thirumangalam: Green (GL09) <-> Red (RL06)
  safeAddTransfer('GL09', 'RL06', 0.1, 2.0);
} catch (err) {
  console.error('[Database] Migration error:', err);
}

// Ensure Suburban South Line has all 28 verified stations (Chennai Beach to Chengalpattu Junction)
try {
  // Update transit line summary
  db.prepare(`
    UPDATE transit_lines 
    SET total_stations = 28, total_km = 59.6, description = 'Chennai Beach to Chengalpattu Junction suburban railway corridor'
    WHERE id = 'suburban_south'
  `).run();

  // Normalize existing stations SB01-SB18 names to standard names
  db.prepare("UPDATE stations SET name = 'Chennai Egmore' WHERE id = 'SB04' AND line_id = 'suburban_south'").run();
  db.prepare("UPDATE stations SET name = 'Saidapet' WHERE id = 'SB09' AND line_id = 'suburban_south'").run();
  db.prepare("UPDATE stations SET name = 'Guindy' WHERE id = 'SB10' AND line_id = 'suburban_south'").run();
  db.prepare("UPDATE stations SET name = 'St. Thomas Mount' WHERE id = 'SB11' AND line_id = 'suburban_south'").run();
  db.prepare("UPDATE stations SET name = 'Palavanthangal' WHERE id = 'SB12' AND line_id = 'suburban_south'").run();
  db.prepare("UPDATE stations SET name = 'Minambakkam' WHERE id = 'SB13' AND line_id = 'suburban_south'").run();

  // Insert or update missing stations SB19 through SB28
  const insertStation = db.prepare(`
    INSERT OR REPLACE INTO stations (
      id, name, name_ta, code, line_id, lat, lon, is_interchange, interchange_info,
      system_type, zone, platform_count, has_parking, has_feeder_bus, has_wheelchair,
      has_lifts, has_ev_charging, first_train, last_train, status, phase, target_completion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const southExtensionStations = [
    { id: 'SB19', name: 'Perungalathur', ta: 'பெருங்களத்தூர்', code: 'PRGL', lat: 12.9060, lon: 80.0880, inter: 0, info: 'Suburban station serving southern suburban residential hub' },
    { id: 'SB20', name: 'Vandalur', ta: 'வண்டலூர்', code: 'VDR', lat: 12.8900, lon: 80.0810, inter: 1, info: 'Gateway to Arignar Anna Zoological Park (Vandalur Zoo) & Kilambakkam KCBT bus terminus' },
    { id: 'SB21', name: 'Urappakkam', ta: 'ஊரப்பாக்கம்', code: 'UPM', lat: 12.8680, lon: 80.0700, inter: 0, info: 'Suburban railway stop serving GST Road residential corridor' },
    { id: 'SB22', name: 'Guduvancheri', ta: 'கூடுவாஞ்சேரி', code: 'GI', lat: 12.8440, lon: 80.0600, inter: 1, info: 'Key junction with suburban MTC bus terminal connectivity' },
    { id: 'SB23', name: 'Potheri', ta: 'பொத்தேரி', code: 'POTI', lat: 12.8230, lon: 80.0450, inter: 0, info: 'Serving SRM Institute of Science & Technology (SRM University campus)' },
    { id: 'SB24', name: 'Kattangulathur', ta: 'காட்டாங்கொளத்தூர்', code: 'CTM', lat: 12.8120, lon: 80.0380, inter: 0, info: 'Suburban stop near SRM medical college and tech parks' },
    { id: 'SB25', name: 'Maraimalai Nagar', ta: 'மறைமலை நகர்', code: 'MMNK', lat: 12.7980, lon: 80.0240, inter: 1, info: 'Kamarajar station serving major industrial estate and Ford/automotive cluster' },
    { id: 'SB26', name: 'Singaperumal Koil', ta: 'சிங்கபெருமாள் கோவில்', code: 'SKL', lat: 12.7630, lon: 80.0020, inter: 0, info: 'Serving historic Sri Padalathri Narasimhar Temple and industrial sector' },
    { id: 'SB27', name: 'Paranur', ta: 'பரனூர்', code: 'PWU', lat: 12.7210, lon: 79.9910, inter: 1, info: 'Serving Mahindra World City IT and manufacturing SEZ' },
    { id: 'SB28', name: 'Chengalpattu Junction', ta: 'செங்கல்பட்டு சந்திப்பு', code: 'CGL', lat: 12.6840, lon: 79.9820, inter: 1, info: 'Major Southern Railway Junction & Southern Suburban Terminal connecting to Villupuram, Kanchipuram and Arakkonam' }
  ];

  for (const s of southExtensionStations) {
    insertStation.run(
      s.id, s.name, s.ta, s.code, 'suburban_south', s.lat, s.lon, s.inter, s.info,
      'Suburban', 'South', 4, 1, 1, 1, 1, 0, '04:00', '23:45',
      'operational', 'Southern Railway', 'Operational'
    );
  }

  // Add sequential bidirectional connections from Tambaram (SB18) through Chengalpattu (SB28)
  const insertConn = db.prepare(`
    INSERT INTO connections (from_station_id, to_station_id, line_id, distance_km, travel_time_mins, is_transfer)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const safeAddSuburbanConn = (from: string, to: string, dist: number, time: number) => {
    const exists = db.prepare('SELECT count(*) as count FROM connections WHERE from_station_id = ? AND to_station_id = ? AND line_id = ?').get(from, to, 'suburban_south') as any;
    if (!exists || exists.count === 0) {
      try {
        insertConn.run(from, to, 'suburban_south', dist, time, 0);
        insertConn.run(to, from, 'suburban_south', dist, time, 0);
      } catch (e) {}
    }
  };

  const southSegments = [
    { from: 'SB18', to: 'SB19', dist: 3.0, time: 4 },
    { from: 'SB19', to: 'SB20', dist: 2.1, time: 3 },
    { from: 'SB20', to: 'SB21', dist: 2.8, time: 4 },
    { from: 'SB21', to: 'SB22', dist: 3.0, time: 4 },
    { from: 'SB22', to: 'SB23', dist: 2.7, time: 4 },
    { from: 'SB23', to: 'SB24', dist: 1.5, time: 2 },
    { from: 'SB24', to: 'SB25', dist: 2.1, time: 3 },
    { from: 'SB25', to: 'SB26', dist: 4.5, time: 6 },
    { from: 'SB26', to: 'SB27', dist: 4.8, time: 6 },
    { from: 'SB27', to: 'SB28', dist: 4.5, time: 6 }
  ];

  for (const seg of southSegments) {
    safeAddSuburbanConn(seg.from, seg.to, seg.dist, seg.time);
  }

  console.log('[Database] Suburban South Line upgraded to 28 verified stations (Chennai Beach to Chengalpattu Junction).');
} catch (err) {
  console.error('[Database] Failed to upgrade Suburban South Line:', err);
}

// Ensure Suburban West Line has all 31 verified stations (Chennai Central MMC to Arakkonam Junction)
try {
  // Update transit line summary
  db.prepare(`
    UPDATE transit_lines 
    SET total_stations = 31, 
        total_km = 68.4, 
        name = 'Suburban West Line',
        short_name = 'West Line',
        description = 'Chennai Central (Moore Market Complex) to Arakkonam Junction suburban railway corridor',
        headway_peak = 10,
        headway_offpeak = 20,
        status = 'operational',
        phase = 'Southern Railway',
        target_completion = 'Operational'
    WHERE id = 'suburban_west'
  `).run();

  // Normalize existing stations SW01-SW13 to exact official names and codes
  db.prepare(`
    UPDATE stations SET 
      name = 'Chennai Central (Moore Market Complex)', 
      name_ta = 'புரட்சி தலைவர் டாக்டர் எம்.ஜி.ஆர் சென்னை சென்ட்ரல் (மூர் மார்க்கெட் வளாகம்)',
      code = 'MASS', 
      interchange_info = 'Suburban West Terminal at Moore Market Complex, connects to Metro Blue & Green Lines and Chennai Park (South Line)' 
    WHERE id = 'SW01' AND line_id = 'suburban_west'
  `).run();

  db.prepare(`
    UPDATE stations SET 
      name = 'Basin Bridge', 
      name_ta = 'பேசின் பாலம்',
      code = 'BBQ', 
      interchange_info = 'Major railway junction connecting to North Line (Gummidipoondi / Sullurupeta)' 
    WHERE id = 'SW02' AND line_id = 'suburban_west'
  `).run();

  db.prepare(`
    UPDATE stations SET 
      name = 'Vyasarpadi Jeeva', 
      name_ta = 'வியாசர்பாடி ஜீவா',
      code = 'VPY' 
    WHERE id = 'SW03' AND line_id = 'suburban_west'
  `).run();

  db.prepare(`
    UPDATE stations SET 
      name = 'Perambur', 
      name_ta = 'பெரம்பூர்',
      code = 'PER', 
      interchange_info = 'Major railway hub, future interchange with Purple Line (Corridor 3) & mainline intercity trains' 
    WHERE id = 'SW04' AND line_id = 'suburban_west'
  `).run();

  db.prepare(`
    UPDATE stations SET 
      name = 'Perambur Carriage Works', 
      name_ta = 'பெரம்பூர் கேரேஜ் ஒர்க்ஸ்',
      code = 'PCW' 
    WHERE id = 'SW05' AND line_id = 'suburban_west'
  `).run();

  db.prepare(`
    UPDATE stations SET 
      name = 'Perambur Locomotive Works', 
      name_ta = 'பெரம்பூர் லோகோ ஒர்க்ஸ்',
      code = 'PEW' 
    WHERE id = 'SW06' AND line_id = 'suburban_west'
  `).run();

  db.prepare(`
    UPDATE stations SET 
      name = 'Villivakkam', 
      name_ta = 'வில்லிவாக்கம்',
      code = 'VLK', 
      interchange_info = 'Suburban station, future interchange with Red Line (Corridor 5)' 
    WHERE id = 'SW07' AND line_id = 'suburban_west'
  `).run();

  db.prepare(`
    UPDATE stations SET 
      name = 'Korattur', 
      name_ta = 'கொரட்டூர்',
      code = 'KOTR' 
    WHERE id = 'SW08' AND line_id = 'suburban_west'
  `).run();

  db.prepare(`
    UPDATE stations SET 
      name = 'Pattaravakkam', 
      name_ta = 'பட்டரவாக்கம்',
      code = 'PVM' 
    WHERE id = 'SW09' AND line_id = 'suburban_west'
  `).run();

  db.prepare(`
    UPDATE stations SET 
      name = 'Ambattur', 
      name_ta = 'அம்பத்தூர்',
      code = 'ABU', 
      interchange_info = 'Serving Ambattur Industrial Estate & MTC Bus Terminus' 
    WHERE id = 'SW10' AND line_id = 'suburban_west'
  `).run();

  db.prepare(`
    UPDATE stations SET 
      name = 'Thirumullaivoyal', 
      name_ta = 'திருமுல்லைவாயல்',
      code = 'TMVL' 
    WHERE id = 'SW11' AND line_id = 'suburban_west'
  `).run();

  db.prepare(`
    UPDATE stations SET 
      name = 'Annanur', 
      name_ta = 'அண்ணனூர்',
      code = 'ANNR' 
    WHERE id = 'SW12' AND line_id = 'suburban_west'
  `).run();

  db.prepare(`
    UPDATE stations SET 
      name = 'Avadi', 
      name_ta = 'ஆவடி',
      code = 'AVD', 
      interchange_info = 'Major Suburban Terminal, EMU Car Shed, Defense/HVF Sector & MTC Bus Depot' 
    WHERE id = 'SW13' AND line_id = 'suburban_west'
  `).run();

  // Insert or update stations SW14 through SW31
  const insertStation = db.prepare(`
    INSERT OR REPLACE INTO stations (
      id, name, name_ta, code, line_id, lat, lon, is_interchange, interchange_info,
      system_type, zone, platform_count, has_parking, has_feeder_bus, has_wheelchair,
      has_lifts, has_ev_charging, first_train, last_train, status, phase, target_completion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const westExtensionStations = [
    { id: 'SW14', name: 'Hindu College', ta: 'இந்து கல்லூரி', code: 'HC', lat: 13.1205, lon: 80.0815, inter: 0, info: 'Suburban halt serving Hindu College and suburban residential catchment' },
    { id: 'SW15', name: 'Pattabiram', ta: 'பட்டாபிராம்', code: 'PAB', lat: 13.1200, lon: 80.0630, inter: 1, info: 'Suburban railway junction connecting to Pattabiram Military Siding (PTMS) spur line and Nemilichery mainline' },
    { id: 'SW16', name: 'Pattabiram Military Siding', ta: 'பட்டாபிராம் மிலிட்டரி சைடிங்', code: 'PTMS', lat: 13.1360, lon: 80.0610, inter: 1, info: 'Spur branch station serving defense establishment. Verified dedicated train connection to Pattabiram East Depot (PRES).' },
    { id: 'SW17', name: 'Pattabiram East Depot', ta: 'பட்டாபிராம் கிழக்கு பணிமனை', code: 'PRES', lat: 13.1420, lon: 80.0660, inter: 1, info: 'Spur terminal depot station. Verified dedicated train connection to Pattabiram Military Siding (PTMS).' },
    { id: 'SW18', name: 'Nemilichery', ta: 'நெமிலிச்சேரி', code: 'NEC', lat: 13.1180, lon: 80.0460, inter: 0, info: 'Mainline suburban railway stop between Pattabiram and Thiruninravur' },
    { id: 'SW19', name: 'Thiruninravur', ta: 'திருநின்றவூர்', code: 'TI', lat: 13.1160, lon: 80.0270, inter: 1, info: 'Major suburban station, terminating loop for local EMUs & interchange with Outer Ring Road' },
    { id: 'SW20', name: 'Veppampattu', ta: 'வேப்பம்பட்டு', code: 'VEU', lat: 13.1135, lon: 79.9980, inter: 0, info: 'Suburban station serving western residential township' },
    { id: 'SW21', name: 'Sevvapet Road', ta: 'செவ்வாய்பேட்டை சாலை', code: 'SVR', lat: 13.1200, lon: 79.9650, inter: 0, info: 'Suburban stop along CTH Road (Chennai-Tiruvallur High Road)' },
    { id: 'SW22', name: 'Putlur', ta: 'புட்லூர்', code: 'PTLR', lat: 13.1310, lon: 79.9320, inter: 0, info: 'Suburban station serving historic Angala Parameswari Amman Temple' },
    { id: 'SW23', name: 'Tiruvallur', ta: 'திருவள்ளூர்', code: 'TRL', lat: 13.1430, lon: 79.9080, inter: 1, info: 'District Headquarters Junction & Terminal for Tiruvallur suburban EMUs, Sri Veeraraghava Perumal Temple' },
    { id: 'SW24', name: 'Egattur', ta: 'எகட்டூர்', code: 'EGT', lat: 13.1290, lon: 79.8780, inter: 0, info: 'Suburban railway stop between Tiruvallur and Kadambattur' },
    { id: 'SW25', name: 'Kadambattur', ta: 'கடம்பத்தூர்', code: 'KBT', lat: 13.1120, lon: 79.8510, inter: 1, info: 'Suburban junction with terminating loop for local EMU shuttles' },
    { id: 'SW26', name: 'Senjipanambakkam', ta: 'செஞ்சிபனம்பாக்கம்', code: 'SPAM', lat: 13.1020, lon: 79.8210, inter: 0, info: 'Suburban halt serving rural agricultural belt' },
    { id: 'SW27', name: 'Manavur', ta: 'மணவூர்', code: 'MAF', lat: 13.0900, lon: 79.7910, inter: 0, info: 'Suburban railway station serving Manavur locality' },
    { id: 'SW28', name: 'Thiruvalangadu', ta: 'திருவாலங்காடு', code: 'TO', lat: 13.0800, lon: 79.7610, inter: 1, info: 'Serving ancient Sri Vadaranyeswarar Temple (Rathina Sabhai, one of the five Nataraja Sabhas)' },
    { id: 'SW29', name: 'Mosur', ta: 'மோசூர்', code: 'MSU', lat: 13.0780, lon: 79.7150, inter: 0, info: 'Suburban stop on the Tiruvallur–Arakkonam stretch' },
    { id: 'SW30', name: 'Puliyamangalam', ta: 'புளியமங்கலம்', code: 'PLMG', lat: 13.0790, lon: 79.6880, inter: 0, info: 'Suburban halt preceding Arakkonam Junction' },
    { id: 'SW31', name: 'Arakkonam Junction', ta: 'அரக்கோணம் சந்திப்பு', code: 'AJJ', lat: 13.0830, lon: 79.6680, inter: 1, info: 'Major Southern Railway Divisional Junction & Western Suburban Terminal connecting to Katpadi, Bengaluru, Renigunta, and Chengalpattu' }
  ];

  for (const s of westExtensionStations) {
    insertStation.run(
      s.id, s.name, s.ta, s.code, 'suburban_west', s.lat, s.lon, s.inter, s.info,
      'Suburban', 'West', 4, 1, 1, 1, 1, 0, '04:15', '23:45',
      'operational', 'Southern Railway', 'Operational'
    );
  }

  // Add sequential bidirectional connections for the complete 31-station West Line
  const insertWestConn = db.prepare(`
    INSERT INTO connections (from_station_id, to_station_id, line_id, distance_km, travel_time_mins, is_transfer)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const safeAddWestConn = (from: string, to: string, dist: number, time: number, isTransfer = 0) => {
    const exists = db.prepare('SELECT count(*) as count FROM connections WHERE from_station_id = ? AND to_station_id = ? AND line_id = ?').get(from, to, 'suburban_west') as any;
    if (!exists || exists.count === 0) {
      try {
        insertWestConn.run(from, to, 'suburban_west', dist, time, isTransfer);
        insertWestConn.run(to, from, 'suburban_west', dist, time, isTransfer);
      } catch (e) {}
    }
  };

  const westSegments = [
    { from: 'SW13', to: 'SW14', dist: 2.2, time: 3 }, // Avadi <-> Hindu College
    { from: 'SW14', to: 'SW15', dist: 1.9, time: 3 }, // Hindu College <-> Pattabiram
    { from: 'SW15', to: 'SW18', dist: 2.0, time: 3 }, // Pattabiram <-> Nemilichery (Mainline)
    { from: 'SW15', to: 'SW16', dist: 2.1, time: 4 }, // Pattabiram <-> Pattabiram Military Siding (PTMS spur)
    { from: 'SW16', to: 'SW17', dist: 1.8, time: 3 }, // PTMS <-> Pattabiram East Depot (PRES spur train connection)
    { from: 'SW18', to: 'SW19', dist: 2.1, time: 3 }, // Nemilichery <-> Thiruninravur
    { from: 'SW19', to: 'SW20', dist: 3.2, time: 4 }, // Thiruninravur <-> Veppampattu
    { from: 'SW20', to: 'SW21', dist: 3.6, time: 5 }, // Veppampattu <-> Sevvapet Road
    { from: 'SW21', to: 'SW22', dist: 3.8, time: 5 }, // Sevvapet Road <-> Putlur
    { from: 'SW22', to: 'SW23', dist: 2.9, time: 4 }, // Putlur <-> Tiruvallur
    { from: 'SW23', to: 'SW24', dist: 3.5, time: 5 }, // Tiruvallur <-> Egattur
    { from: 'SW24', to: 'SW25', dist: 3.3, time: 4 }, // Egattur <-> Kadambattur
    { from: 'SW25', to: 'SW26', dist: 3.4, time: 4 }, // Kadambattur <-> Senjipanambakkam
    { from: 'SW26', to: 'SW27', dist: 3.5, time: 4 }, // Senjipanambakkam <-> Manavur
    { from: 'SW27', to: 'SW28', dist: 3.5, time: 4 }, // Manavur <-> Thiruvalangadu
    { from: 'SW28', to: 'SW29', dist: 5.1, time: 6 }, // Thiruvalangadu <-> Mosur
    { from: 'SW29', to: 'SW30', dist: 3.0, time: 4 }, // Mosur <-> Puliyamangalam
    { from: 'SW30', to: 'SW31', dist: 2.3, time: 4 }  // Puliyamangalam <-> Arakkonam Junction
  ];

  for (const seg of westSegments) {
    safeAddWestConn(seg.from, seg.to, seg.dist, seg.time);
  }

  console.log('[Database] Suburban West Line upgraded to 31 verified stations (Chennai Central MMC to Arakkonam Junction).');
} catch (err) {
  console.error('[Database] Failed to upgrade Suburban West Line:', err);
}

// Ensure Suburban North Line exists (Moore Market Complex to Sullurupeta - 22 Stations)
try {
  const northLineCheck = (db.prepare("SELECT count(*) as count FROM transit_lines WHERE id = 'suburban_north'").get() as any)?.count || 0;
  if (northLineCheck === 0) {
    db.prepare(`
      INSERT INTO transit_lines (
        id, name, short_name, color, text_color, description, system_type,
        total_stations, total_km, operating_hours, headway_peak, headway_offpeak,
        status, phase, target_completion
      ) VALUES (
        'suburban_north',
        'Suburban North Line',
        'North Line',
        '#0891b2',
        '#ffffff',
        'Chennai Moore Market Complex (MASS) to Sullurupeta (SPE) via Basin Bridge, Ennore, and Gummidipoondi',
        'Suburban',
        22,
        82.5,
        '04:15 - 23:45',
        12,
        25,
        'operational',
        'Southern Railway',
        'Operational'
      )
    `).run();
  }

  const northStationCount = (db.prepare("SELECT count(*) as count FROM stations WHERE line_id = 'suburban_north'").get() as any)?.count || 0;
  if (northStationCount < 22) {
    const insertStation = db.prepare(`
      INSERT OR REPLACE INTO stations (
        id, name, name_ta, code, line_id, lat, lon, is_interchange, interchange_info,
        system_type, zone, platform_count, has_parking, has_feeder_bus, has_wheelchair,
        has_lifts, has_ev_charging, first_train, last_train, status, phase, target_completion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const northStations = [
      { id: 'SN01', name: 'Chennai Moore Market Complex', ta: 'சென்னை மூர் மார்க்கெட் வளாகம் (சென்ட்ரல் புறநகர்)', code: 'MASS', lat: 13.0833, lon: 80.2755, inter: 1, info: 'Suburban North Terminal at Moore Market Complex (MASS/MMCC). Verified interchange with Metro Blue/Green Lines (Central) and Suburban West/South Lines.', zone: 'Terminal Hub' },
      { id: 'SN02', name: 'Basin Bridge Junction', ta: 'பேசின் பாலம் சந்திப்பு', code: 'BBQ', lat: 13.0970, lon: 80.2710, inter: 1, info: 'Major Southern Railway junction connecting North and West Suburban lines.', zone: 'Zone 1 (Inner City)' },
      { id: 'SN03', name: 'Korukkupet', ta: 'கொருக்குப்பேட்டை', code: 'KOK', lat: 13.1110, lon: 80.2780, inter: 0, info: 'Suburban stop in North Chennai industrial and residential zone.', zone: 'Zone 1 (Inner City)' },
      { id: 'SN04', name: 'Tondiarpet', ta: 'தண்டையார்பேட்டை', code: 'TNP', lat: 13.1230, lon: 80.2830, inter: 0, info: 'Serving Tondiarpet oil refinery depot, container freight terminals, and residential localities.', zone: 'Zone 1 (Inner City)' },
      { id: 'SN05', name: 'V. O. C. Nagar', ta: 'வ. உ. சி. நகர்', code: 'VOC', lat: 13.1360, lon: 80.2880, inter: 0, info: 'Suburban station named after freedom fighter V. O. Chidambaram Pillai.', zone: 'Zone 2 (North Chennai)' },
      { id: 'SN06', name: 'Tiruvottiyur', ta: 'திருவொற்றியூர்', code: 'TVT', lat: 13.1610, lon: 80.3010, inter: 1, info: 'Suburban railway station serving historic Tiruvottiyur Thyagaraja Swamy Temple. Verified interchange with Blue Line Metro (Tiruvottiyur station).', zone: 'Zone 2 (North Chennai)' },
      { id: 'SN07', name: 'Wimco Nagar', ta: 'விம்கோ நகர்', code: 'WCN', lat: 13.1750, lon: 80.3060, inter: 1, info: 'Suburban railway station serving Wimco match factory area. Verified physical interchange with Chennai Metro Blue Line Wimco Nagar station (BL02).', zone: 'Zone 2 (North Chennai)' },
      { id: 'SN08', name: 'Kathivakkam', ta: 'கத்திவாக்கம்', code: 'KAV', lat: 13.1950, lon: 80.3120, inter: 0, info: 'Serving Kathivakkam industrial township and fishing community.', zone: 'Zone 3 (Ennore Industrial Belt)' },
      { id: 'SN09', name: 'Ennore', ta: 'எண்ணூர்', code: 'ENR', lat: 13.2160, lon: 80.3220, inter: 1, info: 'Gateway to Kamarajar Port (Ennore Port), North Chennai Thermal Power Station, and Ennore Creek.', zone: 'Zone 3 (Ennore Industrial Belt)' },
      { id: 'SN10', name: 'Attipattu Pudu Nagar', ta: 'அத்திப்பட்டு புது நகர்', code: 'AIPN', lat: 13.2420, lon: 80.3180, inter: 0, info: 'Suburban halt serving Attipattu township expansion and port logistics cluster.', zone: 'Zone 3 (Ennore Industrial Belt)' },
      { id: 'SN11', name: 'Attipattu', ta: 'அத்திப்பட்டு', code: 'AIPP', lat: 13.2610, lon: 80.3150, inter: 0, info: 'Suburban railway stop serving NCTPS power plant workers and local residents.', zone: 'Zone 3 (Ennore Industrial Belt)' },
      { id: 'SN12', name: 'Nandiyampakkam', ta: 'நந்தியம்பாக்கம்', code: 'NPKM', lat: 13.2790, lon: 80.3050, inter: 0, info: 'Suburban station serving Nandiyampakkam village and surrounding agricultural tracts.', zone: 'Zone 4 (Minjur Sub-division)' },
      { id: 'SN13', name: 'Minjur', ta: 'மீஞ்சூர்', code: 'MJR', lat: 13.2980, lon: 80.2610, inter: 1, info: 'Major suburban hub, Minjur Seawater Desalination Plant, and interchange with Outer Ring Road (ORR - Phase II).', zone: 'Zone 4 (Minjur Sub-division)' },
      { id: 'SN14', name: 'Anuppambattu', ta: 'அனுப்பம்பட்டு', code: 'APB', lat: 13.3180, lon: 80.2310, inter: 0, info: 'Suburban halt between Minjur and Ponneri along North Chennai line.', zone: 'Zone 5 (Ponneri Taluk)' },
      { id: 'SN15', name: 'Ponneri', ta: 'பொன்னேரி', code: 'PON', lat: 13.3400, lon: 80.2010, inter: 1, info: 'Taluk headquarters station, Ponneri Smart City hub, and major educational institutional cluster.', zone: 'Zone 5 (Ponneri Taluk)' },
      { id: 'SN16', name: 'Kavaraipettai', ta: 'கவரப்பேட்டை', code: 'KVP', lat: 13.3750, lon: 80.1700, inter: 0, info: 'Suburban station serving engineering colleges, RMK campus, and rural agricultural hub.', zone: 'Zone 6 (Gummidipoondi Industrial Sector)' },
      { id: 'SN17', name: 'Gummidipoondi', ta: 'கும்மிடிப்பூண்டி', code: 'GPD', lat: 13.4070, lon: 80.1300, inter: 1, info: 'Major Southern Railway Terminating Hub & EMU Turnover Junction. Major SIPCOT Industrial Park with frequent suburban EMU turn-backs.', zone: 'Zone 6 (Terminating Hub / Turnover)' },
      { id: 'SN18', name: 'Elavur', ta: 'எளாவூர்', code: 'ELR', lat: 13.4560, lon: 80.1110, inter: 0, info: 'Suburban stop north of Gummidipoondi serving border industrial clusters.', zone: 'Zone 7 (Northern Border Extension)' },
      { id: 'SN19', name: 'Arambakkam', ta: 'ஆரம்பாக்கம்', code: 'AAM', lat: 13.5180, lon: 80.0890, inter: 0, info: 'Suburban station near Tamil Nadu–Andhra Pradesh interstate border.', zone: 'Zone 7 (Northern Border Extension)' },
      { id: 'SN20', name: 'Tada', ta: 'தடா', code: 'TADA', lat: 13.5850, lon: 80.0410, inter: 1, info: 'Gateway to Sri City Integrated Business City & SEZ, Pulicat Lake sanctuary, and Ubbalamadugu (Tada) Falls.', zone: 'Zone 8 (Andhra Pradesh Border Hub)' },
      { id: 'SN21', name: 'Akkampet', ta: 'அக்கம்பேட்டை', code: 'AKAT', lat: 13.6320, lon: 80.0310, inter: 0, info: 'Suburban halt preceding Sullurupeta in Nellore district of Andhra Pradesh.', zone: 'Zone 8 (Andhra Pradesh Border Hub)' },
      { id: 'SN22', name: 'Sullurupeta', ta: 'சூளூர்பேட்டை', code: 'SPE', lat: 13.6980, lon: 80.0210, inter: 1, info: 'Northern Suburban Railway Terminal. Gateway to ISRO Satish Dhawan Space Centre (SHAR), Sriharikota & Pulicat Bird Sanctuary.', zone: 'Terminal Hub (AP Border)' }
    ];

    for (const s of northStations) {
      insertStation.run(
        s.id, s.name, s.ta, s.code, 'suburban_north', s.lat, s.lon, s.inter, s.info,
        'Suburban', s.zone, 4, 1, 1, 1, 1, 0, '04:15', '23:45',
        'operational', 'Southern Railway', 'Operational'
      );
    }

    const insertConn = db.prepare(`
      INSERT INTO connections (from_station_id, to_station_id, line_id, distance_km, travel_time_mins, is_transfer)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const safeAddNorthConn = (from: string, to: string, dist: number, time: number) => {
      const exists = db.prepare('SELECT count(*) as count FROM connections WHERE from_station_id = ? AND to_station_id = ? AND line_id = ?').get(from, to, 'suburban_north') as any;
      if (!exists || exists.count === 0) {
        try {
          insertConn.run(from, to, 'suburban_north', dist, time, 0);
          insertConn.run(to, from, 'suburban_north', dist, time, 0);
        } catch (e) {}
      }
    };

    const northSegments = [
      { from: 'SN01', to: 'SN02', dist: 2.2, time: 3 },
      { from: 'SN02', to: 'SN03', dist: 1.9, time: 3 },
      { from: 'SN03', to: 'SN04', dist: 1.6, time: 2 },
      { from: 'SN04', to: 'SN05', dist: 1.8, time: 3 },
      { from: 'SN05', to: 'SN06', dist: 3.1, time: 4 },
      { from: 'SN06', to: 'SN07', dist: 1.9, time: 3 },
      { from: 'SN07', to: 'SN08', dist: 2.3, time: 3 },
      { from: 'SN08', to: 'SN09', dist: 2.5, time: 4 },
      { from: 'SN09', to: 'SN10', dist: 2.9, time: 4 },
      { from: 'SN10', to: 'SN11', dist: 2.1, time: 3 },
      { from: 'SN11', to: 'SN12', dist: 2.2, time: 3 },
      { from: 'SN12', to: 'SN13', dist: 2.7, time: 4 },
      { from: 'SN13', to: 'SN14', dist: 3.2, time: 4 },
      { from: 'SN14', to: 'SN15', dist: 3.5, time: 5 },
      { from: 'SN15', to: 'SN16', dist: 4.8, time: 6 },
      { from: 'SN16', to: 'SN17', dist: 5.2, time: 7 },
      { from: 'SN17', to: 'SN18', dist: 5.9, time: 8 },
      { from: 'SN18', to: 'SN19', dist: 7.2, time: 9 },
      { from: 'SN19', to: 'SN20', dist: 8.4, time: 10 },
      { from: 'SN20', to: 'SN21', dist: 5.8, time: 7 },
      { from: 'SN21', to: 'SN22', dist: 7.6, time: 9 }
    ];

    for (const seg of northSegments) {
      safeAddNorthConn(seg.from, seg.to, seg.dist, seg.time);
    }

    // Key Interchange Transfers
    const safeAddTransfer = (from: string, to: string, dist: number, time: number) => {
      const exists = db.prepare('SELECT count(*) as count FROM connections WHERE from_station_id = ? AND to_station_id = ?').get(from, to) as any;
      if (!exists || exists.count === 0) {
        try {
          insertConn.run(from, to, 'interchange', dist, time, 1);
          insertConn.run(to, from, 'interchange', dist, time, 1);
        } catch (e) {}
      }
    };

    safeAddTransfer('SN01', 'SW01', 0.05, 1.0);
    safeAddTransfer('SN01', 'BL13', 0.15, 2.5);
    safeAddTransfer('SN01', 'GL01', 0.15, 2.5);
    safeAddTransfer('SN01', 'SB03', 0.1, 2.0);
    safeAddTransfer('SN02', 'SW02', 0.05, 1.0);
    safeAddTransfer('SN07', 'BL02', 0.1, 2.0);
    safeAddTransfer('SN06', 'BL03', 0.2, 3.0);

    console.log('[Database] Suburban North Line initialized with 22 verified stations (MASS to SPE).');
  }
} catch (err) {
  console.error('[Database] Failed to initialize Suburban North Line:', err);
}

// Ensure West–South Link Line exists (Chengalpattu Junction to Arakkonam Junction - 13 Stations)
try {
  const linkLineCheck = (db.prepare("SELECT count(*) as count FROM transit_lines WHERE id = 'suburban_west_south'").get() as any)?.count || 0;
  if (linkLineCheck === 0) {
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
    `).run();
  }

  // Ensure interchange info for endpoint stations
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

  const linkStationCount = (db.prepare("SELECT count(*) as count FROM stations WHERE line_id = 'suburban_west_south'").get() as any)?.count || 0;
  if (linkStationCount < 11) {
    const insertStation = db.prepare(`
      INSERT OR REPLACE INTO stations (
        id, name, name_ta, code, line_id, lat, lon, is_interchange, interchange_info,
        system_type, zone, platform_count, has_parking, has_feeder_bus, has_wheelchair,
        has_lifts, has_ev_charging, first_train, last_train, status, phase, target_completion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const intermediateStations = [
      { id: 'WS02', name: 'Reddipalayam', ta: 'ரெட்டிபாளையம்', code: 'RDY', lat: 12.7050, lon: 79.9480, inter: 0, info: 'Suburban railway stop serving Reddipalayam agricultural & residential catchment', zone: 'Chengalpattu Taluk' },
      { id: 'WS03', name: 'Villiyambakkam', ta: 'வில்லியம்பாக்கம்', code: 'VB', lat: 12.7210, lon: 79.9190, inter: 0, info: 'Suburban halt serving Villiyambakkam and surrounding rural settlements', zone: 'Chengalpattu Taluk' },
      { id: 'WS04', name: 'Palur', ta: 'பாலூர்', code: 'PALR', lat: 12.7480, lon: 79.8820, inter: 0, info: 'Suburban station serving Palur agricultural and handloom cluster along Palar River basin', zone: 'Chengalpattu Taluk' },
      { id: 'WS05', name: 'Pazhaya Seevaram', ta: 'பழைய சீவரம்', code: 'PYV', lat: 12.7830, lon: 79.8450, inter: 0, info: 'Historical locality also known as Palayasivaram; home to Sri Lakshmi Narasimha Swamy Temple', zone: 'Walajabad Taluk' },
      { id: 'WS06', name: 'Walajabad', ta: 'வாலாஜாபாத்', code: 'WJ', lat: 12.8020, lon: 79.8130, inter: 1, info: 'Suburban town station and key automobile freight hub with MTC/TNSTC bus connectivity', zone: 'Walajabad Taluk' },
      { id: 'WS07', name: 'Nathapettai', ta: 'நாதப்பேட்டை', code: 'NTT', lat: 12.8210, lon: 79.7420, inter: 0, info: 'Suburban stop approaching Kanchipuram eastern industrial and weaving outskirts', zone: 'Kanchipuram District' },
      { id: 'WS08', name: 'Kanchipuram East', ta: 'காஞ்சிபுரம் கிழக்கு', code: 'CJE', lat: 12.8360, lon: 79.7210, inter: 0, info: 'Suburban station serving Kanchipuram eastern residential areas, silk weaving co-operatives, and Collectorate office', zone: 'Kanchipuram Urban' },
      { id: 'WS09', name: 'Kanchipuram', ta: 'காஞ்சிபுரம்', code: 'CJ', lat: 12.8420, lon: 79.7020, inter: 1, info: 'Major historical temple city & silk capital. Key junction for Sri Kamakshi Amman, Ekambareswarar & Varadharaja Perumal temples with bus connections to Vellore & Bengaluru', zone: 'Kanchipuram Urban' },
      { id: 'WS10', name: 'Tirumalpur', ta: 'திருமால்பூர்', code: 'TMLP', lat: 12.9230, lon: 79.6910, inter: 1, info: 'Major suburban terminus station; originating/terminating point for Chennai Beach–Tirumalpur EMU locals with yard and loop tracks', zone: 'Nemili Taluk' },
      { id: 'WS11', name: 'Takkolam', ta: 'தக்கோலம்', code: 'TKO', lat: 13.0120, lon: 79.6840, inter: 0, info: 'Historical township (Battle of Takkolam, 949 CE); serving Central Industrial Security Force (CISF) RTC base and Sri Jalanatheeswarar Temple', zone: 'Ranipet District' },
      { id: 'WS12', name: 'Melpakkam', ta: 'மேல்பாக்கம்', code: 'MLPM', lat: 13.0610, lon: 79.6730, inter: 0, info: 'Suburban cabin and halt preceding Arakkonam Junction; junction for freight chords bypassing AJJ towards Renigunta/Katpadi', zone: 'Arakkonam Taluk' }
    ];

    for (const s of intermediateStations) {
      insertStation.run(
        s.id, s.name, s.ta, s.code, 'suburban_west_south', s.lat, s.lon, s.inter, s.info,
        'Suburban', s.zone, 3, 1, 1, 1, 1, 0, '04:45', '22:30',
        'operational', 'Southern Railway', 'Operational'
      );
    }

    const insertConn = db.prepare(`
      INSERT INTO connections (from_station_id, to_station_id, line_id, distance_km, travel_time_mins, is_transfer)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const safeAddLinkConn = (from: string, to: string, dist: number, time: number) => {
      const exists = db.prepare('SELECT count(*) as count FROM connections WHERE from_station_id = ? AND to_station_id = ? AND line_id = ?').get(from, to, 'suburban_west_south') as any;
      if (!exists || exists.count === 0) {
        try {
          insertConn.run(from, to, 'suburban_west_south', dist, time, 0);
          insertConn.run(to, from, 'suburban_west_south', dist, time, 0);
        } catch (e) {}
      }
    };

    const linkSegments = [
      { from: 'SB28', to: 'WS02', dist: 4.5, time: 6 },
      { from: 'WS02', to: 'WS03', dist: 4.1, time: 5 },
      { from: 'WS03', to: 'WS04', dist: 4.9, time: 6 },
      { from: 'WS04', to: 'WS05', dist: 5.8, time: 7 },
      { from: 'WS05', to: 'WS06', dist: 4.3, time: 5 },
      { from: 'WS06', to: 'WS07', dist: 8.5, time: 10 },
      { from: 'WS07', to: 'WS08', dist: 2.6, time: 4 },
      { from: 'WS08', to: 'WS09', dist: 2.4, time: 4 },
      { from: 'WS09', to: 'WS10', dist: 9.8, time: 11 },
      { from: 'WS10', to: 'WS11', dist: 10.5, time: 12 },
      { from: 'WS11', to: 'WS12', dist: 5.8, time: 7 },
      { from: 'WS12', to: 'SW31', dist: 4.0, time: 5 }
    ];

    for (const seg of linkSegments) {
      safeAddLinkConn(seg.from, seg.to, seg.dist, seg.time);
    }
    console.log('[Database] West–South Link Line initialized with 13 stations connecting CGL to AJJ.');
  }
} catch (err) {
  console.error('[Database] Failed to initialize West–South Link Line:', err);
}

// Database Query APIs
export function getTransitLines(statusFilter?: string) {
  let query = 'SELECT * FROM transit_lines WHERE 1=1';
  const params: any[] = [];
  if (statusFilter && statusFilter !== 'all') {
    query += ' AND status = ?';
    params.push(statusFilter);
  }
  query += " ORDER BY CASE status WHEN 'operational' THEN 1 WHEN 'under_construction' THEN 2 ELSE 3 END, name";
  return db.prepare(query).all(...params);
}

export function getAllStations(lineId?: string, search?: string, statusFilter?: string) {
  let query = `
    SELECT 
      s.*,
      l.name as line_name,
      l.short_name as line_short_name,
      l.color as line_color,
      l.headway_peak,
      l.headway_offpeak,
      l.operating_hours as line_operating_hours
    FROM stations s
    LEFT JOIN transit_lines l ON s.line_id = l.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (lineId && lineId !== 'all') {
    if (lineId === 'suburban_west_south' || lineId === 'suburban_link') {
      query += ` AND (s.line_id = 'suburban_west_south' OR s.id IN ('SB28', 'SW31'))`;
    } else {
      query += ' AND s.line_id = ?';
      params.push(lineId);
    }
  }

  if (statusFilter && statusFilter !== 'all') {
    query += ' AND s.status = ?';
    params.push(statusFilter);
  }

  if (search && search.trim() !== '') {
    query += ' AND (s.name LIKE ? OR s.name_ta LIKE ? OR s.code LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  if (lineId === 'suburban_west_south' || lineId === 'suburban_link') {
    query += " ORDER BY CASE s.id WHEN 'SB28' THEN 1 WHEN 'SW31' THEN 99 ELSE 2 END, s.id ASC";
  } else {
    query += " ORDER BY s.line_id, s.id ASC";
  }
  return db.prepare(query).all(...params);
}

export function getStationById(stationId: string) {
  return db.prepare(`
    SELECT 
      s.*,
      l.name as line_name,
      l.short_name as line_short_name,
      l.color as line_color,
      l.headway_peak,
      l.headway_offpeak,
      l.operating_hours as line_operating_hours
    FROM stations s
    LEFT JOIN transit_lines l ON s.line_id = l.id
    WHERE s.id = ?
  `).get(stationId);
}

export function getConnections() {
  return db.prepare('SELECT * FROM connections').all();
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
  status?: string;
}

export interface JourneyPlanResult {
  origin: any;
  destination: any;
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

// Internal solver for a single path with specific profile weights
function solveDijkstraPath(
  originStation: any,
  destStation: any,
  profile: 'best' | 'fewest_transfers' | 'metro' | 'suburban' | 'fastest',
  allConnections: any[],
  stationMap: Map<string, any>,
  lineMap: Map<string, any>,
  forceOperationalOnly: boolean
): any | null {
  // Build adjacency graph filtered by forceOperationalOnly
  const graph = new Map<string, Array<{ to: string; dist: number; time: number; line: string; is_transfer: number }>>();
  for (const c of allConnections) {
    if (forceOperationalOnly) {
      const fromSt = stationMap.get(c.from_station_id);
      const toSt = stationMap.get(c.to_station_id);
      const ln = lineMap.get(c.line_id);
      if (!fromSt || !toSt) continue;
      if (fromSt.status !== 'operational' || toSt.status !== 'operational') continue;
      if (ln && ln.status !== 'operational') continue;
    }
    if (!graph.has(c.from_station_id)) {
      graph.set(c.from_station_id, []);
    }
    graph.get(c.from_station_id)!.push({
      to: c.to_station_id,
      dist: c.distance_km,
      time: c.travel_time_mins,
      line: c.line_id,
      is_transfer: c.is_transfer
    });
  }

  const times = new Map<string, number>();
  const distances = new Map<string, number>();
  const prevNode = new Map<string, { stationId: string; edge: any } | null>();
  const unvisited = new Set<string>();

  for (const [id] of stationMap) {
    times.set(id, Infinity);
    distances.set(id, Infinity);
    prevNode.set(id, null);
    unvisited.add(id);
  }

  times.set(originStation.id, 0);
  distances.set(originStation.id, 0);

  while (unvisited.size > 0) {
    let currentId: string | null = null;
    let shortestTime = Infinity;

    for (const id of unvisited) {
      const t = times.get(id)!;
      if (t < shortestTime) {
        shortestTime = t;
        currentId = id;
      }
    }

    if (currentId === null || shortestTime === Infinity) break;
    if (currentId === destStation.id) break;

    unvisited.delete(currentId);

    const neighbors = graph.get(currentId) || [];
    for (const edge of neighbors) {
      if (!unvisited.has(edge.to)) continue;

      let transferPenalty = 0;
      if (edge.is_transfer) {
        if (profile === 'fewest_transfers') transferPenalty = 45.0;
        else if (profile === 'fastest') transferPenalty = 1.5;
        else transferPenalty = 3.5;
      }

      let preferencePenalty = 0;
      if (profile === 'metro') {
        if (edge.line.startsWith('suburban') || edge.line === 'mrts') {
          preferencePenalty = 30.0;
        }
      } else if (profile === 'suburban') {
        if (['blue', 'green', 'purple', 'yellow', 'red'].includes(edge.line)) {
          preferencePenalty = 30.0;
        }
      }

      const candidateTime = times.get(currentId)! + edge.time + transferPenalty + preferencePenalty;

      if (candidateTime < times.get(edge.to)!) {
        times.set(edge.to, candidateTime);
        distances.set(edge.to, distances.get(currentId)! + edge.dist);
        prevNode.set(edge.to, { stationId: currentId, edge });
      }
    }
  }

  if (times.get(destStation.id) === Infinity) {
    return null;
  }

  // Backtrack to reconstruct the route path
  const pathStationIds: string[] = [];
  const pathEdges: any[] = [];
  let curr: string | null = destStation.id;

  while (curr !== null) {
    pathStationIds.unshift(curr);
    const p = prevNode.get(curr);
    if (p) {
      pathEdges.unshift(p.edge);
      curr = p.stationId;
    } else {
      curr = null;
    }
  }

  const steps: RouteStep[] = [];
  let interchangeCount = 0;
  const linesUsedSet = new Set<string>();
  let hasAnyUpcomingStationInPath = false;

  for (let i = 0; i < pathStationIds.length; i++) {
    const stId = pathStationIds[i];
    const st = stationMap.get(stId);
    const prevEdge = i > 0 ? pathEdges[i - 1] : null;

    const lineInfo = lineMap.get(st.line_id);
    const lineColor = lineInfo ? lineInfo.color : '#0284c7';
    const lineName = lineInfo ? lineInfo.name : 'Transit';

    if (st.line_id && st.line_id !== 'interchange') {
      linesUsedSet.add(st.line_id);
    }

    if (st.status !== 'operational') {
      hasAnyUpcomingStationInPath = true;
    }

    let isTransfer = false;
    let instruction: string | undefined = undefined;

    if (i === 0) {
      instruction = `Board at ${st.name} (${lineName})`;
    } else if (prevEdge && prevEdge.is_transfer) {
      isTransfer = true;
      interchangeCount++;
      const nextLineInfo = lineMap.get(st.line_id);
      instruction = `Interchange at ${st.name}: Transfer to ${nextLineInfo ? nextLineInfo.name : 'next line'}`;
    } else if (i === pathStationIds.length - 1) {
      instruction = `Arrive at destination: ${st.name}`;
    }

    steps.push({
      station_id: st.id,
      station_name: st.name,
      station_name_ta: st.name_ta,
      line_id: st.line_id,
      line_name: lineName,
      line_color: lineColor,
      lat: st.lat,
      lon: st.lon,
      distance_from_prev: prevEdge ? prevEdge.dist : 0,
      time_from_prev: prevEdge ? prevEdge.time : 0,
      is_transfer: isTransfer,
      instruction,
      status: st.status
    });
  }

  const totalDist = +(distances.get(destStation.id)!).toFixed(2);
  let totalMins = 0;
  for (let i = 1; i < steps.length; i++) {
    totalMins += steps[i].time_from_prev;
    if (steps[i].is_transfer) totalMins += 4; // Transfer walk time
  }
  totalMins = Math.max(2, Math.round(totalMins));

  // Verified fare calculation
  const isOnlySuburban = Array.from(linesUsedSet).every(l => l.startsWith('suburban'));
  const isOnlyMRTS = Array.from(linesUsedSet).every(l => l === 'mrts');

  let fare = 10;
  if (isOnlySuburban) {
    if (totalDist > 45) fare = 20;
    else if (totalDist > 25) fare = 15;
    else if (totalDist > 10) fare = 10;
    else fare = 5;
  } else if (isOnlyMRTS) {
    fare = totalDist > 10 ? 10 : 5;
  } else {
    // Official CMRL Metro fare slabs
    if (totalDist > 9) fare = 50;
    else if (totalDist > 6) fare = 40;
    else if (totalDist > 4) fare = 30;
    else if (totalDist > 2) fare = 20;
    else fare = 10;
  }

  let notice: string | undefined = undefined;
  let alternativeNote: string | undefined = undefined;

  if (hasAnyUpcomingStationInPath) {
    notice = 'Upcoming Infrastructure Notice: This journey route involves Phase II corridors currently under construction (e.g. Corridor 4 Yellow Line). Passenger service is not yet operational on future segments.';
    if (linesUsedSet.has('yellow') || destStation.line_id === 'yellow' || originStation.line_id === 'yellow') {
      alternativeNote = 'Current Operational Alternative: Take Green Line Metro to Vadapalani or Koyambedu (CMBT), then board MTC Feeder Bus / direct service (Route 54, 88K, or 101) directly to Poonamallee Bus Terminus until Yellow Line opens.';
    } else {
      alternativeNote = 'Current Operational Alternative: For upcoming Phase 2 segments, interim MTC bus routes and local feeder services provide active operational connectivity.';
    }
  }

  // Direction of travel calculation
  let direction = `Towards ${destStation.name}`;
  let directionTa = `${destStation.name_ta || destStation.name} நோக்கி`;

  if (linesUsedSet.has('suburban_west_south')) {
    const isDestAJJ =
      destStation.id === 'SW31' ||
      (destStation.id.startsWith('WS') &&
        (originStation.id === 'SB28' ||
          (originStation.id.startsWith('WS') && destStation.id > originStation.id))) ||
      (originStation.id === 'SB28' && destStation.id !== 'SB28');

    if (isDestAJJ) {
      direction = 'Towards Arakkonam Junction via Kanchipuram (Northwest-bound)';
      directionTa = 'காஞ்சிபுரம் வழியாக அரக்கோணம் சந்திப்பு நோக்கி (வடமேற்கு திசை)';
    } else {
      direction = 'Towards Chengalpattu Junction via Kanchipuram (Southeast-bound)';
      directionTa = 'காஞ்சிபுரம் வழியாக செங்கல்பட்டு சந்திப்பு நோக்கி (தென்கிழக்கு திசை)';
    }
  } else if (linesUsedSet.has('suburban_south') && (originStation.line_id === 'suburban_south' || destStation.line_id === 'suburban_south')) {
    const origNum = parseInt(originStation.id.replace(/\D/g, '') || '0', 10);
    const destNum = parseInt(destStation.id.replace(/\D/g, '') || '0', 10);
    if (destNum > origNum) {
      direction = 'Towards Chengalpattu Junction (Southbound)';
      directionTa = 'செங்கல்பட்டு சந்திப்பு நோக்கி (தெற்கு திசை)';
    } else if (destNum < origNum) {
      direction = 'Towards Chennai Beach (Northbound)';
      directionTa = 'சென்னை கடற்கரை நோக்கி (வடக்கு திசை)';
    }
  } else if (linesUsedSet.has('blue')) {
    if (destStation.id === 'BL26' || destStation.id > originStation.id) {
      direction = 'Towards Chennai Airport (Southbound)';
      directionTa = 'விமான நிலையம் நோக்கி';
    } else {
      direction = 'Towards Wimco Nagar Depot (Northbound)';
      directionTa = 'விம்கோ நகர் பணிமனை நோக்கி';
    }
  } else if (linesUsedSet.has('green')) {
    if (destStation.id === 'GL17' || destStation.id > originStation.id) {
      direction = 'Towards St. Thomas Mount';
      directionTa = 'பரங்கிமலை நோக்கி';
    } else {
      direction = 'Towards Chennai Central';
      directionTa = 'சென்னை சென்ட்ரல் நோக்கி';
    }
  } else if (linesUsedSet.has('mrts')) {
    if (destStation.id > originStation.id) {
      direction = 'Towards Velachery';
      directionTa = 'வேளச்சேரி நோக்கி';
    } else {
      direction = 'Towards Chennai Beach';
      directionTa = 'சென்னை கடற்கரை நோக்கி';
    }
  } else if (linesUsedSet.has('suburban_west')) {
    if ((originStation.id === 'SW16' && destStation.id === 'SW17') || (originStation.id === 'SW17' && destStation.id === 'SW16')) {
      if (destStation.id === 'SW17') {
        direction = 'Towards Pattabiram East Depot (Spur Train Connection)';
        directionTa = 'பட்டாபிராம் கிழக்கு பணிமனை நோக்கி (தனி ரயில் இணைப்பு)';
      } else {
        direction = 'Towards Pattabiram Military Siding (Spur Train Connection)';
        directionTa = 'பட்டாபிராம் மிலிட்டரி சைடிங் நோக்கி (தனி ரயில் இணைப்பு)';
      }
    } else if (destStation.id === 'SW16') {
      direction = 'Towards Pattabiram Military Siding (PTMS Siding)';
      directionTa = 'பட்டாபிராம் மிலிட்டரி சைடிங் நோக்கி';
    } else if (destStation.id === 'SW17') {
      direction = 'Towards Pattabiram East Depot (PRES Depot)';
      directionTa = 'பட்டாபிராம் கிழக்கு பணிமனை நோக்கி';
    } else {
      const origNum = parseInt(originStation.id.replace(/\D/g, '') || '0', 10);
      const destNum = parseInt(destStation.id.replace(/\D/g, '') || '0', 10);
      if (destNum > origNum) {
        direction = 'Towards Arakkonam Junction (Westbound)';
        directionTa = 'அரக்கோணம் சந்திப்பு நோக்கி (மேற்கு திசை)';
      } else {
        direction = 'Towards Chennai Central (Moore Market Complex) (Eastbound)';
        directionTa = 'சென்னை சென்ட்ரல் (மூர் மார்க்கெட் வளாகம்) நோக்கி (கிழக்கு திசை)';
      }
    }
  } else if (linesUsedSet.has('yellow')) {
    const origNum = parseInt(originStation.id.replace(/\D/g, '') || '0', 10);
    const destNum = parseInt(destStation.id.replace(/\D/g, '') || '0', 10);
    if (destNum > origNum) {
      direction = 'Towards Lighthouse (Eastbound)';
      directionTa = 'கலங்கரை விளக்கம் நோக்கி (கிழக்கு திசை)';
    } else {
      direction = 'Towards Poonamallee Bypass (Westbound)';
      directionTa = 'பூவிருந்தவல்லி புறவழிச்சாலை நோக்கி (மேற்கு திசை)';
    }
  } else if (linesUsedSet.has('suburban_north')) {
    const origNum = parseInt(originStation.id.replace(/\D/g, '') || '0', 10);
    const destNum = parseInt(destStation.id.replace(/\D/g, '') || '0', 10);
    if (destStation.id === 'SN17' || (destNum > origNum && destNum <= 17)) {
      direction = 'Towards Gummidipoondi (Northbound)';
      directionTa = 'கும்மிடிப்பூண்டி நோக்கி (வடக்கு திசை)';
    } else if (destNum > origNum) {
      direction = 'Towards Sullurupeta (Northbound)';
      directionTa = 'சூளூர்பேட்டை நோக்கி (வடக்கு திசை)';
    } else {
      direction = 'Towards Chennai Moore Market Complex (MASS) (Southbound)';
      directionTa = 'சென்னை மூர் மார்க்கெட் வளாகம் (MASS) நோக்கி (தெற்கு திசை)';
    }
  }

  const intermediateStopsCount = Math.max(0, steps.length - 2);

  return {
    origin: originStation,
    destination: destStation,
    total_distance_km: totalDist,
    estimated_duration_mins: totalMins,
    fare_inr: fare,
    interchange_count: interchangeCount,
    stops_count: steps.length,
    intermediate_stops_count: intermediateStopsCount,
    direction,
    direction_ta: directionTa,
    steps,
    lines_used: Array.from(linesUsedSet),
    is_fully_operational: !hasAnyUpcomingStationInPath,
    notice,
    alternative_note: alternativeNote
  };
}

// Find multiple valid journey alternatives with clear ranking criteria and operational accuracy
export function findJourneyAlternatives(
  originId: string,
  destId: string,
  userPreference: 'best' | 'metro' | 'suburban' = 'best'
): any[] {
  const originStation: any = getStationById(originId);
  const destStation: any = getStationById(destId);

  if (!originStation || !destStation) return [];

  // When both stations are operational, strictly force operational connections
  const forceOperationalOnly = originStation.status === 'operational' && destStation.status === 'operational';

  if (originId === destId) {
    const single = {
      id: 'opt_direct_same',
      option_type: 'best',
      title: originStation.name,
      title_ta: originStation.name_ta,
      tag: 'recommended',
      tag_label: 'Same Station',
      tag_label_ta: 'அதே நிலையம்',
      ranking_reason: 'Origin and destination are the same station.',
      ranking_reason_ta: 'புறப்பாடு மற்றும் சேருமிடம் இரண்டும் ஒரே நிலையம்.',
      mode_types: [originStation.system_type],
      origin: originStation,
      destination: originStation,
      total_distance_km: 0,
      estimated_duration_mins: 0,
      fare_inr: 0,
      interchange_count: 0,
      stops_count: 1,
      steps: [{
        station_id: originStation.id,
        station_name: originStation.name,
        station_name_ta: originStation.name_ta,
        line_id: originStation.line_id,
        line_name: originStation.line_name || originStation.line_id,
        line_color: originStation.line_color || '#0284c7',
        lat: originStation.lat,
        lon: originStation.lon,
        distance_from_prev: 0,
        time_from_prev: 0,
        is_transfer: false,
        instruction: 'Origin and destination are the same station.',
        status: originStation.status
      }],
      lines_used: [originStation.line_id],
      is_fully_operational: originStation.status === 'operational'
    };
    return [single];
  }

  const allConnections: any[] = db.prepare('SELECT * FROM connections').all();
  const allStations: any[] = db.prepare('SELECT * FROM stations').all();
  const stationMap = new Map<string, any>();
  for (const s of allStations) stationMap.set(s.id, s);

  const allLines: any[] = db.prepare('SELECT * FROM transit_lines').all();
  const lineMap = new Map<string, any>();
  for (const l of allLines) lineMap.set(l.id, l);

  // Compute multiple candidate routes using different profiles
  const profilesToRun: Array<'best' | 'fewest_transfers' | 'metro' | 'suburban' | 'fastest'> = [
    'best',
    'fewest_transfers',
    'metro',
    'suburban',
    'fastest'
  ];

  const rawResults: Array<{ profile: string; plan: any }> = [];
  for (const prof of profilesToRun) {
    try {
      const plan = solveDijkstraPath(
        originStation,
        destStation,
        prof,
        allConnections,
        stationMap,
        lineMap,
        forceOperationalOnly
      );
      if (plan) {
        rawResults.push({ profile: prof, plan });
      }
    } catch {}
  }

  if (rawResults.length === 0) {
    // If operational-only failed (e.g. user selected an upcoming station), retry without forcing operational-only
    if (forceOperationalOnly) {
      for (const prof of profilesToRun) {
        try {
          const plan = solveDijkstraPath(
            originStation,
            destStation,
            prof,
            allConnections,
            stationMap,
            lineMap,
            false
          );
          if (plan) rawResults.push({ profile: prof, plan });
        } catch {}
      }
    }
  }

  if (rawResults.length === 0) return [];

  // Deduplicate routes based on exact station sequence
  const uniquePaths = new Map<string, { profile: string; plan: any }>();
  for (const res of rawResults) {
    const signature = res.plan.steps.map((s: any) => s.station_id).join('->');
    if (!uniquePaths.has(signature)) {
      uniquePaths.set(signature, res);
    }
  }

  const uniqueList = Array.from(uniquePaths.values());

  // Build styled JourneyOption objects with transparent ranking metadata
  const options: any[] = uniqueList.map((item, index) => {
    const plan = item.plan;
    const profile = item.profile;
    const linesUsed: string[] = plan.lines_used;

    const isOnlyMetro = linesUsed.every(l => ['blue', 'green', 'purple', 'yellow', 'red'].includes(l));
    const isOnlySuburban = linesUsed.every(l => l.startsWith('suburban'));
    const isOnlyMRTS = linesUsed.every(l => l === 'mrts');
    const isDirect = plan.interchange_count === 0;

    // Detect mode types
    const modeSet = new Set<string>();
    plan.steps.forEach((st: any) => {
      const stationObj = stationMap.get(st.station_id);
      if (stationObj?.system_type) modeSet.add(stationObj.system_type);
    });
    const modeTypes = Array.from(modeSet);

    // Friendly route title based on lines used
    let title = '';
    let titleTa = '';
    if (linesUsed.length === 1) {
      const lineObj = lineMap.get(linesUsed[0]);
      title = `Direct ${lineObj ? lineObj.short_name : 'Transit'} Route`;
      titleTa = `நேரடி ${lineObj ? lineObj.short_name : 'போக்குவரத்து'} பாதை`;
    } else {
      const lineNames = linesUsed.map(lid => lineMap.get(lid)?.short_name || lid);
      title = lineNames.join(' ➔ ');
      titleTa = lineNames.join(' ➔ ');
    }

    // Determine ranking tag and reason
    let tag: 'recommended' | 'fewest_transfers' | 'metro_preferred' | 'suburban_preferred' | 'fastest' = 'recommended';
    let tagLabel = 'Recommended Route';
    let tagLabelTa = 'பரிந்துரைக்கப்படும் சிறந்த பாதை';
    let rankingReason = 'Optimal balance between overall transit travel time and seamless station connection.';
    let rankingReasonTa = 'மொத்த பயண நேரம் மற்றும் நிலைய பரிமாற்ற வசதிக்கான சிறந்த சமநிலை.';

    if (profile === 'fewest_transfers' || (isDirect && index > 0)) {
      tag = 'fewest_transfers';
      tagLabel = isDirect ? 'Direct Line (0 Transfers)' : 'Fewest Transfers';
      tagLabelTa = isDirect ? 'நேரடி பாதை (0 மாற்றங்கள்)' : 'குறைந்த மாற்றங்கள்';
      rankingReason = isDirect
        ? 'Direct single-train connection with zero interchanges and no platform switching.'
        : `Route with minimum intermediate line changes (${plan.interchange_count} transfer).`;
      rankingReasonTa = isDirect
        ? 'எந்தவித நடைமேடை மாற்றமும் இல்லாத நேரடி தொடர் ரயில் பயணம்.'
        : `குறைந்த மாற்றங்களுடன் கூடிய பாதை (${plan.interchange_count} பரிமாற்றம்).`;
    } else if (profile === 'metro' || isOnlyMetro) {
      tag = 'metro_preferred';
      tagLabel = 'Metro Preferred';
      tagLabelTa = 'மெட்ரோ முன்னுரிமை';
      rankingReason = 'All-Metro air-conditioned transit with high peak frequency every 4–5 minutes.';
      rankingReasonTa = '4–5 நிமிட இடைவெளியில் ஏசி வசதியுடன் கூடிய வேகமான மெட்ரோ பயணம்.';
    } else if (profile === 'suburban' || isOnlySuburban) {
      tag = 'suburban_preferred';
      tagLabel = 'Suburban Train (Economy)';
      tagLabelTa = 'புறநகர் ரயில் (சிக்கனக் கட்டணம்)';
      rankingReason = `Economical Southern Railway suburban EMU service at standard ₹${plan.fare_inr} fare.`;
      rankingReasonTa = `தென்னக இரயில்வே புறநகர் மின்சார ரயிலில் ₹${plan.fare_inr} குறைந்தபட்ச கட்டணத்தில் சிக்கனப் பயணம்.`;
    } else if (index === 0) {
      tag = 'recommended';
      tagLabel = userPreference === 'metro' ? 'Best Metro Route' : userPreference === 'suburban' ? 'Best Suburban Route' : 'Best Available Route';
      tagLabelTa = 'சிறந்த பரிந்துரைக்கப்படும் பாதை';
      rankingReason = `Shortest estimated travel time (~${plan.estimated_duration_mins} mins) across verified networks.`;
      rankingReasonTa = `அங்கீகரிக்கப்பட்ட போக்குவரத்து அமைப்புகளில் மிகக் குறைந்த பயண நேரம் (~${plan.estimated_duration_mins} நிமிடம்).`;
    } else {
      tag = 'fastest';
      tagLabel = 'Alternative Route';
      tagLabelTa = 'மாற்றுப் பாதை';
      rankingReason = `Alternative multi-modal connection via ${plan.steps.find((s: any) => s.is_transfer)?.station_name || 'intermediate hub'}.`;
      rankingReasonTa = `பரிமாற்ற நிலையம் வழியாக செல்லும் மாற்று வழித்தட இணைப்பு.`;
    }

    return {
      id: `opt_${index + 1}_${plan.steps.length}`,
      option_type: profile,
      title,
      title_ta: titleTa,
      tag,
      tag_label: tagLabel,
      tag_label_ta: tagLabelTa,
      ranking_reason: rankingReason,
      ranking_reason_ta: rankingReasonTa,
      mode_types: modeTypes,
      ...plan
    };
  });

  // Sort: prioritize requested preference or recommended option first
  options.sort((a, b) => {
    if (userPreference === 'metro') {
      if (a.tag === 'metro_preferred' && b.tag !== 'metro_preferred') return -1;
      if (b.tag === 'metro_preferred' && a.tag !== 'metro_preferred') return 1;
    } else if (userPreference === 'suburban') {
      if (a.tag === 'suburban_preferred' && b.tag !== 'suburban_preferred') return -1;
      if (b.tag === 'suburban_preferred' && a.tag !== 'suburban_preferred') return 1;
    }
    return a.estimated_duration_mins - b.estimated_duration_mins;
  });

  return options;
}

// Algorithmic Dijkstra pathfinder with transport preference weighting (Backward-compatible single plan)
export function findJourneyRoute(
  originId: string,
  destId: string,
  preference: 'best' | 'metro' | 'suburban' = 'best'
): JourneyPlanResult | null {
  const alternatives = findJourneyAlternatives(originId, destId, preference);
  return alternatives.length > 0 ? alternatives[0] : null;
}

// Smart Assistant Query Parser
export function smartAssistantQuery(query: string, preference: 'best' | 'metro' | 'suburban' = 'best') {
  if (!query || query.trim() === '') {
    return { success: false, error: 'Query is empty' };
  }

  const raw = query.toLowerCase();
  const allStations: any[] = db.prepare('SELECT id, name, name_ta, code, line_id, status FROM stations').all();

  // Known synonyms and aliases
  const aliases: Record<string, string> = {
    'central': 'GL01',
    'chennai central': 'GL01',
    'mgr central': 'GL01',
    'moore market': 'SW01',
    'moore market complex': 'SW01',
    'mmc': 'SW01',
    'mass': 'SW01',
    'airport': 'BL26',
    'chennai airport': 'BL26',
    'meenambakkam': 'BL25',
    'poonamallee': 'YL28',
    'poonamalle': 'YL28',
    'poonamallee bypass': 'YL29',
    'vadapalani': 'GL08',
    'egmore': 'GL02',
    'chennai egmore': 'GL02',
    'guindy': 'BL22',
    'alandur': 'BL23',
    'tambaram': 'SB18',
    'beach': 'SB01',
    'chennai beach': 'SB01',
    'chengalpattu': 'SB28',
    'chengalpattu junction': 'SB28',
    'paranur': 'SB27',
    'singaperumal koil': 'SB26',
    'maraimalai nagar': 'SB25',
    'kattangulathur': 'SB24',
    'potheri': 'SB23',
    'guduvancheri': 'SB22',
    'urappakkam': 'SB21',
    'vandalur': 'SB20',
    'perungalathur': 'SB19',
    'chromepet': 'SB16',
    'pallavaram': 'SB15',
    'tirusulam': 'SB14',
    'palavanthangal': 'SB12',
    'minambakkam': 'SB13',
    'velachery': 'MR18',
    'marina': 'YL01',
    'marina beach': 'YL01',
    'light house': 'YL01',
    't nagar': 'YL08',
    'panagal park': 'YL08',
    'koyambedu': 'GL07',
    'cmbt': 'GL06',
    'porur': 'YL20',
    'porur junction': 'YL20',
    'iyyappanthangal': 'YL23',
    'arakkonam': 'SW31',
    'arakkonam junction': 'SW31',
    'puliyamangalam': 'SW30',
    'mosur': 'SW29',
    'thiruvalangadu': 'SW28',
    'manavur': 'SW27',
    'senjipanambakkam': 'SW26',
    'kadambattur': 'SW25',
    'egattur': 'SW24',
    'tiruvallur': 'SW23',
    'putlur': 'SW22',
    'sevvapet road': 'SW21',
    'veppampattu': 'SW20',
    'thiruninravur': 'SW19',
    'nemilichery': 'SW18',
    'pattabiram east depot': 'SW17',
    'pres': 'SW17',
    'pattabiram military siding': 'SW16',
    'ptms': 'SW16',
    'pattabiram': 'SW15',
    'hindu college': 'SW14',
    'avadi': 'SW13',
    'annanur': 'SW12',
    'thirumullaivoyal': 'SW11',
    'ambattur': 'SW10',
    'pattaravakkam': 'SW09',
    'korattur': 'SW08',
    'villivakkam': 'SW07',
    'perambur loco works': 'SW06',
    'perambur carriage works': 'SW05',
    'perambur': 'SW04',
    'vyasarpadi': 'SW03',
    'vyasarpadi jeeva': 'SW03',
    'basin bridge': 'SW02',
    'thousand lights': 'BL18',
    'kilpauk': 'GL04',
    'kmc': 'GL04',
    'anna nagar': 'GL10',
    'thirumangalam': 'GL09',
    'st thomas mount': 'GL17',
    'mount': 'GL17',
    'thirumayilai': 'YL03',
    'mylapore': 'YL03',
    'thiruvanmiyur': 'MR15',
    'taramani': 'MR16',
    'sullurupeta': 'SN22',
    'sullurpeta': 'SN22',
    'spe': 'SN22',
    'akkampet': 'SN21',
    'tada': 'SN20',
    'sri city': 'SN20',
    'arambakkam': 'SN19',
    'elavur': 'SN18',
    'gummidipoondi': 'SN17',
    'gpd': 'SN17',
    'kavaraipettai': 'SN16',
    'ponneri': 'SN15',
    'anuppambattu': 'SN14',
    'minjur': 'SN13',
    'nandiyampakkam': 'SN12',
    'attipattu': 'SN11',
    'attipattu pudu nagar': 'SN10',
    'ennore': 'SN09',
    'kathivakkam': 'SN08',
    'wimco nagar suburban': 'SN07',
    'tiruvottiyur suburban': 'SN06',
    'voc nagar': 'SN05',
    'tondiarpet': 'SN04',
    'korukkupet': 'SN03',
    'kanchipuram': 'WS09',
    'kanchi': 'WS09',
    'cj': 'WS09',
    'kanchipuram east': 'WS08',
    'cje': 'WS08',
    'tirumalpur': 'WS10',
    'tmlp': 'WS10',
    'takkolam': 'WS11',
    'tko': 'WS11',
    'melpakkam': 'WS12',
    'mlpm': 'WS12',
    'walajabad': 'WS06',
    'wj': 'WS06',
    'nathapettai': 'WS07',
    'ntt': 'WS07',
    'pazhaya seevaram': 'WS05',
    'palayasivaram': 'WS05',
    'palaya seevaram': 'WS05',
    'pazhayaseevaram': 'WS05',
    'pyv': 'WS05',
    'palur': 'WS04',
    'palr': 'WS04',
    'villiyambakkam': 'WS03',
    'vb': 'WS03',
    'reddipalayam': 'WS02',
    'rdy': 'WS02'
  };

  let matchedOriginId: string | null = null;
  let matchedDestId: string | null = null;

  // Normalize query by removing introductory conversational fluff
  let cleaned = raw
    .replace(/^(hello|hi|please|can you tell me|how to go|how do i travel|how to travel|i want to travel|i want to go|i need to go|travel)\s+/i, '')
    .trim();

  // Pattern: "from X to Y" or "X to Y"
  cleaned = cleaned.replace(/^from\s+/i, '').trim();

  const toSplit = cleaned.split(/\s+(?:to|சென்று|வரை)\s+/i);
  if (toSplit.length >= 2) {
    const part1 = toSplit[0].trim();
    const part2 = toSplit[1].replace(/\b(please|fastest route|by metro|by train)\b/gi, '').trim();

    // Check aliases first (prioritize longer keys)
    const sortedKeys = Object.keys(aliases).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (part1.includes(key) && !matchedOriginId) matchedOriginId = aliases[key];
      if (part2.includes(key) && !matchedDestId) matchedDestId = aliases[key];
    }

    // Check station names
    if (!matchedOriginId) {
      const match = allStations.find(s => part1.includes(s.name.toLowerCase()) || part1.includes(s.name_ta.toLowerCase()));
      if (match) matchedOriginId = match.id;
    }
    if (!matchedDestId) {
      const match = allStations.find(s => part2.includes(s.name.toLowerCase()) || part2.includes(s.name_ta.toLowerCase()));
      if (match) matchedDestId = match.id;
    }
  }

  // Fallback: search anywhere in query
  if (!matchedOriginId || !matchedDestId) {
    const sortedKeys = Object.keys(aliases).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (raw.includes(key)) {
        if (!matchedOriginId) matchedOriginId = aliases[key];
        else if (!matchedDestId && matchedOriginId !== aliases[key]) matchedDestId = aliases[key];
      }
    }
  }

  if (!matchedOriginId || !matchedDestId) {
    return {
      success: false,
      error: 'Could not clearly identify both departure and destination stations from your request. Please specify both stations (e.g., "Chennai Central to Poonamallee").'
    };
  }

  const plan = findJourneyRoute(matchedOriginId, matchedDestId, preference);
  if (!plan) {
    return {
      success: false,
      error: 'No connected transit route found between the identified stations.'
    };
  }

  return {
    success: true,
    matched_origin: plan.origin,
    matched_destination: plan.destination,
    plan
  };
}

export function getActiveTrains() {
  const trains: any[] = db.prepare('SELECT * FROM trains').all();
  const stations: any[] = db.prepare('SELECT id, name, name_ta, lat, lon FROM stations').all();
  const stationMap = new Map<string, any>();
  for (const s of stations) stationMap.set(s.id, s);

  const now = Date.now();
  return trains.map((t, idx) => {
    const cycleTimeSeconds = 180;
    const offset = idx * 45;
    const rawProgress = ((Math.floor(now / 1000) + offset) % cycleTimeSeconds) / cycleTimeSeconds;

    const currSt = stationMap.get(t.current_station_id);
    const nextSt = stationMap.get(t.next_station_id);

    let currentLat = currSt ? currSt.lat : 13.0827;
    let currentLon = currSt ? currSt.lon : 80.2754;

    if (currSt && nextSt) {
      currentLat = +(currSt.lat + (nextSt.lat - currSt.lat) * rawProgress).toFixed(5);
      currentLon = +(currSt.lon + (nextSt.lon - currSt.lon) * rawProgress).toFixed(5);
    }

    return {
      ...t,
      progress_pct: +rawProgress.toFixed(2),
      current_lat: currentLat,
      current_lon: currentLon,
      current_station_name: currSt ? currSt.name : 'En route',
      next_station_name: nextSt ? nextSt.name : 'Terminus',
      eta_mins: Math.max(1, Math.ceil((1 - rawProgress) * 3)),
      is_simulated: true,
      simulation_notice: 'Simulated tracking based on official CMRL timetable and speed profiling'
    };
  });
}

export function saveUserJourney(originId: string, destId: string) {
  const orig: any = getStationById(originId);
  const dest: any = getStationById(destId);
  if (!orig || !dest) return null;

  const stmt = db.prepare(`
    INSERT INTO saved_journeys (origin_station_id, dest_station_id, origin_name, dest_name)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(originId, destId, orig.name, dest.name);
  return { success: true };
}

export function getUserSavedJourneys() {
  return db.prepare('SELECT * FROM saved_journeys ORDER BY created_at DESC LIMIT 20').all();
}

export function getSystemStats() {
  const lineCount = (db.prepare('SELECT count(*) as count FROM transit_lines').get() as any).count;
  const operationalLineCount = (db.prepare("SELECT count(*) as count FROM transit_lines WHERE status = 'operational'").get() as any).count;
  const upcomingLineCount = (db.prepare("SELECT count(*) as count FROM transit_lines WHERE status = 'under_construction'").get() as any).count;

  const stationCount = (db.prepare('SELECT count(*) as count FROM stations').get() as any).count;
  const operationalStationCount = (db.prepare("SELECT count(*) as count FROM stations WHERE status = 'operational'").get() as any).count;
  const upcomingStationCount = (db.prepare("SELECT count(*) as count FROM stations WHERE status = 'under_construction'").get() as any).count;

  const connectionCount = (db.prepare('SELECT count(*) as count FROM connections').get() as any).count;
  const trainCount = (db.prepare('SELECT count(*) as count FROM trains').get() as any).count;

  return {
    lines: lineCount,
    operational_lines: operationalLineCount,
    upcoming_lines: upcomingLineCount,
    stations: stationCount,
    operational_stations: operationalStationCount,
    upcoming_stations: upcomingStationCount,
    connections: connectionCount,
    active_trains: trainCount,
    database_file: DB_PATH,
    status: 'operational',
    simulation_mode: 'Schedule-Based Timetable Simulation Active'
  };
}

export function getDataSources(category?: string) {
  if (category && category !== 'all') {
    return db
      .prepare('SELECT * FROM data_sources WHERE category = ? ORDER BY is_official DESC, title ASC')
      .all(category);
  }
  return db
    .prepare('SELECT * FROM data_sources ORDER BY is_official DESC, title ASC')
    .all();
}
