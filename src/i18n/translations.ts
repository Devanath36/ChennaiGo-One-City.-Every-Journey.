export type Language = 'en' | 'ta';

export interface Translations {
  // Brand & Navigation
  appTitle: string;
  appSubtitle: string;
  navHome: string;
  navMetro: string;
  navStations: string;
  navPlanner: string;
  navMap: string;
  navSuburban: string;
  navMRTS: string;
  navSettings: string;

  // Common Actions
  search: string;
  planJourney: string;
  planFromHere: string;
  setAsDestination: string;
  viewStations: string;
  swap: string;
  close: string;
  clear: string;
  details: string;
  filter: string;
  reset: string;
  retry: string;
  backToTop: string;
  openInPlanner: string;

  // Transport Categories
  categoryMetro: string;
  categorySuburban: string;
  categoryMRTS: string;
  allCategories: string;

  // Corridor Names
  lineBlue: string;
  lineGreen: string;
  lineYellow: string;
  linePurple: string;
  lineRed: string;
  lineSuburbanSouth: string;
  lineSuburbanWest: string;
  lineSuburbanNorth: string;
  lineSuburbanWestSouth: string;
  lineMRTS: string;

  // Suburban South Line
  suburbanSouthTitle: string;
  suburbanSouthSubtitle: string;
  suburbanSouthCounter: string;
  directionOfTravel: string;
  intermediateStopsCount: string;
  firstStation: string;
  finalStation: string;
  transportTypeSuburban: string;
  corridorSouthLine: string;
  searchStations: string;

  // Suburban West Line
  suburbanWestTitle: string;
  suburbanWestSubtitle: string;
  suburbanWestCounter: string;
  corridorWestLine: string;
  searchWestStations: string;
  pattabiramTrainConnection: string;
  pattabiramConnectionNotice: string;
  pattabiramSpurBadge: string;
  timetableNotice: string;

  // Suburban North Line
  suburbanNorthTitle: string;
  suburbanNorthSubtitle: string;
  suburbanNorthCounter: string;
  corridorNorthLine: string;
  searchNorthStations: string;
  gummidipoondiTerminatingHub: string;
  sullurupetaTerminalHub: string;
  northLineServiceNotice: string;

  // West–South Link Line
  suburbanWestSouthTitle: string;
  suburbanWestSouthSubtitle: string;
  suburbanWestSouthCounter: string;
  corridorWestSouthLine: string;
  searchWestSouthStations: string;
  kanchipuramHeritageHub: string;
  tirumalpurTerminusNotice: string;
  westSouthServiceNotice: string;

  // Yellow Line (Corridor 4)
  yellowLineTitle: string;
  yellowLineSubtitle: string;
  yellowLineCounter: string;
  corridorYellowLine: string;
  searchYellowStations: string;
  yellowLineSectionA: string;
  yellowLineSectionB: string;
  yellowLineSectionC: string;
  yellowStatusNotice: string;

  // Status Labels
  statusAll: string;
  statusOperational: string;
  statusUnderConstruction: string;
  statusPlanned: string;
  statusPhase1: string;
  statusPhase2: string;

  // Journey Planner
  plannerTitle: string;
  plannerSubtitle: string;
  recentTrips: string;
  recentTripsSubtitle: string;
  clearRecentTrips: string;
  noRecentTrips: string;
  reRunTrip: string;
  reverseTrip: string;
  tripCompleted: string;
  originStation: string;
  destinationStation: string;
  selectOrigin: string;
  selectDestination: string;
  routePreference: string;
  prefBest: string;
  prefMetro: string;
  prefSuburban: string;
  searchRoutes: string;
  routeResults: string;
  totalDistance: string;
  estimatedDuration: string;
  estimatedFare: string;
  transfers: string;
  stops: string;
  boardAt: string;
  transferAt: string;
  arriveAt: string;
  intermediateStops: string;
  upcomingNotice: string;
  operationalAlternative: string;
  noRouteFound: string;
  sameStationError: string;

  // Smart Assistant
  assistantTitle: string;
  assistantSubtitle: string;
  assistantPlaceholder: string;
  assistantButton: string;
  assistantExamples: string;
  assistantInstruction: string;

  // Featured Journey
  featuredTitle: string;
  featuredSubtitle: string;
  featuredStep1: string;
  featuredStep2: string;
  featuredStep3: string;
  featuredAlternative: string;
  planThisJourney: string;

  // Station Details & Facilities
  stationCode: string;
  zone: string;
  coordinates: string;
  platforms: string;
  facilities: string;
  facilityParking: string;
  facilityFeederBus: string;
  facilityWheelchair: string;
  facilityLifts: string;
  facilityEVCharging: string;
  operatingHours: string;
  peakHeadway: string;
  offPeakHeadway: string;
  firstTrain: string;
  lastTrain: string;
  interchangeConnections: string;

  // Settings
  settingsTitle: string;
  settingsSubtitle: string;
  languageSelection: string;
  languageDesc: string;
  preferencesTitle: string;
  defaultPreference: string;
  cacheTitle: string;
  cacheDesc: string;
  refreshCache: string;
  attributionTitle: string;
  attributionText: string;

  // Service Status
  liveStatusTitle: string;
  liveStatusSubtitle: string;
  serviceOperationalText: string;
  staticNoticeText: string;

