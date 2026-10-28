import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Layers,
  Train,
  MapPin,
  Search,
  Navigation,
  ArrowRight,
  ShieldCheck,
  Hammer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  CheckCircle2,
  X,
  Compass,
  ArrowUpDown,
  Filter,
  Eye,
  Info
} from 'lucide-react';
import { Station, TransitLine, TransportPreference } from '../types/transit.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

export type NetworkViewMode = 'metro' | 'suburban_mrts' | 'full';

interface NetworkSchematic2DProps {
  lines: TransitLine[];
  stations: Station[];
  initialViewMode?: NetworkViewMode;
  onSelectStationModal: (station: Station) => void;
  onSetOriginForPlanner: (station: Station) => void;
  onSetDestinationForPlanner: (station: Station) => void;
  onPlanTrip: (origin: Station, destination: Station, preference?: TransportPreference) => void;
}

interface StationLayoutConfig {
  x: number;
  y: number;
  labelPos: 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  shortName: string;
  importance: 1 | 2 | 3; // 3 = Major Terminal/Hub, 2 = Interchange, 1 = Regular
}

export const NetworkSchematic2D: React.FC<NetworkSchematic2DProps> = ({
  lines,
  stations,
  initialViewMode = 'metro',
  onSelectStationModal,
  onSetOriginForPlanner,
  onSetDestinationForPlanner,
  onPlanTrip
}) => {
  const { lang, t } = useLanguage();

  // Primary 3-View Segmented Navigation State: 'metro' | 'suburban_mrts' | 'full'
  const [viewMode, setViewMode] = useState<NetworkViewMode>(initialViewMode);

  // Secondary Corridor Filter inside view modes:
  // For 'metro': 'all' | 'blue' | 'green' | 'yellow' | 'purple' | 'red'
  // For 'suburban_mrts': 'all' | 'suburban_north' | 'suburban_south' | 'suburban_west' | 'suburban_west_south' | 'mrts'
  const [corridorFilter, setCorridorFilter] = useState<string>('all');

  // Multi-mode toggles for 'full' view mode
  const [fullModeToggles, setFullModeToggles] = useState<{
    metro: boolean;
    suburban: boolean;
    mrts: boolean;
  }>({
    metro: true,
    suburban: true,
    mrts: true
  });

  // Search input within the schematic
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected station ID for docked detail panel
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  // Hovered station ID for spotlight
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);

  // Pan & Zoom State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);
  const pinchStartDistanceRef = useRef<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync initialViewMode if prop changes with view-optimized zoom/pan
  useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
      setCorridorFilter('all');
      if (initialViewMode === 'metro') {
        setZoom(1.0);
        setPan({ x: 20, y: 10 });
      } else if (initialViewMode === 'suburban_mrts') {
        setZoom(0.85);
        setPan({ x: 15, y: -10 });
      } else {
        setZoom(0.8);
        setPan({ x: 10, y: -10 });
      }
    }
  }, [initialViewMode]);

  // Fast map lookup of stations by ID
  const stationMap = useMemo(() => {
    const map = new Map<string, Station>();
    stations.forEach((s) => map.set(s.id, s));
    return map;
  }, [stations]);

  // Normalized schematic coordinate space with generous spacing and alternating collision-aware label layout
  const stationLayouts = useMemo<Record<string, StationLayoutConfig>>(() => {
    return {
      // ==================== BLUE LINE (Metro Corridor 1 - 26 Stations) ====================
      BL01: { x: 870, y: 70, labelPos: 'right', shortName: 'Wimco Depot', importance: 3 },
      BL02: { x: 870, y: 105, labelPos: 'right', shortName: 'Wimco Nagar', importance: 2 },
      BL03: { x: 870, y: 140, labelPos: 'right', shortName: 'Tiruvottriyur', importance: 2 },
      BL04: { x: 870, y: 175, labelPos: 'right', shortName: 'Theradi', importance: 1 },
      BL05: { x: 870, y: 205, labelPos: 'right', shortName: 'Kaladipet', importance: 1 },
      BL06: { x: 870, y: 235, labelPos: 'right', shortName: 'Tollgate', importance: 1 },
      BL07: { x: 870, y: 265, labelPos: 'right', shortName: 'New Washermanpet', importance: 1 },
      BL08: { x: 870, y: 295, labelPos: 'right', shortName: 'Tondiarpet', importance: 1 },
      BL09: { x: 870, y: 325, labelPos: 'right', shortName: 'Sir Theagaraya', importance: 1 },
      BL10: { x: 870, y: 355, labelPos: 'right', shortName: 'Washermanpet', importance: 1 },
      BL11: { x: 870, y: 385, labelPos: 'right', shortName: 'Mannadi', importance: 1 },
      BL12: { x: 870, y: 415, labelPos: 'right', shortName: 'High Court', importance: 2 },
      BL13: { x: 820, y: 445, labelPos: 'top-left', shortName: 'Central Metro', importance: 3 },
      BL14: { x: 770, y: 480, labelPos: 'right', shortName: 'Govt Estate', importance: 1 },
      BL15: { x: 730, y: 505, labelPos: 'right', shortName: 'LIC', importance: 1 },
      BL16: { x: 690, y: 530, labelPos: 'right', shortName: 'Thousand Lights', importance: 2 },
      BL17: { x: 650, y: 555, labelPos: 'right', shortName: 'AG-DMS', importance: 1 },
      BL18: { x: 610, y: 580, labelPos: 'right', shortName: 'Teynampet', importance: 1 },
      BL19: { x: 570, y: 605, labelPos: 'right', shortName: 'Nandanam', importance: 2 },
      BL20: { x: 530, y: 635, labelPos: 'right', shortName: 'Saidapet', importance: 1 },
      BL21: { x: 490, y: 665, labelPos: 'right', shortName: 'Little Mount', importance: 1 },
      BL22: { x: 450, y: 695, labelPos: 'right', shortName: 'Guindy', importance: 2 },
      BL23: { x: 410, y: 725, labelPos: 'bottom', shortName: 'Alandur', importance: 3 },
      BL24: { x: 370, y: 755, labelPos: 'left', shortName: 'Nanganallur', importance: 1 },
      BL25: { x: 330, y: 785, labelPos: 'left', shortName: 'Meenambakkam', importance: 1 },
      BL26: { x: 290, y: 815, labelPos: 'bottom', shortName: 'Airport', importance: 3 },

      // ==================== GREEN LINE (Metro Corridor 2 - 17 Stations) ====================
      GL01: { x: 820, y: 445, labelPos: 'top-right', shortName: 'Central Metro', importance: 3 },
      GL02: { x: 760, y: 445, labelPos: 'top', shortName: 'Egmore', importance: 2 },
      GL03: { x: 700, y: 445, labelPos: 'top', shortName: 'Nehru Park', importance: 1 },
      GL04: { x: 640, y: 445, labelPos: 'top', shortName: 'Kilpauk KMC', importance: 2 },
      GL05: { x: 580, y: 445, labelPos: 'top', shortName: 'Pachaiyappa', importance: 1 },
      GL06: { x: 520, y: 445, labelPos: 'top', shortName: 'Shenoy Nagar', importance: 1 },
      GL07: { x: 460, y: 445, labelPos: 'top', shortName: 'Anna Nagar East', importance: 1 },
      GL08: { x: 400, y: 445, labelPos: 'top', shortName: 'Anna Nagar Tower', importance: 1 },
      GL09: { x: 350, y: 445, labelPos: 'top', shortName: 'Thirumangalam', importance: 2 },
      GL10: { x: 320, y: 485, labelPos: 'left', shortName: 'Koyambedu', importance: 1 },
      GL11: { x: 320, y: 525, labelPos: 'left', shortName: 'CMBT', importance: 3 },
      GL12: { x: 320, y: 565, labelPos: 'left', shortName: 'Arumbakkam', importance: 1 },
      GL13: { x: 350, y: 610, labelPos: 'left', shortName: 'Vadapalani', importance: 2 },
      GL14: { x: 375, y: 650, labelPos: 'bottom', shortName: 'Ashok Nagar', importance: 1 },
      GL15: { x: 400, y: 685, labelPos: 'bottom', shortName: 'Ekkattuthangal', importance: 1 },
      GL16: { x: 410, y: 725, labelPos: 'bottom-left', shortName: 'Alandur', importance: 3 },
      GL17: { x: 450, y: 750, labelPos: 'right', shortName: 'St. Thomas Mt', importance: 3 },

      // ==================== YELLOW LINE (Phase 2 Corridor 4 - 28 Stations) ====================
      YL01: { x: 60, y: 570, labelPos: 'top', shortName: 'Poonamallee Bypass', importance: 3 },
      YL02: { x: 95, y: 570, labelPos: 'bottom', shortName: 'Poonamallee Bus Stand', importance: 2 },
      YL03: { x: 125, y: 570, labelPos: 'top', shortName: 'Poonamallee GH', importance: 1 },
      YL04: { x: 155, y: 570, labelPos: 'bottom', shortName: 'Karayanchavadi', importance: 1 },
      YL05: { x: 185, y: 570, labelPos: 'top', shortName: 'Kumananchavadi', importance: 1 },
      YL06: { x: 215, y: 570, labelPos: 'bottom', shortName: 'Kattupakkam', importance: 1 },
      YL07: { x: 245, y: 570, labelPos: 'top', shortName: 'Iyyappanthangal', importance: 2 },
      YL08: { x: 275, y: 570, labelPos: 'bottom', shortName: 'Thelliyaragaram', importance: 1 },
      YL09: { x: 305, y: 570, labelPos: 'top', shortName: 'Porur Bypass', importance: 1 },
      YL10: { x: 335, y: 570, labelPos: 'bottom', shortName: 'Porur Jn', importance: 2 },
      YL11: { x: 365, y: 570, labelPos: 'top', shortName: 'Alapakkam', importance: 1 },
      YL12: { x: 395, y: 570, labelPos: 'bottom', shortName: 'Karambakkam', importance: 1 },
      YL13: { x: 425, y: 570, labelPos: 'top', shortName: 'Valasaravakkam', importance: 1 },
      YL14: { x: 455, y: 570, labelPos: 'bottom', shortName: 'Alwarthiru Nagar', importance: 1 },
      YL15: { x: 485, y: 570, labelPos: 'top', shortName: 'Virugambakkam', importance: 1 },
      YL16: { x: 515, y: 570, labelPos: 'bottom', shortName: 'Natesan Nagar', importance: 1 },
      YL17: { x: 545, y: 570, labelPos: 'top', shortName: 'Vadapalani Hub', importance: 2 },
      YL18: { x: 580, y: 570, labelPos: 'bottom', shortName: 'Power House', importance: 1 },
      YL19: { x: 615, y: 570, labelPos: 'top', shortName: 'Meenakshi College', importance: 1 },
      YL20: { x: 650, y: 570, labelPos: 'bottom', shortName: 'Kodambakkam Metro', importance: 1 },
      YL21: { x: 690, y: 570, labelPos: 'top', shortName: 'Panagal Park', importance: 2 },
      YL22: { x: 730, y: 570, labelPos: 'bottom', shortName: 'Nandanam Metro', importance: 2 },
      YL23: { x: 770, y: 570, labelPos: 'top', shortName: 'Boat Club', importance: 1 },
      YL24: { x: 810, y: 570, labelPos: 'bottom', shortName: 'Bharathidasan', importance: 1 },
      YL25: { x: 850, y: 570, labelPos: 'top', shortName: 'Alwarpet', importance: 1 },
      YL26: { x: 895, y: 570, labelPos: 'bottom', shortName: 'Thirumayilai Hub', importance: 3 },
      YL27: { x: 940, y: 570, labelPos: 'top', shortName: 'Kutchery Road', importance: 1 },
      YL28: { x: 985, y: 570, labelPos: 'right', shortName: 'Lighthouse', importance: 3 },

      // ==================== PURPLE LINE (Corridor 3 Anchors) ====================
      PL01: { x: 640, y: 110, labelPos: 'left', shortName: 'Madhavaram Depot', importance: 3 },
      PL03: { x: 680, y: 260, labelPos: 'top', shortName: 'Perambur Metro', importance: 2 },
      PL07: { x: 640, y: 445, labelPos: 'bottom-left', shortName: 'KMC Metro', importance: 2 },
      PL10: { x: 690, y: 530, labelPos: 'left', shortName: 'Thousand Lights', importance: 2 },
      PL13: { x: 895, y: 570, labelPos: 'left', shortName: 'Thirumayilai', importance: 3 },
      PL16: { x: 890, y: 815, labelPos: 'right', shortName: 'Thiruvanmiyur', importance: 2 },
      PL20: { x: 890, y: 915, labelPos: 'right', shortName: 'Sholinganallur', importance: 2 },
      PL22: { x: 890, y: 980, labelPos: 'right', shortName: 'Siruseri SIPCOT', importance: 3 },

      // ==================== RED LINE (Corridor 5 Anchors) ====================
      RL01: { x: 640, y: 110, labelPos: 'right', shortName: 'Madhavaram', importance: 3 },
      RL04: { x: 530, y: 260, labelPos: 'bottom', shortName: 'Villivakkam Metro', importance: 2 },
      RL06: { x: 350, y: 445, labelPos: 'bottom', shortName: 'Thirumangalam', importance: 2 },
      RL08: { x: 320, y: 525, labelPos: 'right', shortName: 'CMBT', importance: 3 },
      RL09: { x: 410, y: 725, labelPos: 'right', shortName: 'Alandur', importance: 3 },
      RL10: { x: 450, y: 750, labelPos: 'bottom', shortName: 'St. Thomas Mt', importance: 3 },
      RL17: { x: 890, y: 915, labelPos: 'bottom', shortName: 'Sholinganallur', importance: 2 },

      // ==================== SUBURBAN NORTH LINE (MASS to SPE - 22 Stations) ====================
      SN01: { x: 820, y: 400, labelPos: 'bottom', shortName: 'Moore Market (MASS)', importance: 3 },
      SN02: { x: 820, y: 345, labelPos: 'left', shortName: 'Basin Bridge', importance: 2 },
      SN03: { x: 820, y: 310, labelPos: 'left', shortName: 'Korukkupet', importance: 1 },
      SN04: { x: 820, y: 275, labelPos: 'left', shortName: 'Tondiarpet', importance: 1 },
      SN05: { x: 820, y: 240, labelPos: 'left', shortName: 'VOC Nagar', importance: 1 },
      SN06: { x: 820, y: 205, labelPos: 'left', shortName: 'Tiruvottiyur', importance: 2 },
      SN07: { x: 820, y: 170, labelPos: 'left', shortName: 'Wimco Nagar', importance: 2 },
      SN08: { x: 820, y: 135, labelPos: 'left', shortName: 'Kathivakkam', importance: 1 },
      SN09: { x: 820, y: 100, labelPos: 'left', shortName: 'Ennore', importance: 2 },
      SN10: { x: 820, y: 65, labelPos: 'left', shortName: 'Attipattu Pudu', importance: 1 },
      SN11: { x: 780, y: 50, labelPos: 'top', shortName: 'Attipattu', importance: 1 },
      SN12: { x: 730, y: 50, labelPos: 'bottom', shortName: 'Nandiyampakkam', importance: 1 },
      SN13: { x: 680, y: 50, labelPos: 'top', shortName: 'Minjur', importance: 2 },
      SN14: { x: 630, y: 50, labelPos: 'bottom', shortName: 'Anuppambattu', importance: 1 },
      SN15: { x: 575, y: 50, labelPos: 'top', shortName: 'Ponneri', importance: 2 },
      SN16: { x: 520, y: 50, labelPos: 'bottom', shortName: 'Kavaraipettai', importance: 1 },
      SN17: { x: 460, y: 50, labelPos: 'top', shortName: 'Gummidipoondi', importance: 3 },
      SN18: { x: 405, y: 50, labelPos: 'bottom', shortName: 'Elavur', importance: 1 },
      SN19: { x: 350, y: 50, labelPos: 'top', shortName: 'Arambakkam', importance: 1 },
      SN20: { x: 290, y: 50, labelPos: 'bottom', shortName: 'Tada (Sri City)', importance: 2 },
      SN21: { x: 230, y: 50, labelPos: 'top', shortName: 'Akkampet', importance: 1 },
      SN22: { x: 170, y: 50, labelPos: 'left', shortName: 'Sullurupeta', importance: 3 },

      // ==================== SUBURBAN WEST LINE (MMC to AJJ - 31 Stations) ====================
      SW01: { x: 820, y: 400, labelPos: 'top-right', shortName: 'Central (MMC)', importance: 3 },
      SW02: { x: 800, y: 330, labelPos: 'top-left', shortName: 'Basin Bridge', importance: 2 },
      SW03: { x: 740, y: 260, labelPos: 'bottom', shortName: 'Vyasarpadi Jeeva', importance: 1 },
      SW04: { x: 680, y: 260, labelPos: 'top', shortName: 'Perambur', importance: 2 },
      SW05: { x: 630, y: 260, labelPos: 'bottom', shortName: 'Perambur CW', importance: 1 },
      SW06: { x: 580, y: 260, labelPos: 'top', shortName: 'Perambur LW', importance: 1 },
      SW07: { x: 530, y: 260, labelPos: 'bottom', shortName: 'Villivakkam', importance: 2 },
      SW08: { x: 480, y: 260, labelPos: 'top', shortName: 'Korattur', importance: 1 },
      SW09: { x: 430, y: 260, labelPos: 'bottom', shortName: 'Pattaravakkam', importance: 1 },
      SW10: { x: 380, y: 260, labelPos: 'top', shortName: 'Ambattur', importance: 2 },
      SW11: { x: 335, y: 260, labelPos: 'bottom', shortName: 'Thirumullaivoyal', importance: 1 },
      SW12: { x: 290, y: 260, labelPos: 'top', shortName: 'Annanur', importance: 1 },
      SW13: { x: 245, y: 260, labelPos: 'bottom', shortName: 'Avadi', importance: 3 },
      SW14: { x: 200, y: 260, labelPos: 'top', shortName: 'Hindu College', importance: 1 },
      SW15: { x: 160, y: 260, labelPos: 'bottom', shortName: 'Pattabiram', importance: 2 },
      SW16: { x: 140, y: 205, labelPos: 'left', shortName: 'PTMS (Defense)', importance: 2 },
      SW17: { x: 180, y: 205, labelPos: 'right', shortName: 'PRES (Depot)', importance: 2 },
      SW18: { x: 120, y: 260, labelPos: 'top', shortName: 'Nemilichery', importance: 1 },
      SW19: { x: 80, y: 260, labelPos: 'bottom', shortName: 'Thiruninravur', importance: 2 },
      SW20: { x: 60, y: 295, labelPos: 'left', shortName: 'Veppampattu', importance: 1 },
      SW21: { x: 60, y: 330, labelPos: 'left', shortName: 'Sevvapet Road', importance: 1 },
      SW22: { x: 60, y: 365, labelPos: 'left', shortName: 'Putlur', importance: 1 },
      SW23: { x: 60, y: 400, labelPos: 'left', shortName: 'Tiruvallur', importance: 3 },
      SW24: { x: 60, y: 435, labelPos: 'left', shortName: 'Egattur', importance: 1 },
      SW25: { x: 60, y: 470, labelPos: 'left', shortName: 'Kadambattur', importance: 2 },
      SW26: { x: 60, y: 505, labelPos: 'left', shortName: 'Senjipanambakkam', importance: 1 },
      SW27: { x: 60, y: 540, labelPos: 'left', shortName: 'Manavur', importance: 1 },
      SW28: { x: 60, y: 575, labelPos: 'left', shortName: 'Thiruvalangadu', importance: 2 },
      SW29: { x: 60, y: 610, labelPos: 'left', shortName: 'Mosur', importance: 1 },
      SW30: { x: 60, y: 645, labelPos: 'left', shortName: 'Puliyamangalam', importance: 1 },
      SW31: { x: 60, y: 685, labelPos: 'bottom-left', shortName: 'Arakkonam Jn', importance: 3 },

      // ==================== WEST–SOUTH LINK CORRIDOR (AJJ to CGL - 13 Stations) ====================
      WS12: { x: 75, y: 725, labelPos: 'right', shortName: 'Melpakkam', importance: 1 },
      WS11: { x: 90, y: 765, labelPos: 'right', shortName: 'Takkolam', importance: 1 },
      WS10: { x: 110, y: 805, labelPos: 'right', shortName: 'Tirumalpur', importance: 2 },
      WS09: { x: 145, y: 855, labelPos: 'bottom', shortName: 'Kanchipuram (CJ)', importance: 3 },
      WS08: { x: 185, y: 895, labelPos: 'top', shortName: 'Kanchi East', importance: 1 },
      WS07: { x: 225, y: 935, labelPos: 'bottom', shortName: 'Nathapettai', importance: 1 },
      WS06: { x: 265, y: 975, labelPos: 'top', shortName: 'Walajabad', importance: 2 },
      WS05: { x: 305, y: 1015, labelPos: 'bottom', shortName: 'Pazhaya Seevaram', importance: 1 },
      WS04: { x: 345, y: 1055, labelPos: 'top', shortName: 'Palur', importance: 1 },
      WS03: { x: 385, y: 1095, labelPos: 'bottom', shortName: 'Villiyambakkam', importance: 1 },
      WS02: { x: 425, y: 1135, labelPos: 'top', shortName: 'Reddipalayam', importance: 1 },

      // ==================== SUBURBAN SOUTH LINE (Beach to CGL - 28 Stations) ====================
      SB01: { x: 880, y: 300, labelPos: 'right', shortName: 'Chennai Beach', importance: 3 },
      SB02: { x: 880, y: 345, labelPos: 'right', shortName: 'Chennai Fort', importance: 2 },
      SB03: { x: 855, y: 390, labelPos: 'right', shortName: 'Chennai Park', importance: 2 },
      SB04: { x: 760, y: 445, labelPos: 'bottom', shortName: 'Chennai Egmore', importance: 3 },
      SB05: { x: 715, y: 475, labelPos: 'bottom', shortName: 'Chetpet', importance: 1 },
      SB06: { x: 675, y: 505, labelPos: 'bottom', shortName: 'Nungambakkam', importance: 1 },
      SB07: { x: 635, y: 535, labelPos: 'bottom', shortName: 'Kodambakkam', importance: 2 },
      SB08: { x: 595, y: 565, labelPos: 'bottom', shortName: 'Mambalam', importance: 2 },
      SB09: { x: 555, y: 595, labelPos: 'bottom', shortName: 'Saidapet', importance: 1 },
      SB10: { x: 515, y: 630, labelPos: 'bottom', shortName: 'Guindy', importance: 2 },
      SB11: { x: 485, y: 665, labelPos: 'bottom-left', shortName: 'St. Thomas Mt', importance: 3 },
      SB12: { x: 485, y: 700, labelPos: 'left', shortName: 'Palavanthangal', importance: 1 },
      SB13: { x: 485, y: 730, labelPos: 'left', shortName: 'Minambakkam', importance: 1 },
      SB14: { x: 485, y: 760, labelPos: 'left', shortName: 'Tirusulam (Airport)', importance: 2 },
      SB15: { x: 485, y: 790, labelPos: 'left', shortName: 'Pallavaram', importance: 1 },
      SB16: { x: 485, y: 820, labelPos: 'left', shortName: 'Chromepet', importance: 1 },
      SB17: { x: 485, y: 850, labelPos: 'left', shortName: 'Sanatorium', importance: 1 },
      SB18: { x: 485, y: 880, labelPos: 'left', shortName: 'Tambaram', importance: 3 },
      SB19: { x: 485, y: 910, labelPos: 'right', shortName: 'Perungalathur', importance: 1 },
      SB20: { x: 485, y: 940, labelPos: 'left', shortName: 'Vandalur Zoo', importance: 2 },
      SB21: { x: 485, y: 970, labelPos: 'right', shortName: 'Urappakkam', importance: 1 },
      SB22: { x: 485, y: 1000, labelPos: 'left', shortName: 'Guduvancheri', importance: 2 },
      SB23: { x: 485, y: 1030, labelPos: 'right', shortName: 'Potheri (SRM)', importance: 1 },
      SB24: { x: 485, y: 1060, labelPos: 'left', shortName: 'Kattangulathur', importance: 1 },
      SB25: { x: 485, y: 1090, labelPos: 'right', shortName: 'Maraimalai Nagar', importance: 2 },
      SB26: { x: 485, y: 1120, labelPos: 'left', shortName: 'Singaperumal Koil', importance: 1 },
      SB27: { x: 485, y: 1150, labelPos: 'right', shortName: 'Paranur (MWC)', importance: 2 },
      SB28: { x: 485, y: 1180, labelPos: 'bottom-right', shortName: 'Chengalpattu Jn', importance: 3 },

      // ==================== MRTS ELEVATED LINE (Beach to Velachery - 18 Stations) ====================
      MR01: { x: 920, y: 300, labelPos: 'top-right', shortName: 'Beach (MRTS)', importance: 3 },
      MR02: { x: 920, y: 345, labelPos: 'right', shortName: 'Fort', importance: 1 },
      MR03: { x: 920, y: 390, labelPos: 'right', shortName: 'Park Town', importance: 2 },
      MR04: { x: 920, y: 430, labelPos: 'right', shortName: 'Chintadripet', importance: 1 },
      MR05: { x: 920, y: 465, labelPos: 'right', shortName: 'Chepauk Stadium', importance: 2 },
      MR06: { x: 920, y: 500, labelPos: 'right', shortName: 'Triplicane', importance: 1 },
      MR07: { x: 940, y: 535, labelPos: 'right', shortName: 'Light House', importance: 2 },
      MR08: { x: 940, y: 570, labelPos: 'right', shortName: 'Mundakakanni', importance: 1 },
      MR09: { x: 940, y: 605, labelPos: 'right', shortName: 'Thirumayilai', importance: 3 },
      MR10: { x: 940, y: 640, labelPos: 'right', shortName: 'Mandaveli', importance: 1 },
      MR11: { x: 940, y: 675, labelPos: 'right', shortName: 'Greenways Road', importance: 1 },
      MR12: { x: 940, y: 710, labelPos: 'right', shortName: 'Kotturpuram', importance: 1 },
      MR13: { x: 940, y: 745, labelPos: 'right', shortName: 'Kasturba Nagar', importance: 2 },
      MR14: { x: 920, y: 780, labelPos: 'right', shortName: 'Indira Nagar', importance: 1 },
      MR15: { x: 890, y: 815, labelPos: 'right', shortName: 'Thiruvanmiyur', importance: 2 },
      MR16: { x: 840, y: 835, labelPos: 'bottom', shortName: 'Taramani', importance: 1 },
      MR17: { x: 785, y: 845, labelPos: 'bottom', shortName: 'Perungudi', importance: 1 },
      MR18: { x: 725, y: 850, labelPos: 'bottom-left', shortName: 'Velachery', importance: 3 }
    };
  }, []);

  // Filter lines according to the active View Mode and Corridor sub-filter
  const activeLines = useMemo(() => {
    if (viewMode === 'metro') {
      const metroOnly = lines.filter((l) => l.system_type === 'Metro');
      if (corridorFilter === 'all') return metroOnly;
      return metroOnly.filter((l) => l.id === corridorFilter);
    }

    if (viewMode === 'suburban_mrts') {
      const subMrtsOnly = lines.filter((l) => l.system_type === 'Suburban' || l.system_type === 'MRTS');
      if (corridorFilter === 'all') return subMrtsOnly;
      return subMrtsOnly.filter((l) => l.id === corridorFilter);
    }

    // viewMode === 'full'
    return lines.filter((l) => {
      if (l.system_type === 'Metro' && !fullModeToggles.metro) return false;
      if (l.system_type === 'Suburban' && !fullModeToggles.suburban) return false;
      if (l.system_type === 'MRTS' && !fullModeToggles.mrts) return false;
      return true;
    });
  }, [lines, viewMode, corridorFilter, fullModeToggles]);

  // Determine stations that should be rendered based on activeLines
  const activeStations = useMemo(() => {
    const activeLineIds = new Set(activeLines.map((l) => l.id));

    return stations.filter((s) => {
      // Allow shared junction endpoints for West-South Link
      if (activeLineIds.has('suburban_west_south')) {
        if (s.id === 'SB28' || s.id === 'SW31') return true;
      }
      return activeLineIds.has(s.line_id);
    });
  }, [stations, activeLines]);

  // Search filter matches
  const searchMatchedStationIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase().trim();
    const matched = new Set<string>();
    stations.forEach((s) => {
      if (
        s.name.toLowerCase().includes(q) ||
        (s.name_ta && s.name_ta.toLowerCase().includes(q)) ||
        (s.code && s.code.toLowerCase().includes(q))
      ) {
        matched.add(s.id);
      }
    });
    return matched;
  }, [stations, searchQuery]);

  // Selected station object
  const selectedStation = useMemo(() => {
    if (!selectedStationId) return null;
    return stationMap.get(selectedStationId) || null;
  }, [selectedStationId, stationMap]);

  // Track Paths for active lines
  const lineTracks = useMemo(() => {
    return activeLines.map((line) => {
      let lineSts: { station: Station; coords: { x: number; y: number } }[] = [];

      if (line.id === 'suburban_west_south') {
        const cgl = stations.find((s) => s.id === 'SB28');
        const ajj = stations.find((s) => s.id === 'SW31');
        const intermediate = stations
          .filter((s) => s.line_id === 'suburban_west_south')
          .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

        const fullSeq: Station[] = [];
        if (cgl) fullSeq.push(cgl);
        fullSeq.push(...intermediate);
        if (ajj) fullSeq.push(ajj);

        lineSts = fullSeq
          .map((s) => ({
            station: s,
            coords: stationLayouts[s.id]
          }))
          .filter((item) => item.coords !== undefined);
      } else {
        lineSts = stations
          .filter((s) => s.line_id === line.id)
          .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
          .map((s) => ({
            station: s,
            coords: stationLayouts[s.id]
          }))
          .filter((item) => item.coords !== undefined);
      }

      let pathD = '';
      if (lineSts.length > 1) {
        pathD = `M ${lineSts[0].coords.x} ${lineSts[0].coords.y}`;
        for (let i = 1; i < lineSts.length; i++) {
          pathD += ` L ${lineSts[i].coords.x} ${lineSts[i].coords.y}`;
        }
      }

      return {
        line,
        stations: lineSts,
        pathD,
        isOperational: line.status === 'operational'
      };
    });
  }, [activeLines, stations, stationLayouts]);

  // Pan and Zoom Event Handlers
  const handleZoomIn = () => setZoom((z) => Math.min(2.4, +(z + 0.2).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(2)));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleFitNetwork = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      const targetWidth = 1150;
      const targetHeight = 1220;
      const scaleX = (containerWidth - 30) / targetWidth;
      const scaleY = (containerHeight - 30) / targetHeight;
      const fitZoom = Math.max(0.55, Math.min(1.15, +(Math.min(scaleX, scaleY)).toFixed(2)));
      setZoom(fitZoom);
      setPan({ x: Math.max(0, (containerWidth - targetWidth * fitZoom) / 2), y: 10 });
    } else {
      setZoom(0.85);
      setPan({ x: 10, y: 10 });
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((curr) => {
      const next = Math.max(0.6, Math.min(2.4, +(curr * zoomFactor).toFixed(2)));
      return next;
    });
  };

  // Mouse drag panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMovedRef.current = true;
    }
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag & pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      hasMovedRef.current = false;
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { ...pan };
      pinchStartDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDistanceRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasMovedRef.current = true;
      }
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy
      });
    } else if (e.touches.length === 2 && pinchStartDistanceRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      const ratio = currentDist / pinchStartDistanceRef.current;
      setZoom((z) => Math.max(0.6, Math.min(2.4, +(z * (ratio > 1 ? 1.03 : 0.97)).toFixed(2))));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    pinchStartDistanceRef.current = null;
  };

  // Click on station node: ignore if user was dragging
  const handleNodeClick = (stId: string) => {
    if (hasMovedRef.current) return;
    setSelectedStationId(stId);
  };

  // Determine whether label should be rendered based on zoom, importance, search, corridor filter, or hover
  const shouldRenderLabel = (stId: string, importance: number): boolean => {
    if (selectedStationId === stId || hoveredStationId === stId || searchMatchedStationIds.has(stId)) {
      return true;
    }
    // When filtered to a specific corridor, reveal all its station names directly
    if (corridorFilter !== 'all') {
      return true;
    }
    if (zoom < 0.85) {
      return importance >= 3;
    }
    if (zoom < 1.25) {
      return importance >= 2;
    }
    // High zoom: reveal all station labels
    return true;
  };

  // Helper to compute label offsets based on labelPos
  const getLabelCoordinates = (pos: StationLayoutConfig['labelPos']) => {
    switch (pos) {
      case 'top':
        return { dx: 0, dy: -14, anchor: 'middle' as const };
      case 'bottom':
        return { dx: 0, dy: 22, anchor: 'middle' as const };
      case 'left':
        return { dx: -14, dy: 4, anchor: 'end' as const };
      case 'right':
        return { dx: 14, dy: 4, anchor: 'start' as const };
      case 'top-right':
        return { dx: 10, dy: -10, anchor: 'start' as const };
      case 'bottom-right':
        return { dx: 10, dy: 16, anchor: 'start' as const };
      case 'top-left':
        return { dx: -10, dy: -10, anchor: 'end' as const };
      case 'bottom-left':
        return { dx: -10, dy: 16, anchor: 'end' as const };
      default:
        return { dx: 12, dy: 4, anchor: 'start' as const };
    }
  };

  return (
    <section className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 lg:p-8 space-y-5 shadow-2xl">
      {/* 1. Header Bar: Title, Search, Zoom Level */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-xs font-bold text-cyan-400 mb-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive 2D Network Diagram</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
            Explore Chennai's Transit Corridors
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-0.5 leading-relaxed">
            Pristine 2D schematic network with responsive collision-free station labels, multi-tier zoom & pan, and mode-segregated rail views.
          </p>
        </div>

        {/* Live Station Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search station or code (e.g. Kanchipuram, Vadapalani, Central)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors min-h-[40px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white p-0.5 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Top-Level Segmented View Selector: METRO | SUBURBAN + MRTS | FULL NETWORK */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Main 3-View Segmented Tabs */}
        <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => {
              setViewMode('metro');
              setCorridorFilter('all');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              viewMode === 'metro'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Metro Network</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('suburban_mrts');
              setCorridorFilter('all');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              viewMode === 'suburban_mrts'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Train className="w-4 h-4" />
            <span>Suburban + MRTS</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('full');
              setCorridorFilter('all');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              viewMode === 'full'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Full Network</span>
          </button>
        </div>

        {/* Pan & Zoom Controls Toolbar */}
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-2xl p-1 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono text-cyan-400 px-2 font-bold select-none">
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-800 mx-0.5" />

          <button
            type="button"
            onClick={handleFitNetwork}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            title="Fit Network"
            aria-label="Fit Network to Viewport"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleResetView}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            title="Reset View"
            aria-label="Reset Pan and Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Secondary Sub-Filters based on Active View Mode */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800/80 rounded-2xl overflow-x-auto">
        {/* VIEW A: METRO SUB-FILTERS */}
        {viewMode === 'metro' && (
          <>
            <button
              onClick={() => setCorridorFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer min-h-[36px] ${
                corridorFilter === 'all'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              All Metro Lines
            </button>
            <button
              onClick={() => setCorridorFilter('blue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
                corridorFilter === 'blue'
                  ? 'bg-[#0284c7] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
              <span>Blue Line (C-1)</span>
            </button>
            <button
              onClick={() => setCorridorFilter('green')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
                corridorFilter === 'green'
                  ? 'bg-[#16a34a] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a]" />
              <span>Green Line (C-2)</span>
            </button>
            <button
              onClick={() => setCorridorFilter('yellow')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
                corridorFilter === 'yellow'
                  ? 'bg-[#eab308] text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
              <span>Yellow Line (C-4)</span>
            </button>
            <button
              onClick={() => setCorridorFilter('purple')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
                corridorFilter === 'purple'
                  ? 'bg-[#9333ea] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#9333ea]" />
              <span>Purple Line (C-3)</span>
            </button>
            <button
              onClick={() => setCorridorFilter('red')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
                corridorFilter === 'red'
                  ? 'bg-[#ef4444] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
              <span>Red Line (C-5)</span>
            </button>
          </>
        )}

        {/* VIEW B: SUBURBAN + MRTS SUB-FILTERS */}
        {viewMode === 'suburban_mrts' && (
          <>
            <button
              onClick={() => setCorridorFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer min-h-[36px] ${
                corridorFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              All Suburban + MRTS
            </button>
            <button
              onClick={() => setCorridorFilter('suburban_north')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
                corridorFilter === 'suburban_north'
                  ? 'bg-[#0891b2] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#0891b2]" />
              <span>North Line (MASS–SPE)</span>
            </button>
            <button
              onClick={() => setCorridorFilter('suburban_south')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
                corridorFilter === 'suburban_south'
                  ? 'bg-[#ea580c] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c]" />
              <span>South Line (Beach–CGL)</span>
            </button>
            <button
              onClick={() => setCorridorFilter('suburban_west')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
                corridorFilter === 'suburban_west'
                  ? 'bg-[#059669] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
              <span>West Line (MMC–AJJ)</span>
            </button>
            <button
              onClick={() => setCorridorFilter('suburban_west_south')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
                corridorFilter === 'suburban_west_south'
                  ? 'bg-[#e11d48] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]" />
              <span>West–South Link (CGL–AJJ)</span>
            </button>
            <button
              onClick={() => setCorridorFilter('mrts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
                corridorFilter === 'mrts'
                  ? 'bg-[#8b5cf6] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" />
              <span>MRTS Elevated (Beach–Velachery)</span>
            </button>
          </>
        )}

        {/* VIEW C: FULL NETWORK MODE TOGGLES */}
        {viewMode === 'full' && (
          <div className="flex items-center gap-3 px-2 py-1 text-xs">
            <span className="text-slate-400 font-bold uppercase text-[11px]">Layer Controls:</span>
            <label className="flex items-center gap-1.5 text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={fullModeToggles.metro}
                onChange={(e) => setFullModeToggles((prev) => ({ ...prev, metro: e.target.checked }))}
                className="w-3.5 h-3.5 rounded text-cyan-600 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Metro Rail</span>
              </span>
            </label>
            <label className="flex items-center gap-1.5 text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={fullModeToggles.suburban}
                onChange={(e) => setFullModeToggles((prev) => ({ ...prev, suburban: e.target.checked }))}
                className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Suburban Railway</span>
              </span>
            </label>
            <label className="flex items-center gap-1.5 text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={fullModeToggles.mrts}
                onChange={(e) => setFullModeToggles((prev) => ({ ...prev, mrts: e.target.checked }))}
                className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>MRTS Elevated</span>
              </span>
            </label>
          </div>
        )}
      </div>

      {/* 4. Canvas Viewport Container with Pan, Drag, Wheel, Pinch Zoom */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full h-[600px] sm:h-[660px] lg:h-[720px] overflow-hidden bg-slate-950 rounded-2xl border border-slate-800/90 shadow-inner select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

        {/* Zoom Instructions Hint */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 pointer-events-none flex items-center gap-1.5 z-10 backdrop-blur-sm">
          <Info className="w-3 h-3 text-cyan-400" />
          <span>Click & drag to pan · Scroll / pinch to zoom</span>
        </div>

        {/* Transformed SVG Workspace */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left',
            transition: isDragging ? 'none' : 'transform 0.08s ease-out',
            width: '1150px',
            height: '1220px',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        >
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 1150 1220"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="schematicGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.8" />
              </filter>
            </defs>

            {/* A. ROUTE TRACK LINES */}
            {lineTracks.map(({ line, pathD, isOperational }) => {
              if (!pathD) return null;

              return (
                <g key={`track-${line.id}`}>
                  {/* Dark track foundation */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#020617"
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Main colorful railway stroke */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={line.color}
                    strokeWidth="6.5"
                    strokeDasharray={isOperational ? undefined : '8,5'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={isOperational ? 0.95 : 0.75}
                  />
                </g>
              );
            })}

            {/* B. SPECIAL INTERCHANGE CHORDS */}
            {/* Chennai Central Hub Major Interchange Visual Connector */}
            <g className="pointer-events-none opacity-85">
              <line
                x1={820}
                y1={400}
                x2={820}
                y2={445}
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="3,3"
              />
              <line
                x1={820}
                y1={400}
                x2={855}
                y2={390}
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeDasharray="3,3"
              />
              <circle cx={835} cy={410} r="18" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3,2" />
            </g>

            {/* Pattabiram Spur Connecting Line */}
            <line
              x1={160}
              y1={260}
              x2={140}
              y2={205}
              stroke="#059669"
              strokeWidth="4"
              strokeDasharray="4,3"
            />
            <line
              x1={140}
              y1={205}
              x2={180}
              y2={205}
              stroke="#059669"
              strokeWidth="4"
              strokeDasharray="4,3"
            />

            {/* C. STATION NODES & CALLOUT LABELS */}
            {activeStations.map((station) => {
              const layout = stationLayouts[station.id];
              if (!layout) return null;

              const isInterchange = station.is_interchange === 1;
              const isSelected = selectedStationId === station.id;
              const isHovered = hoveredStationId === station.id;
              const isMatched = searchMatchedStationIds.has(station.id);
              const isOperational = station.status === 'operational';
              const showLabel = shouldRenderLabel(station.id, layout.importance);

              const nodeColor = station.line_color || '#0284c7';
              const nodeRadius = isInterchange ? 7.5 : 5.5;
              const labelOffsets = getLabelCoordinates(layout.labelPos);

              return (
                <g
                  key={`node-${station.id}`}
                  transform={`translate(${layout.x}, ${layout.y})`}
                  onClick={() => handleNodeClick(station.id)}
                  onMouseEnter={() => setHoveredStationId(station.id)}
                  onMouseLeave={() => setHoveredStationId(null)}
                  className="cursor-pointer transition-transform"
                  tabIndex={0}
                  role="button"
                  aria-label={`${station.name} station, code ${station.code}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedStationId(station.id);
                    }
                  }}
                >
                  {/* Native SVG Tooltip for browser hover accessibility */}
                  <title>{`${station.name} [${station.code}] — ${station.line_name} (${station.system_type})`}</title>

                  {/* Search Match Halo Pulse */}
                  {isMatched && (
                    <circle
                      r="19"
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="3.5"
                      className="animate-ping"
                      opacity="0.85"
                    />
                  )}

                  {/* Selected Station Outer Ring */}
                  {isSelected && (
                    <circle
                      r="16"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="3.5"
                      opacity="0.95"
                    />
                  )}

                  {/* Hover Outer Ring */}
                  {isHovered && !isSelected && (
                    <circle
                      r="14"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      opacity="0.85"
                    />
                  )}

                  {/* Station Node Core with Visual Hierarchy */}
                  {isInterchange ? (
                    <>
                      {/* Major Interchange Outer White Ring */}
                      <circle
                        r={nodeRadius + 4}
                        fill="#020617"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        filter="url(#schematicGlow)"
                      />
                      {/* Inner Line Core */}
                      <circle
                        r={nodeRadius - 0.5}
                        fill={isOperational ? nodeColor : '#090d16'}
                        stroke={nodeColor}
                        strokeWidth="2"
                      />
                    </>
                  ) : layout.importance === 3 ? (
                    <>
                      {/* Terminal Station Gold Outer Ring */}
                      <circle
                        r={nodeRadius + 3.5}
                        fill="#020617"
                        stroke="#fde047"
                        strokeWidth="2.2"
                        filter="url(#schematicGlow)"
                      />
                      <circle
                        r={nodeRadius}
                        fill={isOperational ? nodeColor : '#090d16'}
                        stroke="#ffffff"
                        strokeWidth="1.8"
                      />
                    </>
                  ) : (
                    <circle
                      r={nodeRadius}
                      fill={isOperational ? nodeColor : '#090d16'}
                      stroke="#ffffff"
                      strokeWidth="1.8"
                      strokeDasharray={isOperational ? undefined : '2,2'}
                      filter="url(#schematicGlow)"
                    />
                  )}

                  {/* Station Label with Collision-Free High-Contrast Dark Halo Pill */}
                  {showLabel && (
                    <g
                      transform={`translate(${labelOffsets.dx}, ${labelOffsets.dy})`}
                      className="pointer-events-none select-none"
                    >
                      {/* High-Contrast Pill Background so route lines NEVER cut through text */}
                      <text
                        x="0"
                        y="0"
                        textAnchor={labelOffsets.anchor}
                        fontSize={layout.importance >= 3 ? '13.5' : '12.5'}
                        fontWeight={isInterchange || isSelected || layout.importance >= 2 ? '700' : '600'}
                        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                        stroke="#030712"
                        strokeWidth="4.5"
                        strokeLinejoin="round"
                        fill="#030712"
                      >
                        {layout.shortName}
                      </text>

                      {/* Foreground Crisp Legible Text */}
                      <text
                        x="0"
                        y="0"
                        textAnchor={labelOffsets.anchor}
                        fontSize={layout.importance >= 3 ? '13.5' : '12.5'}
                        fontWeight={isInterchange || isSelected || layout.importance >= 2 ? '700' : '600'}
                        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                        fill={
                          isSelected
                            ? '#38bdf8'
                            : isHovered
                            ? '#ffffff'
                            : layout.importance >= 3
                            ? '#fde047'
                            : isInterchange
                            ? '#ffffff'
                            : '#f1f5f9'
                        }
                      >
                        {layout.shortName}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* 5. Station Floating Detail Panel / Docked Card */}
        {selectedStation && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-slate-900/95 backdrop-blur-md border border-cyan-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-2 z-20">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: selectedStation.line_color || '#0284c7' }}
                  />
                  <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                    {lang === 'ta' && selectedStation.name_ta ? selectedStation.name_ta : selectedStation.name}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                  <span className="font-mono text-cyan-400 font-bold">[{selectedStation.code}]</span>
                  <span>·</span>
                  <span>{selectedStation.system_type}</span>
                  <span>·</span>
                  <span className="text-slate-300 font-medium">{selectedStation.line_name}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStationId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 transition cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                title="Close station details"
                aria-label="Close station details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Operational Status Pill */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold ${
                  selectedStation.status === 'operational'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {selectedStation.status === 'operational' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Operational Service</span>
                  </>
                ) : (
                  <>
                    <Hammer className="w-3.5 h-3.5" />
                    <span>Phase II Under Construction</span>
                  </>
                )}
              </span>

              {selectedStation.is_interchange === 1 && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[11px] font-bold">
                  Major Interchange Hub
                </span>
              )}
            </div>

            {/* Interchange Description */}
            {selectedStation.interchange_info && (
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                {selectedStation.interchange_info}
              </p>
            )}

            {/* Working Action Buttons */}
            <div className="pt-1 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onSetOriginForPlanner(selectedStation)}
                className="flex-1 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Plan From Here</span>
              </button>

              <button
                type="button"
                onClick={() => onSetDestinationForPlanner(selectedStation)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>To Destination</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectStationModal(selectedStation)}
                className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                title="View complete station facilities, accessibility, and platform info"
              >
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Facilities</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Network Legend Bar */}
      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-white bg-slate-900" />
            <span className="text-slate-300 font-semibold">Interchange Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-amber-300 bg-slate-900" />
            <span className="text-amber-300 font-semibold">Terminal Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>Regular Station</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-0.5 border-t-2 border-dashed border-amber-400" />
            <span className="text-amber-300">Phase II Under Construction</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Showing {activeStations.length} stations across {activeLines.length} active corridors
        </div>
      </div>
    </section>
  );
};
