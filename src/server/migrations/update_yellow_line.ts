import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const DB_PATH = path.resolve(process.cwd(), 'data/chennai_transit.db');
console.log(`[Migration] Updating Yellow Line (Corridor 4) in SQLite: ${DB_PATH}`);

const db = new DatabaseSync(DB_PATH);

// 1. Update transit_lines record for 'yellow'
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

// 2. Delete existing Yellow Line connections & transfers involving old yellow stations
db.prepare(`
  DELETE FROM connections
  WHERE line_id = 'yellow'
     OR from_station_id LIKE 'YL%'
     OR to_station_id LIKE 'YL%'
`).run();

// 3. Delete existing yellow line stations
db.prepare(`
  DELETE FROM stations
  WHERE line_id = 'yellow'
`).run();

// 4. Exact 28 verified Corridor 4 stations (West to East)
const verifiedYellowStations = [
  // Section A: Poonamallee Bypass to Vadapalani (Initial Priority Section)
  {
    id: 'YL01',
    name: 'Poonamallee Bypass',
    name_ta: 'பூவிருந்தவல்லி புறவழிச்சாலை',
    code: 'PNMB',
    lat: 13.0560,
    lon: 80.0760,
    is_interchange: 0,
    interchange_info: 'Western elevated terminal station with CMRL Corridor 4 maintenance depot.',
    section: 'Section A (Priority Section)',
    target_completion: 'Target 2025 - 2026 (Priority Section)'
  },
  {
    id: 'YL02',
    name: 'Poonamallee Bus Stand',
    name_ta: 'பூவிருந்தவல்லி பேருந்து நிலையம்',
    code: 'PNMS',
    lat: 13.0520,
    lon: 80.0880,
    is_interchange: 1,
    interchange_info: 'Direct integration with Poonamallee MTC Bus Terminus hub.',
    section: 'Section A (Priority Section)',
    target_completion: 'Target 2025 - 2026 (Priority Section)'
  },
  {
    id: 'YL03',
    name: 'Poonamallee Government Hospital',
    name_ta: 'பூவிருந்தவல்லி அரசு மருத்துவமனை',
    code: 'PGH',
    lat: 13.0515,
    lon: 80.0955,
    is_interchange: 0,
    interchange_info: 'Serving Poonamallee Government Hospital and Mullaithottam.',
    section: 'Section A (Priority Section)',
    target_completion: 'Target 2025 - 2026 (Priority Section)'
  },
  {
    id: 'YL04',
    name: 'Karayanchavadi',
    name_ta: 'கரையான்சாவடி',
    code: 'KYV',
    lat: 13.0515,
    lon: 80.1000,
    is_interchange: 0,
    interchange_info: null,
    section: 'Section A (Priority Section)',
    target_completion: 'Target 2025 - 2026 (Priority Section)'
  },
  {
    id: 'YL05',
    name: 'Kumananchavadi',
    name_ta: 'குமணன்சாவடி',
    code: 'KMC',
    lat: 13.0520,
    lon: 80.1080,
    is_interchange: 0,
    interchange_info: null,
    section: 'Section A (Priority Section)',
    target_completion: 'Target 2025 - 2026 (Priority Section)'
  },
  {
    id: 'YL06',
    name: 'Kattupakkam',
    name_ta: 'காட்டுப்பாக்கம்',
    code: 'KTP',
    lat: 13.0490,
    lon: 80.1230,
    is_interchange: 0,
    interchange_info: null,
    section: 'Section A (Priority Section)',
    target_completion: 'Target 2025 - 2026 (Priority Section)'
  },
  {
    id: 'YL07',
    name: 'Iyyappanthangal',
    name_ta: 'ஐயப்பன்தாங்கல்',
    code: 'IPT',
    lat: 13.0440,
    lon: 80.1380,
    is_interchange: 1,
    interchange_info: 'Major MTC bus depot transit interchange and depot spur line.',
    section: 'Section A (Priority Section)',
    target_completion: 'Target 2025 - 2026 (Priority Section)'
  },
  {
    id: 'YL08',
    name: 'Thelliyaragaram',
    name_ta: 'தெள்ளியரகரம்',
    code: 'TLG',
    lat: 13.0410,
    lon: 80.1430,
    is_interchange: 0,
    interchange_info: 'Serving Sri Ramachandra Institute of Higher Education & Research (SRMC).',
    section: 'Section A (Priority Section)',
    target_completion: 'Target 2025 - 2026 (Priority Section)'
  },
  {
    id: 'YL09',
    name: 'Porur Bypass',
    name_ta: 'போரூர் புறவழிச்சாலை',
    code: 'PBP',
    lat: 13.0385,
    lon: 80.1485,
    is_interchange: 0,
    interchange_info: null,
    section: 'Section A (Priority Section)',
    target_completion: 'Target 2025 - 2026 (Priority Section)'
  },
  {
    id: 'YL10',
    name: 'Porur Junction',
    name_ta: 'போரூர் சந்திப்பு',
    code: 'PRJ',
    lat: 13.0345,
    lon: 80.1580,
    is_interchange: 1,
    interchange_info: 'Future multi-level interchange with Phase 2 Corridor 5 (Madhavaram–Sholinganallur). Double-decker elevated viaduct.',
    section: 'Section A (Priority Section)',
    target_completion: 'Target 2025 - 2026 (Priority Section)'
  },
  // Section B Intermediate: Arcot Road corridor
  {
    id: 'YL11',
    name: 'Alapakkam',
    name_ta: 'ஆலப்பாக்கம்',
    code: 'APK',
    lat: 13.0380,
    lon: 80.1630,
    is_interchange: 1,
    interchange_info: 'Shared double-decker corridor station with Phase 2 Corridor 5 (Red Line).',
    section: 'Section B (Intermediate Arcot Road)',
    target_completion: 'Target 2025 - 2026 (Priority Section)'
  },
  {
    id: 'YL12',
    name: 'Karambakkam',
    name_ta: 'காரம்பாக்கம்',
    code: 'KBK',
    lat: 13.0420,
    lon: 80.1690,
    is_interchange: 1,
    interchange_info: 'Shared double-decker corridor station with Phase 2 Corridor 5 (Red Line).',
    section: 'Section B (Intermediate Arcot Road)',
    target_completion: 'Target 2025 - 2026 (Priority Section)'
  },
  {
    id: 'YL13',
    name: 'Valasaravakkam',
    name_ta: 'வளசரவாக்கம்',
    code: 'VSV',
    lat: 13.0480,
    lon: 80.1780,
    is_interchange: 1,
    interchange_info: 'Shared double-decker corridor station with Phase 2 Corridor 5 (Red Line).',
    section: 'Section B (Intermediate Arcot Road)',
    target_completion: 'Target 2025 - 2026 (Priority Section)'
  },
  {
    id: 'YL14',
    name: 'Alwarthiru Nagar',
    name_ta: 'ஆழ்வார்திரு நகர்',
    code: 'ATN',
    lat: 13.0510,
    lon: 80.1830,
    is_interchange: 1,
    interchange_info: 'Shared double-decker corridor station with Phase 2 Corridor 5 (Red Line).',
    section: 'Section B (Intermediate Arcot Road)',
    target_completion: 'Target 2025 - 2026 (Priority Section)'
  },
  {
    id: 'YL15',
    name: 'Virugambakkam',
    name_ta: 'விருகம்பாக்கம்',
    code: 'VGK',
    lat: 13.0535,
    lon: 80.1920,
    is_interchange: 0,
    interchange_info: 'Serving Virugambakkam and Avichi Higher Secondary School area.',
    section: 'Section B (Intermediate Arcot Road)',
    target_completion: 'Target 2025 - 2026 (Priority Section)'
  },
  {
    id: 'YL16',
    name: 'Natesan Nagar',
    name_ta: 'நடேசன் நகர்',
    code: 'NTN',
    lat: 13.0525,
    lon: 80.2015,
    is_interchange: 0,
    interchange_info: 'Serving Natesan Nagar and Saligramam South residential area.',
    section: 'Section B (Intermediate Arcot Road)',
    target_completion: 'Target 2025 - 2026 (Priority Section)'
  },
  {
    id: 'YL17',
    name: 'Vadapalani',
    name_ta: 'வடபழனி',
    code: 'VDP',
    lat: 13.0514,
    lon: 80.2118,
    is_interchange: 1,
    interchange_info: 'Future multi-level interchange with operational Green Line (GL08) via integrated concourse upon Phase 2 opening.',
    section: 'Section A (Terminal of Priority Operating Section)',
    target_completion: 'Target 2025 - 2026 (Priority Section)'
  },
  {
    id: 'YL18',
    name: 'Kodambakkam Power House',
    name_ta: 'கோடம்பாக்கம் பவர் ஹவுஸ்',
    code: 'KPH',
    lat: 13.0513,
    lon: 80.2155,
    is_interchange: 0,
    interchange_info: 'Near TNEB Power House; adjacent to Ashok Nagar / Kodambakkam boundary.',
    section: 'Section B (Intermediate toward city centre)',
    target_completion: 'Target 2026 - 2027'
  },
  {
    id: 'YL19',
    name: 'Meenakshi College',
    name_ta: 'மீனாட்சி கல்லூரி',
    code: 'MKC',
    lat: 13.0512,
    lon: 80.2190,
    is_interchange: 0,
    interchange_info: 'Serving Meenakshi College for Women and engineering campus; elevated-to-underground transition portal.',
    section: 'Section B (Intermediate toward city centre)',
    target_completion: 'Target 2026 - 2027'
  },
  {
    id: 'YL20',
    name: 'Kodambakkam',
    name_ta: 'கோடம்பாக்கம்',
    code: 'KDM',
    lat: 13.0510,
    lon: 80.2250,
    is_interchange: 0,
    interchange_info: 'Distinct underground metro station near Kodambakkam Railway Station (SR07). Separate station facility; planned future pedestrian connection across railway tracks.',
    section: 'Section B (Intermediate toward city centre)',
    target_completion: 'Target 2026 - 2027'
  },
  // Section C: Underground section toward Lighthouse
  {
    id: 'YL21',
    name: 'Panagal Park',
    name_ta: 'பனகல் பூங்கா',
    code: 'PNP',
    lat: 13.0380,
    lon: 80.2310,
    is_interchange: 0,
    interchange_info: 'Underground station serving T. Nagar retail district, Pondy Bazaar, and Usman Road.',
    section: 'Section C (Underground section toward Lighthouse)',
    target_completion: 'Target 2027 - 2028 (Underground)'
  },
  {
    id: 'YL22',
    name: 'Nandanam',
    name_ta: 'நந்தனம்',
    code: 'NDM',
    lat: 13.0321,
    lon: 80.2392,
    is_interchange: 1,
    interchange_info: 'Future multi-level interchange with operational Blue Line (BL19). Direct underground concourse transfer upon Phase 2 completion.',
    section: 'Section C (Underground section toward Lighthouse)',
    target_completion: 'Target 2027 - 2028 (Underground)'
  },
  {
    id: 'YL23',
    name: 'Boat Club',
    name_ta: 'போட் கிளப் (அடையாறு கேட்)',
    code: 'BTC',
    lat: 13.0328,
    lon: 80.2420,
    is_interchange: 0,
    interchange_info: 'Underground station serving Adyar Gate Junction and residential enclave.',
    section: 'Section C (Underground section toward Lighthouse)',
    target_completion: 'Target 2027 - 2028 (Underground)'
  },
  {
    id: 'YL24',
    name: 'Bharathidasan Road',
    name_ta: 'பாரதிதாசன் சாலை',
    code: 'BDR',
    lat: 13.0335,
    lon: 80.2465,
    is_interchange: 0,
    interchange_info: null,
    section: 'Section C (Underground section toward Lighthouse)',
    target_completion: 'Target 2027 - 2028 (Underground)'
  },
  {
    id: 'YL25',
    name: 'Alwarpet',
    name_ta: 'ஆழ்வார்பேட்டை',
    code: 'ALW',
    lat: 13.0340,
    lon: 80.2540,
    is_interchange: 0,
    interchange_info: 'Underground station at Alwarpet junction along TTK Road corridor.',
    section: 'Section C (Underground section toward Lighthouse)',
    target_completion: 'Target 2027 - 2028 (Underground)'
  },
  {
    id: 'YL26',
    name: 'Thirumayilai',
    name_ta: 'திருமயிலை',
    code: 'TMY',
    lat: 13.0345,
    lon: 80.2701,
    is_interchange: 1,
    interchange_info: 'Major future 3-way multi-modal interchange hub connecting Phase 2 Corridor 3 (Purple Line PL11) and Suburban MRTS (MR11).',
    section: 'Section C (Underground section toward Lighthouse)',
    target_completion: 'Target 2027 - 2028 (Underground)'
  },
  {
    id: 'YL27',
    name: 'Kutchery Road',
    name_ta: 'கச்சேரி சாலை',
    code: 'KCR',
    lat: 13.0380,
    lon: 80.2730,
    is_interchange: 0,
    interchange_info: 'Underground station near historic Mylapore cultural quarter.',
    section: 'Section C (Underground section toward Lighthouse)',
    target_completion: 'Target 2027 - 2028 (Underground)'
  },
  {
    id: 'YL28',
    name: 'Lighthouse',
    name_ta: 'கலங்கரை விளக்கம்',
    code: 'LHS',
    lat: 13.0425,
    lon: 80.2762,
    is_interchange: 0,
    interchange_info: 'Eastern underground coastal terminal station situated near Marina Beach, Santhome, and Kamarajar Salai.',
    section: 'Section C (Underground coastal terminal)',
    target_completion: 'Target 2027 - 2028 (Underground)'
  }
];

