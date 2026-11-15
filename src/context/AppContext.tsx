import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEMO_SCENARIOS } from '../content/demoScenarios';
import { formatLocalTime, TRANSLATIONS, type Translations } from '../i18n/translations';
import { evaluateRiskAssessment } from '../risk/riskEngine';
import { fetchAirQuality } from '../services/airQuality';
import { fetchEonetEvents } from '../services/eonet';
import { fetchFirmsDetections, FIRMS_STORAGE_KEY, resolveFirmsApiKey } from '../services/firms';
import { fetchFloodData } from '../services/flood';
import { askEarthPulseChat, buildDeterministicOfflineBrief, generateSituationBrief } from '../services/gemini';
import { fetchPowerData } from '../services/power';
import { fetchWeatherForecast } from '../services/weather';
import type {
  AiBrief,
  ChatMessage,
  DemoScenarioId,
  GeoLocation,
  HazardId,
  Language,
  MapLayerState,
  Persona,
  RadiusKm,
  RiskAssessment,
  SavedLocation,
  SourceEnvelope,
  TelemetryBundle,
  ThemeMode,
} from '../types/telemetry';
import { safeGetItem, safeRemoveItem, safeSetItem } from '../utils/cache';

export const DEFAULT_LOCATION: GeoLocation = {
  name: 'Rawalpindi',
  admin1: 'Punjab',
  country: 'Pakistan',
  lat: 33.5651,
  lon: 73.0169,
  timezone: 'Asia/Karachi',
};

const SAVED_LOCATIONS_KEY = 'earthpulse_saved_locations_v1';
const THEME_STORAGE_KEY = 'earthpulse_theme_v1';
const LANG_STORAGE_KEY = 'earthpulse_lang_v1';

function emptyEnvelope<T>(): SourceEnvelope<T> {
  return {
    data: null,
    fetchedAt: null,
    observationDate: null,
    stale: false,
    error: null,
    fromCache: false,
  };
}

function emptyTelemetry(): TelemetryBundle {
  return {
    firms: emptyEnvelope(),
    eonet: emptyEnvelope(),
    power: emptyEnvelope(),
    weather: emptyEnvelope(),
    air: emptyEnvelope(),
    flood: emptyEnvelope(),
  };
}

export type MobileTab = 'status' | 'map' | 'brief' | 'ask';
export type RightTab = 'brief' | 'ask' | 'actions';

interface LoadingModulesState {
  wildfire: boolean;
  flood: boolean;
  soil: boolean;
  air: boolean;
}

