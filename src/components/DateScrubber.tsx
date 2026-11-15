import React from 'react';
import { Box, Calendar, ChevronLeft, ChevronRight, Map as MapIcon, Table2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export type ViewportMode = 'map' | '3d' | 'table';

interface DateScrubberProps {
  viewMode: ViewportMode;
  onChangeViewMode: (mode: ViewportMode) => void;
}

export const DateScrubber: React.FC<DateScrubberProps> = ({ viewMode, onChangeViewMode }) => {
  const { selectedDateOffset, setSelectedDateOffset, imageryDateIso, t } = useApp();

  const offsetLabel =
    selectedDateOffset === 0
      ? t.mapLayers.todayUtc
      : selectedDateOffset === -1
      ? t.mapLayers.yesterdayUtc
      : `T${selectedDateOffset}d`;

  return (
    <div
      dir="ltr"
      className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-[var(--line)] bg-[var(--hud)] px-3.5 py-2 shadow-xl backdrop-blur-md sm:rounded-full"
    >
      <div className="flex items-center gap-2">
        <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--interactive)]" aria-hidden="true" />
        <div className="flex items-center gap-1.5 font-mono-tabular text-[12px]">
          <span className="font-semibold text-[var(--text)]">{imageryDateIso}</span>
          <span className="text-[var(--muted)]">·</span>
          <span className="text-[var(--muted)]">{offsetLabel}</span>
        </div>
      </div>

      {/* 7-day slider + step buttons */}
      <div className="flex min-w-[140px] flex-1 items-center gap-2 sm:max-w-[230px]">
        <button
          type="button"
          onClick={() => setSelectedDateOffset(Math.max(-6, selectedDateOffset - 1))}
          disabled={selectedDateOffset <= -6}
          aria-label="Previous day"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] disabled:opacity-40 hover:border-[var(--interactive)]"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </button>

        <input
          type="range"
          min={-6}
          max={0}
          step={1}
          value={selectedDateOffset}
          onChange={(e) => setSelectedDateOffset(Number(e.target.value))}
          aria-label={t.mapLayers.imageryDate}
          className="h-1.5 flex-1 cursor-pointer accent-[var(--interactive)]"
        />

        <button
          type="button"
          onClick={() => setSelectedDateOffset(Math.min(0, selectedDateOffset + 1))}
          disabled={selectedDateOffset >= 0}
          aria-label="Next day"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] disabled:opacity-40 hover:border-[var(--interactive)]"
        >
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* 3-Way Viewport Mode Switcher: 2D Satellite Map | 3D Terrain & Orbit | Detections Table */}
      <div
        role="group"
        aria-label="Viewport mode"
        className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] p-0.5"
      >
        <button
          type="button"
          onClick={() => onChangeViewMode('map')}
          className={`inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[11px] font-medium transition-colors duration-150 ${
            viewMode === 'map'
              ? 'bg-[var(--primary)] text-white'
              : 'text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          <MapIcon className="h-3 w-3" aria-hidden="true" />
          <span>{t.mapLayers.mapToggle}</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeViewMode('3d')}
          className={`inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[11px] font-medium transition-colors duration-150 ${
            viewMode === '3d'
              ? 'bg-[var(--primary)] text-white'
              : 'text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          <Box className="h-3 w-3" aria-hidden="true" />
          <span>{t.mapLayers.threeDScene}</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeViewMode('table')}
          className={`inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[11px] font-medium transition-colors duration-150 ${
            viewMode === 'table'
              ? 'bg-[var(--primary)] text-white'
              : 'text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          <Table2 className="h-3 w-3" aria-hidden="true" />
          <span>{t.mapLayers.tableToggle}</span>
        </button>
      </div>
    </div>
  );
};
