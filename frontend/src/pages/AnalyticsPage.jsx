import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/shared/SidebarLayout';
import { adminApi } from '../services/api';
import { format } from 'date-fns';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('7d');
  const [revenueData, setRevenueData] = useState([]);
  const [peakHoursData, setPeakHoursData] = useState([]);
  const [slotPerformance, setSlotPerformance] = useState([]);
  const [memberStats, setMemberStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [rev, peak, slot, mem] = await Promise.all([
          adminApi.getRevenue(period),
          adminApi.getPeakHours(),
          adminApi.getSlotPerformance(),
          adminApi.getMembersAnalytics()
        ]);
        setRevenueData(rev.data);
        setPeakHoursData(peak.data);
        setSlotPerformance(slot.data);
        setMemberStats(mem.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [period]);

  const renderRevenue = () => {
    if (!revenueData.length) return <EmptyChart />;
    const width = 600, height = 180, pad = 40;
    const maxRev = Math.max(...revenueData.map(d => parseFloat(d.revenue) || 0), 1);
    const pts = revenueData.map((d, i) => ({
      x: pad + (i * ((width - pad * 2) / Math.max(revenueData.length - 1, 1))),
      y: height - pad - ((parseFloat(d.revenue) || 0) / maxRev * (height - pad * 2)),
      ...d
    }));
    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${height - pad} L ${pts[0].x} ${height - pad} Z`;
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <line key={v} x1={pad} y1={height - pad - v * (height - pad * 2)} x2={width - pad} y2={height - pad - v * (height - pad * 2)} stroke="var(--bg-border)" strokeDasharray="4" />
        ))}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={linePath} stroke="#6366f1" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#6366f1" />
        ))}
      </svg>
    );
  };

  const renderPeakHours = () => {
    if (!peakHoursData.length) return <EmptyChart />;
    const width = 600, height = 180, pad = 30;
    const barW = (width - pad * 2) / 24;
    const getColor = v => v < 0.4 ? '#22c55e' : v < 0.7 ? '#f59e0b' : '#ef4444';
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {peakHoursData.map((d, i) => {
          const h = parseFloat(d.avgoccupancy) * (height - pad * 2);
          const x = pad + parseInt(d.hour) * barW + 2;
          return <rect key={i} x={x} y={height - pad - h} width={barW - 4} height={h} fill={getColor(parseFloat(d.avgoccupancy))} rx="2" />;
        })}
        {[0, 6, 12, 18, 23].map(h => (
          <text key={h} x={pad + h * barW + barW / 2} y={height - 8} fill="var(--text-muted)" fontSize="10" textAnchor="middle">
            {h === 0 ? '12am' : h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`}
          </text>
        ))}
      </svg>
    );
  };

  if (loading && !memberStats) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-full min-h-screen">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">Revenue trends, peak hours, and member behavior.</p>
          </div>
          <div className="flex glass border border-border p-1 rounded-xl gap-1">
            {['7d', '30d', '90d'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${period === p ? 'bg-accent text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Revenue trend (full width) */}
        <Card title="Revenue Trend" subtitle={`Last ${period === '7d' ? '7' : period === '30d' ? '30' : '90'} days`}>
          {renderRevenue()}
        </Card>

        {/* Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Peak Occupancy" subtitle="Hourly average">
            {renderPeakHours()}
          </Card>
          <Card title="Slot Utilization">
            <div className="space-y-4 pt-2">
              {slotPerformance.map((s, i) => {
                const maxS = Math.max(...slotPerformance.map(sp => parseInt(sp.totalsessions) || 0), 1);
                const rate = ((parseInt(s.totalsessions) || 0) / maxS) * 100;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[var(--text-primary)] font-medium">Slot {s.label}</span>
                      <span className="text-[var(--text-secondary)]">{s.totalsessions} sessions</span>
                    </div>
                    <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all duration-700" style={{ width: `${rate}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Top Members table (full width) */}
        <Card title="Top Members" subtitle="By total spending">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                  <th className="pb-4 w-10">Rank</th>
                  <th className="pb-4">Member</th>
                  <th className="pb-4">Sessions</th>
                  <th className="pb-4">Spent</th>
                  <th className="pb-4">Points</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-border">
                {(memberStats?.topMembers ?? []).map((m, i) => (
                  <tr key={i}>
                    <td className={`py-4 font-bold ${i === 0 ? 'text-pending' : 'text-[var(--text-muted)]'}`}>#{i + 1}</td>
                    <td className="py-4">
                      <p className="font-medium text-[var(--text-primary)]">{m.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{m.phone}</p>
                    </td>
                    <td className="py-4 text-[var(--text-secondary)]">{m.totalsessions ?? 0}</td>
                    <td className="py-4 font-semibold text-[var(--text-primary)]">NPR {m.totalspent ?? 0}</td>
                    <td className="py-4 text-pending font-bold">★ {m.points ?? 0}</td>
                  </tr>
                ))}
                {!memberStats?.topMembers?.length && (
                  <tr><td colSpan="5" className="py-8 text-center text-sm text-[var(--text-muted)] italic">Not enough data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </SidebarLayout>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <div className="glass rounded-xl border border-border p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function EmptyChart() {
  return <div className="h-44 flex items-center justify-center text-sm text-[var(--text-muted)] italic">Not enough data yet</div>;
}
