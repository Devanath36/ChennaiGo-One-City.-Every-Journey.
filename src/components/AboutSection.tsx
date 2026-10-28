import React from 'react';
import {
  Info,
  Train,
  ShieldCheck,
  CreditCard,
  Building,
  Database,
  MapPin,
  Clock,
  Layers,
  Hammer,
  Sparkles
} from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              About ChennaiGo
            </h2>
            <p className="text-xs sm:text-sm text-cyan-400 font-medium">
              One City. Every Journey.
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          <strong>ChennaiGo</strong> is an engineering-grade public transit explorer built to provide clear, verified multi-modal navigation for Chennai’s rapid rail and suburban network. The platform features operational Phase I lines (Blue and Green Corridors), Southern Railway suburban networks (North, South, West, and the West–South Link Corridor connecting Chengalpattu to Arakkonam via Kanchipuram), the MRTS elevated railway, and verified Phase II upcoming corridors (Purple, Yellow, and Red Lines).
        </p>
      </div>

      {/* Operational Phase I Corridors */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Operational Corridors (Phase I & Phase I Extension)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-500" />
                <h4 className="text-sm font-bold text-white">Blue Line (Corridor 1)</h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                OPERATIONAL
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Alignment:</strong> Wimco Nagar Depot ➔ Chennai International Airport via High Court, Central, and Anna Salai.
            </p>
            <div className="text-xs text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-between">
              <span>Length: <strong>32.65 km</strong></span>
              <span>Stations: <strong>26</strong></span>
              <span>Speed: <strong>~35–80 km/h</strong></span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-green-500" />
                <h4 className="text-sm font-bold text-white">Green Line (Corridor 2)</h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                OPERATIONAL
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Alignment:</strong> Puratchi Thalaivar Dr. M.G. Ramachandran Central ➔ St. Thomas Mount via Koyambedu & CMBT.
            </p>
            <div className="text-xs text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-between">
              <span>Length: <strong>22.0 km</strong></span>
              <span>Stations: <strong>17</strong></span>
              <span>Rolling Stock: <strong>Alstom Metropolis</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Phase II Corridors */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Hammer className="w-5 h-5 text-amber-400" />
          <span>Upcoming Corridors (CMRL Phase II — 118.9 km)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Corridor 3 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-purple-500" />
                <h4 className="text-sm font-bold text-white">Purple Line (Corridor 3)</h4>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                UNDER CONST.
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Madhavaram Milk Colony ➔ Siruseri SIPCOT (45.8 km, 48 stations). Longest Phase II corridor featuring deep underground tunnels under Purasaiwakkam, KMC, and Adyar River, linking the OMR IT Corridor.
            </p>
            <div className="text-xs text-amber-300 font-medium pt-2 border-t border-slate-800">
              Target Opening: 2026 – 2028
            </div>
          </div>

          {/* Corridor 4 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-yellow-400" />
                <h4 className="text-sm font-bold text-white">Yellow Line (Corridor 4)</h4>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                UNDER CONST.
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Light House ➔ Poonamallee Bypass (26.1 km, 28 stations). Priority corridor connecting West Chennai, Porur, Vadapalani, Panagal Park (T. Nagar), and Marina Beach.
            </p>
            <div className="text-xs text-amber-300 font-medium pt-2 border-t border-slate-800">
              Target Opening: 2025 – 2027 (Priority Stretch)
            </div>
          </div>

          {/* Corridor 5 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500" />
                <h4 className="text-sm font-bold text-white">Red Line (Corridor 5)</h4>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                UNDER CONST.
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Madhavaram Milk Colony ➔ Sholinganallur (47.0 km, 48 stations). Crucial circumferential orbital corridor linking Retteri, Kolathur, CMBT, Alandur, and Medavakkam.
            </p>
            <div className="text-xs text-amber-300 font-medium pt-2 border-t border-slate-800">
              Target Opening: 2027 – 2028
            </div>
          </div>
        </div>
      </div>

      {/* Ticketing, Fares & Discounts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Ticketing, Fares & Smart Cards</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="font-bold text-white block mb-1">Standard Tokens</span>
            <p className="text-slate-400 leading-relaxed">
              Single journey QR paper tokens and contactless tokens available at all TVMs. Fare slabs: ₹10, ₹20, ₹30, ₹40, ₹50.
            </p>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="font-bold text-emerald-400 block mb-1">20% Smart Card Discount</span>
            <p className="text-slate-400 leading-relaxed">
              CMRL Travel Cards, Singara Chennai Card, and RuPay National Common Mobility Cards (NCMC) enjoy an automatic 20% discount on every trip.
            </p>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="font-bold text-cyan-400 block mb-1">Mobile QR Ticketing</span>
            <p className="text-slate-400 leading-relaxed">
              Available via CMRL Mobile App, WhatsApp ticketing (+91 83000 86000), and digital payment gateways for seamless gate entry.
            </p>
          </div>
        </div>
      </div>

      {/* System Integrity & Offline Resilience */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-3 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <Database className="w-4 h-4 text-cyan-400" />
          <span>Data Integrity & Offline Resilience</span>
        </div>
        <p className="leading-relaxed">
          All station coordinates, interchange graphs, and transit routes are stored persistently in SQLite (<code className="text-cyan-400 font-mono">/data/chennai_transit.db</code>).
          The routing engine evaluates paths using Dijkstra's algorithm across genuine network connections with zero fictitious lines or imaginary shortcuts.
          Train positions are clearly demarcated as schedule-based deterministic simulations in compliance with public safety policies.
          Full offline caching via <strong>Service Workers</strong> and <strong>LocalStorage</strong> ensures core map access remains functional even in underground tunnels.
        </p>
      </div>
    </div>
  );
};
