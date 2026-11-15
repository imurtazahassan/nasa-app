import { getActionPlanSteps } from '../content/actionPlans';
import type {
  AiBrief,
  GeoLocation,
  Language,
  Persona,
  RadiusKm,
  RiskAssessment,
  TelemetryBundle,
} from '../types/telemetry';
import { formatCoordinates } from '../utils/geo';

function buildCompactSnapshot(params: {
  location: GeoLocation;
  radiusKm: RadiusKm;
  localTimeStr: string;
  persona: Persona;
  language: Language;
  assessment: RiskAssessment;
  telemetry: TelemetryBundle;
}) {
  const { location, radiusKm, localTimeStr, persona, language, assessment, telemetry } = params;
  return {
    place: `${location.name}${location.admin1 ? `, ${location.admin1}` : ''}${
      location.country ? `, ${location.country}` : ''
    }`,
    coordinates: formatCoordinates(location.lat, location.lon),
    radiusKm,
    localTime: localTimeStr,
    persona,
    language: language === 'ur' ? 'Urdu' : 'English',
    overallStatus: assessment.overallStatus,
    topHazard: assessment.topHazard,
    modules: assessment.orderedModuleIds.map((id) => {
      const m = assessment.modules[id];
      return {
        hazard: id,
        status: m.status,
        reading: `${m.kpiDisplay} ${m.kpiUnit}`,
        source: m.provenanceLabel,
        observationDate: m.observationDate,
        stale: m.stale,
        error: m.error,
        rawInputs: m.rawInputs,
      };
    }),
    counts: {
      firmsDetectionsWithinRadius: telemetry.firms.data?.detections.length ?? 0,
      eonetEventsWithin400km: telemetry.eonet.data?.length ?? 0,
      firmsFallbackMode: Boolean(telemetry.firms.data?.fallbackMode),
    },
    personaInsights: assessment.personaInsights,
  };
}

export function buildDeterministicOfflineBrief(params: {
  location: GeoLocation;
  localTimeStr: string;
  persona: Persona;
  language: Language;
  assessment: RiskAssessment;
}): AiBrief {
  const { location, persona, language, assessment } = params;
  const top = assessment.modules[assessment.topHazard];
  const topActions = getActionPlanSteps(
    language,
    persona,
    assessment.topHazard,
    assessment.overallStatus
  ).slice(0, 3);

  const dataGaps: string[] = [];
  for (const id of assessment.orderedModuleIds) {
    const m = assessment.modules[id];
    if (m.status === 'nodata' || m.error) {
      dataGaps.push(
        language === 'ur'
          ? `${id}: ڈیٹا دستیاب نہیں یا عارضی طور پر منقطع ہے۔`
          : `${m.provenanceLabel}: source unavailable or missing reading.`
      );
    } else if (m.stale) {
      dataGaps.push(
        language === 'ur'
          ? `${m.provenanceLabel}: کیش شدہ پرانا ڈیٹا دکھایا جا رہا ہے۔`
          : `${m.provenanceLabel}: showing aged cached telemetry.`
      );
    }
  }
  if (assessment.modules.wildfire.sourceNote) {
    dataGaps.push(
      language === 'ur'
        ? 'FIRMS CSV کلید کے بغیر NASA EONET اور GIBS تھرمل لیئر استعمال ہو رہی ہے۔'
        : assessment.modules.wildfire.sourceNote
    );
  }

  if (language === 'ur') {
    const statusMap: Record<string, string> = {
      critical: 'انتہائی خطرہ',
      warning: 'انتباہ',
      watch: 'نگرانی',
      nominal: 'معمول کے مطابق',
      nodata: 'ڈیٹا دستیاب نہیں',
    };
    const hazardMap: Record<string, string> = {
      wildfire: 'جنگل کی آگ',
      flood: 'سیلاب کا خطرہ',
      soil: 'زمین کی نمی',
      air: 'ہوا کا معیار',
    };

    const statusText = statusMap[assessment.overallStatus] || assessment.overallStatus;
    const hazardText = hazardMap[assessment.topHazard] || assessment.topHazard;

    return {
      headline: `${location.name}: ${hazardText} — ${statusText}`,
      summary: `${location.name} کے لیے اہم ترین مشاہدہ ${hazardText} (${top.kpiDisplay} ${top.kpiUnit}) ہے۔ تمام چاروں خلائی اور ماڈل ماڈیولز مقامی اصولوں کے مطابق جانچے گئے ہیں۔ اگر صورتحال انتباہ یا انتہائی خطرہ ہو تو مقامی ہنگامی اداروں کی ہدایات پر فوری عمل کریں۔`,
      topActions,
      dataGaps,
      mode: 'offline',
      generatedAt: Date.now(),
    };
  }

  const headlineMap: Record<string, string> = {
    critical: `Critical ${top.id} risk near ${location.name} (${top.kpiDisplay} ${top.kpiUnit})`,
    warning: `Elevated ${top.id} warning for ${location.name} (${top.kpiDisplay} ${top.kpiUnit})`,
    watch: `Watch advisory on ${top.id} near ${location.name} (${top.kpiDisplay} ${top.kpiUnit})`,
    nominal: `All monitored hazards nominal around ${location.name}`,
    nodata: `Telemetry incomplete for ${location.name}`,
  };

  const authorityNote =
    assessment.overallStatus === 'warning' || assessment.overallStatus === 'critical'
      ? ' Follow official local emergency authorities immediately.'
      : '';

  return {
    headline: headlineMap[assessment.overallStatus] || `Telemetry brief for ${location.name}`,
    summary: `${top.summary} Primary reading is ${top.kpiDisplay} ${top.kpiUnit} from ${top.provenanceLabel}.${authorityNote}`,
    topActions,
    dataGaps,
    mode: 'offline',
    generatedAt: Date.now(),
  };
}

