import React from 'react';

export default function StatusBadge({ status }) {
  const map = {
    active:    'bg-accent/10 text-accent border-accent/20',
    occupied:  'bg-accent/10 text-accent border-accent/20',
    completed: 'bg-available/10 text-available border-available/20',
    available: 'bg-available/10 text-available border-available/20',
    abandoned: 'bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--text-muted)]/20',
  };
  const label = {
    active: 'ACTIVE', occupied: 'ACTIVE',
    completed: 'COMPLETED', available: 'AVAILABLE',
    abandoned: 'ABANDONED',
  };
  const cls = map[status] || 'bg-border text-[var(--text-muted)] border-border';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] tracking-wide uppercase font-semibold border ${cls}`}>
      {label[status] ?? status?.toUpperCase()}
    </span>
  );
}
