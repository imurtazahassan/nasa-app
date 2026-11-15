import type {
  GeoLocation,
  HazardId,
  ModuleEvaluation,
  Persona,
  PersonaInsights,
  RadiusKm,
  RiskAssessment,
  RuleBreakdownItem,
  SeverityStatus,
  TacticalIncident,
  TelemetryBundle,
} from '../types/telemetry';

export const SEVERITY_RANK: Record<SeverityStatus, number> = {
  critical: 4,
  warning: 3,
  watch: 2,
  nominal: 1,
  nodata: 0,
};

export const RISK_THRESHOLDS = {
  WILDFIRE_CRITICAL_KM: 5,
  WILDFIRE_WARNING_KM: 15,
  WILDFIRE_WATCH_KM: 50,
  WILDFIRE_CLUSTER_COUNT: 10,
  WILDFIRE_CLUSTER_RADIUS_KM: 25,

  FLOOD_DISCHARGE_WATCH: 1.3,
  FLOOD_DISCHARGE_WARNING: 2.0,
  FLOOD_DISCHARGE_CRITICAL: 3.0,
  FLOOD_RAIN_7D_WATCH_MM: 50,
  FLOOD_RAIN_7D_WARNING_MM: 100,
  FLOOD_RAIN_7D_CRITICAL_MM: 200,
  FLOOD_RAIN_3D_WATCH_MM: 50,
  FLOOD_RAIN_3D_WARNING_MM: 100,
  FLOOD_EONET_PROXIMITY_KM: 100,

  SOIL_SEVERE_DROUGHT: 0.15,
  SOIL_AG_STRESS: 0.25,
  SOIL_NOMINAL_MIN: 0.40,
  SOIL_WATERLOG_MAX: 0.90,

  AQI_NOMINAL_MAX: 100,
  AQI_WATCH_MAX: 150,
  AQI_WARNING_MAX: 200,

  HIKER_HEAT_CAUTION_C: 35,
  HIKER_HEAT_DANGER_C: 40,
} as const;

function maxSeverity(statuses: SeverityStatus[]): SeverityStatus {
  let best: SeverityStatus = 'nodata';
  for (const s of statuses) {
    if (SEVERITY_RANK[s] > SEVERITY_RANK[best]) {
      best = s;
    }
  }
  return best;
}

function escalateOneLevel(status: SeverityStatus): SeverityStatus {
  switch (status) {
    case 'nominal':
      return 'watch';
    case 'watch':
      return 'warning';
    case 'warning':
      return 'critical';
    case 'critical':
      return 'critical';
    default:
      return status;
  }
}

function shortDateLabel(iso: string): string {
  return iso.length >= 10 ? iso.slice(5, 10) : iso;
}