export async function generateSituationBrief(params: {
  location: GeoLocation;
  radiusKm: RadiusKm;
  localTimeStr: string;
  persona: Persona;
  language: Language;
  assessment: RiskAssessment;
  telemetry: TelemetryBundle;
}): Promise<AiBrief> {
  const snapshot = buildCompactSnapshot(params);
  const targetLang = params.language === 'ur' ? 'Urdu' : 'English';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch('/api/gemini/brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshot, targetLang }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return buildDeterministicOfflineBrief(params);
    }

    const payload = (await res.json()) as {
      mode?: 'gemini' | 'offline';
      brief?: {
        headline: string;
        summary: string;
        topActions: string[];
        dataGaps: string[];
      };
    };

    if (payload.mode === 'gemini' && payload.brief) {
      return {
        headline: payload.brief.headline,
        summary: payload.brief.summary,
        topActions: Array.isArray(payload.brief.topActions)
          ? payload.brief.topActions.slice(0, 3)
          : [],
        dataGaps: Array.isArray(payload.brief.dataGaps) ? payload.brief.dataGaps : [],
        mode: 'gemini',
        generatedAt: Date.now(),
      };
    }

    return buildDeterministicOfflineBrief(params);
  } catch {
    clearTimeout(timer);
    return buildDeterministicOfflineBrief(params);
  }
}

