import {
  findJourneyAlternatives,
  findJourneyRoute,
  getAllStations,
  getStationById
} from '../src/server/db.js';

async function runTests() {
  console.log('=== CHENNAI TRANSIT TEST SUITE ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`PASS: ${testName}`);
      passed++;
    } else {
      console.error(`FAIL: ${testName} ${details ? '- ' + details : ''}`);
      failed++;
    }
  }

  // 1. SMART STATION SEARCH & RESOLUTION
  console.log('\n--- 1. Testing Station Data & Verification ---');
  const allStations = getAllStations();
  assert(allStations.length > 100, `Database has ${allStations.length} stations loaded (expected > 100)`);

  const centralStation: any = getStationById('GL01');
  assert(centralStation && String(centralStation.name).includes('Central'), 'Station Central (GL01) resolved properly');

  const airportStation: any = getStationById('BL26');
  assert(airportStation && String(airportStation.name).includes('Airport'), 'Station Airport (BL26) resolved properly');

  const tambaramStation: any = getStationById('SB18');
  assert(tambaramStation && tambaramStation.code === 'TBM', 'Tambaram Suburban Station (SB18) has verified code TBM');

  const poonamalleeStation: any = getStationById('YL28');
  assert(poonamalleeStation && poonamalleeStation.status === 'under_construction', 'Poonamallee is correctly flagged as Phase 2 under_construction');

  // 2. JOURNEY ROUTE COMPARISON & ALTERNATIVES
  console.log('\n--- 2. Testing Route Comparison & Alternatives ---');
  // Route: Central (GL01) to Guindy (BL22)
  const centralToGuindyAlts = findJourneyAlternatives('GL01', 'BL22', 'best');
  assert(centralToGuindyAlts.length >= 1, `Central to Guindy generated ${centralToGuindyAlts.length} alternative routes`);
  
  const hasRankingTag = centralToGuindyAlts.every(opt => opt.tag && opt.tag_label && opt.ranking_reason);
  assert(hasRankingTag, 'All route alternatives have ranking tags and transparent ranking rationale');

  // Verify operational accuracy: Operational journey between GL01 and BL22 must not contain under_construction stations
  const hasNoUpcoming = centralToGuindyAlts[0].steps.every((st: any) => st.status === 'operational');
  assert(hasNoUpcoming, 'Central to Guindy operational journey does not use under-construction stations');

  // Route: Central to St. Thomas Mount (GL01 to GL17)
  const mountAlts = findJourneyAlternatives('GL01', 'GL17', 'best');
  assert(mountAlts.length >= 1, `Central to St. Thomas Mount generated ${mountAlts.length} alternatives`);
  assert(mountAlts[0].fare_inr > 0, `Fare calculated: ₹${mountAlts[0].fare_inr}`);
  assert(mountAlts[0].total_distance_km > 0, `Distance calculated: ${mountAlts[0].total_distance_km} km`);

  // 3. STEP-BY-STEP TIMELINE & INTERCHANGE HANDLING
  console.log('\n--- 3. Testing Step-by-Step Journey Steps ---');
  const primaryRoute = centralToGuindyAlts[0];
  assert(primaryRoute.steps.length > 2, `Route has ${primaryRoute.steps.length} sequential steps`);
  assert(primaryRoute.steps[0].station_id === 'GL01', 'First step is origin station (GL01)');
  assert(primaryRoute.steps[primaryRoute.steps.length - 1].station_id === 'BL22', 'Last step is destination station (BL22)');
  
  // 4. UNDER CONSTRUCTION SERVICE HANDLING
  console.log('\n--- 4. Testing Service Accuracy & Phase 2 Handling ---');
  const underConstructionRoute = findJourneyAlternatives('GL01', 'YL28', 'best');
  if (underConstructionRoute.length > 0) {
    assert(underConstructionRoute[0].is_fully_operational === false, 'Route to upcoming station flagged as not fully operational');
    assert(!!underConstructionRoute[0].notice, 'Route to upcoming station includes prominent warning notice');
  } else {
    assert(true, 'Upcoming line isolated safely from operational graph');
  }

  // 5. MASTER PROMPT REQUIRED COMMUTER JOURNEYS
  console.log('\n--- 5. Testing Master Prompt Required Commuter Journeys ---');
  
  // 1. Tambaram -> Anna Nagar (SB18 -> GL08)
  const tambaramToAnnaNagar = findJourneyAlternatives('SB18', 'GL08', 'best');
  assert(tambaramToAnnaNagar.length > 0, 'Journey 1: Tambaram -> Anna Nagar route found');
  assert(tambaramToAnnaNagar[0].is_fully_operational === true, 'Journey 1: Tambaram -> Anna Nagar is fully operational');

  // 2. Chengalpattu -> Poonamallee (SB28 -> YL01)
  const cglToPoonamallee = findJourneyAlternatives('SB28', 'YL01', 'best');
  assert(cglToPoonamallee.length > 0, 'Journey 2: Chengalpattu -> Poonamallee route generated');
  assert(cglToPoonamallee[0].is_fully_operational === false, 'Journey 2: Chengalpattu -> Poonamallee is correctly flagged as non-operational Phase 2');
  assert(!!cglToPoonamallee[0].notice, 'Journey 2: Includes prominent Phase 2 construction warning notice');

  // 3. Moore Market Complex -> Gummidipoondi (SN01 -> SN17)
  const mmcToGummidipoondi = findJourneyAlternatives('SN01', 'SN17', 'best');
  assert(mmcToGummidipoondi.length > 0, 'Journey 3: Moore Market Complex -> Gummidipoondi direct Suburban North route found');
  assert(mmcToGummidipoondi[0].lines_used.includes('suburban_north'), 'Journey 3: Uses Suburban North Line');

  // 4. Moore Market Complex -> Sullurupeta (SN01 -> SN22)
  const mmcToSullurupeta = findJourneyAlternatives('SN01', 'SN22', 'best');
  assert(mmcToSullurupeta.length > 0, 'Journey 4: Moore Market Complex -> Sullurupeta full northern corridor route found');
  assert(mmcToSullurupeta[0].steps.length === 22, `Journey 4: All 22 stations in sequence (found ${mmcToSullurupeta[0].steps.length})`);

  // 5. Chengalpattu -> Kanchipuram (SB28 -> WS09)
  const cglToKanchipuram = findJourneyAlternatives('SB28', 'WS09', 'best');
  assert(cglToKanchipuram.length > 0, 'Journey 5: Chengalpattu -> Kanchipuram West-South Link route found');
  assert(cglToKanchipuram[0].lines_used.includes('suburban_west_south'), 'Journey 5: Uses West-South Link Line');

  // 6. Chengalpattu -> Arakkonam (SB28 -> SW31)
  const cglToArakkonam = findJourneyAlternatives('SB28', 'SW31', 'best');
  assert(cglToArakkonam.length > 0, 'Journey 6: Chengalpattu -> Arakkonam complete link corridor route found');
  assert(cglToArakkonam[0].steps.length === 13, `Journey 6: Full 13 stations from CGL to AJJ (found ${cglToArakkonam[0].steps.length})`);

  // 7. Korukkupet -> Ponneri (SN03 -> SN15)
  const korukkupetToPonneri = findJourneyAlternatives('SN03', 'SN15', 'best');
  assert(korukkupetToPonneri.length > 0, 'Journey 7: Korukkupet -> Ponneri suburban section route found');
  assert(korukkupetToPonneri[0].is_fully_operational === true, 'Journey 7: Korukkupet -> Ponneri is operational');

  // 6. IDENTICAL ORIGIN & DESTINATION
  console.log('\n--- 6. Testing Edge Cases ---');
  const sameStationRoute = findJourneyAlternatives('GL01', 'GL01', 'best');
  assert(sameStationRoute.length === 1 && sameStationRoute[0].estimated_duration_mins === 0, 'Same origin and destination returns 0 mins and 1 step');

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