function evaluateWildfire(
  telemetry: TelemetryBundle,
  radiusKm: RadiusKm
): ModuleEvaluation {
  const firmsEnv = telemetry.firms;
  const eonetEnv = telemetry.eonet;

  const firmsDetections = firmsEnv.data?.detections || [];
  const eonetWildfires = (eonetEnv.data || []).filter(
    (ev) => ev.categoryId === 'wildfires' && ev.distanceKm <= radiusKm
  );

  // If both EONET failed and FIRMS has no usable data (e.g. offline/error), return nodata
  const hasAnySource = firmsEnv.data !== null || eonetEnv.data !== null;
  if (!hasAnySource) {
    return {
      id: 'wildfire',
      status: 'nodata',
      kpiDisplay: '--',
      kpiUnit: 'km',
      summary: 'Active fire telemetry could not be retrieved from NASA FIRMS or EONET.',
      provenanceLabel: 'NASA VIIRS 375m / EONET v3',
      isPartnerData: false,
      updatedAt: null,
      observationDate: null,
      stale: false,
      error: eonetEnv.error || firmsEnv.error || 'Source unavailable',
      sparkline: [],
      sparklineUnit: 'detections',
      rules: [],
      rawInputs: [],
    };
  }

  interface FirePoint {
    distanceKm: number;
    label: string;
    date: string;
  }

  const allPoints: FirePoint[] = [
    ...firmsDetections.map((d) => ({
      distanceKm: d.distanceKm,
      label: `VIIRS ${d.frp.toFixed(1)} MW`,
      date: d.acqDate,
    })),
    ...eonetWildfires.map((e) => ({
      distanceKm: e.distanceKm,
      label: e.title,
      date: e.date.slice(0, 10),
    })),
  ].sort((a, b) => a.distanceKm - b.distanceKm);

  const nearestDist = allPoints.length > 0 ? allPoints[0].distanceKm : null;
  const clusterCount25km = firmsDetections.filter(
    (d) => d.distanceKm <= RISK_THRESHOLDS.WILDFIRE_CLUSTER_RADIUS_KM
  ).length + eonetWildfires.filter((e) => e.distanceKm <= RISK_THRESHOLDS.WILDFIRE_CLUSTER_RADIUS_KM).length;

  let baseStatus: SeverityStatus = 'nominal';
  if (nearestDist !== null) {
    if (nearestDist < RISK_THRESHOLDS.WILDFIRE_CRITICAL_KM) {
      baseStatus = 'critical';
    } else if (nearestDist < RISK_THRESHOLDS.WILDFIRE_WARNING_KM) {
      baseStatus = 'warning';
    } else if (nearestDist < RISK_THRESHOLDS.WILDFIRE_WATCH_KM) {
      baseStatus = 'watch';
    } else {
      baseStatus = 'nominal';
    }
  }

  const clusterTriggered = clusterCount25km >= RISK_THRESHOLDS.WILDFIRE_CLUSTER_COUNT;
  const finalStatus = clusterTriggered ? escalateOneLevel(baseStatus) : baseStatus;

  // Build 7-day sparkline of thermal detections or fallback baseline
  const dayCounts = new Map<string, number>();
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10);
    dayCounts.set(d, 0);
  }
  for (const pt of allPoints) {
    if (dayCounts.has(pt.date)) {
      dayCounts.set(pt.date, (dayCounts.get(pt.date) || 0) + 1);
    }
  }
  const sparkline = Array.from(dayCounts.entries()).map(([date, count]) => ({
    label: shortDateLabel(date),
    value: count,
  }));

  const kpiDisplay = nearestDist !== null ? nearestDist.toFixed(1) : '0';
  const kpiUnit = nearestDist !== null ? 'km' : `in ${radiusKm} km`;

  let summary = `No thermal anomalies detected within ${radiusKm} km in the past 48 hours.`;
  if (nearestDist !== null) {
    summary =
      finalStatus === 'critical'
        ? `Active fire or hotspot detected just ${nearestDist.toFixed(1)} km away. Immediate smoke and fire vigilance required.`
        : finalStatus === 'warning'
        ? `Credible thermal detection ${nearestDist.toFixed(1)} km from your target. Monitor wind direction and local advisories.`
        : finalStatus === 'watch'
        ? `Distant fire activity ${nearestDist.toFixed(1)} km away inside ${radiusKm} km radius. Stay alert to shifting winds.`
        : `Nearest fire activity is ${nearestDist.toFixed(1)} km away, outside immediate proximity thresholds.`;
  }

  const rules: RuleBreakdownItem[] = [
    {
      label: 'Nearest Fire / Hotspot Distance',
      value: nearestDist !== null ? `${nearestDist.toFixed(1)} km` : `None within ${radiusKm} km`,
      threshold: '<5 km Critical · <15 km Warning · <50 km Watch',
      triggered: nearestDist !== null && nearestDist < RISK_THRESHOLDS.WILDFIRE_WATCH_KM,
    },
    {
      label: '25 km Cluster Escalation',
      value: `${clusterCount25km} detections`,
      threshold: '>= 10 detections within 25 km (+1 severity)',
      triggered: clusterTriggered,
    },
  ];

  const rawInputs = [
    {
      label: 'Active Fire Feed',
      value: firmsEnv.data?.fallbackMode
        ? 'NASA EONET + GIBS Thermal (Keyless)'
        : `${firmsDetections.length} points within ${radiusKm} km`,
    },
    {
      label: 'NASA EONET Open Wildfires',
      value: `${eonetWildfires.length} events within ${radiusKm} km`,
    },
    {
      label: 'Peak FRP Intensity',
      value:
        firmsDetections.length > 0
          ? `${Math.max(...firmsDetections.map((d) => d.frp)).toFixed(1)} MW`
          : '0.0 MW',
    },
  ];

  const updatedAt = Math.max(firmsEnv.fetchedAt || 0, eonetEnv.fetchedAt || 0) || null;
  const isFallback = Boolean(firmsEnv.data?.fallbackMode);

  return {
    id: 'wildfire',
    status: finalStatus,
    kpiDisplay,
    kpiUnit,
    summary,
    provenanceLabel: isFallback ? 'NASA EONET v3 · GIBS Thermal' : 'NASA VIIRS 375m · EONET v3',
    isPartnerData: false,
    updatedAt,
    observationDate: firmsEnv.observationDate || eonetEnv.observationDate,
    stale: firmsEnv.stale || eonetEnv.stale,
    error: eonetEnv.error && firmsEnv.data?.fallbackMode ? eonetEnv.error : null,
    sourceNote: firmsEnv.sourceNote,
    sparkline,
    sparklineUnit: 'fires',
    rules,
    rawInputs,
  };
}

