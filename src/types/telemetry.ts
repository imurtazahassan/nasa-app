export type Persona = 'farmer' | 'hiker' | 'responder' | 'planner';

export type RadiusKm = 25 | 50 | 100;

export type Language = 'en' | 'ur';

export type ThemeMode = 'light' | 'dark';

export type HazardId = 'wildfire' | 'flood' | 'soil' | 'air';

export type SeverityStatus = 'critical' | 'warning' | 'watch' | 'nominal' | 'nodata';

export interface GeoLocation {
  name: string;
  admin1?: string;
  country?: string;
  lat: number;
  lon: number;
  timezone: string;
}

export interface SavedLocation extends GeoLocation {
  id: string;
  savedAt: number;
}

export interface FirmsDetection {
  id: string;
  lat: number;
  lon: number;
  brightTi4: number;
  acqDate: string;
  acqTime: string;
  confidence: string;
  frp: number;
  distanceKm: number;
  bearingDeg: number;
  bearingCardinal: string;
}

export interface EonetEvent {
  id: string;
  title: string;
  categoryId: 'wildfires' | 'floods' | 'severeStorms' | 'landslides' | string;
  categoryTitle: string;
  date: string;
  lat: number;
  lon: number;
  distanceKm: number;
  bearingDeg: number;
  bearingCardinal: string;
  sourceUrl?: string;
}

export interface SourceEnvelope<T> {
  data: T | null;
  fetchedAt: number | null;
  observationDate: string | null;
  stale: boolean;
  error: string | null;
  fromCache: boolean;
  sourceNote?: string;
}

export interface FirmsPayload {
  detections: FirmsDetection[];
  hasApiKey: boolean;
  fallbackMode: boolean;
}

export interface PowerDailyPoint {
  date: string;
  precipMm: number | null;
  gwetRoot: number | null;
  gwetTop: number | null;
  t2mMaxC: number | null;
}

export interface PowerPayload {
  series: PowerDailyPoint[];
  latestValidDate: string | null;
  latestGwetRoot: number | null;
  latestGwetTop: number | null;
  latestT2mMaxC: number | null;
  precip30dMm: number | null;
}

export interface WeatherDailyPoint {
  date: string;
  precipMm: number | null;
  tempMaxC: number | null;
  isForecast: boolean;
}

export interface WeatherPayload {
  timezone: string;
  series: WeatherDailyPoint[];
  trailing7dRainMm: number | null;
  next3dRainMm: number | null;
  next7dRainMm: number | null;
  maxForecastTempC: number | null;
}

export interface AirDailyPoint {
  date: string;
  maxUsAqi: number | null;
}

export interface AirQualityPayload {
  currentUsAqi: number | null;
  currentPm25: number | null;
  currentPm10: number | null;
  dailySeries: AirDailyPoint[];
  daysOver100Last30d: number | null;
  observedAt: string | null;
}

export interface FloodDailyPoint {
  date: string;
  discharge: number | null;
  dischargeMean: number | null;
  dischargeMax: number | null;
  isForecast: boolean;
}

export interface FloodPayload {
  series: FloodDailyPoint[];
  forecastMaxDischarge: number | null;
  baselineMeanDischarge: number | null;
  dischargeRatio: number | null;
}

export interface TelemetryBundle {
  firms: SourceEnvelope<FirmsPayload>;
  eonet: SourceEnvelope<EonetEvent[]>;
  power: SourceEnvelope<PowerPayload>;
  weather: SourceEnvelope<WeatherPayload>;
  air: SourceEnvelope<AirQualityPayload>;
  flood: SourceEnvelope<FloodPayload>;
}

export interface SparklinePoint {
  label: string;
  value: number;
}

export interface RuleBreakdownItem {
  label: string;
  value: string;
  threshold: string;
  triggered: boolean;
}

export interface ModuleEvaluation {
  id: HazardId;
  status: SeverityStatus;
  kpiDisplay: string;
  kpiUnit: string;
  summary: string;
  provenanceLabel: string;
  isPartnerData: boolean;
  updatedAt: number | null;
  observationDate: string | null;
  stale: boolean;
  error: string | null;
  sourceNote?: string;
  sparkline: SparklinePoint[];
  sparklineUnit: string;
  rules: RuleBreakdownItem[];
  rawInputs: { label: string; value: string }[];
}

export interface TacticalIncident {
  id: string;
  title: string;
  kind: 'thermal' | 'eonet';
  category: string;
  distanceKm: number;
  bearingCardinal: string;
  bearingDeg: number;
  intensityLabel: string;
  date: string;
  lat: number;
  lon: number;
}

export interface PersonaInsights {
  farmer14dPrecipMm: number | null;
  hikerPeakTempC: number | null;
  hikerHeatLevel: 'normal' | 'caution' | 'danger' | 'nodata';
  responderIncidents: TacticalIncident[];
  plannerThermalCount30d: number;
  plannerBadAirDays30d: number | null;
  plannerRain30dMm: number | null;
}

export interface RiskAssessment {
  overallStatus: SeverityStatus;
  topHazard: HazardId;
  orderedModuleIds: HazardId[];
  modules: Record<HazardId, ModuleEvaluation>;
  personaInsights: PersonaInsights;
  evaluatedAt: number;
}

export interface AiBrief {
  headline: string;
  summary: string;
  topActions: string[];
  dataGaps: string[];
  mode: 'gemini' | 'offline';
  generatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mode?: 'gemini' | 'offline';
}

export type DemoScenarioId =
  | 'live'
  | 'monsoon_surge'
  | 'indus_flood'
  | 'punjab_drought'
  | 'margalla_wildfire';

export interface DemoScenario {
  id: Exclude<DemoScenarioId, 'live'>;
  name: string;
  nameUr: string;
  subtitle: string;
  subtitleUr: string;
  location: GeoLocation;
  radiusKm: RadiusKm;
  telemetry: TelemetryBundle;
}

export interface MapLayerState {
  trueColor: boolean;
  thermalFires: boolean;
  imergRain: boolean;
  eonetEvents: boolean;
  radiusRing: boolean;
  streetBase: boolean;
  referenceLabels: boolean;
}
