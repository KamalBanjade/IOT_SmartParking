import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { LayoutGrid, Car, CheckSquare, Activity, DollarSign, TrendingUp, Zap, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await adminApi.getDashboard();
      setStats(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      <QuickStat 
        icon={<LayoutGrid className="w-5 h-5" />} 
        label="Total Capacity" 
        value={stats.totalSlots ?? 0} 
        sub="Configured Slots"
        color="text-accent" 
      />
      <QuickStat 
        icon={<CheckSquare className="w-5 h-5" />} 
        label="Available Now" 
        value={stats.availableSlots ?? 0} 
        sub="Ready for entry"
        color="text-available" 
      />
      <QuickStat 
        icon={<Activity className="w-5 h-5" />} 
        label="Active Sessions" 
        value={stats.activeSessions ?? 0} 
        sub="Vehicles on-site"
        color="text-pending" 
      />
      <QuickStat 
        icon={<TrendingUp className="w-5 h-5" />} 
        label="Today's Revenue" 
        value={`NPR ${stats.todayRevenue ?? 0}`} 
        sub="Settled payments"
        color="text-available" 
      />
      <QuickStat 
        icon={<DollarSign className="w-5 h-5" />} 
        label="Gross Lifetime" 
        value={`NPR ${stats.totalRevenue ?? 0}`} 
        sub="Total earnings"
        color="text-admin" 
      />
    </div>
  );
}

function QuickStat({ icon, label, value, sub, color }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] p-6 rounded-[2rem] shadow-xl hover:shadow-2xl hover:border-accent/20 transition-all group">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2.5 rounded-xl bg-[var(--bg-elevated)] ${color} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none">{label}</span>
          <span className="text-[9px] font-bold text-[var(--text-muted)] mt-1 opacity-60">{sub}</span>
        </div>
      </div>
      <p className="text-2xl font-black text-[var(--text-primary)] font-mono tracking-tighter">{value}</p>
    </div>
  );
}