function evaluateFlood(telemetry: TelemetryBundle): ModuleEvaluation {
  const floodEnv = telemetry.flood;
  const weatherEnv = telemetry.weather;
  const eonetEnv = telemetry.eonet;

  const floodData = floodEnv.data;
  const weatherData = weatherEnv.data;
  const eonetData = eonetEnv.data;

  const ratio = floodData?.dischargeRatio ?? null;
  const rain7d = weatherData?.trailing7dRainMm ?? null;
  const rain3d = weatherData?.next3dRainMm ?? null;
  const nearbyFloodOrStorm = (eonetData || []).filter(
    (ev) =>
      (ev.categoryId === 'floods' || ev.categoryId === 'severeStorms') &&
      ev.distanceKm <= RISK_THRESHOLDS.FLOOD_EONET_PROXIMITY_KM
  );

  if (ratio === null && rain7d === null && rain3d === null && eonetData === null) {
    return {
      id: 'flood',
      status: 'nodata',
      kpiDisplay: '--',
      kpiUnit: '× mean',
      summary: 'River discharge and rainfall telemetry are currently unavailable.',
      provenanceLabel: 'Partner Data • Open-Meteo / GloFAS',
      isPartnerData: true,
      updatedAt: null,
      observationDate: null,
      stale: false,
      error: floodEnv.error || weatherEnv.error || 'Source unavailable',
      sparkline: [],
      sparklineUnit: 'm³/s',
      rules: [],
      rawInputs: [],
    };
  }

  let ratioStatus: SeverityStatus = ratio === null ? 'nodata' : 'nominal';
  if (ratio !== null) {
    if (ratio >= RISK_THRESHOLDS.FLOOD_DISCHARGE_CRITICAL) ratioStatus = 'critical';
    else if (ratio >= RISK_THRESHOLDS.FLOOD_DISCHARGE_WARNING) ratioStatus = 'warning';
    else if (ratio >= RISK_THRESHOLDS.FLOOD_DISCHARGE_WATCH) ratioStatus = 'watch';
  }

  let rain7dStatus: SeverityStatus = rain7d === null ? 'nodata' : 'nominal';
  if (rain7d !== null) {
    if (rain7d >= RISK_THRESHOLDS.FLOOD_RAIN_7D_CRITICAL_MM) rain7dStatus = 'critical';
    else if (rain7d >= RISK_THRESHOLDS.FLOOD_RAIN_7D_WARNING_MM) rain7dStatus = 'warning';
    else if (rain7d >= RISK_THRESHOLDS.FLOOD_RAIN_7D_WATCH_MM) rain7dStatus = 'watch';
  }

  let rain3dStatus: SeverityStatus = rain3d === null ? 'nodata' : 'nominal';
  if (rain3d !== null) {
    if (rain3d >= RISK_THRESHOLDS.FLOOD_RAIN_3D_WARNING_MM) rain3dStatus = 'warning';
    else if (rain3d >= RISK_THRESHOLDS.FLOOD_RAIN_3D_WATCH_MM) rain3dStatus = 'watch';
  }

  const eonetOverrideStatus: SeverityStatus =
    nearbyFloodOrStorm.length > 0 ? 'warning' : eonetData ? 'nominal' : 'nodata';

  const status = maxSeverity([ratioStatus, rain7dStatus, rain3dStatus, eonetOverrideStatus]);

  // Sparkline: prefer GloFAS river discharge 7d forecast/recent, fallback to rainfall
  const sparkline =
    floodData && floodData.series.length > 0
      ? floodData.series.slice(-7).map((pt) => ({
          label: shortDateLabel(pt.date),
          value: pt.dischargeMax ?? pt.discharge ?? 0,
        }))
      : (weatherData?.series || []).slice(-7).map((pt) => ({
          label: shortDateLabel(pt.date),
          value: pt.precipMm ?? 0,
        }));

  const sparklineUnit = floodData && floodData.series.length > 0 ? 'm³/s' : 'mm';

  const kpiDisplay =
    ratio !== null
      ? `${ratio.toFixed(2)}`
      : rain7d !== null
      ? `${rain7d.toFixed(0)}`
      : `${nearbyFloodOrStorm.length}`;
  const kpiUnit =
    ratio !== null ? '× mean' : rain7d !== null ? 'mm / 7d' : 'events';

  let summary = 'River discharge and cumulative rainfall remain within normal seasonal bounds.';
  if (status === 'critical') {
    summary =
      ratioStatus === 'critical'
        ? `Forecast river discharge reaches ${ratio?.toFixed(2)}× baseline mean, indicating severe flood hazard.`
        : `Extreme trailing 7-day rainfall (${rain7d?.toFixed(0)} mm) poses acute flash and basin flooding.`;
  } else if (status === 'warning') {
    summary =
      nearbyFloodOrStorm.length > 0
        ? `Active NASA EONET flood/storm event (${nearbyFloodOrStorm[0].distanceKm} km away) elevates local flood risk.`
        : `Elevated river surge (${ratio?.toFixed(2) ?? '--'}×) or heavy rainfall exceeds warning thresholds.`;
  } else if (status === 'watch') {
    summary = `Rising streamflow (${ratio?.toFixed(2) ?? '--'}× mean) or sustained rainfall warrants drainage readiness.`;
  }

  const rules: RuleBreakdownItem[] = [
    {
      label: 'River Discharge Ratio (Forecast Max / Mean)',
      value: ratio !== null ? `${ratio.toFixed(2)}×` : 'No river pixel data',
      threshold: '>= 1.3× Watch · >= 2.0× Warning · >= 3.0× Critical',
      triggered: SEVERITY_RANK[ratioStatus] >= SEVERITY_RANK.watch,
    },
    {
      label: 'Trailing 7-Day Cumulative Rainfall',
      value: rain7d !== null ? `${rain7d.toFixed(1)} mm` : 'Unavailable',
      threshold: '>= 50 mm Watch · >= 100 mm Warning · >= 200 mm Critical',
      triggered: SEVERITY_RANK[rain7dStatus] >= SEVERITY_RANK.watch,
    },
    {
      label: 'Next 3-Day Forecast Rainfall',
      value: rain3d !== null ? `${rain3d.toFixed(1)} mm` : 'Unavailable',
      threshold: '>= 50 mm Watch · >= 100 mm Warning',
      triggered: SEVERITY_RANK[rain3dStatus] >= SEVERITY_RANK.watch,
    },
    {
      label: 'NASA EONET Flood / Severe Storm (< 100 km)',
      value: `${nearbyFloodOrStorm.length} open events`,
      threshold: '>= 1 event enforces at least Warning',
      triggered: nearbyFloodOrStorm.length > 0,
    },
  ];

  const rawInputs = [
    {
      label: 'GloFAS Forecast Max Discharge',
      value:
        floodData?.forecastMaxDischarge !== null && floodData?.forecastMaxDischarge !== undefined
          ? `${floodData.forecastMaxDischarge.toFixed(1)} m³/s`
          : 'N/A',
    },
    {
      label: 'GloFAS Baseline Mean',
      value:
        floodData?.baselineMeanDischarge !== null && floodData?.baselineMeanDischarge !== undefined
          ? `${floodData.baselineMeanDischarge.toFixed(1)} m³/s`
          : 'N/A',
    },
    {
      label: '7d Past / 3d Forecast Rain',
      value: `${rain7d !== null ? rain7d.toFixed(1) : '--'} mm / ${rain3d !== null ? rain3d.toFixed(1) : '--'} mm`,
    },
  ];

  const updatedAt = Math.max(floodEnv.fetchedAt || 0, weatherEnv.fetchedAt || 0) || null;

  return {
    id: 'flood',
    status,
    kpiDisplay,
    kpiUnit,
    summary,
    provenanceLabel: 'Partner Data • Open-Meteo / GloFAS + EONET',
    isPartnerData: true,
    updatedAt,
    observationDate: floodEnv.observationDate || weatherEnv.observationDate,
    stale: floodEnv.stale || weatherEnv.stale,
    error: floodEnv.error && weatherEnv.error ? floodEnv.error : null,
    sparkline,
    sparklineUnit,
    rules,
    rawInputs,
  };
}