  // Settings Sections & Registry
  settingsSectionGeneral: string;
  settingsSectionLanguage: string;
  settingsSectionSources: string;
  settingsSectionVerification: string;
  settingsSectionAccessibility: string;
  sourcesSearchPlaceholder: string;
  sourcesFilterAll: string;
  sourcesFilterMetro: string;
  sourcesFilterSuburbanNorth: string;
  sourcesFilterSuburbanSouth: string;
  sourcesFilterSuburbanWest: string;
  sourcesFilterSuburbanWestSouth: string;
  sourcesFilterMRTS: string;
  sourcesFilterBus: string;
  sourcesFilterGeneral: string;
  openSource: string;
  copySourceLink: string;
  copied: string;
  statusVerified: string;
  statusPartiallyVerified: string;
  statusOfficial: string;
  statusThirdParty: string;
  lastVerifiedOn: string;
  supportsDataLabel: string;
  highContrast: string;
  highContrastDesc: string;
  reducedMotion: string;
  reducedMotionDesc: string;
  fontSize: string;
  fontSizeNormal: string;
  fontSizeLarge: string;
  clearAllCache: string;
  clearAllCacheSuccess: string;
  backToPlanner: string;
  backToOverview: string;
  activeRouteNotice: string;
  constructionNotice: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appTitle: 'ChennaiGo',
    appSubtitle: 'One City. Every Journey.',
    navHome: 'Home',
    navMetro: 'Metro Network',
    navStations: 'Stations',
    navPlanner: 'Journey Planner',
    navMap: 'Google Map',
    navSuburban: 'Local Trains',
    navMRTS: 'MRTS',
    navSettings: 'Settings',

    search: 'Search',
    planJourney: 'Plan Journey',
    planFromHere: 'Plan Journey From Here',
    setAsDestination: 'Choose as Destination',
    viewStations: 'View Stations',
    swap: 'Swap Stations',
    close: 'Close',
    clear: 'Clear',
    details: 'Station Details',
    filter: 'Filter',
    reset: 'Reset',
    retry: 'Retry',
    backToTop: 'Back to Top',
    openInPlanner: 'Open in Journey Planner',

    categoryMetro: 'Metro',
    categorySuburban: 'Suburban / Local Trains',
    categoryMRTS: 'MRTS',
    allCategories: 'All Transit Modes',

    lineBlue: 'Blue Line (Corridor 1)',
    lineGreen: 'Green Line (Corridor 2)',
    lineYellow: 'Yellow Line (Corridor 4)',
    linePurple: 'Purple Line (Corridor 3)',
    lineRed: 'Red Line (Corridor 5)',
    lineSuburbanSouth: 'Suburban South Line',
    lineSuburbanWest: 'Suburban West Line',
    lineSuburbanNorth: 'Suburban North Line',
    lineSuburbanWestSouth: 'West–South Link Line',
    lineMRTS: 'MRTS Line',

    suburbanSouthTitle: 'Suburban South Line',
    suburbanSouthSubtitle: 'Explore stations along the Chennai Beach–Chengalpattu suburban railway corridor.',
    suburbanSouthCounter: '28 stations',
    directionOfTravel: 'Direction of Travel',
    intermediateStopsCount: 'Intermediate Stops',
    firstStation: 'Starting Station',
    finalStation: 'Final Station',
    transportTypeSuburban: 'Suburban Railway',
    corridorSouthLine: 'South Line',
    searchStations: 'Search 28 South Line stations by name or code...',

    suburbanWestTitle: 'Suburban West Line',
    suburbanWestSubtitle: 'Explore stations along the Chennai Central (MMC)–Arakkonam Junction suburban railway corridor.',
    suburbanWestCounter: '31 stations',
    corridorWestLine: 'West Line',
    searchWestStations: 'Search 31 West Line stations by name or code...',
    pattabiramTrainConnection: 'Dedicated Train Connection',
    pattabiramConnectionNotice: 'Verified train connection between separate stations (not a pedestrian walkway or same-platform transfer). Dedicated Southern Railway spur EMU services connect Pattabiram Military Siding (PTMS) and Pattabiram East Depot (PRES).',
    pattabiramSpurBadge: 'Pattabiram Spur Rail Service',
    timetableNotice: 'Timetable Disclaimer: Routes, transfer paths, and intermediate halts are based on standard Southern Railway corridor sequencing. Confirm live timings and specific train halts with Southern Railway / NTES / UTS before travel.',

    suburbanNorthTitle: 'Suburban North Line',
    suburbanNorthSubtitle: 'Explore stations along the Chennai Moore Market Complex (MASS)–Sullurupeta (SPE) suburban railway corridor.',
    suburbanNorthCounter: '22 stations',
    corridorNorthLine: 'North Line',
    searchNorthStations: 'Search 22 North Line stations by name or code...',
    gummidipoondiTerminatingHub: 'Major Terminating Hub & EMU Turnover Junction',
    sullurupetaTerminalHub: 'Northern Suburban Terminal • AP Border (Interstate Local)',
    northLineServiceNotice: 'Suburban Service Pattern: Regular high-frequency EMUs operate between Moore Market Complex and Gummidipoondi. Beyond Gummidipoondi to Tada and Sullurupeta, services run as scheduled through-EMUs and passenger shuttles.',

