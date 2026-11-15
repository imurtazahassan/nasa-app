import React, { useState } from 'react';
import {
  Activity,
  CheckSquare,
  FlaskConical,
  Map as MapIcon,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { ActionPlanPanel } from './components/ActionPlanPanel';
import { BriefPanel } from './components/BriefPanel';
import { ChatPanel } from './components/ChatPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HazardModule } from './components/HazardModule';
import { MapView } from './components/MapView';
import { MethodsDrawer } from './components/MethodsDrawer';
import { StatusBanner } from './components/StatusBanner';
import { TopBar } from './components/TopBar';
import { getActionPlanSteps } from './content/actionPlans';
import { AppProvider, useApp } from './context/AppContext';
import { formatCoordinates, isInsidePakistan } from './utils/geo';

const WorkspaceContent: React.FC = () => {
  const {
    location,
    radiusKm,
    persona,
    language,
    t,
    assessment,
    loadingModules,
    activeScenarioId,
    selectDemoScenario,
    rightTab,
    setRightTab,
    mobileTab,
    setMobileTab,
    brief,
    localTimeStr,
    toast,
  } = useApp();

  const [mobileBriefMode, setMobileBriefMode] = useState<'brief' | 'actions'>('brief');
  const inPakistan = isInsidePakistan(location.lat, location.lon);
  const emergencyText = inPakistan ? t.footer.emergencyPk : t.footer.emergencyGlobal;

  const printActions = getActionPlanSteps(
    language,
    persona,
    assessment.topHazard,
    assessment.overallStatus
  );

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      {/* Demo Scenario Active Banner */}
      {activeScenarioId !== 'live' && (
        <div className="no-print flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--status-warning)]/40 bg-[var(--status-warning)]/15 px-4 py-1.5 text-[12px]">
          <div className="flex items-center gap-2 font-semibold text-[var(--status-warning)]">
            <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t.demoBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => selectDemoScenario('live')}
            className="rounded-[4px] border border-[var(--status-warning)] bg-[var(--surface)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--text)] hover:bg-[var(--raised)]"
          >
            {t.switchToLive}
          </button>
        </div>
      )}

      {/* Top Command Bar */}
      <TopBar />

      {/* Desktop 3-Column Aerospace Telemetry Workspace (>= 1024px) */}
      <main className="no-print hidden min-h-0 flex-1 grid-cols-[410px_1fr_380px] gap-3 p-3 lg:grid">
        {/* Left Telemetry Rail */}
        <aside className="flex min-h-0 flex-col overflow-y-auto pe-1 telemetry-scroll">
          <div className="space-y-3 pb-3">
            <StatusBanner />
            {assessment.orderedModuleIds.map((id) => (
              <HazardModule
                key={id}
                evaluation={assessment.modules[id]}
                loading={loadingModules[id]}
              />
            ))}
          </div>
          <footer className="mt-auto border-t border-[var(--line)] pt-2.5 text-[11px] leading-snug text-[var(--muted)]">
            {t.footer.competition}
          </footer>
        </aside>

        {/* Center Earth Observation Viewport */}
        <section className="min-h-0 min-w-0">
          <ErrorBoundary title="Satellite Viewport">
            <MapView />
          </ErrorBoundary>
        </section>

        {/* Right Intelligence Deck */}
        <aside className="flex min-h-0 flex-col rounded-[6px] border border-[var(--line)] bg-[var(--surface)]">
          <ErrorBoundary title="Intelligence Deck">
            {/* Segmented Tab Bar */}
            <div className="shrink-0 border-b border-[var(--line)] p-2">
              <div className="grid grid-cols-3 gap-1 rounded-[4px] border border-[var(--line)] bg-[var(--bg)] p-0.5">
                <button
                  type="button"
                  onClick={() => setRightTab('brief')}
                  className={`flex items-center justify-center gap-1.5 rounded-[3px] py-1.5 text-[12px] font-medium transition-colors duration-150 ${
                    rightTab === 'brief'
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.tabs.brief}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRightTab('ask')}
                  className={`flex items-center justify-center gap-1.5 rounded-[3px] py-1.5 text-[12px] font-medium transition-colors duration-150 ${
                    rightTab === 'ask'
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.tabs.ask}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRightTab('actions')}
                  className={`flex items-center justify-center gap-1.5 rounded-[3px] py-1.5 text-[12px] font-medium transition-colors duration-150 ${
                    rightTab === 'actions'
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.tabs.actions}</span>
                </button>
              </div>
            </div>

            {/* Active Panel Body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-3.5 telemetry-scroll">
              {rightTab === 'brief' && <BriefPanel />}
              {rightTab === 'ask' && <ChatPanel />}
              {rightTab === 'actions' && <ActionPlanPanel />}
            </div>

            {/* Persistent Safety Disclaimer Footer */}
            <footer className="shrink-0 border-t border-[var(--line)] bg-[var(--bg)] px-3.5 py-2.5 text-[11px] leading-snug text-[var(--muted)]">
              <p>{t.footer.safety}</p>
              <p className="mt-0.5 font-semibold text-[var(--text)]">{emergencyText}</p>
            </footer>
          </ErrorBoundary>
        </aside>
      </main>

      {/* Mobile & Tablet Workspace (< 1024px) */}
      <main className="no-print relative flex min-h-0 flex-1 flex-col lg:hidden">
        <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-20 telemetry-scroll">
          {mobileTab === 'status' && (
            <div className="space-y-3">
              <StatusBanner />
              {assessment.orderedModuleIds.map((id) => (
                <HazardModule
                  key={id}
                  evaluation={assessment.modules[id]}
                  loading={loadingModules[id]}
                />
              ))}
              <footer className="border-t border-[var(--line)] pt-2 text-[11px] text-[var(--muted)]">
                <p>{t.footer.competition}</p>
                <p className="mt-1 font-semibold text-[var(--text)]">{emergencyText}</p>
              </footer>
            </div>
          )}

          {mobileTab === 'map' && (
            <div className="h-[calc(100dvh-144px)] min-h-[380px]">
              <ErrorBoundary title="Satellite Viewport">
                <MapView />
              </ErrorBoundary>
            </div>
          )}

          {mobileTab === 'brief' && (
            <div className="space-y-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-3.5">
              <div className="grid grid-cols-2 gap-1 rounded-[4px] border border-[var(--line)] bg-[var(--bg)] p-0.5">
                <button
                  type="button"
                  onClick={() => setMobileBriefMode('brief')}
                  className={`min-h-[40px] rounded-[3px] text-[13px] font-medium ${
                    mobileBriefMode === 'brief'
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--muted)]'
                  }`}
                >
                  {t.tabs.brief}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileBriefMode('actions')}
                  className={`min-h-[40px] rounded-[3px] text-[13px] font-medium ${
                    mobileBriefMode === 'actions'
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--muted)]'
                  }`}
                >
                  {t.tabs.actions}
                </button>
              </div>
              {mobileBriefMode === 'brief' ? <BriefPanel /> : <ActionPlanPanel />}
              <footer className="border-t border-[var(--line)] pt-2 text-[11px] text-[var(--muted)]">
                <p>{t.footer.safety}</p>
                <p className="mt-0.5 font-semibold text-[var(--text)]">{emergencyText}</p>
              </footer>
            </div>
          )}

          {mobileTab === 'ask' && (
            <div className="flex h-[calc(100dvh-144px)] flex-col rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-3.5">
              <ErrorBoundary title="Ask EarthPulse">
                <ChatPanel />
              </ErrorBoundary>
            </div>
          )}
        </div>

        {/* Fixed Bottom Navigation Dock (60px height, >= 44px touch targets) */}
        <nav
          aria-label="Mobile Navigation"
          className="fixed bottom-0 end-0 start-0 z-40 grid h-[60px] grid-cols-4 border-t border-[var(--line)] bg-[var(--surface)] px-1"
        >
          {(
            [
              { id: 'status', label: t.tabs.status, Icon: Activity },
              { id: 'map', label: t.tabs.map, Icon: MapIcon },
              { id: 'brief', label: t.tabs.brief, Icon: Sparkles },
              { id: 'ask', label: t.tabs.ask, Icon: MessageSquare },
            ] as const
          ).map(({ id, label, Icon }) => {
            const active = mobileTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setMobileTab(id)}
                className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors duration-150 ${
                  active ? 'text-[var(--interactive)]' : 'text-[var(--muted)]'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </main>

      {/* Printable 1-Page Field Brief (Print Only) */}
      <section className="print-only hidden p-4 text-black">
        <div className="flex items-start justify-between border-b-2 border-black pb-3">
          <div>
            <h1 className="text-2xl font-bold">EarthPulse — Field Hazard Brief</h1>
            <p className="text-sm">
              {location.name}
              {location.country ? `, ${location.country}` : ''} ·{' '}
              <span className="font-mono-tabular">
                {formatCoordinates(location.lat, location.lon)}
              </span>{' '}
              · Radius: {radiusKm} km
            </p>
          </div>
          <div className="text-end text-xs">
            <div className="font-bold uppercase">
              Overall Status: {t.statuses[assessment.overallStatus]}
            </div>
            <div>Persona: {t.personas[persona]}</div>
            <div className="font-mono-tabular">Local Time: {localTimeStr}</div>
          </div>
        </div>

        <div className="my-4 rounded border border-gray-400 p-3">
          <div className="text-sm font-bold">{brief.headline}</div>
          <p className="mt-1 text-xs">{brief.summary}</p>
        </div>

        <h2 className="mb-2 text-sm font-bold uppercase">Telemetry Summary</h2>
        <table className="mb-4 w-full border-collapse border border-gray-400 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-2 py-1.5 text-start">Hazard</th>
              <th className="border border-gray-400 px-2 py-1.5 text-start">Status</th>
              <th className="border border-gray-400 px-2 py-1.5 text-start">Reading</th>
              <th className="border border-gray-400 px-2 py-1.5 text-start">Source</th>
            </tr>
          </thead>
          <tbody>
            {assessment.orderedModuleIds.map((id) => {
              const m = assessment.modules[id];
              return (
                <tr key={id}>
                  <td className="border border-gray-400 px-2 py-1.5 font-semibold">
                    {t.hazards[id]}
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5 uppercase">
                    {t.statuses[m.status]}
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5 font-mono-tabular">
                    {m.kpiDisplay} {m.kpiUnit}
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5">{m.provenanceLabel}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <h2 className="mb-2 text-sm font-bold uppercase">Recommended Field Actions</h2>
        <ul className="mb-4 list-disc space-y-1 ps-5 text-xs">
          {printActions.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ul>

        <footer className="border-t border-gray-400 pt-2 text-[11px]">
          <p>{t.footer.competition}</p>
          <p className="font-semibold">
            {t.footer.safety} {emergencyText}
          </p>
        </footer>
      </section>

      {/* Mission & Methods Drawer */}
      <MethodsDrawer />

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-20 start-1/2 z-50 -translate-x-1/2 rounded-[4px] border border-[var(--interactive)] bg-[var(--surface)] px-4 py-2 text-[13px] font-medium text-[var(--text)] shadow-xl lg:bottom-5"
        >
          {toast}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <WorkspaceContent />
    </AppProvider>
  );
}