function evaluateSoil(telemetry: TelemetryBundle): ModuleEvaluation {
  const powerEnv = telemetry.power;
  const gwetRoot = powerEnv.data?.latestGwetRoot ?? null;
  const gwetTop = powerEnv.data?.latestGwetTop ?? null;

  if (gwetRoot === null) {
    return {
      id: 'soil',
      status: 'nodata',
      kpiDisplay: '--',
      kpiUnit: 'm³/m³',
      summary: 'NASA POWER root-zone soil wetness data is temporarily unavailable.',
      provenanceLabel: 'NASA POWER / MERRA-2',
      isPartnerData: false,
      updatedAt: powerEnv.fetchedAt,
      observationDate: powerEnv.observationDate,
      stale: powerEnv.stale,
      error: powerEnv.error || 'No valid GWETROOT reading',
      sparkline: [],
      sparklineUnit: 'index',
      rules: [],
      rawInputs: [],
    };
  }

  let status: SeverityStatus = 'nominal';
  let conditionLabel = 'Optimal root-zone moisture';
  if (gwetRoot < RISK_THRESHOLDS.SOIL_SEVERE_DROUGHT) {
    status = 'critical';
    conditionLabel = 'Severe root-zone drought';
  } else if (gwetRoot < RISK_THRESHOLDS.SOIL_AG_STRESS) {
    status = 'warning';
    conditionLabel = 'Agricultural moisture stress';
  } else if (gwetRoot <= RISK_THRESHOLDS.SOIL_NOMINAL_MIN) {
    status = 'watch';
    conditionLabel = 'Drying root-zone trend';
  } else if (gwetRoot > RISK_THRESHOLDS.SOIL_WATERLOG_MAX) {
    status = 'watch';
    conditionLabel = 'Soil waterlogging / oversaturation risk';
  }

  const validSeries = (powerEnv.data?.series || [])
    .filter((pt) => pt.gwetRoot !== null)
    .slice(-7);

  const sparkline = validSeries.map((pt) => ({
    label: shortDateLabel(pt.date),
    value: pt.gwetRoot as number,
  }));

  const summary =
    status === 'critical'
      ? `Root-zone wetness (${gwetRoot.toFixed(2)}) is critically depleted, indicating severe drought stress.`
      : status === 'warning'
      ? `Root-zone wetness (${gwetRoot.toFixed(2)}) indicates significant agricultural moisture stress.`
      : status === 'watch'
      ? gwetRoot > RISK_THRESHOLDS.SOIL_WATERLOG_MAX
        ? `Root-zone wetness (${gwetRoot.toFixed(2)}) exceeds 0.90 saturation, raising waterlogging and runoff risk.`
        : `Root-zone wetness (${gwetRoot.toFixed(2)}) is trending dry; plan supplemental irrigation.`
      : `Root-zone wetness (${gwetRoot.toFixed(2)}) sits in the healthy 0.41–0.90 agronomic band.`;

  const rules: RuleBreakdownItem[] = [
    {
      label: 'GWETROOT Severe Drought',
      value: gwetRoot.toFixed(2),
      threshold: '< 0.15 Critical',
      triggered: gwetRoot < RISK_THRESHOLDS.SOIL_SEVERE_DROUGHT,
    },
    {
      label: 'GWETROOT Agricultural Stress',
      value: gwetRoot.toFixed(2),
      threshold: '0.15 – 0.24 Warning',
      triggered: gwetRoot >= RISK_THRESHOLDS.SOIL_SEVERE_DROUGHT && gwetRoot < RISK_THRESHOLDS.SOIL_AG_STRESS,
    },
    {
      label: 'GWETROOT Drying / Waterlogging Watch',
      value: gwetRoot.toFixed(2),
      threshold: '0.25 – 0.40 or > 0.90 Watch',
      triggered:
        (gwetRoot >= RISK_THRESHOLDS.SOIL_AG_STRESS && gwetRoot <= RISK_THRESHOLDS.SOIL_NOMINAL_MIN) ||
        gwetRoot > RISK_THRESHOLDS.SOIL_WATERLOG_MAX,
    },
  ];

  const rawInputs = [
    { label: 'Root-Zone Wetness (GWETROOT)', value: `${gwetRoot.toFixed(3)} (0–1)` },
    {
      label: 'Surface Topsoil (GWETTOP)',
      value: gwetTop !== null ? `${gwetTop.toFixed(3)} (0–1)` : 'N/A',
    },
    {
      label: 'Latest Valid Satellite Date',
      value: powerEnv.data?.latestValidDate || 'Unknown (2–4d lag)',
    },
    { label: 'Condition Classification', value: conditionLabel },
  ];

  return {
    id: 'soil',
    status,
    kpiDisplay: gwetRoot.toFixed(2),
    kpiUnit: 'm³/m³',
    summary,
    provenanceLabel: 'NASA POWER / MERRA-2',
    isPartnerData: false,
    updatedAt: powerEnv.fetchedAt,
    observationDate: powerEnv.data?.latestValidDate || powerEnv.observationDate,
    stale: powerEnv.stale,
    error: powerEnv.error,
    sparkline,
    sparklineUnit: 'wetness',
    rules,
    rawInputs,
  };
}

