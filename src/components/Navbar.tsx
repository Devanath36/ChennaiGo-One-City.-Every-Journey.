import React, { useState } from 'react';
import {
  Train,
  Navigation,
  Layers,
  MapPin,
  Map as MapIcon,
  Settings,
  Languages,
  Menu,
  X,
  Compass,
  ArrowRight,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

export type AppTab = 'home' | 'metro' | 'stations' | 'planner' | 'map' | 'suburban' | 'mrts' | 'settings';

interface NavbarProps {
  activeTab: AppTab;
  activeCorridor?: string;
  onTabChange: (tab: AppTab, corridor?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, activeCorridor = 'suburban_west', onTabChange }) => {
  const { lang, setLang, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [suburbanDropdownOpen, setSuburbanDropdownOpen] = useState(false);

  const navItems: { id: AppTab; label: string; icon: React.ReactNode; isSuburban?: boolean }[] = [
    { id: 'home', label: t('navHome'), icon: <Compass className="w-4 h-4" /> },
    { id: 'metro', label: t('navMetro'), icon: <Layers className="w-4 h-4" /> },
    { id: 'stations', label: t('navStations'), icon: <MapPin className="w-4 h-4" /> },
    { id: 'planner', label: t('navPlanner'), icon: <Navigation className="w-4 h-4" /> },
    { id: 'map', label: t('navMap'), icon: <MapIcon className="w-4 h-4 text-cyan-400" /> },
    { id: 'suburban', label: t('navSuburban'), icon: <Train className="w-4 h-4" />, isSuburban: true },
    { id: 'mrts', label: t('navMRTS'), icon: <Train className="w-4 h-4 text-orange-400" /> },
    { id: 'settings', label: t('navSettings'), icon: <Settings className="w-4 h-4" /> }
  ];

  const handleSelectTab = (tab: AppTab, corridor?: string) => {
    onTabChange(tab, corridor);
    setMobileMenuOpen(false);
    setSuburbanDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand Logo */}
          <button
            onClick={() => handleSelectTab('home')}
            className="flex items-center gap-2.5 sm:gap-3 text-left group cursor-pointer focus:outline-none min-w-0 flex-shrink"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <Train className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white group-hover:text-cyan-400 transition-colors truncate max-w-[130px] min-[360px]:max-w-[170px] sm:max-w-none">
                  {lang === 'ta' ? (
                    'சென்னை கோ'
                  ) : (
                    <>
                      <span>Chennai</span>
                      <span className="text-cyan-400">Go</span>
                    </>
                  )}
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono flex-shrink-0">
                  Smart Guide
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate">
                {t('appSubtitle')}
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;

              if (item.isSuburban) {
                return (
                  <div
                    key={item.id}
                    className="relative"
                    onMouseEnter={() => setSuburbanDropdownOpen(true)}
                    onMouseLeave={() => setSuburbanDropdownOpen(false)}
                  >
                    <button
                      onClick={() => handleSelectTab('suburban', activeCorridor)}
                      className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 min-h-[40px] ${
                        isActive
                          ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                      }`}
                      aria-expanded={suburbanDropdownOpen}
                      aria-haspopup="true"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                          suburbanDropdownOpen ? 'rotate-180 text-cyan-400' : ''
                        }`}
                      />
                    </button>

                    {/* Suburban Corridors Dropdown Menu */}
                    {suburbanDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150 space-y-1">
                        <button
                          onClick={() => handleSelectTab('suburban', 'suburban_west')}
                          className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-left flex items-center justify-between transition-colors cursor-pointer ${
                            isActive && activeCorridor === 'suburban_west'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                              : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div>
                            <span className="block font-bold">Suburban West Line</span>
                            <span className="text-[10px] text-slate-400">Chennai Central MMC ➔ Arakkonam</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-emerald-400">
                            31 Stns
                          </span>
                        </button>

                        <button
                          onClick={() => handleSelectTab('suburban', 'suburban_north')}
                          className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-left flex items-center justify-between transition-colors cursor-pointer ${
                            isActive && activeCorridor === 'suburban_north'
                              ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60'
                              : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div>
                            <span className="block font-bold">Suburban North Line</span>
                            <span className="text-[10px] text-slate-400">Moore Market MASS ➔ Sullurupeta</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-400">
                            22 Stns
                          </span>
                        </button>

                        <button
                          onClick={() => handleSelectTab('suburban', 'suburban_south')}
                          className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-left flex items-center justify-between transition-colors cursor-pointer ${
                            isActive && activeCorridor === 'suburban_south'
                              ? 'bg-orange-950/60 text-orange-300 border border-orange-800/60'
                              : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div>
                            <span className="block font-bold">Suburban South Line</span>
                            <span className="text-[10px] text-slate-400">Chennai Beach ➔ Chengalpattu</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-orange-400">
                            28 Stns
                          </span>
                        </button>

                        <button
                          onClick={() => handleSelectTab('suburban', 'suburban_west_south')}
                          className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-left flex items-center justify-between transition-colors cursor-pointer ${
                            isActive && activeCorridor === 'suburban_west_south'
                              ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                              : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div>
                            <span className="block font-bold">West–South Link Line</span>
                            <span className="text-[10px] text-slate-400">Chengalpattu ➔ Arakkonam (via Kanchi)</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-rose-400">
                            13 Stns
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Header: Language Switcher & Mobile Menu Trigger */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Direct Language Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs font-semibold">
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1.5 sm:px-3 rounded-lg transition-colors cursor-pointer min-h-[34px] flex items-center justify-center font-bold ${
                  lang === 'en'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                onClick={() => setLang('ta')}
                className={`px-2 py-1.5 sm:px-2.5 rounded-lg transition-colors cursor-pointer min-h-[34px] flex items-center justify-center font-bold ${
                  lang === 'ta'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="தமிழில் மாற்றவும்"
              >
                தமிழ்
              </button>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 py-4 space-y-1.5 animate-in slide-in-from-top-2 duration-150">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            if (item.isSuburban) {
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => handleSelectTab('suburban', activeCorridor)}
                    className={`w-full px-3.5 py-3 rounded-xl text-sm font-semibold flex items-center justify-between transition-colors min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </button>

                  {/* Sub-items for Suburban in Mobile */}
                  <div className="pl-4 space-y-1 border-l-2 border-slate-800 ml-3 my-1">
                    <button
                      onClick={() => handleSelectTab('suburban', 'suburban_west')}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between min-h-[44px] cursor-pointer transition-colors ${
                        isActive && activeCorridor === 'suburban_west'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <span>Suburban West (MMC–Arakkonam)</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">31 Stns</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </button>
                    <button
                      onClick={() => handleSelectTab('suburban', 'suburban_north')}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between min-h-[44px] cursor-pointer transition-colors ${
                        isActive && activeCorridor === 'suburban_north'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <span>Suburban North (MASS–Sullurupeta)</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">22 Stns</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </button>
                    <button
                      onClick={() => handleSelectTab('suburban', 'suburban_south')}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between min-h-[44px] cursor-pointer transition-colors ${
                        isActive && activeCorridor === 'suburban_south'
                          ? 'bg-orange-950 text-orange-300 border border-orange-800'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <span>Suburban South (Beach–Chengalpattu)</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-orange-400">28 Stns</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </button>
                    <button
                      onClick={() => handleSelectTab('suburban', 'suburban_west_south')}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between min-h-[44px] cursor-pointer transition-colors ${
                        isActive && activeCorridor === 'suburban_west_south'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <span>West–South Link (CGL–Kanchi–AJJ)</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-rose-400">13 Stns</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full px-3.5 py-3 rounded-xl text-sm font-semibold flex items-center justify-between transition-colors min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isActive && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
