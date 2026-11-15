import React, { useEffect, useRef, useState } from 'react';
import {
  Bookmark,
  ChevronDown,
  Compass,
  FlaskConical,
  Info,
  Loader2,
  MapPin,
  Moon,
  Navigation,
  Satellite,
  Search,
  SlidersHorizontal,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { DEMO_SCENARIOS } from '../content/demoScenarios';
import { useApp } from '../context/AppContext';
import { searchPlaces } from '../services/geocoding';
import type { GeoLocation, Persona, RadiusKm } from '../types/telemetry';

const RADII: RadiusKm[] = [25, 50, 100];
const PERSONAS: Persona[] = ['farmer', 'hiker', 'responder', 'planner'];

export const TopBar: React.FC = () => {
  const {
    location,
    radiusKm,
    persona,
    language,
    t,
    theme,
    savedLocations,
    activeScenarioId,
    setLocation,
    setRadiusKm,
    setPersona,
    setLanguage,
    toggleTheme,
    toggleSaveLocation,
    removeSavedLocation,
    selectDemoScenario,
    setMethodsOpen,
    showToast,
  } = useApp();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [savedOpen, setSavedOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const savedWrapRef = useRef<HTMLDivElement>(null);
  const demoWrapRef = useRef<HTMLDivElement>(null);

  const isCurrentSaved = savedLocations.some(
    (s) => Math.abs(s.lat - location.lat) < 0.01 && Math.abs(s.lon - location.lon) < 0.01
  );

  // Cmd+K / '/' shortcut to focus search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Outside click closes popovers
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchWrapRef.current && !searchWrapRef.current.contains(target)) {
        setSearchOpen(false);
      }
      if (savedWrapRef.current && !savedWrapRef.current.contains(target)) {
        setSavedOpen(false);
      }
      if (demoWrapRef.current && !demoWrapRef.current.contains(target)) {
        setDemoOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Debounced geocoding search (300ms)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchPlaces(trimmed);
        setResults(res);
        setActiveIndex(res.length > 0 ? 0 : -1);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectPlace = (loc: GeoLocation) => {
    setLocation(loc);
    setQuery('');
    setResults([]);
    setSearchOpen(false);
  };

  const handleUseGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showToast(
        language === 'ur'
          ? 'اس براؤزر میں GPS دستیاب نہیں ہے۔'
          : 'Geolocation is not supported in this browser.'
      );
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        setLocation({
          name: language === 'ur' ? 'میرا موجودہ مقام' : 'My GPS Location',
          lat,
          lon,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        });
      },
      (err) => {
        setGpsLoading(false);
        showToast(
          err.code === 1
            ? language === 'ur'
              ? 'مقام تک رسائی کی اجازت مسترد کر دی گئی۔'
              : 'Location permission denied. Search or click the map instead.'
            : language === 'ur'
            ? 'GPS مقام حاصل نہیں ہو سکا۔'
            : 'Unable to determine GPS position.'
        );
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchOpen || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      e.preventDefault();
      handleSelectPlace(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setSearchOpen(false);
    }
  };

  return (
    <>
      <header className="no-print relative z-30 flex h-[56px] shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-3 lg:px-4">
        {/* Left: Brand Wordmark + Space Apps micro-badge */}
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-[var(--primary)] text-white">
            <Satellite className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="whitespace-nowrap text-[16px] font-bold tracking-tight text-[var(--text)]">
              {t.appName}
            </span>
            <span className="hidden whitespace-nowrap rounded-[4px] border border-[var(--line)] bg-[var(--raised)] px-1.5 py-0.5 font-mono-tabular text-[11px] font-medium text-[var(--muted)] sm:inline-block">
              {t.spaceAppsBadge}
            </span>
          </div>
        </div>

        {/* Center: Global Place Search + GPS + Saved Locations */}
        <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 lg:max-w-lg">
          <div ref={searchWrapRef} className="relative min-w-0 flex-1">
            <div className="relative flex items-center">
              <Search
                className="pointer-events-none absolute start-2.5 h-3.5 w-3.5 text-[var(--muted)]"
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchPlaceholder}
                className="h-9 w-full rounded-[4px] border border-[var(--line)] bg-[var(--bg)] pe-8 ps-8 text-[13px] text-[var(--text)] placeholder:text-[var(--muted)] transition-colors duration-150 focus:border-[var(--interactive)] focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                  }}
                  aria-label="Clear search"
                  className="absolute end-2 text-[var(--muted)] hover:text-[var(--text)]"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            {searchOpen && query.trim().length >= 2 && (
              <div className="absolute start-0 end-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-[6px] border border-[var(--line)] bg-[var(--surface)] shadow-xl">
                {searching ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-[var(--muted)]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    <span>{t.searching}</span>
                  </div>
                ) : results.length === 0 ? (
                  <div className="px-3 py-2.5 text-[13px] text-[var(--muted)]">
                    {t.noSearchResults}
                  </div>
                ) : (
                  <ul role="listbox" className="divide-y divide-[var(--line)]">
                    {results.map((item, idx) => (
                      <li key={`${item.lat}-${item.lon}-${idx}`}>
                        <button
                          type="button"
                          onClick={() => handleSelectPlace(item)}
                          className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-start text-[13px] transition-colors duration-150 ${
                            idx === activeIndex
                              ? 'bg-[var(--raised)] text-[var(--text)]'
                              : 'text-[var(--text)] hover:bg-[var(--raised)]'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="truncate font-medium">{item.name}</div>
                            <div className="truncate text-[12px] text-[var(--muted)]">
                              {[item.admin1, item.country].filter(Boolean).join(', ')}
                            </div>
                          </div>
                          <span
                            dir="ltr"
                            className="shrink-0 font-mono-tabular text-[11px] text-[var(--muted)]"
                          >
                            {item.lat.toFixed(2)}, {item.lon.toFixed(2)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleUseGps}
            disabled={gpsLoading}
            title={t.useMyGps}
            aria-label={t.useMyGps}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[4px] border border-[var(--line)] bg-[var(--bg)] px-2.5 text-[12px] font-medium text-[var(--text)] transition-colors duration-150 hover:border-[var(--interactive)] hover:bg-[var(--raised)] disabled:opacity-60"
          >
            {gpsLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--interactive)]" aria-hidden="true" />
            ) : (
              <Navigation className="h-3.5 w-3.5 text-[var(--interactive)]" aria-hidden="true" />
            )}
            <span className="hidden xl:inline">{t.useMyGps}</span>
          </button>

          {/* Saved Locations Popover */}
          <div ref={savedWrapRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setSavedOpen((o) => !o)}
              title={t.savedLocations}
              aria-label={t.savedLocations}
              className="inline-flex h-9 items-center gap-1.5 rounded-[4px] border border-[var(--line)] bg-[var(--bg)] px-2.5 text-[12px] font-medium text-[var(--text)] transition-colors duration-150 hover:border-[var(--interactive)] hover:bg-[var(--raised)]"
            >
              <Bookmark
                className={`h-3.5 w-3.5 ${
                  isCurrentSaved ? 'fill-[var(--interactive)] text-[var(--interactive)]' : 'text-[var(--muted)]'
                }`}
                aria-hidden="true"
              />
              <span className="hidden xl:inline">{t.savedLocations}</span>
              <span className="font-mono-tabular text-[11px] text-[var(--muted)]">
                {savedLocations.length}
              </span>
            </button>

            {savedOpen && (
              <div className="absolute end-0 top-[calc(100%+6px)] z-50 w-72 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-2 shadow-xl">
                <div className="mb-2 flex items-center justify-between border-b border-[var(--line)] pb-2">
                  <span className="truncate text-[12px] font-semibold text-[var(--text)]">
                    {location.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleSaveLocation(location)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-[4px] bg-[var(--primary)] px-2 py-1 text-[11px] font-medium text-white hover:opacity-90"
                  >
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    <span>{isCurrentSaved ? t.removeLocation : t.saveLocation}</span>
                  </button>
                </div>

                {savedLocations.length === 0 ? (
                  <p className="px-1 py-2 text-[12px] text-[var(--muted)]">{t.noSavedLocations}</p>
                ) : (
                  <ul className="space-y-1">
                    {savedLocations.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded-[4px] px-2 py-1.5 hover:bg-[var(--raised)]"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setLocation(item);
                            setSavedOpen(false);
                          }}
                          className="min-w-0 flex-1 text-start"
                        >
                          <div className="truncate text-[13px] font-medium text-[var(--text)]">
                            {item.name}
                          </div>
                          <div
                            dir="ltr"
                            className="font-mono-tabular text-[11px] text-[var(--muted)]"
                          >
                            {item.lat.toFixed(2)}, {item.lon.toFixed(2)}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSavedLocation(item.id)}
                          aria-label={`Remove ${item.name}`}
                          className="p-1 text-[var(--muted)] hover:text-[var(--accent-red)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Desktop Controls */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          {/* Radius segmented control */}
          <div
            role="group"
            aria-label={t.radiusLabel}
            className="flex items-center rounded-[4px] border border-[var(--line)] bg-[var(--bg)] p-0.5"
          >
            {RADII.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRadiusKm(r)}
                className={`whitespace-nowrap rounded-[3px] px-2 py-1 font-mono-tabular text-[12px] font-medium transition-colors duration-150 ${
                  radiusKm === r
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>

          {/* Persona selector */}
          <div className="relative flex items-center">
            <Compass
              className="pointer-events-none absolute start-2.5 h-3.5 w-3.5 text-[var(--interactive)]"
              aria-hidden="true"
            />
            <select
              aria-label={t.personaLabel}
              value={persona}
              onChange={(e) => setPersona(e.target.value as Persona)}
              className="h-8 appearance-none rounded-[4px] border border-[var(--line)] bg-[var(--bg)] pe-7 ps-8 text-[12px] font-medium text-[var(--text)] transition-colors duration-150 hover:border-[var(--interactive)]"
            >
              {PERSONAS.map((p) => (
                <option key={p} value={p}>
                  {t.personas[p]}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute end-2 h-3.5 w-3.5 text-[var(--muted)]"
              aria-hidden="true"
            />
          </div>

          {/* Language EN | اردو */}
          <div
            role="group"
            aria-label="Language"
            className="flex items-center rounded-[4px] border border-[var(--line)] bg-[var(--bg)] p-0.5"
          >
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`rounded-[3px] px-2 py-1 text-[12px] font-medium transition-colors duration-150 ${
                language === 'en'
                  ? 'bg-[var(--raised)] text-[var(--text)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('ur')}
              className={`rounded-[3px] px-2 py-1 text-[12px] font-medium transition-colors duration-150 ${
                language === 'ur'
                  ? 'bg-[var(--raised)] text-[var(--text)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              اردو
            </button>
          </div>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] border border-[var(--line)] bg-[var(--bg)] text-[var(--text)] transition-colors duration-150 hover:border-[var(--interactive)] hover:bg-[var(--raised)]"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-[var(--status-watch)]" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
            )}
          </button>

          {/* Demo Scenarios menu */}
          <div ref={demoWrapRef} className="relative">
            <button
              type="button"
              onClick={() => setDemoOpen((o) => !o)}
              className={`inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-[4px] border px-2.5 text-[12px] font-medium transition-colors duration-150 ${
                activeScenarioId !== 'live'
                  ? 'border-[var(--status-warning)] bg-[var(--status-warning)]/15 text-[var(--status-warning)]'
                  : 'border-[var(--line)] bg-[var(--bg)] text-[var(--text)] hover:border-[var(--interactive)]'
              }`}
            >
              <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{t.demoScenarios}</span>
            </button>

            {demoOpen && (
              <div className="absolute end-0 top-[calc(100%+6px)] z-50 w-80 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    selectDemoScenario('live');
                    setDemoOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-[4px] px-2.5 py-2 text-start text-[12px] font-medium transition-colors duration-150 ${
                    activeScenarioId === 'live'
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--text)] hover:bg-[var(--raised)]'
                  }`}
                >
                  <span>{t.liveTelemetry}</span>
                  <span className="font-mono-tabular text-[11px] opacity-80">LIVE API</span>
                </button>
                <div className="my-1 border-t border-[var(--line)]" />
                {DEMO_SCENARIOS.map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      selectDemoScenario(sc.id);
                      setDemoOpen(false);
                    }}
                    className={`w-full rounded-[4px] px-2.5 py-2 text-start transition-colors duration-150 ${
                      activeScenarioId === sc.id
                        ? 'bg-[var(--raised)] text-[var(--interactive)]'
                        : 'text-[var(--text)] hover:bg-[var(--raised)]'
                    }`}
                  >
                    <div className="text-[13px] font-semibold">
                      {language === 'ur' ? sc.nameUr : sc.name}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                      {language === 'ur' ? sc.subtitleUr : sc.subtitle}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mission & Methods button */}
          <button
            type="button"
            onClick={() => setMethodsOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-[4px] border border-[var(--line)] bg-[var(--bg)] px-2.5 text-[12px] font-medium text-[var(--text)] transition-colors duration-150 hover:border-[var(--interactive)] hover:bg-[var(--raised)]"
          >
            <Info className="h-3.5 w-3.5 shrink-0 text-[var(--interactive)]" aria-hidden="true" />
            <span>{t.methodsBtn}</span>
          </button>
        </div>

        {/* Mobile/Tablet Controls Trigger */}
        <button
          type="button"
          onClick={() => setControlsOpen(true)}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[4px] border border-[var(--line)] bg-[var(--bg)] px-3 text-[13px] font-medium text-[var(--text)] lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4 text-[var(--interactive)]" aria-hidden="true" />
          <span className="hidden sm:inline">{t.controlsBtn}</span>
        </button>
      </header>

      {/* Mobile/Tablet Controls Drawer */}
      {controlsOpen && (
        <div className="no-print fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs lg:hidden">
          <div className="flex h-full w-full max-w-sm flex-col overflow-y-auto border-s border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h2 className="text-[16px] font-semibold text-[var(--text)]">{t.controlsBtn}</h2>
              <button
                type="button"
                onClick={() => setControlsOpen(false)}
                aria-label={t.closeBtn}
                className="inline-flex h-10 w-10 items-center justify-center rounded-[4px] border border-[var(--line)] bg-[var(--raised)] text-[var(--text)]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Radius */}
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-[var(--muted)]">
                  {t.radiusLabel}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {RADII.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRadiusKm(r)}
                      className={`h-11 rounded-[4px] border font-mono-tabular text-[13px] font-medium ${
                        radiusKm === r
                          ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                          : 'border-[var(--line)] bg-[var(--bg)] text-[var(--text)]'
                      }`}
                    >
                      {r} km
                    </button>
                  ))}
                </div>
              </div>

              {/* Persona */}
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-[var(--muted)]">
                  {t.personaLabel}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PERSONAS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPersona(p)}
                      className={`h-11 rounded-[4px] border px-3 text-[13px] font-medium ${
                        persona === p
                          ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                          : 'border-[var(--line)] bg-[var(--bg)] text-[var(--text)]'
                      }`}
                    >
                      {t.personas[p]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language & Theme */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
                  className="flex h-11 items-center justify-center rounded-[4px] border border-[var(--line)] bg-[var(--bg)] text-[13px] font-medium text-[var(--text)]"
                >
                  {language === 'en' ? 'اردو (RTL)' : 'English (LTR)'}
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex h-11 items-center justify-center gap-2 rounded-[4px] border border-[var(--line)] bg-[var(--bg)] text-[13px] font-medium text-[var(--text)]"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4 text-[var(--status-watch)]" aria-hidden="true" />
                  ) : (
                    <Moon className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
                  )}
                  <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>
              </div>

              {/* Demo Scenarios */}
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-[var(--muted)]">
                  {t.demoScenarios}
                </label>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      selectDemoScenario('live');
                      setControlsOpen(false);
                    }}
                    className={`flex min-h-[44px] w-full items-center justify-between rounded-[4px] border px-3 py-2 text-start text-[13px] font-medium ${
                      activeScenarioId === 'live'
                        ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                        : 'border-[var(--line)] bg-[var(--bg)] text-[var(--text)]'
                    }`}
                  >
                    <span>{t.liveTelemetry}</span>
                    <span className="font-mono-tabular text-[11px]">LIVE</span>
                  </button>
                  {DEMO_SCENARIOS.map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => {
                        selectDemoScenario(sc.id);
                        setControlsOpen(false);
                      }}
                      className={`min-h-[44px] w-full rounded-[4px] border px-3 py-2 text-start ${
                        activeScenarioId === sc.id
                          ? 'border-[var(--interactive)] bg-[var(--raised)] text-[var(--interactive)]'
                          : 'border-[var(--line)] bg-[var(--bg)] text-[var(--text)]'
                      }`}
                    >
                      <div className="text-[13px] font-semibold">
                        {language === 'ur' ? sc.nameUr : sc.name}
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">
                        {language === 'ur' ? sc.subtitleUr : sc.subtitle}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mission & Methods */}
              <button
                type="button"
                onClick={() => {
                  setControlsOpen(false);
                  setMethodsOpen(true);
                }}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-[4px] bg-[var(--primary)] text-[13px] font-semibold text-white"
              >
                <Info className="h-4 w-4" aria-hidden="true" />
                <span>{t.methodsBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