    suburbanWestSouthTitle: 'West–South Link Line',
    suburbanWestSouthSubtitle: 'Explore stations along the Chengalpattu Junction (CGL)–Arakkonam Junction (AJJ) suburban link corridor via Kanchipuram.',
    suburbanWestSouthCounter: '13 stations',
    corridorWestSouthLine: 'West–South Link',
    searchWestSouthStations: 'Search 13 West–South Link stations by name or code...',
    kanchipuramHeritageHub: 'Silk Capital & Ancient Temple Heritage Hub (CJ)',
    tirumalpurTerminusNotice: 'Key Suburban EMU Turn-around Terminal (TMLP)',
    westSouthServiceNotice: 'Corridor Operational Pattern: Passenger EMUs connect Chengalpattu and Arakkonam directly through Kanchipuram and Tirumalpur. Direct through-EMUs connect Chennai Beach to Tirumalpur/Arakkonam via Chengalpattu.',

    yellowLineTitle: 'Yellow Line — Corridor 4',
    yellowLineSubtitle: 'Explore 28 stations along the Poonamallee Bypass–Lighthouse Phase II metro corridor.',
    yellowLineCounter: '28 stations',
    corridorYellowLine: 'Corridor 4 (Yellow Line)',
    searchYellowStations: 'Search 28 Yellow Line stations by name or code...',
    yellowLineSectionA: 'Section A: Poonamallee Bypass to Vadapalani (Priority Elevated Reach)',
    yellowLineSectionB: 'Section B: Arcot Road & City Centre Intermediate Reach',
    yellowLineSectionC: 'Section C: Underground Reach to Lighthouse & Marina Beach',
    yellowStatusNotice: 'Phase II Construction Notice: Corridor 4 is under active construction by CMRL. Commercial passenger operations are scheduled to commence initially on the Poonamallee–Vadapalani priority stretch (late 2025/2026), followed by the underground section to Lighthouse (2027/2028).',

    statusAll: 'All Statuses',
    statusOperational: 'Operational',
    statusUnderConstruction: 'Under Construction',
    statusPlanned: 'Planned',
    statusPhase1: 'Phase 1 & Extension',
    statusPhase2: 'Phase 2 (Upcoming)',

    plannerTitle: 'Intelligent Journey Planner',
    plannerSubtitle: 'Multi-modal route finding across Chennai Metro, Suburban Railway, and MRTS with verified interchange transfers',
    recentTrips: 'Recent Trips',
    recentTripsSubtitle: 'Quickly re-run your last 5 completed journey searches with verified routes',
    clearRecentTrips: 'Clear History',
    noRecentTrips: 'No recent trips yet. Plan a journey to see your last 5 searches here.',
    reRunTrip: 'Re-run',
    reverseTrip: 'Reverse Route',
    tripCompleted: 'Completed',
    originStation: 'From Station',
    destinationStation: 'To Station',
    selectOrigin: 'Select departure station...',
    selectDestination: 'Select destination station...',
    routePreference: 'Transport Preference',
    prefBest: 'Best available route',
    prefMetro: 'Metro preferred',
    prefSuburban: 'Local train preferred',
    searchRoutes: 'Find Best Route',
    routeResults: 'Suggested Route Guidance',
    totalDistance: 'Total Distance',
    estimatedDuration: 'Est. Travel Time',
    estimatedFare: 'Verified Fare',
    transfers: 'Transfers',
    stops: 'Total Stops',
    boardAt: 'Board at',
    transferAt: 'Interchange at',
    arriveAt: 'Arrive at destination',
    intermediateStops: 'intermediate stops',
    upcomingNotice: 'Upcoming Infrastructure Notice: This route involves a Phase II corridor currently under construction. Passenger service is not yet operational.',
    operationalAlternative: 'Current Operational Alternative',
    noRouteFound: 'No transit connection found between these stations in the verified network database.',
    sameStationError: 'Origin and destination stations are the same. Please choose different stations.',

    assistantTitle: 'Where do you want to go?',
    assistantSubtitle: 'Ask our smart transport guide in plain English or Tamil. Example: "I want to travel from Chennai Central to Poonamallee"',
    assistantPlaceholder: 'Type your journey request (e.g., Chennai Central to Poonamallee, Airport to Egmore)...',
    assistantButton: 'Get Directions',
    assistantExamples: 'Quick Queries:',
    assistantInstruction: 'Step-by-step Travel Instructions',

    featuredTitle: 'Featured Journey: Chennai Central → Poonamallee',
    featuredSubtitle: 'Clear step-by-step transit route linking Central Chennai to the upcoming West Corridor',
    featuredStep1: 'Step 1: Board Green Line (Corridor 2) at Chennai Central Metro Hub towards Vadapalani (Operational).',
    featuredStep2: 'Step 2: Alight at Vadapalani interchange station (Upper/Phase 2 junction).',
    featuredStep3: 'Step 3: Transfer to Yellow Line (Corridor 4) towards Poonamallee Bypass (Phase II Under Construction).',
    featuredAlternative: 'Current Operational Route: Take Green Line Metro to Vadapalani or Koyambedu (CMBT), then board MTC Feeder Bus / direct service (Route 54, 88K, or 101) directly to Poonamallee Bus Terminus until Yellow Line opens.',
    planThisJourney: 'Plan This Journey',

