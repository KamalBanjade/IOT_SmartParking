import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Scan, UserPlus, Server, TrendingUp, Clock, Users, Star, ChevronRight, 
  ArrowUpRight, ArrowDownRight, Activity, Wallet, Calendar, ShieldCheck, 
  Zap, Database, Globe, LogIn, LogOut, Inbox, Lock, UserCog, History, Layers
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, RadialBarChart, RadialBar,
  ComposedChart, Line, LineChart
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import SidebarLayout from '../components/shared/SidebarLayout';
import { useParking } from '../context/ParkingContext';
import { useOperatorAuth } from '../hooks/useOperatorAuth';
import { sessionsApi, adminApi } from '../services/api';
import { format, formatDistanceToNow } from 'date-fns';
import PaymentModal from '../components/payment/PaymentModal';
import QRScanner from '../components/user/QRScanner';
import UserCard from '../components/user/UserCard';

const StatCard = ({ title, value, subValue, icon: Icon, trend, color, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="bg-[var(--bg-surface)]/40 border border-[var(--bg-border)] rounded-2xl p-5 relative overflow-hidden group hover:border-accent/40 transition-all duration-500">
    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Icon className="w-12 h-12" /></div>
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-2.5 rounded-xl bg-${color}/10 text-${color} border border-${color}/20`}><Icon className="w-5 h-5" /></div>
      <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">{title}</span>
    </div>
    <div className="flex items-baseline gap-2">
      <h4 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{value}</h4>
      {trend && (<span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 ${trend > 0 ? 'bg-available/10 text-available' : 'bg-occupied/10 text-occupied'}`}>{trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{Math.abs(trend)}%</span>)}
    </div>
    <p className="text-[10px] text-[var(--text-muted)] font-medium mt-1 uppercase tracking-wider">{subValue}</p>
  </motion.div>
);

const EmptyState = ({ message = "No data points collected", icon: Icon = Inbox }) => (
  <div className="h-full w-full flex flex-col items-center justify-center opacity-40 py-8">
    <Icon className="w-8 h-8 mb-3 text-[var(--text-muted)]" />
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-center max-w-[150px]">{message}</p>
  </div>
);

