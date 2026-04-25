import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  const fetchStats = () => {
    adminApi.getDashboard().then(res => setStats(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div className="animate-pulse bg-bg-surface h-24 rounded-xl w-full border border-bg-border"></div>;

  const cards = [
    { label: "Total Slots", value: stats.totalSlots },
    { label: "Available", value: stats.availableSlots },
    { label: "Occupied", value: stats.occupiedSlots },
    { label: "Active Sessions", value: stats.activeSessions },
    { label: "Today's Revenue", value: `NPR ${stats.todayRevenue}` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {cards.map((c, i) => (
        <div key={i} className="bg-bg-surface border border-bg-border rounded-xl p-5">
          <p className="text-[10px] tracking-widest text-text-muted uppercase mb-2">{c.label}</p>
          <h4 className="text-2xl font-bold text-text-primary">{c.value}</h4>
        </div>
      ))}
    </div>
  );
}
