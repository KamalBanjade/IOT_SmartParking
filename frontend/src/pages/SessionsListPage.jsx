import React, { useState, useEffect } from 'react';
import { adminApi, paymentsApi } from '../services/api';
import SidebarLayout from '../components/shared/SidebarLayout';
import {
  Search, Clock, CheckCircle2, AlertCircle,
  Wallet, Calendar, User, Hash, MoreHorizontal,
  ChevronRight, Filter, Download, DollarSign,
  ArrowUpRight, ArrowDownRight, Timer, Receipt,
  Eye, X, ShieldCheck, Mail, Phone, CreditCard,
  Terminal, Info
} from 'lucide-react';
import { formatDistanceToNow, format, differenceInMinutes } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  active: 'bg-available/20 text-available border-available/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]',
  completed: 'bg-accent/20 text-accent border-accent/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
  cancelled: 'bg-[var(--text-muted)]/20 text-[var(--text-muted)] border-[var(--text-muted)]/30',
  abandoned: 'bg-occupied/20 text-occupied border-occupied/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
};

const PAYMENT_STATUS_BADGE = {
  paid: 'bg-available/20 text-available border-available/30',
  pending: 'bg-occupied/20 text-occupied border-occupied/30',
  failed: 'bg-occupied/20 text-occupied border-occupied/30',
  null: 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--bg-border)]',
};

const getPaymentBadgeClass = (status) => PAYMENT_STATUS_BADGE[status] || PAYMENT_STATUS_BADGE['null'];

const TABS = ['All Sessions', 'Active', 'Pending Payment', 'Completed'];

