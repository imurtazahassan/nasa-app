import React, { useState } from 'react';
import { ExternalLink, KeyRound, ShieldAlert, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const PROVENANCE_ROWS = [
  {
    metric: 'True Color & Thermal Imagery',
    instrument: 'NASA GIBS WMTS · Suomi NPP VIIRS (MODIS Terra fallback)',
    resolution: '250 m – 375 m',
    cadence: 'Daily (UTC)',
    url: 'https://nasa-gibs.github.io/gibs-api-docs/',
    nasa: true,
  },
  {
    metric: 'Active Fire Detections',
    instrument: 'NASA FIRMS VIIRS_SNPP_NRT + GIBS Thermal Anomalies',
    resolution: '375 m',
    cadence: 'Near Real-Time (< 3 hr)',
    url: 'https://firms.modaps.eosdis.nasa.gov/',
    nasa: true,
  },
  {
    metric: 'Natural Hazard Events',
    instrument: 'NASA EONET v3 (Wildfires, Floods, Severe Storms, Landslides)',
    resolution: 'Event-level',
    cadence: 'Continuous',
    url: 'https://eonet.gsfc.nasa.gov/docs/v3',
    nasa: true,
  },
  {
    metric: 'Root-Zone Soil Wetness & Precip',
    instrument: 'NASA POWER (MERRA-2 GWETROOT, GWETTOP, PRECTOTCORR, T2M_MAX)',
    resolution: '0.5° × 0.625°',
    cadence: 'Daily (2–4d lag)',
    url: 'https://power.larc.nasa.gov/docs/',
    nasa: true,
  },
  {
    metric: 'IMERG Precipitation Layer',
    instrument: 'NASA GIBS GPM IMERG_Precipitation_Rate',
    resolution: '0.1° (~10 km)',
    cadence: '30 min – Daily',
    url: 'https://gpm.nasa.gov/data/imerg',
    nasa: true,
  },
  {
    metric: 'Weather Forecast & Air Quality',
    instrument: 'Partner Data • Open-Meteo Forecast & CAMS US AQI / PM2.5',
    resolution: '11 km – 40 km',
    cadence: 'Hourly / Daily',
    url: 'https://open-meteo.com/en/docs',
    nasa: false,
  },
  {
    metric: 'River Discharge & Flood Model',
    instrument: 'Partner Data • Open-Meteo Global Flood (GloFAS v4)',
    resolution: '0.05° (~5 km)',
    cadence: 'Daily',
    url: 'https://open-meteo.com/en/docs/flood-api',
    nasa: false,
  },
];

export const MethodsDrawer: React.FC = () => {
  const { methodsOpen, setMethodsOpen, firmsApiKey, saveFirmsApiKey, t } = useApp();
  const [activeTab, setActiveTab] = useState<'data' | 'project'>('data');
  const [keyInput, setKeyInput] = useState(firmsApiKey);

  if (!methodsOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.methodsDrawer.title}
      className="no-print fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-xs"
    >
      <div className="flex h-full w-full max-w-2xl flex-col border-s border-[var(--line)] bg-[var(--surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3.5">
          <div>
            <h2 className="text-[18px] font-bold text-[var(--text)]">{t.methodsDrawer.title}</h2>
            <p className="text-[12px] text-[var(--muted)]">
              NASA Space Apps Challenge 2026 · Earth Observation for Local Community Resilience
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMethodsOpen(false)}
            aria-label={t.closeBtn}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[4px] border border-[var(--line)] bg-[var(--bg)] text-[var(--text)] hover:border-[var(--interactive)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Segmented Tabs */}
        <div className="border-b border-[var(--line)] bg-[var(--bg)] px-5 py-2">
          <div className="inline-flex rounded-[4px] border border-[var(--line)] bg-[var(--surface)] p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('data')}
              className={`rounded-[3px] px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ${
                activeTab === 'data'
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {t.methodsDrawer.tabData}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('project')}
              className={`rounded-[3px] px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ${
                activeTab === 'project'
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {t.methodsDrawer.tabProject}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-5 telemetry-scroll">
          {activeTab === 'data' ? (
            <>
              {/* Provenance Table */}
              <section className="space-y-2.5">
                <h3 className="text-[15px] font-semibold text-[var(--text)]">
                  Telemetry Provenance & Resolution Matrix
                </h3>
                <div className="overflow-x-auto rounded-[6px] border border-[var(--line)]">
                  <table className="w-full text-start text-[12px]">
                    <thead className="border-b border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]">
                      <tr>
                        <th className="px-3 py-2 text-start font-semibold">Metric</th>
                        <th className="px-3 py-2 text-start font-semibold">Spacecraft / Model</th>
                        <th className="px-3 py-2 text-start font-semibold">Resolution</th>
                        <th className="px-3 py-2 text-start font-semibold">Cadence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {PROVENANCE_ROWS.map((row) => (
                        <tr key={row.metric} className="hover:bg-[var(--raised)]">
                          <td className="px-3 py-2 font-medium text-[var(--text)]">{row.metric}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] font-semibold uppercase ${
                                  row.nasa ? 'text-[var(--interactive)]' : 'text-[var(--muted)]'
                                }`}
                              >
                                {row.nasa ? 'NASA' : 'Partner'}
                              </span>
                              <a
                                href={row.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[var(--text)] underline decoration-[var(--line)] hover:text-[var(--interactive)]"
                              >
                                <span>{row.instrument}</span>
                                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                              </a>
                            </div>
                          </td>
                          <td dir="ltr" className="whitespace-nowrap px-3 py-2 font-mono-tabular text-[var(--muted)]">
                            {row.resolution}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-[var(--muted)]">
                            {row.cadence}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Threshold Table */}
              <section className="space-y-2.5">
                <h3 className="text-[15px] font-semibold text-[var(--text)]">
                  {t.methodsDrawer.thresholdsTitle}
                </h3>
                <div className="overflow-x-auto rounded-[6px] border border-[var(--line)]">
                  <table className="w-full text-start text-[12px]">
                    <thead className="border-b border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]">
                      <tr>
                        <th className="px-3 py-2 text-start font-semibold">Module</th>
                        <th className="px-3 py-2 text-start font-semibold">Watch</th>
                        <th className="px-3 py-2 text-start font-semibold">Warning</th>
                        <th className="px-3 py-2 text-start font-semibold">Critical</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)] font-mono-tabular">
                      <tr>
                        <td className="px-3 py-2 font-sans font-medium">Wildfire Distance</td>
                        <td className="px-3 py-2">15–50 km</td>
                        <td className="px-3 py-2">5–15 km</td>
                        <td className="px-3 py-2">&lt; 5 km (or +1 if &ge;10 in 25 km)</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-sans font-medium">River Discharge Ratio</td>
                        <td className="px-3 py-2">&ge; 1.3× mean</td>
                        <td className="px-3 py-2">&ge; 2.0× mean</td>
                        <td className="px-3 py-2">&ge; 3.0× mean</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-sans font-medium">7d Rain / 3d Forecast</td>
                        <td className="px-3 py-2">&ge; 50 mm</td>
                        <td className="px-3 py-2">&ge; 100 mm (or EONET &lt;100km)</td>
                        <td className="px-3 py-2">&ge; 200 mm (7d)</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-sans font-medium">Soil Wetness (GWETROOT)</td>
                        <td className="px-3 py-2">0.25–0.40 or &gt;0.90</td>
                        <td className="px-3 py-2">0.15–0.24</td>
                        <td className="px-3 py-2">&lt; 0.15</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-sans font-medium">Air Quality (US AQI)</td>
                        <td className="px-3 py-2">101–150</td>
                        <td className="px-3 py-2">151–200</td>
                        <td className="px-3 py-2">&gt; 200</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Optional FIRMS MAP_KEY storage */}
              <section className="space-y-2 rounded-[6px] border border-[var(--line)] bg-[var(--bg)] p-3.5">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text)]">
                  <KeyRound className="h-4 w-4 text-[var(--interactive)]" aria-hidden="true" />
                  <span>{t.methodsDrawer.firmsKeyTitle}</span>
                </div>
                <p className="text-[12px] text-[var(--muted)]">{t.methodsDrawer.firmsKeyHelp}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder={t.methodsDrawer.firmsKeyPlaceholder}
                    className="h-9 min-w-[200px] flex-1 rounded-[4px] border border-[var(--line)] bg-[var(--surface)] px-3 font-mono-tabular text-[12px] text-[var(--text)] focus:border-[var(--interactive)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => saveFirmsApiKey(keyInput)}
                    className="h-9 rounded-[4px] bg-[var(--primary)] px-3 text-[12px] font-semibold text-white hover:opacity-90"
                  >
                    {t.methodsDrawer.saveKey}
                  </button>
                  {firmsApiKey && (
                    <button
                      type="button"
                      onClick={() => {
                        setKeyInput('');
                        saveFirmsApiKey('');
                      }}
                      className="h-9 rounded-[4px] border border-[var(--line)] bg-[var(--surface)] px-3 text-[12px] font-medium text-[var(--text)] hover:border-[var(--accent-red)]"
                    >
                      {t.methodsDrawer.clearKey}
                    </button>
                  )}
                </div>
              </section>

              {/* Scientific Disclaimer */}
              <section className="flex items-start gap-2.5 rounded-[6px] border border-[var(--status-watch)]/40 bg-[var(--status-watch)]/10 p-3.5">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-watch)]" aria-hidden="true" />
                <div className="space-y-1 text-[12px]">
                  <div className="font-semibold text-[var(--text)]">
                    {t.methodsDrawer.disclaimerTitle}
                  </div>
                  <p className="text-[var(--muted)]">{t.methodsDrawer.disclaimerBody}</p>
                </div>
              </section>
            </>
          ) : (
            <div className="space-y-5 text-[13px] leading-relaxed text-[var(--text)]">
              <section className="space-y-2 rounded-[6px] border border-[var(--line)] bg-[var(--bg)] p-4">
                <div className="font-mono-tabular text-[11px] font-semibold uppercase tracking-wide text-[var(--interactive)]">
                  NASA Space Apps Challenge 2026
                </div>
                <h3 className="text-[18px] font-bold">
                  Earth Observation for Local Community Resilience
                </h3>
                <p className="max-w-[68ch] text-[var(--muted)]">
                  EarthPulse bridges the last-mile gap between orbital Earth-observation archives
                  and everyday community decisions. Within five seconds, farmers, hikers,
                  emergency responders, and urban planners see local hazard severity, satellite
                  provenance, and concrete next steps in English or Urdu (RTL).
                </p>
              </section>

              <section className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[6px] border border-[var(--line)] bg-[var(--bg)] p-3.5">
                  <h4 className="font-semibold text-[var(--text)]">Multi-Sensor Data Fusion</h4>
                  <p className="mt-1 text-[12px] text-[var(--muted)]">
                    Combines NASA GIBS True Color, VIIRS 375m Thermal Anomalies, EONET v3 hazard
                    feeds, NASA POWER root-zone moisture, GPM IMERG precipitation, and Open-Meteo
                    GloFAS river discharge inside a zero-backend client architecture.
                  </p>
                </div>
                <div className="rounded-[6px] border border-[var(--line)] bg-[var(--bg)] p-3.5">
                  <h4 className="font-semibold text-[var(--text)]">
                    Deterministic Safety + Grounded AI
                  </h4>
                  <p className="mt-1 text-[12px] text-[var(--muted)]">
                    Hazard status is always computed deterministically from documented scientific
                    thresholds. Gemini 2.5 Flash strictly summarizes the active JSON telemetry
                    snapshot and degrades gracefully to a bilingual offline rule engine.
                  </p>
                </div>
              </section>

              <section className="rounded-[6px] border border-[var(--line)] bg-[var(--bg)] p-3.5">
                <h4 className="font-semibold text-[var(--text)]">
                  Last-Mile Field & Offline Accessibility
                </h4>
                <ul className="mt-2 list-disc space-y-1 ps-5 text-[12px] text-[var(--muted)]">
                  <li>Full English (LTR) and Urdu (RTL) translation with Noto Naskh Arabic.</li>
                  <li>Two-tier in-memory and localStorage telemetry caching with stale-age flags.</li>
                  <li>One-tap WhatsApp-ready field bulletins and 1-page ink-efficient print brief.</li>
                  <li>64 curated offline action checklists across 4 personas and 4 severity tiers.</li>
                </ul>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