interface AppContextValue {
  location: GeoLocation;
  radiusKm: RadiusKm;
  persona: Persona;
  language: Language;
  t: Translations;
  theme: ThemeMode;
  savedLocations: SavedLocation[];
  telemetry: TelemetryBundle;
  assessment: RiskAssessment;
  loadingModules: LoadingModulesState;
  activeScenarioId: DemoScenarioId;
  mapLayers: MapLayerState;
  selectedDateOffset: number; // -6 .. 0 (default -1 = Yesterday UTC)
  imageryDateIso: string;
  firmsApiKey: string;
  brief: AiBrief;
  briefLoading: boolean;
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  methodsOpen: boolean;
  mobileTab: MobileTab;
  rightTab: RightTab;
  isOnline: boolean;
  lastUpdatedAt: number | null;
  localTimeStr: string;
  toast: string | null;
  setLocation: (loc: GeoLocation) => void;
  setRadiusKm: (r: RadiusKm) => void;
  setPersona: (p: Persona) => void;
  setLanguage: (l: Language) => void;
  toggleTheme: () => void;
  toggleSaveLocation: (loc: GeoLocation) => void;
  removeSavedLocation: (id: string) => void;
  selectDemoScenario: (id: DemoScenarioId) => void;
  toggleMapLayer: (layer: keyof MapLayerState) => void;
  setSelectedDateOffset: (offset: number) => void;
  saveFirmsApiKey: (key: string) => void;
  retryModule: (hazard: HazardId) => void;
  refreshBrief: () => void;
  sendChatQuestion: (q: string) => Promise<void>;
  setMethodsOpen: (open: boolean) => void;
  setMobileTab: (tab: MobileTab) => void;
  setRightTab: (tab: RightTab) => void;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function computeImageryDateIso(offsetDays: number): string {
  const now = new Date();
  const target = new Date(now.getTime() + offsetDays * 86400000);
  return target.toISOString().slice(0, 10);
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocationState] = useState<GeoLocation>(DEFAULT_LOCATION);
  const [radiusKm, setRadiusKmState] = useState<RadiusKm>(50);
  const [persona, setPersonaState] = useState<Persona>('farmer');
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = safeGetItem(LANG_STORAGE_KEY);
    return saved === 'ur' ? 'ur' : 'en';
  });
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = safeGetItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'dark';
  });

  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>(() => {
    const raw = safeGetItem(SAVED_LOCATIONS_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [telemetry, setTelemetry] = useState<TelemetryBundle>(emptyTelemetry);
  const [loadingModules, setLoadingModules] = useState<LoadingModulesState>({
    wildfire: true,
    flood: true,
    soil: true,
    air: true,
  });

  const [activeScenarioId, setActiveScenarioId] = useState<DemoScenarioId>('live');
  const [mapLayers, setMapLayers] = useState<MapLayerState>({
    trueColor: true,
    thermalFires: true,
    imergRain: false,
    eonetEvents: true,
    radiusRing: true,
    streetBase: false,
    referenceLabels: true,
  });

  // Default to Yesterday (UTC) so incomplete today swath never shows grey tiles
  const [selectedDateOffset, setSelectedDateOffset] = useState<number>(-1);
  const [firmsApiKey, setFirmsApiKey] = useState<string>(() => resolveFirmsApiKey());
  const [methodsOpen, setMethodsOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('status');
  const [rightTab, setRightTab] = useState<RightTab>('brief');
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [toast, setToast] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const requestSeqRef = useRef(0);
  const briefSeqRef = useRef(0);

  // Sync HTML dir, lang, and .dark class
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [language, theme]);

  // Listen to online/offline status
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(t);
  }, [toast]);

  // Fetch all 6 data feeds sequentially/independently via Promise.allSettled so modules snap in as each settles
  const loadLiveTelemetry = useCallback(
    (loc: GeoLocation, rKm: RadiusKm, forceRefresh = false) => {
      const seq = ++requestSeqRef.current;
      setLoadingModules({ wildfire: true, flood: true, soil: true, air: true });

      const isCurrent = () => requestSeqRef.current === seq;

      // Track individual sub-promises for coordinated module completion
      const firmsPromise = fetchFirmsDetections(loc.lat, loc.lon, rKm, forceRefresh).then((res) => {
        if (isCurrent()) {
          setTelemetry((prev) => ({ ...prev, firms: res }));
        }
        return res;
      });

      const eonetPromise = fetchEonetEvents(loc.lat, loc.lon, forceRefresh).then((res) => {
        if (isCurrent()) {
          setTelemetry((prev) => ({ ...prev, eonet: res }));
        }
        return res;
      });

      const powerPromise = fetchPowerData(loc.lat, loc.lon, forceRefresh).then((res) => {
        if (isCurrent()) {
          setTelemetry((prev) => ({ ...prev, power: res }));
          setLoadingModules((prev) => ({ ...prev, soil: false }));
        }
        return res;
      });

      const weatherPromise = fetchWeatherForecast(loc.lat, loc.lon, forceRefresh).then((res) => {
        if (isCurrent()) {
          setTelemetry((prev) => ({ ...prev, weather: res }));
          if (res.data?.timezone) {
            setLocationState((curr) =>
              curr.lat === loc.lat && curr.lon === loc.lon && curr.timezone === 'UTC'
                ? { ...curr, timezone: res.data!.timezone }
                : curr
            );
          }
        }
        return res;
      });

      const airPromise = fetchAirQuality(loc.lat, loc.lon, forceRefresh).then((res) => {
        if (isCurrent()) {
          setTelemetry((prev) => ({ ...prev, air: res }));
          setLoadingModules((prev) => ({ ...prev, air: false }));
        }
        return res;
      });

      const floodPromise = fetchFloodData(loc.lat, loc.lon, forceRefresh).then((res) => {
        if (isCurrent()) {
          setTelemetry((prev) => ({ ...prev, flood: res }));
        }
        return res;
      });

      Promise.allSettled([firmsPromise, eonetPromise]).then(() => {
        if (isCurrent()) {
          setLoadingModules((prev) => ({ ...prev, wildfire: false }));
        }
      });

      Promise.allSettled([floodPromise, weatherPromise, eonetPromise]).then(() => {
        if (isCurrent()) {
          setLoadingModules((prev) => ({ ...prev, flood: false }));
        }
      });

      Promise.allSettled([powerPromise]).then(() => {
        if (isCurrent()) {
          setLoadingModules((prev) => ({ ...prev, soil: false }));
        }
      });

      Promise.allSettled([airPromise]).then(() => {
        if (isCurrent()) {
          setLoadingModules((prev) => ({ ...prev, air: false }));
        }
      });
    },
    []
  );

  useEffect(() => {
    if (activeScenarioId === 'live') {
      loadLiveTelemetry(location, radiusKm);
    }
  }, [activeScenarioId, location.lat, location.lon, radiusKm, loadLiveTelemetry]);

  const assessment = useMemo(
    () => evaluateRiskAssessment(telemetry, persona, radiusKm, location),
    [telemetry, persona, radiusKm, location]
  );

  const lastUpdatedAt = useMemo(() => {
    const times = [
      telemetry.firms.fetchedAt,
      telemetry.eonet.fetchedAt,
      telemetry.power.fetchedAt,
      telemetry.weather.fetchedAt,
      telemetry.air.fetchedAt,
      telemetry.flood.fetchedAt,
    ].filter((n): n is number => typeof n === 'number' && n > 0);
    return times.length > 0 ? Math.max(...times) : null;
  }, [telemetry]);

  const localTimeStr = useMemo(
    () => formatLocalTime(lastUpdatedAt || Date.now(), location.timezone, language),
    [lastUpdatedAt, location.timezone, language]
  );

  // Brief state & automatic synthesis when all modules finish loading
  const [brief, setBrief] = useState<AiBrief>(() =>
    buildDeterministicOfflineBrief({
      location: DEFAULT_LOCATION,
      localTimeStr: formatLocalTime(Date.now(), DEFAULT_LOCATION.timezone, 'en'),
      persona: 'farmer',
      language: 'en',
      assessment: evaluateRiskAssessment(emptyTelemetry(), 'farmer', 50, DEFAULT_LOCATION),
    })
  );
  const [briefLoading, setBriefLoading] = useState(false);

  const allModulesSettled =
    !loadingModules.wildfire &&
    !loadingModules.flood &&
    !loadingModules.soil &&
    !loadingModules.air;

  const runBriefGeneration = useCallback(async () => {
    const bSeq = ++briefSeqRef.current;
    // Immediately populate deterministic brief so there's zero empty screen
    const instant = buildDeterministicOfflineBrief({
      location,
      localTimeStr,
      persona,
      language,
      assessment,
    });
    setBrief(instant);
    setBriefLoading(true);

    const generated = await generateSituationBrief({
      location,
      radiusKm,
      localTimeStr,
      persona,
      language,
      assessment,
      telemetry,
    });

    if (briefSeqRef.current === bSeq) {
      setBrief(generated);
      setBriefLoading(false);
    }
  }, [location, radiusKm, localTimeStr, persona, language, assessment, telemetry]);

  useEffect(() => {
    if (allModulesSettled) {
      void runBriefGeneration();
    }
  }, [allModulesSettled, location.lat, location.lon, radiusKm, persona, language, activeScenarioId]);

  const setLocation = useCallback((loc: GeoLocation) => {
    setActiveScenarioId('live');
    setLocationState(loc);
    setChatMessages([]);
  }, []);

  const setRadiusKm = useCallback((r: RadiusKm) => {
    setRadiusKmState(r);
  }, []);

  const setPersona = useCallback((p: Persona) => {
    setPersonaState(p);
  }, []);

  const setLanguage = useCallback((l: Language) => {
    setLanguageState(l);
    safeSetItem(LANG_STORAGE_KEY, l);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      safeSetItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const toggleSaveLocation = useCallback((loc: GeoLocation) => {
    setSavedLocations((prev) => {
      const existing = prev.find(
        (s) => Math.abs(s.lat - loc.lat) < 0.01 && Math.abs(s.lon - loc.lon) < 0.01
      );
      let next: SavedLocation[];
      if (existing) {
        next = prev.filter((s) => s.id !== existing.id);
      } else {
        const entry: SavedLocation = {
          ...loc,
          id: `${loc.lat.toFixed(3)},${loc.lon.toFixed(3)}`,
          savedAt: Date.now(),
        };
        next = [entry, ...prev].slice(0, 5);
      }
      safeSetItem(SAVED_LOCATIONS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeSavedLocation = useCallback((id: string) => {
    setSavedLocations((prev) => {
      const next = prev.filter((s) => s.id !== id);
      safeSetItem(SAVED_LOCATIONS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const selectDemoScenario = useCallback(
    (id: DemoScenarioId) => {
      if (id === 'live') {
        setActiveScenarioId('live');
        setLocationState(DEFAULT_LOCATION);
        setRadiusKmState(50);
        setChatMessages([]);
        loadLiveTelemetry(DEFAULT_LOCATION, 50, true);
        return;
      }

      const found = DEMO_SCENARIOS.find((s) => s.id === id);
      if (!found) return;
      requestSeqRef.current++;
      setActiveScenarioId(found.id);
      setLocationState(found.location);
      setRadiusKmState(found.radiusKm);
      setTelemetry(found.telemetry);
      setLoadingModules({ wildfire: false, flood: false, soil: false, air: false });
      setChatMessages([]);
    },
    [loadLiveTelemetry]
  );

  const toggleMapLayer = useCallback((layer: keyof MapLayerState) => {
    setMapLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const saveFirmsApiKey = useCallback(
    (key: string) => {
      const trimmed = key.trim();
      if (trimmed) {
        safeSetItem(FIRMS_STORAGE_KEY, trimmed);
      } else {
        safeRemoveItem(FIRMS_STORAGE_KEY);
      }
      setFirmsApiKey(resolveFirmsApiKey());
      if (activeScenarioId === 'live') {
        loadLiveTelemetry(location, radiusKm, true);
      }
    },
    [activeScenarioId, location, radiusKm, loadLiveTelemetry]
  );

  const retryModule = useCallback(
    (hazard: HazardId) => {
      if (activeScenarioId !== 'live') return;
      setLoadingModules((prev) => ({ ...prev, [hazard]: true }));

      if (hazard === 'wildfire') {
        Promise.allSettled([
          fetchFirmsDetections(location.lat, location.lon, radiusKm, true).then((res) =>
            setTelemetry((prev) => ({ ...prev, firms: res }))
          ),
          fetchEonetEvents(location.lat, location.lon, true).then((res) =>
            setTelemetry((prev) => ({ ...prev, eonet: res }))
          ),
        ]).then(() => setLoadingModules((prev) => ({ ...prev, wildfire: false })));
      } else if (hazard === 'flood') {
        Promise.allSettled([
          fetchFloodData(location.lat, location.lon, true).then((res) =>
            setTelemetry((prev) => ({ ...prev, flood: res }))
          ),
          fetchWeatherForecast(location.lat, location.lon, true).then((res) =>
            setTelemetry((prev) => ({ ...prev, weather: res }))
          ),
        ]).then(() => setLoadingModules((prev) => ({ ...prev, flood: false })));
      } else if (hazard === 'soil') {
        fetchPowerData(location.lat, location.lon, true)
          .then((res) => setTelemetry((prev) => ({ ...prev, power: res })))
          .finally(() => setLoadingModules((prev) => ({ ...prev, soil: false })));
      } else if (hazard === 'air') {
        fetchAirQuality(location.lat, location.lon, true)
          .then((res) => setTelemetry((prev) => ({ ...prev, air: res })))
          .finally(() => setLoadingModules((prev) => ({ ...prev, air: false })));
      }
    },
    [activeScenarioId, location, radiusKm]
  );

  const sendChatQuestion = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, userMsg]);
      setChatLoading(true);

      const res = await askEarthPulseChat({
        question: trimmed,
        location,
        radiusKm,
        localTimeStr,
        persona,
        language,
        assessment,
        telemetry,
      });

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        timestamp: Date.now(),
        mode: res.mode,
      };
      setChatMessages((prev) => [...prev, assistantMsg]);
      setChatLoading(false);
    },
    [location, radiusKm, localTimeStr, persona, language, assessment, telemetry]
  );

  const imageryDateIso = useMemo(
    () => computeImageryDateIso(selectedDateOffset),
    [selectedDateOffset]
  );

  const value: AppContextValue = {
    location,
    radiusKm,
    persona,
    language,
    t: TRANSLATIONS[language],
    theme,
    savedLocations,
    telemetry,
    assessment,
    loadingModules,
    activeScenarioId,
    mapLayers,
    selectedDateOffset,
    imageryDateIso,
    firmsApiKey,
    brief,
    briefLoading,
    chatMessages,
    chatLoading,
    methodsOpen,
    mobileTab,
    rightTab,
    isOnline,
    lastUpdatedAt,
    localTimeStr,
    toast,
    setLocation,
    setRadiusKm,
    setPersona,
    setLanguage,
    toggleTheme,
    toggleSaveLocation,
    removeSavedLocation,
    selectDemoScenario,
    toggleMapLayer,
    setSelectedDateOffset,
    saveFirmsApiKey,
    retryModule,
    refreshBrief: () => void runBriefGeneration(),
    sendChatQuestion,
    setMethodsOpen,
    setMobileTab,
    setRightTab,
    showToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
