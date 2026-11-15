import React from 'react';
import {
  CircleCheck,
  Diamond,
  MinusSquare,
  OctagonAlert,
  TriangleAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { SeverityStatus } from '../types/telemetry';

export function getStatusColor(status: SeverityStatus): string {
  switch (status) {
    case 'critical':
      return '#EA4335';
    case 'warning':
      return '#FA7B17';
    case 'watch':
      return '#FBBC04';
    case 'nominal':
      return '#34A853';
    default:
      return 'var(--muted)';
  }
}

export const StatusGlyph: React.FC<{
  status: SeverityStatus;
  size?: 'sm' | 'md';
}> = ({ status, size = 'sm' }) => {
  const { t } = useApp();
  const color = getStatusColor(status);
  const iconClass = size === 'md' ? 'h-4 w-4 shrink-0' : 'h-3.5 w-3.5 shrink-0';

  const Icon =
    status === 'critical'
      ? OctagonAlert
      : status === 'warning'
      ? Diamond
      : status === 'watch'
      ? TriangleAlert
      : status === 'nominal'
      ? CircleCheck
      : MinusSquare;

  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] font-semibold tracking-tight"
      style={{ color }}
    >
      <Icon className={iconClass} aria-hidden="true" />
      <span>{t.statuses[status]}</span>
    </span>
  );
};
