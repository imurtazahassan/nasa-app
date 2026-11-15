import type { HazardId, Language, Persona, SeverityStatus } from '../types/telemetry';

export interface Translations {
  appName: string;
  tagline: string;
  spaceAppsBadge: string;
  searchPlaceholder: string;
  useMyGps: string;
  savedLocations: string;
  saveLocation: string;
  removeLocation: string;
  noSavedLocations: string;
  noSearchResults: string;
  searching: string;
  radiusLabel: string;
  personaLabel: string;
  personas: Record<Persona, string>;
  demoScenarios: string;
  liveTelemetry: string;
  switchToLive: string;
  demoBanner: string;
  methodsBtn: string;
  controlsBtn: string;
  closeBtn: string;
  shareAlert: string;
  printBrief: string;
  copiedToast: string;
  sharedToast: string;
  acquiringStream: string;
  overallStatusLabel: string;
  localObservationTime: string;
  hazards: Record<HazardId, string>;
  statuses: Record<SeverityStatus, string>;
  updated: string;
  staleBadge: string;
  sourceUnavailable: string;
  retry: string;
  telemetryBreakdown: string;
  rawInputsLabel: string;
  rulesEvaluatedLabel: string;
  triggered: string;
  notTriggered: string;
  mapLayers: {
    trueColor: string;
    thermalFires: string;
    imergRain: string;
    eonetEvents: string;
    radiusRing: string;
    streetBase: string;
    referenceLabels: string;
    tableToggle: string;
    mapToggle: string;
    tapToInspect: string;
    activeLayer: string;
    imageryDate: string;
    todayUtc: string;
    yesterdayUtc: string;
    noEventsInTable: string;
    threeDScene: string;
    expand3D: string;
    exitExpand3D: string;
  };
  tabs: {
    brief: string;
    ask: string;
    actions: string;
    status: string;
    map: string;
  };
  briefPanel: {
    title: string;
    geminiBadge: string;
    offlineBadge: string;
    regenerate: string;
    generating: string;
    topActionsTitle: string;
    dataGapsTitle: string;
    noGaps: string;
  };
  chatPanel: {
    title: string;
    groundedAsOf: string;
    placeholder: string;
    send: string;
    suggestedLabel: string;
    emptyPrompt: string;
  };
  actionsPanel: {
    title: string;
    subtitle: string;
    resetChecklist: string;
  };
  personaCallouts: {
    farmerTitle: string;
    farmerDesc: string;
    hikerHeatLabel: string;
    heatNormal: string;
    heatCaution: string;
    heatDanger: string;
    responderTitle: string;
    noIncidents: string;
    plannerTitle: string;
    thermal30d: string;
    badAirDays30d: string;
    rain30d: string;
  };
  footer: {
    competition: string;
    safety: string;
    emergencyPk: string;
    emergencyGlobal: string;
    offlineCacheNotice: string;
  };
  methodsDrawer: {
    title: string;
    tabData: string;
    tabProject: string;
    firmsKeyTitle: string;
    firmsKeyHelp: string;
    firmsKeyPlaceholder: string;
    saveKey: string;
    clearKey: string;
    thresholdsTitle: string;
    disclaimerTitle: string;
    disclaimerBody: string;
  };
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    appName: 'EarthPulse',
    tagline: 'Satellite data, in plain language.',
    spaceAppsBadge: 'Space Apps 2026',
    searchPlaceholder: 'Search city, village, or region (Cmd+K / /)',
    useMyGps: 'Use my location',
    savedLocations: 'Saved',
    saveLocation: 'Save pin',
    removeLocation: 'Saved',
    noSavedLocations: 'No saved locations yet (up to 5).',
    noSearchResults: 'No matching places found.',
    searching: 'Searching places…',
    radiusLabel: 'Radius',
    personaLabel: 'Persona',
    personas: {
      farmer: 'Farmer',
      hiker: 'Hiker',
      responder: 'Responder',
      planner: 'Planner',
    },
    demoScenarios: 'Demo Scenarios',
    liveTelemetry: 'Live Satellite Feed',
    switchToLive: 'Switch to Live Satellite Data',
    demoBanner: 'DEMO SCENARIO ACTIVE — SIMULATED TELEMETRY (NOT LIVE)',
    methodsBtn: 'Mission & Methods',
    controlsBtn: 'Controls',
    closeBtn: 'Close',
    shareAlert: 'Share Alert',
    printBrief: 'Print Brief',
    copiedToast: 'WhatsApp-ready alert copied to clipboard.',
    sharedToast: 'Alert shared successfully.',
    acquiringStream: 'Acquiring satellite stream…',
    overallStatusLabel: 'Overall Local Status',
    localObservationTime: 'Local Time',
    hazards: {
      wildfire: 'Wildfire',
      flood: 'Flood Risk',
      soil: 'Soil Moisture',
      air: 'Air Quality',
    },
    statuses: {
      critical: 'Critical',
      warning: 'Warning',
      watch: 'Watch',
      nominal: 'Nominal',
      nodata: 'No Data',
    },
    updated: 'Updated',
    staleBadge: 'Stale',
    sourceUnavailable: 'Source unavailable',
    retry: 'Retry',
    telemetryBreakdown: 'Telemetry & Rule Breakdown',
    rawInputsLabel: 'Raw Telemetry Inputs',
    rulesEvaluatedLabel: 'Threshold Rules Evaluated',
    triggered: 'Triggered',
    notTriggered: 'Clear',
    mapLayers: {
      trueColor: 'True Color',
      thermalFires: 'Thermal Fires',
      imergRain: 'IMERG Rain',
      eonetEvents: 'EONET Events',
      radiusRing: 'Radius Ring',
      streetBase: 'Street Base',
      referenceLabels: 'Place Labels',
      tableToggle: 'Detections Table',
      mapToggle: 'Satellite Map',
      tapToInspect: 'Click map to inspect any coordinate',
      activeLayer: 'Imagery',
      imageryDate: 'Imagery UTC Date',
      todayUtc: 'Today (UTC)',
      yesterdayUtc: 'Yesterday (UTC)',
      noEventsInTable: 'No active FIRMS thermal points or EONET events inside this radius.',
      threeDScene: '3D Terrain & Orbit',
      expand3D: 'Full Screen',
      exitExpand3D: 'Exit Full Screen',
    },
    tabs: {
      brief: 'Brief',
      ask: 'Ask',
      actions: 'Actions',
      status: 'Status',
      map: 'Map',
    },
    briefPanel: {
      title: 'Situation Brief',
      geminiBadge: 'Gemini Grounded Brief',
      offlineBadge: 'Offline Rule-Based Brief',
      regenerate: 'Refresh Brief',
      generating: 'Synthesizing telemetry…',
      topActionsTitle: 'Top Recommended Actions',
      dataGapsTitle: 'Data Gaps & Latency Notes',
      noGaps: 'All primary satellite and model streams reported nominal availability.',
    },
    chatPanel: {
      title: 'Ask EarthPulse',
      groundedAsOf: 'Grounded in telemetry as of',
      placeholder: 'Ask about fire distance, river flood ratio, soil, or AQI…',
      send: 'Send',
      suggestedLabel: 'Suggested Questions',
      emptyPrompt: 'Ask any question grounded in your active local satellite telemetry.',
    },
    actionsPanel: {
      title: 'Offline Action Checklist',
      subtitle: 'Curated, zero-AI safety steps tailored to your role and active hazard levels.',
      resetChecklist: 'Reset checks',
    },
    personaCallouts: {
      farmerTitle: '14-Day Agronomic Precipitation Window',
      farmerDesc: 'Combined past 7-day observed and next 7-day forecast rainfall.',
      hikerHeatLabel: 'Trail Heat Exposure',
      heatNormal: 'Normal',
      heatCaution: 'Heat Caution (>=35°C)',
      heatDanger: 'Heat Danger (>=40°C)',
      responderTitle: 'Tactical Incidents Inside Radius',
      noIncidents: 'No active thermal detections or EONET hazards inside search radius.',
      plannerTitle: '30-Day Urban Baseline',
      thermal30d: 'Active Detections',
      badAirDays30d: 'Days AQI > 100',
      rain30d: '30d Rain (POWER)',
    },
    footer: {
      competition: 'Built for the NASA Space Apps Challenge 2026 · Open NASA & Partner Telemetry · Not an official NASA product.',
      safety: 'Informational decision-support only, not an official government warning. Follow local authorities.',
      emergencyPk: 'Emergency: Rescue 1122',
      emergencyGlobal: 'Contact your local emergency number',
      offlineCacheNotice: 'Offline — showing cached telemetry from',
    },
    methodsDrawer: {
      title: 'Mission & Methods',
      tabData: 'Data & Methods',
      tabProject: 'Space Apps 2026 Brief',
      firmsKeyTitle: 'Optional NASA FIRMS 375m MAP_KEY',
      firmsKeyHelp:
        'Saved locally in your browser only. Without a key, EarthPulse seamlessly uses NASA EONET wildfires + NASA GIBS Thermal Anomalies.',
      firmsKeyPlaceholder: 'Paste 32-char FIRMS MAP_KEY…',
      saveKey: 'Save Key',
      clearKey: 'Clear',
      thresholdsTitle: 'Deterministic Risk Thresholds',
      disclaimerTitle: 'Scientific & Operational Disclaimer',
      disclaimerBody:
        'Threshold rules are open decision-support heuristics designed to summarize orbital and hydrological datasets into clear guidance. They do not replace official national meteorological, flood-forecasting, or civil-defense warnings.',
    },
  },
  ur: {
    appName: 'EarthPulse',
    tagline: 'سیٹلائٹ ڈیٹا، سادہ زبان میں۔',
    spaceAppsBadge: 'اسپیس ایپس 2026',
    searchPlaceholder: 'شہر، گاؤں یا علاقہ تلاش کریں (Cmd+K / /)',
    useMyGps: 'میرا مقام استعمال کریں',
    savedLocations: 'محفوظ مقامات',
    saveLocation: 'مقام محفوظ کریں',
    removeLocation: 'محفوظ شدہ',
    noSavedLocations: 'ابھی کوئی مقام محفوظ نہیں (زیادہ سے زیادہ 5)۔',
    noSearchResults: 'کوئی مماثل مقام نہیں ملا۔',
    searching: 'مقامات تلاش کیے جا رہے ہیں…',
    radiusLabel: 'دائرہ',
    personaLabel: 'کردار',
    personas: {
      farmer: 'کسان',
      hiker: 'ہائیکر',
      responder: 'ریسپانڈر',
      planner: 'شہری منصوبہ ساز',
    },
    demoScenarios: 'ڈیمو منظرنامے',
    liveTelemetry: 'براہِ راست سیٹلائٹ ڈیٹا',
    switchToLive: 'براہِ راست سیٹلائٹ ڈیٹا پر واپس جائیں',
    demoBanner: 'ڈیمو منظرنامہ فعال ہے — نقلی ڈیٹا (براہِ راست نہیں)',
    methodsBtn: 'مشن اور طریقہ کار',
    controlsBtn: 'کنٹرولز',
    closeBtn: 'بند کریں',
    shareAlert: 'الرٹ شیئر کریں',
    printBrief: 'پرنٹ بریف',
    copiedToast: 'واٹس ایپ کے لیے الرٹ کلپ بورڈ پر کاپی ہو گیا۔',
    sharedToast: 'الرٹ کامیابی سے شیئر ہو گیا۔',
    acquiringStream: 'سیٹلائٹ سٹریم حاصل کیا جا رہا ہے…',
    overallStatusLabel: 'مقامی مجموعی صورتحال',
    localObservationTime: 'مقامی وقت',
    hazards: {
      wildfire: 'جنگل کی آگ',
      flood: 'سیلاب کا خطرہ',
      soil: 'زمین کی نمی',
      air: 'ہوا کا معیار',
    },
    statuses: {
      critical: 'انتہائی خطرہ',
      warning: 'انتباہ',
      watch: 'نگرانی',
      nominal: 'معمول کے مطابق',
      nodata: 'ڈیٹا دستیاب نہیں',
    },
    updated: 'تازہ ترین',
    staleBadge: 'پرانا ڈیٹا',
    sourceUnavailable: 'ماخذ دستیاب نہیں',
    retry: 'دوبارہ کوشش',
    telemetryBreakdown: 'ٹیلی میٹری اور اصولوں کی تفصیل',
    rawInputsLabel: 'بنیادی مشاہداتی ڈیٹا',
    rulesEvaluatedLabel: 'جانچے گئے خطرے کے اصول',
    triggered: 'فعال',
    notTriggered: 'محفوظ',
    mapLayers: {
      trueColor: 'حقیقی رنگ',
      thermalFires: 'حرارتی آگ',
      imergRain: 'IMERG بارش',
      eonetEvents: 'EONET واقعات',
      radiusRing: 'دائرہ کار',
      streetBase: 'سڑکوں کا نقشہ',
      referenceLabels: 'مقامات کے نام',
      tableToggle: 'واقعات کی فہرست',
      mapToggle: 'سیٹلائٹ نقشہ',
      tapToInspect: 'کسی بھی مقام کے معائنے کے لیے نقشے پر کلک کریں',
      activeLayer: 'تصویر',
      imageryDate: 'تصویر کی تاریخ (UTC)',
      todayUtc: 'آج (UTC)',
      yesterdayUtc: 'کل (UTC)',
      noEventsInTable: 'اس دائرے کے اندر کوئی فعال حرارتی نقطہ یا EONET واقعہ نہیں ملا۔',
      threeDScene: '3D منظر اور مدار',
      expand3D: 'فل اسکرین',
      exitExpand3D: 'فل اسکرین بند کریں',
    },
    tabs: {
      brief: 'خلاصہ',
      ask: 'سوالات',
      actions: 'اقدامات',
      status: 'صورتحال',
      map: 'نقشہ',
    },
    briefPanel: {
      title: 'صورتحال کا خلاصہ',
      geminiBadge: 'جیمنائی مستند خلاصہ',
      offlineBadge: 'آف لائن اصولی خلاصہ',
      regenerate: 'خلاصہ تازہ کریں',
      generating: 'سیٹلائٹ ڈیٹا کا تجزیہ جاری ہے…',
      topActionsTitle: 'اہم تجویز کردہ اقدامات',
      dataGapsTitle: 'ڈیٹا کی کمی اور تاخیر کے نوٹس',
      noGaps: 'تمام بنیادی سیٹلائٹ اور ماڈل ذرائع دستیاب ہیں۔',
    },
    chatPanel: {
      title: 'EarthPulse سے پوچھیں',
      groundedAsOf: 'مستند ڈیٹا بمطابق',
      placeholder: 'آگ کا فاصلہ، دریا کا بہاؤ، زمین کی نمی یا AQI پوچھیں…',
      send: 'بھیجیں',
      suggestedLabel: 'تجویز کردہ سوالات',
      emptyPrompt: 'اپنے فعال مقامی سیٹلائٹ ڈیٹا کی بنیاد پر کوئی بھی سوال پوچھیں۔',
    },
    actionsPanel: {
      title: 'آف لائن حفاظتی چیک لسٹ',
      subtitle: 'آپ کے کردار اور موجودہ خطرے کے درجے کے مطابق عملی حفاظتی اقدامات۔',
      resetChecklist: 'چیک لسٹ ری سیٹ کریں',
    },
    personaCallouts: {
      farmerTitle: '14 روزہ زرعی بارش کا تناظر',
      farmerDesc: 'گزشتہ 7 دن کی بارش اور آئندہ 7 دن کی متوقع بارش کا مجموعہ۔',
      hikerHeatLabel: 'راستے میں گرمی کا دباؤ',
      heatNormal: 'معمول کے مطابق',
      heatCaution: 'گرمی احتیاط (>=35°C)',
      heatDanger: 'شدید گرمی خطرہ (>=40°C)',
      responderTitle: 'دائرے میں فعال ہنگامی نشاندہی',
      noIncidents: 'تلاش کے دائرے میں کوئی فعال حرارتی آگ یا EONET واقعہ نہیں ہے۔',
      plannerTitle: '30 روزہ شہری بنیادی جائزہ',
      thermal30d: 'فعال نشاندہی',
      badAirDays30d: '100 سے زائد AQI دن',
      rain30d: '30 دن کی بارش (POWER)',
    },
    footer: {
      competition: 'NASA Space Apps Challenge 2026 کے لیے تیار کردہ · اوپن ناسا و پارٹنر ڈیٹا · سرکاری ناسا پراڈکٹ نہیں۔',
      safety: 'یہ صرف معلوماتی معاونت ہے، سرکاری انتباہ نہیں۔ مقامی حکام کی ہدایات پر عمل کریں۔',
      emergencyPk: 'ہنگامی رابطہ: ریسکیو 1122',
      emergencyGlobal: 'اپنے مقامی ہنگامی نمبر پر رابطہ کریں',
      offlineCacheNotice: 'آف لائن — محفوظ شدہ ڈیٹا دکھایا جا رہا ہے از',
    },
    methodsDrawer: {
      title: 'مشن اور طریقہ کار',
      tabData: 'ڈیٹا اور طریقہ کار',
      tabProject: 'اسپیس ایپس 2026 پروجیکٹ',
      firmsKeyTitle: 'اختیاری NASA FIRMS 375m MAP_KEY',
      firmsKeyHelp:
        'یہ کلید صرف آپ کے براؤزر میں محفوظ رہتی ہے۔ کلید کے بغیر بھی EarthPulse ناسا EONET اور GIBS تھرمل ڈیٹا استعمال کرتا ہے۔',
      firmsKeyPlaceholder: '32 حروف کی FIRMS کلید درج کریں…',
      saveKey: 'کلید محفوظ کریں',
      clearKey: 'صاف کریں',
      thresholdsTitle: 'خطرے کی جانچ کے متعین پیمانے',
      disclaimerTitle: 'سائنسی و عملی تنبیہ',
      disclaimerBody:
        'خطرے کے یہ اصول خلائی اور موسمیاتی ڈیٹا کو سادہ رہنمائی میں بدلنے کے لیے بنائے گئے ہیں۔ یہ سرکاری محکمہ موسمیات یا سول ڈیفنس کے انتباہات کا متبادل نہیں ہیں۔',
    },
  },
};

export function formatLocalTime(timestampMs: number, timezone: string, language: Language): string {
  try {
    return new Intl.DateTimeFormat(language === 'ur' ? 'ur-PK' : 'en-US', {
      timeZone: timezone || 'UTC',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(timestampMs));
  } catch {
    return new Date(timestampMs).toISOString().slice(11, 16) + ' UTC';
  }
}

export function formatRelativeTime(timestampMs: number | null, language: Language): string {
  if (!timestampMs) return '--';
  const diffMin = Math.max(0, Math.round((Date.now() - timestampMs) / 60000));
  if (language === 'ur') {
    if (diffMin < 1) return 'ابھی';
    if (diffMin < 60) return `${diffMin} منٹ پہلے`;
    const hrs = Math.round(diffMin / 60);
    return `${hrs} گھنٹے پہلے`;
  }
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const hrs = Math.round(diffMin / 60);
  return `${hrs}h ago`;
}

export function formatNumber(val: number, decimals = 1, language: Language = 'en'): string {
  try {
    return new Intl.NumberFormat(language === 'ur' ? 'ur-PK' : 'en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  } catch {
    return val.toFixed(decimals);
  }
}