    stationCode: 'Station Code',
    zone: 'Zone / Sector',
    coordinates: 'GPS Coordinates',
    platforms: 'Platform Count',
    facilities: 'Verified Amenities',
    facilityParking: 'Two-Wheeler & Car Parking',
    facilityFeederBus: 'MTC Feeder Bus Connectivity',
    facilityWheelchair: 'Wheelchair Accessibility',
    facilityLifts: 'Lifts & Escalators',
    facilityEVCharging: 'EV Charging Station',
    operatingHours: 'Service Hours',
    peakHeadway: 'Peak Headway',
    offPeakHeadway: 'Off-Peak Headway',
    firstTrain: 'First Train',
    lastTrain: 'Last Train',
    interchangeConnections: 'Interchange Connections',

    settingsTitle: 'Settings & Preferences',
    settingsSubtitle: 'Configure application language, transit routing defaults, and local data caching',
    languageSelection: 'Display Language',
    languageDesc: 'Choose interface language. Switching updates all text, labels, and transit guidance immediately.',
    preferencesTitle: 'Routing Preferences',
    defaultPreference: 'Default Journey Mode',
    cacheTitle: 'Offline Station Cache',
    cacheDesc: 'Station directories and route networks are cached in localStorage for resilient offline operation.',
    refreshCache: 'Refresh Cached Data',
    attributionTitle: 'Authoritative Transport Data Sources',
    attributionText: 'Station lists, corridor alignments, schedules, and interchange relationships are sourced from official Chennai Metro Rail Limited (CMRL) Phase I & Phase II documentation and Southern Railway timetables.',

    liveStatusTitle: 'Network Service Status & Frequency',
    liveStatusSubtitle: 'Official CMRL Timetable Static Metadata',
    serviceOperationalText: 'Metro Lines 1 & 2 are in full operational service daily from 05:00 to 23:00. Peak headway: 4 mins (Blue) / 5 mins (Green).',
    staticNoticeText: 'Real-time telemetry and fake train positions are excluded. All timings and headway information represent official published service benchmarks.',

