import React from 'react';
import {
  CloudRain,
  Compass,
  Printer,
  Share2,
  Thermometer,
  WifiOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatNumber } from '../i18n/translations';
import { formatCoordinates } from '../utils/geo';
import { buildWhatsAppAlertText, shareOrCopyAlert } from '../utils/share';
import { getStatusColor, StatusGlyph } from './StatusGlyph';

export const StatusBanner: React.FC = () => {
  const {
    location,
    radiusKm,
    persona,
    language,
    t,
    assessment,
    brief,
    localTimeStr,
    activeScenarioId,
    isOnline,
    showToast,
  } = useApp();

  const statusColor = getStatusColor(assessment.overallStatus);
  const topModule = assessment.modules[assessment.topHazard];
  const insights = assessment.personaInsights;

  const handleShare = async () => {
    const text = buildWhatsAppAlertText({
      location,
      localTimeStr,
      persona,
      language,
      assessment,
      topActions: brief.topActions,
      isDemo: activeScenarioId !== 'live',
    });
    const result = await shareOrCopyAlert(`EarthPulse: ${location.name}`, text);
    if (result === 'shared') {
      showToast(t.sharedToast);
    } else if (result === 'copied') {
      showToast(t.copiedToast);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section
      aria-live="polite"
      className="space-y-3 rounded-[6px] border border-[var(--line)] border-s-4 bg-[var(--surface)] p-3.5"
      style={{ borderInlineStartColor: statusColor }}
    >
      {/* Top metadata line */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[12px] text-[var(--muted)]">
            <span>{t.overallStatusLabel}</span>
            <span aria-hidden="true">·</span>
            <span dir="ltr" className="font-mono-tabular">
              {radiusKm} km
            </span>
          </div>
          <h1 className="mt-0.5 truncate text-[18px] font-bold tracking-tight text-[var(--text)]">
            {location.name}
            {location.country ? (
              <span className="ms-1.5 text-[14px] font-normal text-[var(--muted)]">
                {location.country}
              </span>
            ) : null}
          </h1>
        </div>
        <StatusGlyph status={assessment.overallStatus} size="md" />
      </div>

      {/* Offline notice */}
      {!isOnline && (
        <div className="flex items-center gap-2 rounded-[4px] border border-[var(--status-watch)]/40 bg-[var(--status-watch)]/10 px-2.5 py-1.5 text-[12px] text-[var(--text)]">
          <WifiOff className="h-3.5 w-3.5 shrink-0 text-[var(--status-watch)]" aria-hidden="true" />
          <span>
            {t.footer.offlineCacheNotice} {localTimeStr}
          </span>
        </div>
      )}

      {/* Plain-language summary */}
      <p className="max-w-[68ch] text-[13px] leading-relaxed text-[var(--text)]">
        {topModule.summary}
      </p>

      {/* Coordinates & Local observation timestamp */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-2.5 text-[12px] text-[var(--muted)]">
        <span dir="ltr" className="font-mono-tabular">
          {formatCoordinates(location.lat, location.lon)}
        </span>
        <span className="font-mono-tabular">
          {t.localObservationTime}: {localTimeStr}
        </span>
      </div>

      {/* Share & Print actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[4px] bg-[var(--primary)] px-3 text-[12px] font-semibold text-white transition-opacity duration-150 hover:opacity-90"
        >
          <Share2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{t.shareAlert}</span>
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-[4px] border border-[var(--line)] bg-[var(--bg)] px-3 text-[12px] font-medium text-[var(--text)] transition-colors duration-150 hover:border-[var(--interactive)] hover:bg-[var(--raised)]"
        >
          <Printer className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" aria-hidden="true" />
          <span>{t.printBrief}</span>
        </button>
      </div>

      {/* Persona-specific contextual callout */}
      {persona === 'farmer' && (
        <div className="rounded-[4px] border border-[var(--line)] bg-[var(--bg)] p-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text)]">
              <CloudRain className="h-3.5 w-3.5 text-[var(--interactive)]" aria-hidden="true" />
              <span>{t.personaCallouts.farmerTitle}</span>
            </div>
            <span dir="ltr" className="font-mono-tabular text-[13px] font-semibold text-[var(--text)]">
              {insights.farmer14dPrecipMm !== null
                ? `${formatNumber(insights.farmer14dPrecipMm, 1, language)} mm`
                : '--'}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-[var(--muted)]">{t.personaCallouts.farmerDesc}</p>
        </div>
      )}

      {persona === 'hiker' && (
        <div className="flex items-center justify-between gap-2 rounded-[4px] border border-[var(--line)] bg-[var(--bg)] p-2.5">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text)]">
            <Thermometer
              className={`h-3.5 w-3.5 ${
                insights.hikerHeatLevel === 'danger'
                  ? 'text-[var(--status-critical)]'
                  : insights.hikerHeatLevel === 'caution'
                  ? 'text-[var(--status-watch)]'
                  : 'text-[var(--interactive)]'
              }`}
              aria-hidden="true"
            />
            <span>{t.personaCallouts.hikerHeatLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span dir="ltr" className="font-mono-tabular text-[13px] font-semibold text-[var(--text)]">
              {insights.hikerPeakTempC !== null
                ? `${formatNumber(insights.hikerPeakTempC, 1, language)}°C`
                : '--'}
            </span>
            <span
              className={`rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold ${
                insights.hikerHeatLevel === 'danger'
                  ? 'bg-[var(--status-critical)]/15 text-[var(--status-critical)]'
                  : insights.hikerHeatLevel === 'caution'
                  ? 'bg-[var(--status-watch)]/15 text-[var(--status-watch)]'
                  : 'bg-[var(--raised)] text-[var(--muted)]'
              }`}
            >
              {insights.hikerHeatLevel === 'danger'
                ? t.personaCallouts.heatDanger
                : insights.hikerHeatLevel === 'caution'
                ? t.personaCallouts.heatCaution
                : t.personaCallouts.heatNormal}
            </span>
          </div>
        </div>
      )}

      {persona === 'responder' && (
        <div className="rounded-[4px] border border-[var(--line)] bg-[var(--bg)] p-2.5">
          <div className="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-[var(--text)]">
            <span className="flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-[var(--interactive)]" aria-hidden="true" />
              <span>{t.personaCallouts.responderTitle}</span>
            </span>
            <span className="font-mono-tabular text-[var(--muted)]">
              {insights.responderIncidents.length}
            </span>
          </div>
          {insights.responderIncidents.length === 0 ? (
            <p className="text-[12px] text-[var(--muted)]">{t.personaCallouts.noIncidents}</p>
          ) : (
            <ul className="max-h-32 space-y-1 overflow-y-auto telemetry-scroll">
              {insights.responderIncidents.slice(0, 6).map((inc) => (
                <li
                  key={inc.id}
                  className="flex items-center justify-between gap-2 border-t border-[var(--line)] pt-1 text-[12px]"
                >
                  <span className="truncate text-[var(--text)]">{inc.title}</span>
                  <span
                    dir="ltr"
                    className="shrink-0 font-mono-tabular text-[11px] text-[var(--muted)]"
                  >
                    {inc.distanceKm.toFixed(1)} km · {inc.bearingCardinal}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {persona === 'planner' && (
        <div className="rounded-[4px] border border-[var(--line)] bg-[var(--bg)] p-2.5">
          <div className="mb-2 text-[12px] font-semibold text-[var(--text)]">
            {t.personaCallouts.plannerTitle}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-[11px] text-[var(--muted)]">{t.personaCallouts.thermal30d}</div>
              <div dir="ltr" className="font-mono-tabular text-[14px] font-semibold text-[var(--text)]">
                {insights.plannerThermalCount30d}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[var(--muted)]">
                {t.personaCallouts.badAirDays30d}
              </div>
              <div dir="ltr" className="font-mono-tabular text-[14px] font-semibold text-[var(--text)]">
                {insights.plannerBadAirDays30d !== null ? insights.plannerBadAirDays30d : '--'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[var(--muted)]">{t.personaCallouts.rain30d}</div>
              <div dir="ltr" className="font-mono-tabular text-[14px] font-semibold text-[var(--text)]">
                {insights.plannerRain30dMm !== null
                  ? `${formatNumber(insights.plannerRain30dMm, 0, language)} mm`
                  : '--'}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
