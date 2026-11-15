import React from 'react';

const STARS: Array<{ cx: number; cy: number; r: number; o: number }> = [
  { cx: 7, cy: 11, r: 0.9, o: 0.55 },
  { cx: 14, cy: 26, r: 0.7, o: 0.35 },
  { cx: 21, cy: 8, r: 1.1, o: 0.7 },
  { cx: 29, cy: 19, r: 0.6, o: 0.4 },
  { cx: 36, cy: 42, r: 0.8, o: 0.3 },
  { cx: 44, cy: 14, r: 1.0, o: 0.6 },
  { cx: 53, cy: 6, r: 0.7, o: 0.45 },
  { cx: 61, cy: 28, r: 0.9, o: 0.35 },
  { cx: 68, cy: 12, r: 1.2, o: 0.65 },
  { cx: 76, cy: 33, r: 0.6, o: 0.3 },
  { cx: 83, cy: 9, r: 0.8, o: 0.55 },
  { cx: 91, cy: 22, r: 1.0, o: 0.6 },
  { cx: 96, cy: 44, r: 0.7, o: 0.35 },
  { cx: 11, cy: 58, r: 0.8, o: 0.4 },
  { cx: 19, cy: 74, r: 1.1, o: 0.55 },
  { cx: 28, cy: 66, r: 0.7, o: 0.3 },
  { cx: 39, cy: 83, r: 0.9, o: 0.45 },
  { cx: 48, cy: 71, r: 0.6, o: 0.3 },
  { cx: 58, cy: 89, r: 1.1, o: 0.5 },
  { cx: 69, cy: 63, r: 0.8, o: 0.4 },
  { cx: 79, cy: 78, r: 1.0, o: 0.6 },
  { cx: 88, cy: 57, r: 0.7, o: 0.35 },
  { cx: 94, cy: 84, r: 0.9, o: 0.5 },
  { cx: 4, cy: 88, r: 1.0, o: 0.45 },
];

export const SpaceBackdrop: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="no-print pointer-events-none fixed inset-0 z-0 hidden overflow-hidden dark:block"
    >
      {/* Subtle Google Earth planetary atmospheric horizon glow */}
      <div
        className="absolute inset-x-0 -top-44 h-96 opacity-50"
        style={{
          background:
            'radial-gradient(65% 100% at 50% 0%, rgba(138, 180, 248, 0.14) 0%, rgba(26, 115, 232, 0.08) 45%, rgba(14, 16, 20, 0) 100%)',
        }}
      />

      {/* Calibrated starfield & orbital trajectory arcs */}
      <svg
        className="h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Faint orbital ellipse arcs */}
        <ellipse
          cx="50"
          cy="118"
          rx="72"
          ry="42"
          fill="none"
          stroke="rgba(138, 180, 248, 0.09)"
          strokeWidth="0.14"
        />
        <ellipse
          cx="50"
          cy="122"
          rx="84"
          ry="48"
          fill="none"
          stroke="rgba(148, 163, 184, 0.07)"
          strokeWidth="0.1"
          strokeDasharray="0.7 1.1"
        />

        {/* Sparse pinpoint starfield */}
        {STARS.map((s, idx) => (
          <circle
            key={idx}
            cx={s.cx}
            cy={s.cy}
            r={s.r * 0.11}
            fill="#E2EEFF"
            fillOpacity={s.o}
          />
        ))}
      </svg>
    </div>
  );
};