    settingsSectionGeneral: 'General & Data Sync',
    settingsSectionLanguage: 'Language Settings',
    settingsSectionSources: 'Data Sources & Research Registry',
    settingsSectionVerification: 'Data Transparency & Verification Audit',
    settingsSectionAccessibility: 'Accessibility & Display Preferences',
    sourcesSearchPlaceholder: 'Search verified data sources, statutory agencies, or documents...',
    sourcesFilterAll: 'All Sources',
    sourcesFilterMetro: 'Metro Rail',
    sourcesFilterSuburbanNorth: 'Suburban North',
    sourcesFilterSuburbanSouth: 'Suburban South',
    sourcesFilterSuburbanWest: 'Suburban West',
    sourcesFilterSuburbanWestSouth: 'West–South Link',
    sourcesFilterMRTS: 'MRTS Elevated',
    sourcesFilterBus: 'Feeder Bus (MTC)',
    sourcesFilterGeneral: 'General Railways',
    openSource: 'Open Official Source',
    copySourceLink: 'Copy Source URL',
    copied: 'Copied to clipboard!',
    statusVerified: 'Verified & Corroborated',
    statusPartiallyVerified: 'Partially Verified / Phased DPR',
    statusOfficial: 'Official Authority',
    statusThirdParty: 'Corroborating Reference',
    lastVerifiedOn: 'Last Audited',
    supportsDataLabel: 'Data Supported & Validated',
    highContrast: 'High Contrast Mode',
    highContrastDesc: 'Increases element contrast and borders for optimal readability in varying lighting conditions.',
    reducedMotion: 'Reduced Motion',
    reducedMotionDesc: 'Minimizes sliding transitions and UI animations for comfortable viewing.',
    fontSize: 'Text Scaling',
    fontSizeNormal: 'Standard',
    fontSizeLarge: 'Comfortable (+15%)',
    clearAllCache: 'Purge Local Storage Cache',
    clearAllCacheSuccess: 'Application cache purged and reloaded from SQLite database.',
    backToPlanner: 'Back to Journey Planner',
    backToOverview: 'Back to Network Overview',
    activeRouteNotice: 'Operational Route Service',
    constructionNotice: 'Phased Construction — Excluded from Revenue Routing'
  },
  ta: {
    appTitle: 'சென்னை கோ',
    appSubtitle: 'ஒரே நகரம். அனைத்து பயணங்களும்.',
    navHome: 'முகப்பு',
    navMetro: 'மெட்ரோ நெட்வொர்க்',
    navStations: 'நிலையங்கள்',
    navPlanner: 'பயணத் திட்டம்',
    navMap: 'கூகுள் வரைபடம்',
    navSuburban: 'புறநகர் ரயில்கள்',
    navMRTS: 'பறக்கும் ரயில் (MRTS)',
    navSettings: 'அமைப்புகள்',

    search: 'தேடுக',
    planJourney: 'பயணத்தை திட்டமிடு',
    planFromHere: 'இங்கிருந்து பயணிக்க',
    setAsDestination: 'இலக்காக தேர்வு செய்',
    viewStations: 'நிலையங்களை காண்க',
    swap: 'நிலையங்களை மாற்றுக',
    close: 'மூடுக',
    clear: 'அழிக்க',
    details: 'நிலைய விவரங்கள்',
    filter: 'வடிகட்டு',
    reset: 'மீட்டமை',
    retry: 'மீண்டும் முயற்சி',
    backToTop: 'மேலே செல்லவும்',
    openInPlanner: 'பயணத் திட்டத்தில் திறக்கவும்',

    categoryMetro: 'மெட்ரோ',
    categorySuburban: 'புறநகர் ரயில்கள்',
    categoryMRTS: 'பறக்கும் ரயில் (MRTS)',
    allCategories: 'அனைத்து போக்குவரத்து வகைகள்',

    lineBlue: 'நீலப் பாதை (தடம் 1)',
    lineGreen: 'பச்சைப் பாதை (தடம் 2)',
    lineYellow: 'மஞ்சள் பாதை (தடம் 4)',
    linePurple: 'ஊதா பாதை (தடம் 3)',
    lineRed: 'சிவப்புப் பாதை (தடம் 5)',
    lineSuburbanSouth: 'தெற்கு புறநகர் பாதை',
    lineSuburbanWest: 'மேற்கு புறநகர் பாதை',
    lineSuburbanNorth: 'வடக்கு புறநகர் பாதை',
    lineSuburbanWestSouth: 'மேற்கு–தெற்கு இணைப்புப் பாதை',
    lineMRTS: 'பறக்கும் ரயில் பாதை (MRTS)',

    suburbanSouthTitle: 'தெற்கு புறநகர் பாதை',
    suburbanSouthSubtitle: 'சென்னை கடற்கரை–செங்கல்பட்டு புறநகர் ரயில் பாதையில் உள்ள நிலையங்களை ஆராயுங்கள்.',
    suburbanSouthCounter: '28 நிலையங்கள்',
    directionOfTravel: 'பயண திசை',
    intermediateStopsCount: 'இடைப்பட்ட நிறுத்தங்கள்',
    firstStation: 'முதல் நிலையம்',
    finalStation: 'இறுதி நிலையம்',
    transportTypeSuburban: 'புறநகர் ரயில்வே',
    corridorSouthLine: 'தெற்கு பாதை',
    searchStations: '28 தெற்கு புறநகர் நிலையங்களை தேடுக...',

    suburbanWestTitle: 'மேற்கு புறநகர் பாதை',
    suburbanWestSubtitle: 'சென்னை சென்ட்ரல் (எம்.எம்.சி)–அரக்கோணம் சந்திப்பு புறநகர் ரயில் பாதையில் உள்ள நிலையங்களை ஆராயுங்கள்.',
    suburbanWestCounter: '31 நிலையங்கள்',
    corridorWestLine: 'மேற்கு தடம்',
    searchWestStations: '31 மேற்கு புறநகர் நிலையங்களை பெயர் அல்லது குறியீடு கொண்டு தேடுக...',
    pattabiramTrainConnection: 'தனி ரயில் இணைப்பு',
    pattabiramConnectionNotice: 'தனித்தனி நிலையங்களுக்கு இடையேயான அங்கீகரிக்கப்பட்ட ரயில் இணைப்பு (நடைபாதை அல்லது ஒரே தள மாற்றம் அல்ல). பட்டாபிராம் மிலிட்டரி சைடிங் (PTMS) மற்றும் பட்டாபிராம் கிழக்கு பணிமனை (PRES) இடையே தெற்கு ரயில்வேயின் தனி மின்சார ரயில் இயங்குகிறது.',
    pattabiramSpurBadge: 'பட்டாபிராம் சைடிங் ரயில் சேவை',
    timetableNotice: 'அட்டவணை அறிவிப்பு: நிலைய வரிசை மற்றும் பயண வழி தெற்கு ரயில்வேயின் அதிகாரப்பூர்வ வரைபடத்தை அடிப்படையாகக் கொண்டது. நேரடி புறப்பாடு மற்றும் நிறுத்தங்களை UTS / NTES மூலம் உறுதி செய்யவும்.',

    suburbanNorthTitle: 'வடக்கு புறநகர் பாதை',
    suburbanNorthSubtitle: 'சென்னை மூர் மார்க்கெட் வளாகம் (MASS)–சூளூர்பேட்டை (SPE) புறநகர் ரயில் பாதையிலுள்ள 22 நிலையங்களை ஆராயுங்கள்.',
    suburbanNorthCounter: '22 நிலையங்கள்',
    corridorNorthLine: 'வடக்கு தடம்',
    searchNorthStations: '22 வடக்கு புறநகர் நிலையங்களை பெயர் அல்லது குறியீடு கொண்டு தேடுக...',
    gummidipoondiTerminatingHub: 'முக்கிய இறுதி முனையம் & ரயில் திருப்பும் சந்திப்பு (கும்மிடிப்பூண்டி)',
    sullurupetaTerminalHub: 'வடக்கு புறநகர் இறுதி நிலையம் • ஆந்திர எல்லை (இடைமாநில புறநகர் ரயில்)',
    northLineServiceNotice: 'சேவை விவரம்: சென்னை சென்ட்ரல் (MASS) முதல் கும்மிடிப்பூண்டி வரை அதிவேகத்தில் அதிக ரயில்கள் இயக்கப்படுகின்றன. கும்மிடிப்பூண்டி தாண்டி தடா மற்றும் சூளூர்பேட்டைக்கு குறிப்பிட்ட அட்டவணைப்படி ரயில்கள் செல்கின்றன.',

    suburbanWestSouthTitle: 'மேற்கு–தெற்கு இணைப்புப் பாதை',
    suburbanWestSouthSubtitle: 'செங்கல்பட்டு சந்திப்பு (CGL)–அரக்கோணம் சந்திப்பு (AJJ) இடையேயான 13 புறநகர் நிலையங்களை ஆராயுங்கள் (காஞ்சிபுரம் வழியாக).',
    suburbanWestSouthCounter: '13 நிலையங்கள்',
    corridorWestSouthLine: 'மேற்கு–தெற்கு இணைப்பு',
    searchWestSouthStations: '13 மேற்கு–தெற்கு இணைப்பு நிலையங்களை பெயர் அல்லது குறியீடு கொண்டு தேடுக...',
    kanchipuramHeritageHub: 'பட்டு நகரம் & பாரம்பரிய கோயில் நகரம் (காஞ்சிபுரம்)',
    tirumalpurTerminusNotice: 'புறநகர் ரயில் திருப்பும் முனையம் (திருமால்பூர்)',
    westSouthServiceNotice: 'சேவை விவரம்: செங்கல்பட்டு மற்றும் அரக்கோணம் இடையே காஞ்சிபுரம் வழியாக புறநகர் ரயில்கள் இயக்கப்படுகின்றன. கடற்கரை–திருமால்பூர் நேரடி ரயில்களும் பயன்பாட்டில் உள்ளன.',

    yellowLineTitle: 'மஞ்சள் தடம் — தடம் 4',
    yellowLineSubtitle: 'பூவிருந்தவல்லி புறவழிச்சாலை–கலங்கரை விளக்கம் மெட்ரோ கட்டம் II பாதையிலுள்ள 28 நிலையங்களை ஆராயுங்கள்.',
    yellowLineCounter: '28 நிலையங்கள்',
    corridorYellowLine: 'தடம் 4 (மஞ்சள் தடம்)',
    searchYellowStations: '28 மஞ்சள் தட நிலையங்களை பெயர் அல்லது குறியீடு கொண்டு தேடுக...',
    yellowLineSectionA: 'பிரிவு A: பூவிருந்தவல்லி புறவழிச்சாலை முதல் வடபழனி வரை (முதன்மை மேம்பாலப் பகுதி)',
    yellowLineSectionB: 'பிரிவு B: ஆற்காடு சாலை மற்றும் நகர்ப்புற இடைப்பட்ட பகுதி',
    yellowLineSectionC: 'பிரிவு C: கலங்கரை விளக்கம் மற்றும் மெரினா கடற்கரை நோக்கிய சுரங்கப்பாதை பகுதி',
    yellowStatusNotice: 'கட்டம் 2 கட்டுமான அறிவிப்பு: தடம் 4 சிஎம்ஆர்எல் நிறுவனத்தால் தீவிர கட்டுமானத்தில் உள்ளது. பூவிருந்தவல்லி–வடபழனி முன்னுரிமைப் பகுதியில் வணிகரீதியான பயணிகள் சேவை முதலில் தொடங்கப்படும் (2025/2026 இறுதி), தொடர்ந்து கலங்கரை விளக்கம் நோக்கிய சுரங்கப்பாதை சேவை திறக்கப்படும் (2027/2028).',

    statusAll: 'அனைத்து நிலைகளும்',
    statusOperational: 'செயல்பாட்டில் உள்ளது',
    statusUnderConstruction: 'கட்டுமானத்தில் உள்ளது',
    statusPlanned: 'திட்டமிடப்பட்டுள்ளது',
    statusPhase1: 'கட்டம் 1 & நீட்டிப்பு',
    statusPhase2: 'கட்டம் 2 (எதிர்காலம்)',

    plannerTitle: 'புத்திசாலி பயணத் திட்டம்',
    plannerSubtitle: 'சென்னை மெட்ரோ, புறநகர் ரயில்வே மற்றும் MRTS இடையேயான துல்லியமான சந்திப்பு வழிகாட்டலுடன் கூடிய பயண வழி',
    recentTrips: 'சமீபத்திய பயணங்கள்',
    recentTripsSubtitle: 'முடிக்கப்பட்ட கடைசி 5 பயணத் தேடல்களை ஒரே கிளிக்கில் மீண்டும் இயக்கவும்',
    clearRecentTrips: 'வரலாற்றை அழி',
    noRecentTrips: 'சமீபத்திய பயணங்கள் எதுவும் இல்லை. உங்கள் கடைசி 5 தேடல்களை இங்கே காண ஒரு பயணத்தைத் திட்டமிடுங்கள்.',
    reRunTrip: 'மீண்டும் இயக்கு',
    reverseTrip: 'எதிர் திசை',
    tripCompleted: 'முடிந்தது',
    originStation: 'புறப்படும் நிலையம்',
    destinationStation: 'சென்றடையும் நிலையம்',
    selectOrigin: 'புறப்படும் நிலையத்தை தேர்ந்தெடுக்கவும்...',
    selectDestination: 'சென்றடையும் நிலையத்தை தேர்ந்தெடுக்கவும்...',
    routePreference: 'போக்குவரத்து முன்னுரிமை',
    prefBest: 'சிறந்த வழி (பரிந்துரைக்கப்பட்டது)',
    prefMetro: 'மெட்ரோ முன்னுரிமை',
    prefSuburban: 'புறநகர் ரயில் முன்னுரிமை',
    searchRoutes: 'பயண வழியைக் காண்க',
    routeResults: 'பரிந்துரைக்கப்பட்ட பயண வழி',
    totalDistance: 'மொத்த தூரம்',
    estimatedDuration: 'தோராய பயண நேரம்',
    estimatedFare: 'கட்டணம்',
    transfers: 'ரயில் மாற்றங்கள்',
    stops: 'மொத்த நிறுத்தங்கள்',
    boardAt: 'ஏறும் நிலையம்',
    transferAt: 'ரயில் மாறும் சந்திப்பு',
    arriveAt: 'இலக்கை அடைதல்',
    intermediateStops: 'இடைப்பட்ட நிறுத்தங்கள்',
    upcomingNotice: 'எச்சரிக்கை: இந்த பயண வழி தற்போது கட்டுமானத்தில் உள்ள கட்டம் 2 பாதையைக் கொண்டுள்ளது. பயணிகள் சேவை இன்னும் தொடங்கப்படவில்லை.',
    operationalAlternative: 'தற்போதைய செயல்பாட்டு மாற்று வழி',
    noRouteFound: 'தேர்ந்தெடுக்கப்பட்ட நிலையங்களுக்கு இடையே நேரடி அல்லது இணைப்பு வழித்தடம் கண்டறியப்படவில்லை.',
    sameStationError: 'புறப்படும் மற்றும் சென்றடையும் நிலையங்கள் ஒன்றாக உள்ளன. தயவுசெய்து வெவ்வேறு நிலையங்களைத் தேர்ந்தெடுக்கவும்.',

    assistantTitle: 'நீங்கள் எங்கு செல்ல விரும்புகிறீர்கள்?',
    assistantSubtitle: 'எங்கள் போக்குவரத்து உதவியாளரிடம் தமிழில் அல்லது ஆங்கிலத்தில் கேளுங்கள். எ.கா: "சென்ட்ரலில் இருந்து பூவிருந்தவல்லி செல்ல வேண்டும்"',
    assistantPlaceholder: 'உங்கள் பயணத்தை உள்ளிடவும் (எ.கா: சென்னை சென்ட்ரல் முதல் பூவிருந்தவல்லி, விமான நிலையம் முதல் எழும்பூர்)...',
    assistantButton: 'வழியைக் காண்க',
    assistantExamples: 'மாதிரி வினாக்கள்:',
    assistantInstruction: 'படிப்படியான பயண வழிகாட்டுதல்',

    featuredTitle: 'சிறப்புப் பயணம்: சென்னை சென்ட்ரல் → பூவிருந்தவல்லி',
    featuredSubtitle: 'சென்ட்ரல் சென்னையை மேற்குப் புறநகருடன் இணைக்கும் தெளிவான போக்குவரத்து வழிகாட்டல்',
    featuredStep1: 'படி 1: சென்னை சென்ட்ரல் மெட்ரோவில் பச்சை பாதையில் (தடம் 2) வடபழனி நோக்கி பயணிக்கவும் (செயல்பாட்டில் உள்ளது).',
    featuredStep2: 'படி 2: வடபழனி சந்திப்பு நிலையத்தில் இறங்கவும்.',
    featuredStep3: 'படி 3: மஞ்சள் பாதையில் (தடம் 4) பூவிருந்தவல்லி புறவழிச்சாலை நோக்கி மாறவும் (கட்டம் 2 கட்டுமானத்தில் உள்ளது).',
    featuredAlternative: 'தற்போதைய மாற்று வழி: வடபழனி அல்லது கோயம்பேடு (CMBT) வரை மெட்ரோவில் சென்று, அங்கிருந்து மாநகர பேருந்து (தடம் 54, 88K அல்லது 101) மூலம் பூவிருந்தவல்லி பேருந்து நிலையத்தை நேரடியாக அடையலாம்.',
    planThisJourney: 'இந்த பயணத்தை திட்டமிடு',

    stationCode: 'நிலைய குறியீடு',
    zone: 'மண்டலம்',
    coordinates: 'புவியியல் அமைவிடம்',
    platforms: 'தளங்களின் எண்ணிக்கை',
    facilities: 'வசதிகள்',
    facilityParking: 'வாகன நிறுத்துமிடம்',
    facilityFeederBus: 'இணைப்பு பேருந்து வசதி',
    facilityWheelchair: 'சக்கர நாற்காலி அணுகல்',
    facilityLifts: 'மின்தூக்கி & நகரும் படிக்கட்டுகள்',
    facilityEVCharging: 'மின்சார வாகன சார்ஜிங்',
    operatingHours: 'சேவை நேரம்',
    peakHeadway: 'நெரிசல் நேர இடைவெளி',
    offPeakHeadway: 'வழக்கமான நேர இடைவெளி',
    firstTrain: 'முதல் ரயில்',
    lastTrain: 'கடைசி ரயில்',
    interchangeConnections: 'இணைப்பு சந்திப்புகள்',

    settingsTitle: 'அமைப்புகள் & விருப்பங்கள்',
    settingsSubtitle: 'பயன்பாட்டு மொழி, பயண முன்னுரிமை மற்றும் ஆஃப்லைன் தரவு அமைப்புகள்',
    languageSelection: 'பயன்பாட்டு மொழி',
    languageDesc: 'முழு இணையதளத்தின் மொழியையும் உடனுக்குடன் மாற்றவும்.',
    preferencesTitle: 'பயண முன்னுரிமைகள்',
    defaultPreference: 'இயல்புநிலை போக்குவரத்து வகை',
    cacheTitle: 'ஆஃப்லைன் நினைவகம்',
    cacheDesc: 'இணையம் இல்லாதபோதும் செயல்பட நிலைய விவரங்கள் உலாவி நினைவகத்தில் சேமிக்கப்படுகின்றன.',
    refreshCache: 'தரவை புதுப்பிக்கவும்',
    attributionTitle: 'அங்கீகரிக்கப்பட்ட தரவு மூலங்கள்',
    attributionText: 'நிலைய விவரங்கள், பாதைகள் மற்றும் அட்டவணைகள் சென்னை மெட்ரோ இரயில் நிறுவனம் (CMRL) மற்றும் தெற்கு ரயில்வேயின் அதிகாரப்பூர்வ பதிவுகளிலிருந்து பெறப்பட்டவை.',

    liveStatusTitle: 'நெட்வொர்க் சேவை நிலை & நேர இடைவெளி',
    liveStatusSubtitle: 'அதிகாரப்பூர்வ CMRL அட்டவணை தகவல்',
    serviceOperationalText: 'மெட்ரோ தடங்கள் 1 மற்றும் 2 தினமும் காலை 05:00 முதல் இரவு 23:00 மணி வரை முழு சேவையில் இயங்குகின்றன. நெரிசல் நேர இடைவெளி: 4 நிமிடங்கள் (நீலம்) / 5 நிமிடங்கள் (பச்சை).',
    staticNoticeText: 'போலியான நேரலை ஜிபிஎஸ் தரவுகள் தவிர்க்கப்பட்டுள்ளன. அனைத்து தகவல்களும் அதிகாரப்பூர்வ அட்டவணைப்படி அமைக்கப்பட்டவை.',

    settingsSectionGeneral: 'பொது & தரவு ஒத்திசைவு',
    settingsSectionLanguage: 'மொழி அமைப்புகள்',
    settingsSectionSources: 'தரவு மூலங்கள் & குறிப்புகள் பதிவேடு',
    settingsSectionVerification: 'தரவு வெளிப்படைத்தன்மை & சரிபார்ப்பு தணிக்கை',
    settingsSectionAccessibility: 'அணுகல்தன்மை & காட்சி விருப்பங்கள்',
    sourcesSearchPlaceholder: 'சரிபார்க்கப்பட்ட மூலங்கள், அமைப்புகள் அல்லது ஆவணங்களைத் தேடுக...',
    sourcesFilterAll: 'அனைத்து மூலங்கள்',
    sourcesFilterMetro: 'மெட்ரோ ரயில்',
    sourcesFilterSuburbanNorth: 'புறநகர் வடக்கு',
    sourcesFilterSuburbanSouth: 'புறநகர் தெற்கு',
    sourcesFilterSuburbanWest: 'புறநகர் மேற்கு',
    sourcesFilterSuburbanWestSouth: 'மேற்கு–தெற்கு இணைப்பு',
    sourcesFilterMRTS: 'பறக்கும் ரயில் (MRTS)',
    sourcesFilterBus: 'இணைப்புப் பேருந்து (MTC)',
    sourcesFilterGeneral: 'பொது ரயில்வே',
    openSource: 'அதிகாரப்பூர்வ மூலத்தைத் திற',
    copySourceLink: 'இணைப்பை நகலெடு',
    copied: 'நகலெடுக்கப்பட்டது!',
    statusVerified: 'சரிபார்க்கப்பட்ட அதிகாரப்பூர்வ தரவு',
    statusPartiallyVerified: 'கட்டமைப்பு/திட்ட அறிக்கை தரவு',
    statusOfficial: 'அதிகாரப்பூர்வ அமைப்பு',
    statusThirdParty: 'துணை குறிப்பு தளம்',
    lastVerifiedOn: 'கடைசியாக தணிக்கை செய்யப்பட்டது',
    supportsDataLabel: 'சரிபார்க்கப்பட்ட போக்குவரத்து தகவல்',
    highContrast: 'உயர் மாறுபட்ட முறை',
    highContrastDesc: 'அனைத்து வெளிச்ச சூழல்களிலும் எளிதாக வாசிக்க உரை மாறுபாட்டை அதிகரிக்கவும்.',
    reducedMotion: 'குறைக்கப்பட்ட அசைவு',
    reducedMotionDesc: 'கண்களுக்கு வசதியாக இயங்குபடிகள் மற்றும் அசைவுகளைக் குறைக்கவும்.',
    fontSize: 'எழுத்து அளவு',
    fontSizeNormal: 'இயல்பு நிலை',
    fontSizeLarge: 'வசதியான அளவு (+15%)',
    clearAllCache: 'உள்ளூர் தற்காலிக நினைவகத்தை அழி',
    clearAllCacheSuccess: 'நினைவகம் அழிக்கப்பட்டு தரவுத்தளத்திலிருந்து மீண்டும் பெறப்பட்டது.',
    backToPlanner: 'பயண திட்டமிடுதலுக்கு திரும்பு',
    backToOverview: 'நெட்வொர்க் மேற்பார்வைக்கு திரும்பு',
    activeRouteNotice: 'செயல்பாட்டு சேவை பாதை',
    constructionNotice: 'கட்டுமான நிலை — தற்போதைய பயண கணக்கீட்டிலிருந்து விலக்கப்பட்டுள்ளது'
  }
};