export async function askEarthPulseChat(params: {
  question: string;
  location: GeoLocation;
  radiusKm: RadiusKm;
  localTimeStr: string;
  persona: Persona;
  language: Language;
  assessment: RiskAssessment;
  telemetry: TelemetryBundle;
}): Promise<{ answer: string; mode: 'gemini' | 'offline' }> {
  const snapshot = buildCompactSnapshot(params);
  const targetLang = params.language === 'ur' ? 'Urdu' : 'English';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: params.question,
        snapshot,
        targetLang,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const payload = (await res.json()) as {
        mode?: 'gemini' | 'offline';
        answer?: string;
      };
      if (payload.mode === 'gemini' && payload.answer) {
        return { answer: payload.answer, mode: 'gemini' };
      }
    }
  } catch {
    clearTimeout(timer);
  }

  // Deterministic grounded offline answer
  const q = params.question.toLowerCase();
  const m = params.assessment.modules;
  const isUr = params.language === 'ur';

  if (q.includes('fire') || q.includes('smoke') || q.includes('آگ') || q.includes('دھواں')) {
    return {
      mode: 'offline',
      answer: isUr
        ? `${params.location.name} میں جنگل کی آگ کا درجہ "${m.wildfire.status}" ہے (${m.wildfire.kpiDisplay} ${m.wildfire.kpiUnit})۔ ماخذ: ${m.wildfire.provenanceLabel}۔`
        : `Wildfire status for ${params.location.name} is ${m.wildfire.status.toUpperCase()} (${m.wildfire.kpiDisplay} ${m.wildfire.kpiUnit}). ${m.wildfire.summary} Source: ${m.wildfire.provenanceLabel}.`,
    };
  }
  if (
    q.includes('flood') ||
    q.includes('rain') ||
    q.includes('river') ||
    q.includes('سیلاب') ||
    q.includes('بارش')
  ) {
    return {
      mode: 'offline',
      answer: isUr
        ? `${params.location.name} میں سیلاب کا درجہ "${m.flood.status}" ہے (${m.flood.kpiDisplay} ${m.flood.kpiUnit})۔ ماخذ: ${m.flood.provenanceLabel}۔`
        : `Flood risk for ${params.location.name} is ${m.flood.status.toUpperCase()} (${m.flood.kpiDisplay} ${m.flood.kpiUnit}). ${m.flood.summary} Source: ${m.flood.provenanceLabel}.`,
    };
  }
  if (
    q.includes('soil') ||
    q.includes('irrigat') ||
    q.includes('crop') ||
    q.includes('نمی') ||
    q.includes('فصل')
  ) {
    return {
      mode: 'offline',
      answer: isUr
        ? `${params.location.name} میں جڑوں کی نمی ${m.soil.kpiDisplay} ${m.soil.kpiUnit} ہے اور صورتحال "${m.soil.status}" ہے۔ ماخذ: ${m.soil.provenanceLabel}۔`
        : `Root-zone soil moisture at ${params.location.name} is ${m.soil.kpiDisplay} ${m.soil.kpiUnit} (${m.soil.status.toUpperCase()}). ${m.soil.summary} Source: ${m.soil.provenanceLabel}.`,
    };
  }
  if (
    q.includes('air') ||
    q.includes('aqi') ||
    q.includes('breath') ||
    q.includes('ہوا') ||
    q.includes('آلودگی')
  ) {
    return {
      mode: 'offline',
      answer: isUr
        ? `${params.location.name} میں موجودہ فضائی معیار ${m.air.kpiDisplay} ${m.air.kpiUnit} (${m.air.status}) ہے۔ ماخذ: ${m.air.provenanceLabel}۔`
        : `Current air quality at ${params.location.name} is ${m.air.kpiDisplay} ${m.air.kpiUnit} (${m.air.status.toUpperCase()}). ${m.air.summary} Source: ${m.air.provenanceLabel}.`,
    };
  }

  return {
    mode: 'offline',
    answer: isUr
      ? `${params.location.name} میں مجموعی صورتحال "${params.assessment.overallStatus}" ہے (وقت: ${params.localTimeStr})۔ اہم مشاہدات: آگ ${m.wildfire.kpiDisplay} ${m.wildfire.kpiUnit}، سیلاب ${m.flood.kpiDisplay} ${m.flood.kpiUnit}، زمین کی نمی ${m.soil.kpiDisplay}، اور ہوا ${m.air.kpiDisplay} US AQI۔ براہِ کرم آگ، سیلاب، زمین کی نمی یا ہوا کے معیار کے بارے میں پوچھیں۔`
      : `At ${params.location.name} (as of ${params.localTimeStr}), overall status is ${params.assessment.overallStatus.toUpperCase()}. Current telemetry: Wildfire ${m.wildfire.kpiDisplay} ${m.wildfire.kpiUnit}, Flood ${m.flood.kpiDisplay} ${m.flood.kpiUnit}, Soil Moisture ${m.soil.kpiDisplay} ${m.soil.kpiUnit}, and Air Quality ${m.air.kpiDisplay} ${m.air.kpiUnit}. Ask specifically about wildfire, flood, soil moisture, or air quality for details.`,
  };
}
