import type { GeoLocation, Language, Persona, RiskAssessment } from '../types/telemetry';
import { formatCoordinates, isInsidePakistan } from './geo';

const STATUS_LABELS: Record<Language, Record<string, string>> = {
  en: {
    critical: 'CRITICAL',
    warning: 'WARNING',
    watch: 'WATCH',
    nominal: 'NOMINAL',
    nodata: 'NO DATA',
  },
  ur: {
    critical: 'انتہائی خطرہ',
    warning: 'انتباہ',
    watch: 'نگرانی',
    nominal: 'معمول کے مطابق',
    nodata: 'ڈیٹا دستیاب نہیں',
  },
};

const HAZARD_LABELS: Record<Language, Record<string, string>> = {
  en: {
    wildfire: 'Wildfire',
    flood: 'Flood Risk',
    soil: 'Soil Moisture',
    air: 'Air Quality',
  },
  ur: {
    wildfire: 'جنگل کی آگ',
    flood: 'سیلاب کا خطرہ',
    soil: 'زمین کی نمی',
    air: 'ہوا کا معیار',
  },
};

export function buildWhatsAppAlertText(params: {
  location: GeoLocation;
  localTimeStr: string;
  persona: Persona;
  language: Language;
  assessment: RiskAssessment;
  topActions: string[];
  isDemo: boolean;
}): string {
  const { location, localTimeStr, language, assessment, topActions, isDemo } = params;
  const coords = formatCoordinates(location.lat, location.lon);
  const statusWord = STATUS_LABELS[language][assessment.overallStatus] ?? assessment.overallStatus;
  const inPk = isInsidePakistan(location.lat, location.lon);

  const readings = assessment.orderedModuleIds
    .map((id) => {
      const m = assessment.modules[id];
      const hName = HAZARD_LABELS[language][id];
      const mStatus = STATUS_LABELS[language][m.status];
      return `- ${hName}: ${m.kpiDisplay} ${m.kpiUnit} [${mStatus}]`;
    })
    .join('\n');

  const actionsText = topActions
    .slice(0, 3)
    .map((a, idx) => `${idx + 1}. ${a}`)
    .join('\n');

  if (language === 'ur') {
    const emergency = inPk ? 'ہنگامی رابطہ: ریسکیو 1122' : 'اپنے مقامی ہنگامی نمبر پر رابطہ کریں';
    const demoNote = isDemo ? '[آزمائشی منظرنامہ — نقلی ڈیٹا]\n' : '';
    return `${demoNote}EarthPulse خلائی ماحولیاتی بلیٹن
مقام: ${location.name}${location.country ? `, ${location.country}` : ''} (${coords})
مقامی وقت: ${localTimeStr}
مجموعی صورتحال: ${statusWord}

اہم مشاہدات:
${readings}

فوری اقدامات:
${actionsText}

ذرائع: NASA (VIIRS, EONET, POWER, IMERG) اور Open-Meteo / GloFAS
تنبیہ: یہ صرف معلوماتی معاونت ہے، سرکاری انتباہ نہیں۔ ${emergency}۔`;
  }

  const emergency = inPk ? 'Emergency: Rescue 1122.' : 'Contact your local emergency number.';
  const demoNote = isDemo ? '[DEMO SCENARIO — SIMULATED TELEMETRY]\n' : '';
  return `${demoNote}EarthPulse Field Hazard Bulletin
Location: ${location.name}${location.country ? `, ${location.country}` : ''} (${coords})
Local Time: ${localTimeStr}
Overall Status: ${statusWord}

Key Readings:
${readings}

Top 3 Actions:
${actionsText}

Sources: NASA (VIIRS, EONET, POWER, IMERG) & Open-Meteo / GloFAS
Disclaimer: Informational decision-support only, not an official government warning. Follow local authorities. ${emergency}`;
}

export async function shareOrCopyAlert(
  title: string,
  text: string
): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share({ title, text });
      return 'shared';
    }
  } catch (err) {
    // User cancelled native share or unsupported in iframe; fall back to clipboard
    if (err instanceof Error && err.name === 'AbortError') {
      return 'failed';
    }
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return 'copied';
    }
  } catch {
    // Fallback textarea copy
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return 'copied';
  } catch {
    return 'failed';
  }
}
