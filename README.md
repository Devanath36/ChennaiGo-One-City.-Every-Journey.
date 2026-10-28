# ChennaiGo
### Smart Public Transport Guide · Multi-Modal Transit Explorer

An interactive, high-contrast transit network guide and intelligent journey planner for Chennai's public transportation network — covering Chennai Metro Rail (Phase I & II), Southern Railway Suburban trains (North, South, West, and West–South Link lines), and the elevated Mass Rapid Transit System (MRTS).

[![GitHub](https://img.shields.io/badge/GitHub-Deva--1706%2Fchennai--transit-181717?style=flat&logo=github)](https://github.com/Deva-1706/chennai-transit)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61dafb?style=flat&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=flat&logo=sqlite)](https://www.sqlite.org/)

---

## 🚉 Project Overview

Chennai Transit provides commuters and visitors with verified transit information, routing calculations, station accessibility data, and clear visual schematic maps without requiring an account or sign-in.

### 🌟 Key Highlights

- **Smart Station Search**: Instant autocomplete search across 220 transit stations by English name, Tamil name (`தமிழ்`), official station code (`MAS`, `TBM`, `MS`, `BL26`), line name, or common colloquial alias (e.g., Central, Airport, Egmore, Guindy, Tambaram, Poonamallee).
- **Multi-Route Journey Comparison**: Generates multiple valid itineraries side-by-side:
  - *Best Available Route* (Fastest travel time)
  - *Fewest Transfers* (Direct or minimal interchange)
  - *Metro Preferred* (Priority for air-conditioned rapid transit)
  - *Suburban Train Preferred* (Cost-effective heavy suburban rail)
- **Interactive 2D Schematic Network**: High-contrast, collision-aware railway schematic with alternating typography, progressive station name visibility on zoom, pan dragging, pinch-to-zoom, and floating zoom/fit controls.
- **Three Dedicated Network Views**:
  - **Metro Network**: Blue Line (Corridor 1), Green Line (Corridor 2), and Phase II priority corridors (Purple Line, Yellow Line 28 stations, Red Line).
  - **Suburban + MRTS**: North Line (`MASS` to `SPE` — 22 stations), South Line (`MSB` to `CGL` — 28 stations), West Line (`MASS` to `AJJ` — 31 stations), West–South Link Corridor (`CGL` to `AJJ` via Kanchipuram — 13 stations), and elevated MRTS (`MSB` to `VLCY` — 18 stations).
  - **Full Network**: Unified metropolitan map with independent layer toggles.
- **Step-by-Step Guidance**: Visual journey timeline detailing boarding stations, platform transfers, walk times, and intermediate halts.
- **Favorites & Recent History**: Star favorite stations and routes; track up to 10 recent journeys with one-tap *Plan Again* and *Reverse Direction* stored locally (`localStorage`).
- **Strict Service Accuracy**: Excludes under-construction Phase II corridors from operational routing while clearly warning users and providing interim feeder alternatives when querying future stations.
- **Bilingual Interface**: Seamless switching between English and Tamil (`தமிழ்`).
- **Zero Secrets**: Pure public commuter guide; no tokens or private keys required.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React icons
- **Backend / API**: Node.js Express server running with integrated Vite middleware
- **Database**: Local SQLite database via Node's native `DatabaseSync` (`data/chennai_transit.db`)
- **Persistence**: Browser `localStorage` for offline preferences and saved trips
- **PWA**: Service Worker caching for offline resilience

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher recommended)
- npm (v9.0.0 or higher)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Deva-1706/chennai-transit.git
   cd chennai-transit
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Run automated test suite:**
   ```bash
   npx tsx tests/transit.test.ts
   ```

---

## 🏛️ Verified Data Sources

This application derives its route topography, station sequences, and fare slabs from verified statutory transport authorities:

- **Chennai Metro Rail Limited (CMRL)**: Phase I & Phase I Extension operational schedules and Phase II Detailed Project Reports.
- **Southern Railway (SR) / Indian Railways**: Chennai Division suburban working timetables (North, South, West, and West–South Link corridors).
- **Metropolitan Transport Corporation (Chennai) Limited (MTC)**: Feeder bus integration and connecting terminus routes.
- **RailYatri & eRail.in**: Corroborating timetable and intermediate distance references.

---

## 🧪 Automated Testing

The repository includes a comprehensive automated test suite in `tests/transit.test.ts` validating:
- 220 transit stations and official codes across all lines.
- Multi-route alternative generation with ranking rationales.
- Operational isolation of Phase 2 under-construction corridors.
- Verified test journeys:
  - *Tambaram → Anna Nagar Tower*
  - *Chengalpattu → Poonamallee* (Phase 2 caution alert)
  - *Moore Market Complex → Gummidipoondi* (Suburban North)
  - *Moore Market Complex → Sullurupeta* (22-station corridor)
  - *Chengalpattu → Kanchipuram* (West–South Link)
  - *Chengalpattu → Arakkonam* (13-station link)
  - *Korukkupet → Ponneri* (Suburban North segment)

---

## 👤 Author

**Devanath**  
GitHub: [@Deva-1706](https://github.com/Deva-1706)  
Project Repository: [https://github.com/Deva-1706/chennai-transit](https://github.com/Deva-1706/chennai-transit)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
