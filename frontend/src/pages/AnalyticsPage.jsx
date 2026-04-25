import React, { useState, useEffect } from 'react';
import Navbar from '../components/shared/Navbar';
import { adminApi } from '../services/api';
import { format, subDays, eachDayOfInterval } from 'date-fns';

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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  const renderRevenueChart = () => {
    if (revenueData.length === 0) return <EmptyState />;
    
    const width = 600;
    const height = 200;
    const padding = 30;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxRevenue = Math.max(...revenueData.map(d => parseFloat(d.revenue)), 100);
    
    const points = revenueData.map((d, i) => {
      const x = padding + (i * (chartWidth / (revenueData.length - 1 || 1)));
      const y = height - padding - (parseFloat(d.revenue) / maxRevenue * chartHeight);
      return { x, y, ...d };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaData = `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <div className="relative group">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(v => (
            <line 
              key={v}
              x1={padding} 
              y1={height - padding - (v * chartHeight)} 
              x2={width - padding} 
              y2={height - padding - (v * chartHeight)} 
              stroke="#222222" 
              strokeDasharray="4"
            />
          ))}
          
          {/* Area fill */}
          <path d={areaData} fill="#3b82f6" fillOpacity="0.08" />
          
          {/* Line */}
          <path d={pathData} stroke="#3b82f6" strokeWidth="2" fill="none" />
          
          {/* Dots */}
          {points.map((p, i) => (
            <circle 
              key={i} 
              cx={p.x} 
              cy={p.y} 
              r="3" 
              fill="#3b82f6"
              className="cursor-pointer hover:r-5 transition-all"
            />
          ))}
        </svg>
      </div>
    );
  };

  const renderPeakHoursChart = () => {
    if (peakHoursData.length === 0) return <EmptyState />;

    const width = 600;
    const height = 200;
    const padding = 30;
    const barWidth = (width - padding * 2) / 24;

    const getColor = (val) => {
      if (val < 0.4) return '#22c55e';
      if (val < 0.7) return '#f59e0b';
      return '#ef4444';
    };

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {peakHoursData.map((d, i) => {
          const h = parseFloat(d.avgoccupancy) * (height - padding * 2);
          const x = padding + (parseInt(d.hour) * barWidth) + 2;
          return (
            <rect 
              key={i}
              x={x}
              y={height - padding - h}
              width={barWidth - 4}
              height={h}
              fill={getColor(parseFloat(d.avgoccupancy))}
              rx="2"
            />
          );
        })}
        {/* Labels */}
        {[0, 6, 12, 18, 23].map(h => (
          <text 
            key={h}
            x={padding + (h * barWidth) + barWidth/2}
            y={height - 10}
            fill="#525252"
            fontSize="10"
            textAnchor="middle"
          >
            {h === 0 ? '12am' : h === 12 ? '12pm' : h > 12 ? `${h-12}pm` : `${h}am`}
          </text>
        ))}
      </svg>
    );
  };

  if (loading && !memberStats) return <Loading />;

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <Navbar />
      
      <main className="flex-grow max-w-7xl w-full mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-xl font-bold text-text-primary">System Analytics</h1>
            <p className="text-sm text-text-secondary mt-1">Deep dive into revenue, occupancy, and member behavior.</p>
          </div>
          
          <div className="flex bg-bg-surface border border-bg-border p-1 rounded-xl">
            {['7d', '30d', '90d'].map(p => (
              <button 
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${period === p ? 'bg-bg-elevated text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Members" value={memberStats?.totalmembers} />
          <StatCard title="Active (Month)" value={memberStats?.activethismonth} />
          <StatCard title="Points Awarded" value={memberStats?.totalpointsawarded} isPoints />
          <StatCard title="Discounts Given" value={`NPR ${memberStats?.totaldiscountsgiven}`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartContainer title="Revenue Trend">
            {renderRevenueChart()}
          </ChartContainer>
          <ChartContainer title="Peak Occupancy (Hourly Average)">
            {renderPeakHoursChart()}
          </ChartContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartContainer title="Top Members (by Spending)">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-text-muted">
                      <th className="pb-4 px-2">Rank</th>
                      <th className="pb-4">Member</th>
                      <th className="pb-4">Sessions</th>
                      <th className="pb-4">Spent</th>
                      <th className="pb-4">Points</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {memberStats?.topMembers.map((m, i) => (
                      <tr key={i} className="border-t border-bg-elevated">
                        <td className={`py-4 px-2 font-bold ${i === 0 ? 'text-amber-400' : 'text-text-muted'}`}>#{i+1}</td>
                        <td className="py-4">
                          <div className="font-medium text-text-primary">{m.name}</div>
                          <div className="text-xs text-text-secondary">{m.phone}</div>
                        </td>
                        <td className="py-4 text-text-secondary">{m.totalsessions}</td>
                        <td className="py-4 text-text-primary font-medium">NPR {m.totalspent}</td>
                        <td className="py-4 text-amber-400 font-bold">★ {m.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartContainer>
          </div>
          
          <div>
            <ChartContainer title="Slot Utilization">
              <div className="space-y-6 pt-2">
                {slotPerformance.map((s, i) => {
                  const maxSessions = Math.max(...slotPerformance.map(sp => parseInt(sp.totalsessions)), 1);
                  const rate = (parseInt(s.totalsessions) / maxSessions) * 100;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-text-primary font-medium">Slot {s.label}</span>
                        <span className="text-text-secondary">{s.totalsessions} sessions</span>
                      </div>
                      <div className="h-2 bg-bg-base rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent transition-all duration-1000" 
                          style={{ width: `${rate}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ChartContainer>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, isPoints }) {
  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl p-5">
      <p className="text-xs text-text-muted uppercase tracking-wider mb-2">{title}</p>
      <p className={`text-2xl font-bold ${isPoints ? 'text-amber-400' : 'text-text-primary'}`}>
        {isPoints && '★ '}{value || 0}
      </p>
    </div>
  );
}

function ChartContainer({ title, children }) {
  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl p-6">
      <h3 className="text-sm font-medium text-text-primary mb-6">{title}</h3>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-[200px] flex items-center justify-center text-sm text-text-muted italic">
      Not enough data yet
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