function evaluateAir(telemetry: TelemetryBundle): ModuleEvaluation {
  const airEnv = telemetry.air;
  const aqi = airEnv.data?.currentUsAqi ?? null;

  if (aqi === null) {
    return {
      id: 'air',
      status: 'nodata',
      kpiDisplay: '--',
      kpiUnit: 'US AQI',
      summary: 'Hourly air quality telemetry could not be retrieved.',
      provenanceLabel: 'Partner Data • Open-Meteo CAMS',
      isPartnerData: true,
      updatedAt: airEnv.fetchedAt,
      observationDate: airEnv.observationDate,
      stale: airEnv.stale,
      error: airEnv.error || 'No US AQI value',
      sparkline: [],
      sparklineUnit: 'AQI',
      rules: [],
      rawInputs: [],
    };
  }

  let status: SeverityStatus = 'nominal';
  if (aqi > RISK_THRESHOLDS.AQI_WARNING_MAX) {
    status = 'critical';
  } else if (aqi > RISK_THRESHOLDS.AQI_WATCH_MAX) {
    status = 'warning';
  } else if (aqi > RISK_THRESHOLDS.AQI_NOMINAL_MAX) {
    status = 'watch';
  }

  const today = (airEnv.data?.observedAt || new Date().toISOString()).slice(0, 10);
  const recent7 = (airEnv.data?.dailySeries || [])
    .filter((d) => d.date <= today && d.maxUsAqi !== null)
    .slice(-7);

  const sparkline = recent7.map((d) => ({
    label: shortDateLabel(d.date),
    value: d.maxUsAqi as number,
  }));

  const summary =
    status === 'critical'
      ? `Hazardous particulate pollution (${aqi} US AQI). Avoid outdoor exertion and seal indoor spaces.`
      : status === 'warning'
      ? `Unhealthy air quality (${aqi} US AQI). Limit prolonged outdoor activity and wear N95 protection.`
      : status === 'watch'
      ? `Moderate-to-sensitive air quality (${aqi} US AQI). Sensitive groups should reduce heavy outdoor effort.`
      : `Clean to moderate air quality (${aqi} US AQI) poses low respiratory risk for most residents.`;

  const rules: RuleBreakdownItem[] = [
    {
      label: 'Current US Air Quality Index',
      value: `${aqi} US AQI`,
      threshold: '0–100 Nominal · 101–150 Watch · 151–200 Warning · >200 Critical',
      triggered: aqi > RISK_THRESHOLDS.AQI_NOMINAL_MAX,
    },
  ];

  const rawInputs = [
    { label: 'US AQI (Current)', value: `${aqi}` },
    {
      label: 'Fine Particulates (PM2.5)',
      value: airEnv.data?.currentPm25 !== null && airEnv.data?.currentPm25 !== undefined ? `${airEnv.data.currentPm25} µg/m³` : 'N/A',
    },
    {
      label: 'Coarse Particulates (PM10)',
      value: airEnv.data?.currentPm10 !== null && airEnv.data?.currentPm10 !== undefined ? `${airEnv.data.currentPm10} µg/m³` : 'N/A',
    },
    {
      label: '30-Day Days > 100 AQI',
      value:
        airEnv.data?.daysOver100Last30d !== null && airEnv.data?.daysOver100Last30d !== undefined
          ? `${airEnv.data.daysOver100Last30d} days`
          : 'N/A',
    },
  ];

  return {
    id: 'air',
    status,
    kpiDisplay: `${aqi}`,
    kpiUnit: 'US AQI',
    summary,
    provenanceLabel: 'Partner Data • Open-Meteo CAMS',
    isPartnerData: true,
    updatedAt: airEnv.fetchedAt,
    observationDate: airEnv.observationDate,
    stale: airEnv.stale,
    error: airEnv.error,
    sparkline,
    sparklineUnit: 'AQI',
    rules,
    rawInputs,
  };
}