export default function SessionsListPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All Sessions');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, [dateFilter]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setSelectedSession(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const fetchSessions = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Increase limit to 100 to ensure we see all recent pending sessions
      const res = await adminApi.getSessions(dateFilter, 1, 100);
      setSessions(res.data);
    } catch (err) {
      toast.error('Failed to load sessions');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleCashPayment = async (paymentId, sessionId) => {
    try {
      await paymentsApi.pay(paymentId, 'cash');
      toast.success('Payment recorded as Cash');
      // Refresh silently so the UI doesn't flicker/jump
      fetchSessions(true);
      if (selectedSession && selectedSession.id === sessionId) {
        setSelectedSession(prev => ({ ...prev, payment_status: 'paid', payment_method: 'cash' }));
      }
    } catch (err) {
      toast.error('Failed to record payment');
    }
  };

  const filteredSessions = sessions.filter(s => {
    const matchSearch =
      (s.user_name || 'Guest').toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.slot_label.toLowerCase().includes(searchTerm.toLowerCase());

    let matchTab = true;
    if (activeTab === 'Active') matchTab = s.status === 'active';
    if (activeTab === 'Pending Payment') matchTab = s.payment_status === 'pending';
    if (activeTab === 'Completed') matchTab = s.payment_status === 'paid';

    return matchSearch && matchTab;
  });

  const getStatusCounts = () => {
    return {
      'All Sessions': sessions.length,
      'Active': sessions.filter(s => s.status === 'active').length,
      'Pending Payment': sessions.filter(s => s.payment_status === 'pending').length,
      'Completed': sessions.filter(s => s.payment_status === 'paid').length,
    };
  };

  const counts = getStatusCounts();

  return (
    <SidebarLayout>
      <div className="p-6 lg:p-10 space-y-8">

        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatMiniCard
            label="Total Sessions"
            value={sessions.length}
            icon={<Hash className="w-4 h-4" />}
            color="text-accent"
          />
          <StatMiniCard
            label="Active Now"
            value={counts['Active']}
            icon={<Timer className="w-4 h-4" />}
            color="text-available"
          />
          <StatMiniCard
            label="Awaiting Payment"
            value={counts['Pending Payment']}
            icon={<AlertCircle className="w-4 h-4" />}
            color="text-pending"
          />
          <StatMiniCard
            label="Revenue Today"
            value={`NPR ${sessions.filter(s => s.payment_status === 'paid' && new Date(s.entry_time).toDateString() === new Date().toDateString()).reduce((acc, s) => acc + (s.amount || 0), 0)}`}
            icon={<Wallet className="w-4 h-4" />}
            color="text-accent"
          />
        </div>

        {/* Filters & Search */}
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-[2rem] p-3 shadow-xl flex flex-col xl:flex-row gap-4 items-center">
          {/* Tabs */}
          <div className="flex bg-[var(--bg-elevated)]/50 p-1.5 rounded-2xl w-full xl:w-auto gap-1 border border-[var(--bg-border)]/30 overflow-x-auto no-scrollbar">
            {TABS.map(tab => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${active ? 'bg-[var(--bg-surface)] text-accent shadow-sm border border-[var(--bg-border)]/50' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }`}
                >
                  {tab}
                  <span className={`text-[9px] px-2 py-0.5 rounded-full ${active ? 'bg-accent/10 text-accent' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>
                    {counts[tab] || 0}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative flex-grow w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by member or slot..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-elevated)]/30 border border-transparent rounded-2xl h-14 pl-12 pr-12 text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:bg-[var(--bg-surface)] focus:border-accent/30 focus:outline-none transition-all"
            />
          </div>

          <div className="flex gap-2 w-full xl:w-auto">
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="bg-[var(--bg-elevated)]/50 border border-[var(--bg-border)] rounded-2xl px-4 h-14 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-accent transition-all"
            />
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-[var(--bg-surface)] rounded-[2.5rem] border border-[var(--bg-border)] shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-elevated)]/30 border-b border-[var(--bg-border)]">
                  {['Session ID', 'Customer & Slot', 'Timeline', 'Duration', 'Financials', 'Session Status', 'Payment Status'].map(h => (
                    <th key={h} className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-black whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--bg-border)]">
                {loading ? (
                  <tr><td colSpan="7" className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-black uppercase tracking-widest text-accent">Fetching History</span>
                    </div>
                  </td></tr>
                ) : filteredSessions.length === 0 ? (
                  <tr><td colSpan="7" className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-40">
                      <HistoryPlaceholder className="w-16 h-16 text-[var(--text-muted)] mb-2" />
                      <p className="text-base font-black text-[var(--text-muted)] uppercase tracking-widest">No matching records found</p>
                    </div>
                  </td></tr>
                ) : filteredSessions.map(session => (
                  <tr key={session.id} className="hover:bg-[var(--bg-elevated)]/30 transition-all group">
                    <td className="px-8 py-6">
                      <span className="text-xs font-mono font-black text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-1 rounded-md border border-[var(--bg-border)]">
                        #{session.id.toString().padStart(4, '0')}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center border border-[var(--bg-border)] shadow-sm group-hover:scale-105 transition-transform">
                          {session.user_name ? <User className="w-5 h-5 text-accent" /> : <Hash className="w-5 h-5 text-pending" />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-[var(--text-primary)] leading-none uppercase">{session.user_name || 'Guest User'}</p>
                          <p className="text-[10px] text-accent font-black mt-1.5 uppercase tracking-widest">SLOT {session.slot_label}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-secondary)] uppercase">
                          <ArrowUpRight className="w-3 h-3 text-available" />
                          {format(new Date(session.entry_time), 'MMM d, HH:mm')}
                        </div>
                        {session.exit_time && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase">
                            <ArrowDownRight className="w-3 h-3 text-occupied" />
                            {format(new Date(session.exit_time), 'MMM d, HH:mm')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tighter">
                          {session.exit_time
                            ? `${session.duration_minutes || Math.max(1, Math.round(differenceInMinutes(new Date(session.exit_time), new Date(session.entry_time))))} Minutes`
                            : formatDistanceToNow(new Date(session.entry_time))
                          }
                        </span>
                        {!session.exit_time && <span className="text-[9px] font-black text-available uppercase tracking-[0.2em] mt-1">Live Now</span>}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {session.amount || session.exit_time ? (
                        <div className="space-y-1">
                          <p className="text-sm font-black text-[var(--text-primary)] font-mono">NPR {(session.amount || 0).toFixed(2)}</p>
                          {session.payment_method && (
                            <span className="text-[8px] px-2 py-0.5 rounded-full uppercase font-black border border-[var(--bg-border)] tracking-widest text-[var(--text-muted)]">
                              via {session.payment_method}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-pending uppercase animate-pulse">Live Billing...</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[10px] px-3 py-1.5 rounded-xl uppercase font-black tracking-widest border-2 shadow-sm whitespace-nowrap inline-flex items-center justify-center min-w-[100px] ${STATUS_BADGE[session.status]}`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        <span className={`text-[10px] px-3 py-1.5 rounded-xl uppercase font-black tracking-widest border-2 shadow-sm whitespace-nowrap inline-flex items-center justify-center min-w-[100px] ${getPaymentBadgeClass(session.payment_status)}`}>
                          {session.payment_status === 'paid'
                            ? 'PAID'
                            : session.payment_status === 'pending'
                            ? 'UNPAID'
                            : 'IN PROGRESS'}
                        </span>
                        {session.payment_status === 'pending' && session.payment_id && (
                          <button
                            type="button"
                            onClick={() => handleCashPayment(session.payment_id, session.id)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-available text-black rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-green-400 transition-all shadow-sm active:scale-95"
                          >
                            <DollarSign className="w-3 h-3" />
                            Pay Cash
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div
          className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[100] p-4 md:p-8"
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-[2.5rem] max-w-2xl w-full max-h-full overflow-y-auto no-scrollbar shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300 relative"
            onClick={e => e.stopPropagation()}
          >

            {/* Modal Header */}
            <div className="sticky top-0 bg-[var(--bg-surface)]/90 backdrop-blur-md border-b border-[var(--bg-border)] px-8 py-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center border border-accent/20">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Audit Insight</h2>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Session #S-{selectedSession.id.toString().padStart(6, '0')}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-3 hover:bg-[var(--bg-elevated)] rounded-2xl transition-all text-[var(--text-muted)]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-10 pb-12">
              {/* Top Grid: Status & Basics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <DetailTile icon={<Hash className="w-4 h-4" />} label="Slot Label" value={selectedSession.slot_label} />
                <DetailTile
                  icon={<ShieldCheck className="w-4 h-4" />}
                  label="Session Status"
                  value={<span className={`text-[10px] px-3 py-1.5 rounded-xl border-2 font-black uppercase tracking-widest ${STATUS_BADGE[selectedSession.status]}`}>{selectedSession.status}</span>}
                />
                <DetailTile
                  icon={<CreditCard className="w-4 h-4" />}
                  label="Payment Status"
                  value={<span className={`text-[10px] px-3 py-1.5 rounded-xl border-2 font-black uppercase tracking-widest ${PAYMENT_STATUS_BADGE[selectedSession.payment_status]}`}>{selectedSession.payment_status}</span>}
                />
                <DetailTile icon={<Wallet className="w-4 h-4" />} label="Method" value={selectedSession.payment_method?.toUpperCase() || 'N/A'} />
              </div>

              {/* Patient/Member Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Identity Context
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[var(--bg-elevated)]/30 rounded-3xl p-6 border border-[var(--bg-border)]">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Full Name</p>
                    <p className="text-sm font-black text-[var(--text-primary)]">{selectedSession.user_name || 'Guest Account'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Contact Phone</p>
                    <p className="text-sm font-black text-[var(--text-primary)]">{selectedSession.user_phone || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Email Access</p>
                    <p className="text-sm font-black text-[var(--text-primary)] truncate">{selectedSession.user_email || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Timeline Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Temporal Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[var(--bg-elevated)]/30 rounded-3xl p-6 border border-[var(--bg-border)]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-available/10 text-available flex items-center justify-center"><ArrowUpRight className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Arrival Time</p>
                      <p className="text-sm font-black text-[var(--text-primary)]">{format(new Date(selectedSession.entry_time), 'MMM d, yyyy HH:mm:ss')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-occupied/10 text-occupied flex items-center justify-center"><ArrowDownRight className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Departure Time</p>
                      <p className="text-sm font-black text-[var(--text-primary)]">{selectedSession.exit_time ? format(new Date(selectedSession.exit_time), 'MMM d, yyyy HH:mm:ss') : 'Still Parked'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center"><Timer className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Calculated Duration</p>
                      <p className="text-sm font-black text-[var(--text-primary)]">{selectedSession.duration_minutes || 0} Minutes</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Trace */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5" /> Transactional Trace
                </h3>
                <div className="bg-[var(--bg-elevated)]/30 rounded-3xl border border-[var(--bg-border)] overflow-hidden">
                  <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Total Charge</p>
                      <p className="text-xl font-black text-accent font-mono">NPR {selectedSession.amount?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Transaction ID</p>
                      <p className="text-sm font-black text-[var(--text-primary)] font-mono truncate">{selectedSession.transaction_id || 'LOCAL_SETTLEMENT'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Gateway Token</p>
                      <p className="text-sm font-black text-[var(--text-primary)] font-mono truncate">{selectedSession.payment_id || 'N/A'}</p>
                    </div>
                  </div>

                  {selectedSession.gateway_response && (
                    <div className="bg-black/20 p-6 border-t border-[var(--bg-border)]">
                      <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                        <Terminal className="w-3.5 h-3.5" /> Raw System Response
                      </div>
                      <pre className="text-[10px] font-mono text-[var(--text-secondary)] bg-black/40 p-4 rounded-2xl overflow-x-auto whitespace-pre-wrap max-h-40 no-scrollbar border border-white/5">
                        {JSON.stringify(typeof selectedSession.gateway_response === 'string' ? JSON.parse(selectedSession.gateway_response) : selectedSession.gateway_response, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Actions if Pending */}
              {selectedSession.payment_status === 'pending' && (
                <div className="pt-4">
                  <button
                    onClick={() => handleCashPayment(selectedSession.payment_id, selectedSession.id)}
                    className="w-full h-16 bg-available hover:bg-green-400 text-black rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-available/20 transition-all flex items-center justify-center gap-3 text-sm active:scale-[0.98]"
                  >
                    <DollarSign className="w-6 h-6" />
                    Settle Account via Cash
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}

function DetailTile({ icon, label, value }) {
  return (
    <div className="bg-[var(--bg-elevated)]/50 border border-[var(--bg-border)] p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
      <div className="text-[var(--text-muted)] opacity-50">{icon}</div>
      <div className="space-y-0.5">
        <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-tighter">{label}</p>
        <p className="text-xs font-black text-[var(--text-primary)] truncate max-w-[120px]">{value}</p>
      </div>
    </div>
  );
}

function StatMiniCard({ label, value, icon, color }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] p-4 rounded-2xl shadow-lg flex items-center gap-4 group hover:border-accent/30 transition-all">
      <div className={`p-2.5 rounded-xl bg-[var(--bg-elevated)] ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm font-black text-[var(--text-primary)] truncate">{value}</p>
      </div>
    </div>
  );
}

function HistoryPlaceholder(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
