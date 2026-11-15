import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, RotateCcw } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useApp } from '../context/AppContext';
import { formatRelativeTime } from '../i18n/translations';
import type { ModuleEvaluation } from '../types/telemetry';
import { getStatusColor, StatusGlyph } from './StatusGlyph';

interface HazardModuleProps {
  evaluation: ModuleEvaluation;
  loading: boolean;
}

export const HazardModule: React.FC<HazardModuleProps> = ({ evaluation, loading }) => {
  const { t, language, retryModule, activeScenarioId } = useApp();
  const [expanded, setExpanded] = useState(false);

  const statusColor = getStatusColor(evaluation.status);
  const hazardTitle = t.hazards[evaluation.id];

  // Sequential Telemetry Lock / Systems Check skeleton
  if (loading) {
    return (
      <article className="relative overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--surface)]/95 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-display text-[15px] font-semibold text-[var(--text)]">
            {hazardTitle}
          </span>
          <span className="font-mono-tabular text-[11px] text-[var(--interactive)]">
            {t.acquiringStream}
          </span>
        </div>
        <div className="relative mt-3 h-[2px] w-full overflow-hidden rounded-full bg-[var(--raised)]">
          <div className="animate-telemetry-sweep h-full w-2/5 bg-[var(--interactive)]" />
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div className="h-7 w-24 rounded-[8px] bg-[var(--raised)]" />
          <div className="h-8 w-28 rounded-[8px] bg-[var(--raised)]" />
        </div>
      </article>
    );
  }

  return (
    <article className="relative overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--surface)]/95 p-4 pt-4 transition-colors duration-150">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ backgroundColor: statusColor }}
      />

      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-[16px] font-semibold text-[var(--text)]">{hazardTitle}</h2>
        <StatusGlyph status={evaluation.status} />
      </div>

      {/* Source unavailable partial failure state */}
      {evaluation.status === 'nodata' && evaluation.error ? (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-[4px] border border-[var(--line)] bg-[var(--bg)] p-2.5">
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-[var(--text)]">
              {t.sourceUnavailable}
            </div>
            <div className="truncate text-[11px] text-[var(--muted)]">{evaluation.error}</div>
          </div>
          {activeScenarioId === 'live' && (
            <button
              type="button"
              onClick={() => retryModule(evaluation.id)}
              className="inline-flex shrink-0 items-center gap-1 rounded-[4px] border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--text)] hover:border-[var(--interactive)]"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span>{t.retry}</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* KPI + 7-day Sparkline */}
          <div className="mt-2.5 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div dir="ltr" className="flex items-baseline gap-1.5">
                <span className="font-mono-tabular text-[30px] font-semibold leading-none tracking-tight text-[var(--text)]">
                  {evaluation.kpiDisplay}
                </span>
                <span className="font-mono-tabular text-[12px] font-medium text-[var(--muted)]">
                  {evaluation.kpiUnit}
                </span>
              </div>
            </div>

            {evaluation.sparkline.length > 0 && (
              <div dir="ltr" className="h-11 w-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evaluation.sparkline} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
                    <defs>
                      <linearGradient id={`grad-${evaluation.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={statusColor} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={statusColor} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--line)',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '11px',
                        color: 'var(--text)',
                      }}
                      itemStyle={{ color: 'var(--text)', padding: 0 }}
                      labelStyle={{ color: 'var(--muted)', marginBottom: '1px' }}
                      formatter={(val: unknown) => [
                        `${val} ${evaluation.sparklineUnit}`,
                        '',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={statusColor}
                      strokeWidth={1.75}
                      fill={`url(#grad-${evaluation.id})`}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Plain-language interpretation */}
          <p className="mt-2 max-w-[68ch] text-[13px] leading-snug text-[var(--muted)]">
            {evaluation.summary}
          </p>
        </>
      )}

      {/* Optional FIRMS fallback info note */}
      {evaluation.sourceNote && (
        <div className="mt-2 flex items-start gap-1.5 rounded-[4px] bg-[var(--bg)] px-2 py-1.5 text-[11px] text-[var(--muted)]">
          <Info className="mt-0.5 h-3 w-3 shrink-0 text-[var(--interactive)]" aria-hidden="true" />
          <span>{evaluation.sourceNote}</span>
        </div>
      )}

      {/* Provenance & Metadata Row */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-2 text-[11px] text-[var(--muted)]">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate font-medium text-[var(--text)]">
            {evaluation.provenanceLabel}
          </span>
          {evaluation.stale && (
            <span className="rounded-[4px] border border-[var(--status-watch)]/50 bg-[var(--status-watch)]/15 px-1.5 py-0.5 font-semibold text-[var(--status-watch)]">
              {t.staleBadge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 font-mono-tabular">
          {evaluation.observationDate && <span>{evaluation.observationDate}</span>}
          <span aria-hidden="true">·</span>
          <span>
            {t.updated} {formatRelativeTime(evaluation.updatedAt, language)}
          </span>
        </div>
      </div>

      {/* Expandable Telemetry & Rule Breakdown Accordion */}
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="flex w-full items-center justify-between rounded-[4px] px-1.5 py-1 text-[12px] font-medium text-[var(--interactive)] transition-colors duration-150 hover:bg-[var(--raised)]"
        >
          <span>{t.telemetryBreakdown}</span>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>

        {expanded && (
          <div className="mt-2 space-y-2.5 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] p-3 text-[12px]">
            {evaluation.rawInputs.length > 0 && (
              <div>
                <div className="mb-1 text-[11px] font-semibold text-[var(--muted)]">
                  {t.rawInputsLabel}
                </div>
                <dl className="space-y-1">
                  {evaluation.rawInputs.map((inp) => (
                    <div key={inp.label} className="flex items-center justify-between gap-2">
                      <dt className="text-[var(--muted)]">{inp.label}</dt>
                      <dd dir="ltr" className="font-mono-tabular font-medium text-[var(--text)]">
                        {inp.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {evaluation.rules.length > 0 && (
              <div className="border-t border-[var(--line)] pt-2">
                <div className="mb-1 text-[11px] font-semibold text-[var(--muted)]">
                  {t.rulesEvaluatedLabel}
                </div>
                <ul className="space-y-1.5">
                  {evaluation.rules.map((r) => (
                    <li key={r.label} className="space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-[var(--text)]">{r.label}</span>
                        <span
                          className={`rounded-[3px] px-1.5 py-0.5 font-mono-tabular text-[10px] font-semibold ${
                            r.triggered
                              ? 'bg-[var(--status-warning)]/15 text-[var(--status-warning)]'
                              : 'bg-[var(--raised)] text-[var(--muted)]'
                          }`}
                        >
                          {r.triggered ? t.triggered : t.notTriggered}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 font-mono-tabular text-[11px] text-[var(--muted)]">
                        <span dir="ltr">{r.value}</span>
                        <span dir="ltr" className="truncate">
                          {r.threshold}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