function orderModulesForPersona(
  persona: Persona,
  modules: Record<HazardId, ModuleEvaluation>
): HazardId[] {
  if (persona === 'farmer') {
    return ['soil', 'flood', 'wildfire', 'air'];
  }
  if (persona === 'hiker') {
    return ['wildfire', 'air', 'flood', 'soil'];
  }
  if (persona === 'responder') {
    const ids: HazardId[] = ['wildfire', 'flood', 'air', 'soil'];
    return ids.sort((a, b) => SEVERITY_RANK[modules[b].status] - SEVERITY_RANK[modules[a].status]);
  }
  // Urban planner
  return ['air', 'flood', 'soil', 'wildfire'];
}

function computePersonaInsights(
  telemetry: TelemetryBundle,
  radiusKm: RadiusKm
): PersonaInsights {
  // Farmer 14-day cumulative precip (7d past + 7d forecast)
  const past7 = telemetry.weather.data?.trailing7dRainMm ?? null;
  const next7 = telemetry.weather.data?.next7dRainMm ?? null;
  const farmer14dPrecipMm =
    past7 !== null && next7 !== null
      ? Number((past7 + next7).toFixed(1))
      : past7 ?? next7;

  // Hiker peak heat exposure from forecast temperature_2m_max or POWER T2M_MAX
  const forecastMax = telemetry.weather.data?.maxForecastTempC ?? null;
  const powerMax = telemetry.power.data?.latestT2mMaxC ?? null;
  const hikerPeakTempC = forecastMax ?? powerMax;
  let hikerHeatLevel: PersonaInsights['hikerHeatLevel'] = 'nodata';
  if (hikerPeakTempC !== null) {
    if (hikerPeakTempC >= RISK_THRESHOLDS.HIKER_HEAT_DANGER_C) hikerHeatLevel = 'danger';
    else if (hikerPeakTempC >= RISK_THRESHOLDS.HIKER_HEAT_CAUTION_C) hikerHeatLevel = 'caution';
    else hikerHeatLevel = 'normal';
  }

  // Responder tactical incident list inside search radius
  const firms = telemetry.firms.data?.detections || [];
  const eonet = (telemetry.eonet.data || []).filter((e) => e.distanceKm <= radiusKm);

  const responderIncidents: TacticalIncident[] = [
    ...firms.map((d) => ({
      id: d.id,
      title: `VIIRS Thermal Hotspot`,
      kind: 'thermal' as const,
      category: 'Wildfire / Thermal',
      distanceKm: d.distanceKm,
      bearingCardinal: d.bearingCardinal,
      bearingDeg: d.bearingDeg,
      intensityLabel: `${d.frp.toFixed(1)} MW FRP`,
      date: `${d.acqDate} ${d.acqTime.slice(0, 2)}:${d.acqTime.slice(2, 4)} UTC`,
      lat: d.lat,
      lon: d.lon,
    })),
    ...eonet.map((e) => ({
      id: e.id,
      title: e.title,
      kind: 'eonet' as const,
      category: e.categoryTitle,
      distanceKm: e.distanceKm,
      bearingCardinal: e.bearingCardinal,
      bearingDeg: e.bearingDeg,
      intensityLabel: 'NASA EONET Open',
      date: e.date.slice(0, 10),
      lat: e.lat,
      lon: e.lon,
    })),
  ].sort((a, b) => a.distanceKm - b.distanceKm);

  // Urban planner 30d baseline
  const plannerThermalCount30d =
    firms.length + eonet.filter((e) => e.categoryId === 'wildfires').length;
  const plannerBadAirDays30d = telemetry.air.data?.daysOver100Last30d ?? null;
  const plannerRain30dMm = telemetry.power.data?.precip30dMm ?? null;

  return {
    farmer14dPrecipMm,
    hikerPeakTempC,
    hikerHeatLevel,
    responderIncidents,
    plannerThermalCount30d,
    plannerBadAirDays30d,
    plannerRain30dMm,
  };
}

export function evaluateRiskAssessment(
  telemetry: TelemetryBundle,
  persona: Persona,
  radiusKm: RadiusKm,
  _location?: GeoLocation
): RiskAssessment {
  const modules: Record<HazardId, ModuleEvaluation> = {
    wildfire: evaluateWildfire(telemetry, radiusKm),
    flood: evaluateFlood(telemetry),
    soil: evaluateSoil(telemetry),
    air: evaluateAir(telemetry),
  };

  const orderedModuleIds = orderModulesForPersona(persona, modules);
  const overallStatus = maxSeverity(orderedModuleIds.map((id) => modules[id].status));

  let topHazard: HazardId = orderedModuleIds[0];
  for (const id of orderedModuleIds) {
    if (SEVERITY_RANK[modules[id].status] > SEVERITY_RANK[modules[topHazard].status]) {
      topHazard = id;
    }
  }

  const personaInsights = computePersonaInsights(telemetry, radiusKm);

  return {
    overallStatus,
    topHazard,
    orderedModuleIds,
    modules,
    personaInsights,
    evaluatedAt: Date.now(),
  };
}