const ChartCard = ({ title, subtitle, children, delay = 0, className = "", hasData = true }) => (
  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay }}
    className={`bg-[var(--bg-surface)]/30 border border-[var(--bg-border)] rounded-3xl p-6 flex flex-col h-full hover:bg-[var(--bg-surface)]/50 transition-all duration-500 ${className}`}>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">{title}</h3>
        {subtitle && <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">{subtitle}</p>}
      </div>
      <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-accent/30 animate-pulse" /><div className="w-2 h-2 rounded-full bg-accent/20" /></div>
    </div>
    <div className="flex-1 min-h-[160px] relative">
      {hasData ? children : <EmptyState />}
    </div>
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0e0e14] border border-[var(--bg-border)] p-3 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1.5">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-3 py-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill || entry.stroke }} />
            <span className="text-[10px] font-bold text-white uppercase tracking-tight">{entry.name}:</span>
            <span className="text-[10px] font-black text-accent">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { slots, connected, scannedUser } = useParking();
  const { operator } = useOperatorAuth();
  const navigate = useNavigate();
  const isAdmin = operator?.role === 'admin';
  
  const [todayStats, setTodayStats] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [uptime, setUptime] = useState(0);
  const [period, setPeriod] = useState('7d');
  const [revenueData, setRevenueData] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [peakHoursData, setPeakHoursData] = useState([]);
  const [memberStats, setMemberStats] = useState(null);

  const stats = useMemo(() => {
    const total = slots.length;
    const occupied = slots.filter(s => s.status === 'occupied').length;
    return { total, occupied, available: total - occupied };
  }, [slots]);

  useEffect(() => {
    const refreshData = () => {
      adminApi.getDashboard().then(res => setTodayStats(res.data)).catch(() => {});
      adminApi.getPeakHours().then(res => setPeakHoursData(res.data || [])).catch(() => {});
      adminApi.getRevenue(period).then(res => setRevenueData(res.data || [])).catch(() => {});
      adminApi.getUserGrowth(period).then(res => setGrowthData(res.data || [])).catch(() => {});
      adminApi.getMembersAnalytics().then(res => setMemberStats(res.data || null)).catch(() => {});
    };
    refreshData();
    const interval = setInterval(refreshData, 15000);
    return () => clearInterval(interval);
  }, [period, isAdmin]);

  useEffect(() => {
    const t = setInterval(() => setUptime(u => u + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const formattedRevData = useMemo(() => revenueData.map(d => ({ name: format(new Date(d.date), 'MMM d'), revenue: parseFloat(d.revenue) || 0, sessions: parseInt(d.sessions) || 0 })), [revenueData]);
  const formattedGrowthData = useMemo(() => growthData.map(d => ({ name: format(new Date(d.date), 'MMM d'), members: d.members, guests: d.guests, staff: d.staff })), [growthData]);
  const formattedPeakData = useMemo(() => peakHoursData.map(d => ({ hour: `${d.hour}:00`, occupancy: Math.round((d.avgOccupancy || d.avg_occupancy || 0) * 100) })), [peakHoursData]);

  const paymentData = useMemo(() => {
    const methods = todayStats?.paymentMethods || [];
    return methods.map(m => ({ name: m.method.toUpperCase(), value: m.amount, color: m.method === 'khalti' ? '#5d2e8e' : '#22c55e' }));
  }, [todayStats]);

  const dwellData = useMemo(() => (todayStats?.dwellDistribution || []).map(d => ({ name: d.bucket, count: d.count, fill: 'var(--color-accent)' })), [todayStats]);
  const occRate = stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0;
  const radialData = [{ name: 'Occupancy', value: occRate, fill: 'var(--color-occupied)' }];

  return (
    <SidebarLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-1000 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter uppercase leading-none">
              {isAdmin ? 'Admin' : 'Staff'} <span className="text-accent underline decoration-accent/20 underline-offset-8">Portal</span>
            </h1>
            <div className="flex items-center gap-6 mt-4">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center gap-2"><Calendar className="w-3 h-3 text-accent" />{format(new Date(), "EEEE, MMMM do yyyy")}</p>
              <div className="h-3 w-px bg-[var(--bg-border)]" /><div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-available animate-pulse" /><p className="text-[9px] font-black text-available uppercase tracking-widest">System Active</p></div>
            </div>
          </motion.div>
          <div className="flex items-center gap-3 bg-[var(--bg-surface)]/50 p-1.5 rounded-2xl border border-[var(--bg-border)]">
            {['7d', '30d', '90d'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${period === p ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>{p === '7d' ? 'Weekly' : p === '30d' ? 'Monthly' : 'Quarterly'}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title={isAdmin ? "Total Revenue" : "Today Collection"} value={isAdmin ? `NPR ${todayStats?.totalRevenue || '0'}` : `NPR ${todayStats?.todayRevenue || '0'}`} subValue={isAdmin ? "Lifetime Accumulation" : "Total Collected Today"} icon={Wallet} trend={isAdmin ? 12 : null} color="accent" delay={0.1} />
          <StatCard title="Live Occupancy" value={`${occRate}%`} subValue={`${stats.occupied}/${stats.total} SLOTS IN USE`} icon={Activity} color="occupied" delay={0.2} />
          <StatCard title={isAdmin ? "Member Community" : "Registered Accounts"} value={isAdmin ? (memberStats?.totalMembers || 0) : (memberStats?.totalMembers || 0)} subValue={isAdmin ? "Member Count" : "Total User Base"} icon={Users} trend={isAdmin ? 5 : null} color="customer" delay={0.3} />
          <StatCard title={isAdmin ? "Health Status" : "System Load"} value={isAdmin ? "Stable" : `${stats.occupied} Cars`} subValue={isAdmin ? `${uptime}m UPTIME` : "Currently In Bay"} icon={ShieldCheck} color="available" delay={0.4} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <ChartCard title="Capacity Pulse" subtitle="Real-time load" delay={0.5}>
              <div className="relative h-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={140}><RadialBarChart innerRadius="85%" outerRadius="100%" data={radialData} startAngle={225} endAngle={-45}><RadialBar background dataKey="value" cornerRadius={30} /></RadialBarChart></ResponsiveContainer>
                <div className="absolute top-[35%] flex flex-col items-center text-center"><span className="text-4xl font-black text-[var(--text-primary)]">{occRate}%</span><span className="text-[8px] font-black text-[var(--text-muted)] uppercase">Utilization</span></div>
                <div className="w-full grid grid-cols-3 gap-2 mt-2 pt-4 border-t border-[var(--bg-border)]">
                  <div className="text-center"><p className="text-xs font-black text-occupied leading-none">{stats.occupied}</p><p className="text-[7px] font-bold text-[var(--text-muted)] uppercase">Full</p></div>
                  <div className="text-center border-x border-[var(--bg-border)]"><p className="text-xs font-black text-[var(--text-primary)] leading-none">{stats.total}</p><p className="text-[7px] font-bold text-[var(--text-muted)] uppercase">Total</p></div>
                  <div className="text-center"><p className="text-xs font-black text-available leading-none">{stats.available}</p><p className="text-[7px] font-bold text-[var(--text-muted)] uppercase">Free</p></div>
                </div>
              </div>
            </ChartCard>
          </div>
          <div className="lg:col-span-8">
            <ChartCard title="User Growth" subtitle="Registration trends" delay={0.6} hasData={formattedGrowthData.length > 0}>
              <ResponsiveContainer width="100%" height={220}><LineChart data={formattedGrowthData}><CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} /><XAxis dataKey="name" stroke="var(--text-muted)" fontSize={8} /><YAxis stroke="var(--text-muted)" fontSize={8} /><Tooltip content={<CustomTooltip />} /><Legend iconType="circle" wrapperStyle={{ fontSize: '8px', textTransform: 'uppercase' }} /><Line type="monotone" dataKey="members" name="Members" stroke="var(--color-accent)" strokeWidth={3} dot={{ r: 3 }} /><Line type="monotone" dataKey="guests" name="Guests" stroke="var(--color-customer)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 2 }} />{isAdmin && <Line type="monotone" dataKey="staff" name="Staff" stroke="var(--color-operator)" strokeWidth={2} dot={{ r: 2 }} />}</LineChart></ResponsiveContainer>
            </ChartCard>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className={isAdmin ? "lg:col-span-8" : "lg:col-span-12"}>
            <ChartCard title={isAdmin ? "Financial Trajectory" : "Activity Trajectory"} subtitle={isAdmin ? "Revenue Flow" : "System Transaction Volume"} delay={0.7} hasData={formattedRevData.length > 0}>
              <ResponsiveContainer width="100%" height={220}><ComposedChart data={formattedRevData}><defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.4}/><stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="4 4" stroke="var(--bg-border)" vertical={false} /><XAxis dataKey="name" stroke="var(--text-muted)" fontSize={8} /><YAxis stroke="var(--text-muted)" fontSize={8} tickFormatter={(v) => isAdmin ? `NPR ${v}` : v} /><Tooltip content={<CustomTooltip />} />{isAdmin && <Area type="monotone" dataKey="revenue" name="Revenue" stroke="var(--color-accent)" strokeWidth={3} fill="url(#colorRev)" />}<Line type="monotone" dataKey="sessions" name="Sessions" stroke={isAdmin ? "var(--color-available)" : "var(--color-accent)"} strokeWidth={isAdmin ? 2 : 4} dot={!isAdmin} strokeDasharray={isAdmin ? "5 5" : "0"} /></ComposedChart></ResponsiveContainer>
            </ChartCard>
          </div>
          {isAdmin && (
            <div className="lg:col-span-4">
              <ChartCard title="Payment Channels" subtitle="Methods Breakdown" delay={1.0} hasData={paymentData.length > 0}>
                <div className="flex flex-col items-center justify-center h-full">
                  <ResponsiveContainer width="100%" height={100}><PieChart><Pie data={paymentData} innerRadius={30} outerRadius={45} paddingAngle={8} dataKey="value" stroke="none">{paymentData.map((entry, index) => <Cell key={index} fill={entry.color} />)}</Pie><Tooltip content={<CustomTooltip />} /></PieChart></ResponsiveContainer>
                  <div className="mt-2 w-full space-y-1">{paymentData.map((p, i) => (<div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]"><div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} /><span className="text-[7px] font-black text-[var(--text-primary)] uppercase">{p.name}</span></div><span className="text-[7px] font-black text-accent">NPR {p.value}</span></div>))}</div>
                </div>
              </ChartCard>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Usage Intensity" delay={0.8} hasData={formattedPeakData.some(d => d.occupancy > 0)}><ResponsiveContainer width="100%" height={140}><BarChart data={formattedPeakData}><XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={7} interval={4} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="occupancy" name="Occupancy %" radius={[4, 4, 0, 0]}>{formattedPeakData.map((entry, index) => <Cell key={index} fill={entry.occupancy > 70 ? 'var(--color-occupied)' : entry.occupancy > 40 ? 'var(--color-pending)' : 'var(--color-available)'} />)}</Bar></BarChart></ResponsiveContainer></ChartCard>
          <ChartCard title="Dwell Distribution" delay={0.9} hasData={dwellData.length > 0}><ResponsiveContainer width="100%" height={140}><BarChart data={dwellData} layout="vertical" margin={{ left: -10 }}><XAxis type="number" hide /><YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={7} width={70} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="count" name="Sessions" radius={[0, 4, 4, 0]} fill="var(--color-accent)" /></BarChart></ResponsiveContainer></ChartCard>
          <ChartCard title="System Metrics" delay={1.0}>
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-accent/5 border border-accent/10"><div className="flex items-center gap-3"><History className="w-4 h-4 text-accent" /><span className="text-[9px] font-black uppercase text-[var(--text-primary)]">Lifetime Sessions</span></div><span className="text-xs font-black text-accent">{memberStats?.totalDiscountsGiven / 25 || 0}</span></div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-available/5 border border-available/10"><div className="flex items-center gap-3"><Layers className="w-4 h-4 text-available" /><span className="text-[9px] font-black uppercase text-[var(--text-primary)]">Slot Reliability</span></div><span className="text-xs font-black text-available">99.8%</span></div>
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className={isAdmin ? "lg:col-span-8" : "lg:col-span-12"}>
            <ChartCard title="Live Activity Feed" delay={1.2} hasData={(todayStats?.recentActivity || []).length > 0}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mt-1">
                {(todayStats?.recentActivity || []).map((act, i) => (
                  <div key={i} className="flex gap-3"><div className="flex flex-col items-center"><div className={`w-6 h-6 rounded-lg flex items-center justify-center ${act.status === 'active' ? 'bg-available/10 text-available' : 'bg-occupied/10 text-occupied'} border`}>{act.status === 'active' ? <LogIn className="w-2.5 h-2.5" /> : <LogOut className="w-2.5 h-2.5" />}</div>{i < (todayStats?.recentActivity.length - 2) && <div className="w-0.5 h-full bg-[var(--bg-border)] my-0.5" />}</div><div><p className="text-[10px] font-black text-[var(--text-primary)] uppercase">{act.user_name || 'Guest'} — {act.slot_label}</p><p className="text-[8px] font-bold text-[var(--text-muted)] uppercase">{formatDistanceToNow(new Date(act.entry_time))} ago</p></div></div>
                ))}
              </div>
            </ChartCard>
          </div>
          {isAdmin && (
            <div className="lg:col-span-4">
              <ChartCard title="Elite Circle" delay={1.1} hasData={(memberStats?.topMembers || []).length > 0}>
                <div className="space-y-3 mt-2">
                  {(memberStats?.topMembers || []).map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center font-black text-accent text-[10px]">{m.name.charAt(0)}</div><div><p className="text-[10px] font-black text-[var(--text-primary)] uppercase">{m.name}</p><p className="text-[8px] text-[var(--text-muted)]">{m.phone}</p></div></div>
                      <span className="text-[9px] font-black text-accent">★ {m.points}</span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[ { label: 'MQTT', icon: Globe, ok: connected }, { label: 'DB', icon: Database, ok: true }, { label: 'Sensors', icon: Zap, ok: true } ].map((sys, i) => (<div key={i} className="bg-[var(--bg-surface)]/20 border border-[var(--bg-border)] rounded-2xl p-3 flex flex-col items-center gap-1.5"><sys.icon className={`w-4 h-4 ${sys.ok ? 'text-available' : 'text-occupied'}`} /><span className="text-[8px] font-black text-[var(--text-muted)] uppercase">{sys.label}</span><div className={`w-1 h-1 rounded-full ${sys.ok ? 'bg-available animate-pulse' : 'bg-occupied'}`} /></div>))}
        </div>
      </div>
      <PaymentModal /><AnimatePresence>{scannerOpen && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"><motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#0e0e14] border border-[var(--bg-border)] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"><div className="flex items-center justify-between px-6 py-4 border-b border-[var(--bg-border)] bg-white/[0.02]"><div><h3 className="text-sm font-black text-white uppercase">Express Scan</h3><p className="text-[10px] font-bold text-accent uppercase">Authorized Procedure</p></div><button onClick={() => setScannerOpen(false)} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-[var(--text-muted)] hover:text-white">&times;</button></div><div className="p-1"><QRScanner /></div>{scannedUser && (<div className="border-t border-[var(--bg-border)] bg-white/[0.01]"><UserCard /><div className="p-6"><button onClick={() => setScannerOpen(false)} className="w-full h-12 bg-accent text-white font-black rounded-xl uppercase text-xs">Verify & Initiate</button></div></div>)}</motion.div></motion.div>)}</AnimatePresence>
    </SidebarLayout>
  );
}
