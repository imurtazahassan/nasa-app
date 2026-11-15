import React from 'react';
import { AlertCircle, CheckSquare, Cpu, RefreshCw, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BriefPanel: React.FC = () => {
  const { brief, briefLoading, refreshBrief, t } = useApp();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-[16px] font-semibold text-[var(--text)]">{t.briefPanel.title}</h2>
          <span
            className={`inline-flex items-center gap-1 rounded-[4px] border px-2 py-0.5 text-[11px] font-medium ${
              brief.mode === 'gemini'
                ? 'border-[var(--interactive)]/40 bg-[var(--interactive)]/10 text-[var(--interactive)]'
                : 'border-[var(--line)] bg-[var(--raised)] text-[var(--muted)]'
            }`}
          >
            <Cpu className="h-3 w-3" aria-hidden="true" />
            <span>
              {brief.mode === 'gemini' ? t.briefPanel.geminiBadge : t.briefPanel.offlineBadge}
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={refreshBrief}
          disabled={briefLoading}
          className="inline-flex h-7 items-center gap-1 rounded-[4px] border border-[var(--line)] bg-[var(--bg)] px-2 text-[11px] font-medium text-[var(--text)] hover:border-[var(--interactive)] disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3 w-3 ${briefLoading ? 'animate-spin text-[var(--interactive)]' : ''}`}
            aria-hidden="true"
          />
          <span>{briefLoading ? t.briefPanel.generating : t.briefPanel.regenerate}</span>
        </button>
      </div>

      {/* Headline & Summary */}
      <div className="space-y-2 rounded-[6px] border border-[var(--line)] bg-[var(--bg)] p-3.5">
        <h3 className="text-balance text-[16px] font-bold leading-snug text-[var(--text)]">
          {brief.headline}
        </h3>
        <p className="max-w-[68ch] text-[13px] leading-relaxed text-[var(--muted)]">
          {brief.summary}
        </p>
      </div>

      {/* Top 3 Imperative Actions */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text)]">
          <CheckSquare className="h-3.5 w-3.5 text-[var(--interactive)]" aria-hidden="true" />
          <span>{t.briefPanel.topActionsTitle}</span>
        </div>
        <ol className="space-y-2">
          {brief.topActions.map((act, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 rounded-[6px] border border-[var(--line)] bg-[var(--bg)] p-2.5 text-[13px] leading-snug text-[var(--text)]"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] bg-[var(--primary)] font-mono-tabular text-[11px] font-semibold text-white">
                {idx + 1}
              </span>
              <span>{act}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Data Gaps / Latency Notes */}
      <div className="space-y-1.5 border-t border-[var(--line)] pt-3">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--muted)]">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t.briefPanel.dataGapsTitle}</span>
        </div>
        {brief.dataGaps.length === 0 ? (
          <p className="text-[12px] text-[var(--muted)]">{t.briefPanel.noGaps}</p>
        ) : (
          <ul className="space-y-1">
            {brief.dataGaps.map((gap, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-[12px] text-[var(--muted)]">
                <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0 text-[var(--status-watch)]" aria-hidden="true" />
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