const insertStation = db.prepare(`
  INSERT INTO stations (
    id, name, name_ta, code, line_id, lat, lon, is_interchange, interchange_info,
    system_type, zone, platform_count, has_parking, has_feeder_bus, has_wheelchair,
    has_lifts, has_ev_charging, first_train, last_train, status, phase, target_completion
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const s of verifiedYellowStations) {
  insertStation.run(
    s.id,
    s.name,
    s.name_ta,
    s.code,
    'yellow',
    s.lat,
    s.lon,
    s.is_interchange,
    s.interchange_info,
    'Metro',
    s.section,
    2,
    1,
    1,
    1,
    1,
    1,
    '05:00',
    '23:00',
    'under_construction',
    'Phase 2',
    s.target_completion
  );
}

// 5. Connect Yellow Line stations consecutively (YL01 to YL28)
const insertConn = db.prepare(`
  INSERT INTO connections (from_station_id, to_station_id, line_id, distance_km, travel_time_mins, is_transfer)
  VALUES (?, ?, ?, ?, ?, ?)
`);

function addBidirectional(from: string, to: string, line: string, dist: number, time: number, isTransfer: number) {
  try {
    insertConn.run(from, to, line, dist, time, isTransfer);
    insertConn.run(to, from, line, dist, time, isTransfer);
  } catch (e) {}
}

for (let i = 0; i < verifiedYellowStations.length - 1; i++) {
  const s1 = verifiedYellowStations[i];
  const s2 = verifiedYellowStations[i + 1];
  const dist = +(Math.sqrt(Math.pow(s2.lat - s1.lat, 2) + Math.pow(s2.lon - s1.lon, 2)) * 111).toFixed(2);
  const time = Math.max(2, Math.round(dist * 1.8));
  addBidirectional(s1.id, s2.id, 'yellow', dist, time, 0);
}

// 6. Connect verified future interchanges
// Vadapalani: GL08 <-> YL17
addBidirectional('GL08', 'YL17', 'interchange', 0.1, 2.0, 1);
// Nandanam: BL19 <-> YL22
addBidirectional('BL19', 'YL22', 'interchange', 0.1, 2.0, 1);
// Thirumayilai MRTS: MR11 <-> YL26
addBidirectional('MR11', 'YL26', 'interchange', 0.18, 3.5, 1);
// Thirumayilai Purple Line: PL11 <-> YL26
addBidirectional('PL11', 'YL26', 'interchange', 0.1, 2.0, 1);

console.log('[Migration] Yellow Line migration completed successfully!');
console.log(`Inserted ${verifiedYellowStations.length} stations from Poonamallee Bypass (YL01) to Lighthouse (YL28).`);
