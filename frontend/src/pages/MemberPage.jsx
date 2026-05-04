import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarLayout from '../components/shared/SidebarLayout';
import MemberCard from '../components/user/MemberCard';
import StatusBadge from '../components/shared/StatusBadge';
import { usersApi, sessionsApi } from '../services/api';
import { 
  ArrowLeft, Calendar, Clock, CreditCard, 
  MapPin, Star, History as HistoryIcon, Download,
  Phone, Mail, ShieldCheck, User as UserIcon, Zap,
  Banknote, Smartphone
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function MemberPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pointsSummary, setPointsSummary] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, pointsRes, sessRes] = await Promise.all([
          usersApi.getById(id),
          usersApi.getPointsSummary(id),
          sessionsApi.getUserSessions(id),
        ]);
        setUser(userRes.data);
        setPointsSummary(pointsRes.data);
        setSessions(sessRes.data);
      } catch { toast.error('Failed to load member data'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  const handleQrUpdate = (newToken) => {
    setUser(u => ({ ...u, qr_token: newToken }));
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">Fetching Profile</p>
        </div>
      </SidebarLayout>
    );
  }

  if (!user) {
    return (
      <SidebarLayout>
        <div className="p-20 text-center space-y-4">
          <div className="w-20 h-20 bg-occupied/10 text-occupied rounded-full flex items-center justify-center mx-auto">
            <UserIcon className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Profile Not Found</h2>
          <button onClick={() => navigate('/members')} className="text-accent hover:underline">Return to Directory</button>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="p-6 lg:p-10 space-y-10">
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate('/members')}
              className="p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--bg-border)] text-[var(--text-muted)] hover:text-accent hover:border-accent/30 transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-accent">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Verified Profile</span>
              </div>
              <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight mt-1">Profile Overview</h1>
            </div>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl text-xs font-black uppercase tracking-widest text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all">
            <Download className="w-4 h-4" /> Export Data
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-4 space-y-8">
            <MemberCard user={user} pointsSummary={pointsSummary} onQrUpdate={handleQrUpdate} />
            
            <div className="glass rounded-[2.5rem] border border-[var(--bg-border)] p-8 space-y-6">
              <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Contact Information</h3>
              <div className="space-y-4">
                {user.phone && <ContactItem icon={<Phone className="w-4 h-4" />} label="Phone Number" value={user.phone} />}
                {user.email && <ContactItem icon={<Mail className="w-4 h-4" />} label="Email Address" value={user.email} />}
                <ContactItem icon={<Calendar className="w-4 h-4" />} label="Member Since" value={format(new Date(user.created_at), 'MMMM d, yyyy')} />
              </div>
            </div>
          </div>

          {/* Right Column: Sessions & Activity */}
          <div className="lg:col-span-8 space-y-8">
            {/* Quick Stats Dashboard */}
            <div className="grid grid-cols-3 gap-6">
              <QuickStat icon={<Zap className="w-5 h-5" />} label="Total Visits" value={sessions.length} color="text-accent" />
              <QuickStat 
                icon={<CreditCard className="w-5 h-5" />} 
                label="Payment Mix" 
                value={
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-muted)] border border-[var(--bg-border)]">
                        <Banknote className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-[var(--text-muted)] leading-none mb-0.5">Cash</span>
                        <span className="text-sm font-black text-[var(--text-primary)] font-mono">{sessions.filter(s => s.payment_method === 'cash').length}</span>
                      </div>
                    </div>
                    
                    <div className="w-px h-8 bg-[var(--bg-border)]" />
                    
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#5c2d91]/5 flex items-center justify-center border border-[#5c2d91]/10">
                        <img src="/Images/khalti.png" alt="Khalti" className="h-4 object-contain" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-[#5c2d91] leading-none mb-0.5">Khalti</span>
                        <span className="text-sm font-black text-[var(--text-primary)] font-mono">{sessions.filter(s => s.payment_method === 'khalti').length}</span>
                      </div>
                    </div>

                    <div className="w-px h-8 bg-[var(--bg-border)]" />

                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#60bb46]/5 flex items-center justify-center border border-[#60bb46]/10">
                        <img src="/Images/esewa.png" alt="eSewa" className="h-4 object-contain" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-[#60bb46] leading-none mb-0.5">eSewa</span>
                        <span className="text-sm font-black text-[var(--text-primary)] font-mono">{sessions.filter(s => s.payment_method === 'esewa').length}</span>
                      </div>
                    </div>
                  </div>
                } 
                color="text-operator" 
              />
              <QuickStat icon={<CreditCard className="w-5 h-5" />} label="Lifetime Spent" value={`NPR ${sessions.reduce((acc, s) => acc + (s.amount || 0), 0)}`} color="text-available" />
            </div>

            {/* Session History Table */}
            <div className="bg-[var(--bg-surface)] rounded-[2.5rem] border border-[var(--bg-border)] shadow-2xl overflow-hidden relative">
              <div className="px-8 py-6 border-b border-[var(--bg-border)] flex items-center justify-between bg-gradient-to-r from-[var(--bg-elevated)]/30 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-accent/10 text-accent">
                    <HistoryIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black text-[var(--text-primary)]">Visit History</h3>
                </div>
                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-elevated)] px-3 py-1 rounded-lg">
                  {sessions.length} Records Found
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--bg-elevated)]/50 border-b border-[var(--bg-border)]">
                      {['Slot', 'Arrival', 'Departure', 'Duration', 'Amount', 'Status'].map(h => (
                        <th key={h} className="px-6 py-4 text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-black">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--bg-border)]">
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-2 opacity-40">
                            <HistoryIcon className="w-12 h-12 text-[var(--text-muted)] mb-2" />
                            <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">No session records identified</p>
                          </div>
                        </td>
                      </tr>
                    ) : sessions.map(s => (
                      <tr key={s.id} className="hover:bg-[var(--bg-elevated)]/30 transition-colors">
                        <td className="px-6 py-5">
                          <span className="font-black text-xs px-3 py-1 rounded-xl bg-accent/10 text-accent border border-accent/20">
                            {s.slot_label}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-xs text-[var(--text-secondary)] font-bold">
                          {s.entry_time ? format(new Date(s.entry_time), 'MMM d, HH:mm') : '—'}
                        </td>
                        <td className="px-6 py-5 text-xs text-[var(--text-secondary)] font-bold">
                          {s.exit_time ? format(new Date(s.exit_time), 'MMM d, HH:mm') : <span className="text-accent animate-pulse">Present</span>}
                        </td>
                        <td className="px-6 py-5 text-xs font-black text-[var(--text-primary)] font-mono">
                          {s.duration_minutes ? `${Math.floor(s.duration_minutes / 60)}h ${s.duration_minutes % 60}m` : '—'}
                        </td>
                        <td className="px-6 py-5 text-xs font-black text-available font-mono">
                          {s.amount ? `NPR ${s.amount}` : '—'}
                        </td>
                        <td className="px-6 py-5">
                          <StatusBadge status={s.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

function ContactItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-accent group-hover:bg-accent/10 transition-all">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  );
}

function QuickStat({ icon, label, value, color }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] p-6 rounded-3xl shadow-xl">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl bg-[var(--bg-elevated)] ${color}`}>
          {icon}
        </div>
        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-black text-[var(--text-primary)] font-mono tracking-tight">{value}</p>
    </div>
  );
}
