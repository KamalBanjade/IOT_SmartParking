import React from 'react';

export default function StatusBadge({ status }) {
  let colorClasses = '';
  switch (status) {
    case 'active':
    case 'occupied':
      colorClasses = 'text-blue-400 bg-blue-400/10';
      break;
    case 'available':
    case 'completed':
      colorClasses = 'text-green-400 bg-green-400/10';
      break;
    case 'abandoned':
      colorClasses = 'text-neutral-400 bg-neutral-400/10';
      break;
    default:
      colorClasses = 'text-neutral-400 bg-neutral-400/10';
  }

  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] tracking-wide uppercase font-medium ${colorClasses}`}>
      {status === 'completed' ? 'COMPLETED' : status === 'occupied' ? 'ACTIVE' : status.toUpperCase()}
    </span>
  );
}
