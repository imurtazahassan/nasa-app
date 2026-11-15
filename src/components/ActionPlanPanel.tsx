import React, { useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { getActionPlanSteps } from '../content/actionPlans';
import { useApp } from '../context/AppContext';
import { StatusGlyph } from './StatusGlyph';

export const ActionPlanPanel: React.FC = () => {
  const { persona, language, assessment, t } = useApp();
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--text)]">{t.actionsPanel.title}</h2>
          <p className="mt-0.5 text-[12px] text-[var(--muted)]">{t.actionsPanel.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setChecked({})}
          className="inline-flex shrink-0 items-center gap-1 rounded-[4px] border border-[var(--line)] bg-[var(--bg)] px-2 py-1 text-[11px] font-medium text-[var(--muted)] hover:text-[var(--text)]"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          <span>{t.actionsPanel.resetChecklist}</span>
        </button>
      </div>

      <div className="space-y-3">
        {assessment.orderedModuleIds.map((hazardId) => {
          const mod = assessment.modules[hazardId];
          const steps = getActionPlanSteps(language, persona, hazardId, mod.status);

          return (
            <section
              key={hazardId}
              className="rounded-[6px] border border-[var(--line)] bg-[var(--bg)] p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-[14px] font-semibold text-[var(--text)]">
                  {t.hazards[hazardId]}
                </h3>
                <StatusGlyph status={mod.status} />
              </div>

              <ul className="space-y-1.5">
                {steps.map((step, idx) => {
                  const key = `${persona}:${hazardId}:${mod.status}:${idx}`;
                  const isDone = Boolean(checked[key]);

                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => toggleItem(key)}
                        className="flex w-full items-start gap-2.5 rounded-[4px] p-1.5 text-start text-[12.5px] leading-snug transition-colors duration-150 hover:bg-[var(--raised)]"
                      >
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border ${
                            isDone
                              ? 'border-[var(--status-nominal)] bg-[var(--status-nominal)] text-white'
                              : 'border-[var(--line)] bg-[var(--surface)]'
                          }`}
                        >
                          {isDone && <Check className="h-3 w-3" aria-hidden="true" />}
                        </span>
                        <span
                          className={
                            isDone
                              ? 'text-[var(--muted)] line-through'
                              : 'text-[var(--text)]'
                          }
                        >
                          {step}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
};
