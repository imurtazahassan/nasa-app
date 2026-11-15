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
      return '#FC3D21';
    case 'warning':
      return '#F97316';
    case 'watch':
      return '#F59E0B';
    case 'nominal':
      return '#10B981';
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
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] border px-2 py-0.5 text-[12px] font-semibold tracking-tight"
      style={{
        color,
        borderColor: status === 'nodata' ? 'var(--line)' : `${color}45`,
        backgroundColor: status === 'nodata' ? 'var(--raised)' : `${color}14`,
      }}
    >
      <Icon className={iconClass} aria-hidden="true" />
      <span>{t.statuses[status]}</span>
    </span>
  );
};
