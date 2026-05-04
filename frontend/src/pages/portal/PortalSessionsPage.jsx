import React, { useState, useEffect, useCallback } from 'react';
import PortalNavbar from '../../components/portal/PortalNavbar';
import { portalApi } from '../../services/api';
import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns';
import toast from 'react-hot-toast';
import {
  History, Search, Calendar, CreditCard, Download,
  Zap, BarChart3, Clock, CheckCircle2, AlertCircle,
  Loader2, Smartphone, XCircle, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import CheckoutButton from '../../components/CheckoutButton';

export default function PortalSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [payingSessionId, setPayingSessionId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const normalizeSessions = (data) =>
    data.map(s => ({
      ...s,
      // Normalize: both 'status' and 'session_status' could come back from the API
      session_status: s.session_status || s.status,
      amount: s.amount != null ? parseFloat(s.amount) : null,
    }));

  const fetchSessions = useCallback(async (p = 1, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await portalApi.getSessions(p, 20);
      const normalized = normalizeSessions(res.data);
      if (p === 1) setSessions(normalized);
      else setSessions(prev => [...prev, ...normalized]);
      setHasMore(res.data.length === 20);
      setPage(p);
    } catch {
      toast.error('Failed to load sessions');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(1); }, [fetchSessions]);

  const handleKhaltiPay = async (paymentId) => {
    try {
      setPayingSessionId(paymentId);
      const res = await portalApi.initiatePayment(paymentId);
      window.location.href = res.data.payment_url;
    } catch (err) {
      setPayingSessionId(null);
      const msg = err.response?.data?.detail || 'Failed to initiate Khalti payment';
      if (msg.toLowerCase().includes('already')) {
        toast.success('This session is already paid!');
        fetchSessions(1, true); // refresh silently
      } else {
        toast.error(msg);
      }
    }
  };

  const FILTERS = [
    { key: 'all', label: 'All', count: sessions.length },
    {
      key: 'active',
      label: 'Active Now',
      count: sessions.filter(s => s.session_status === 'active').length,
    },
    {
      key: 'pending',
      label: 'Awaiting Payment',
      count: sessions.filter(
        s => (s.session_status === 'completed' || s.session_status !== 'active') && s.payment_status === 'pending'
      ).length,
    },
    {
      key: 'paid',
      label: 'Paid',
      count: sessions.filter(s => s.payment_status === 'paid').length,
    },
  ];

  const filteredSessions = sessions.filter(s => {
    const matchSearch =
      !searchTerm ||
      (s.slot_label || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.entry_time && format(new Date(s.entry_time), 'MMM d yyyy').toLowerCase().includes(searchTerm.toLowerCase()));

    let matchFilter = true;
    if (activeFilter === 'active') matchFilter = s.session_status === 'active';
    if (activeFilter === 'pending')
      matchFilter = (s.session_status === 'completed' || s.session_status !== 'active') && s.payment_status === 'pending';
    if (activeFilter === 'paid') matchFilter = s.payment_status === 'paid';

    return matchSearch && matchFilter;
  });

  const totalSpent = sessions
    .filter(s => s.payment_status === 'paid')
    .reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalPoints = sessions.reduce((sum, s) => sum + (s.points_earned || 0), 0);
  const pendingCount = FILTERS.find(f => f.key === 'pending')?.count || 0;

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <PortalNavbar />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-customer/10 text-customer">
                  <History className="w-6 h-6" />
                </div>
                <h1 className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">Session History</h1>
              </div>
              <p className="text-[var(--text-secondary)] text-lg">Your complete parking activity and payment records.</p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-[var(--bg-elevated)] hover:bg-[var(--bg-border)] text-[var(--text-primary)] rounded-2xl font-bold transition-all border border-[var(--bg-border)] shadow-sm">
              <Download className="w-4 h-4 text-customer" />
              Download Statement
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <SummaryCard icon={<Zap className="w-4 h-4" />} label="Total Sessions" value={`${sessions.length} Sessions`} color="text-accent" />
            <SummaryCard icon={<CreditCard className="w-4 h-4" />} label="Lifetime Spent" value={`NPR ${totalSpent.toFixed(0)}`} color="text-available" />
            <SummaryCard icon={<BarChart3 className="w-4 h-4" />} label="Loyalty Earned" value={`${totalPoints} Points`} color="text-amber-400" />
          </div>

          {/* Pending Payment Alert */}
          {pendingCount > 0 && (
            <div className="mb-6 p-4 bg-pending/10 border-2 border-pending/30 rounded-2xl flex items-center gap-4">
              <AlertCircle className="w-5 h-5 text-pending flex-shrink-0" />
              <p className="text-sm font-bold text-pending">
                You have <span className="font-black">{pendingCount}</span> session{pendingCount > 1 ? 's' : ''} awaiting payment. Please settle to keep your parking pass active.
              </p>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="flex flex-col md:flex-row gap-3 p-2 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-2xl shadow-sm">
            <div className="flex p-1 bg-[var(--bg-elevated)] rounded-xl gap-1">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`flex items-center gap-2 py-2 px-3 text-[10px] font-black rounded-lg transition-all uppercase tracking-wider whitespace-nowrap ${
                    activeFilter === f.key
                      ? 'bg-[var(--bg-surface)] text-customer shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {f.label}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${activeFilter === f.key ? 'bg-customer/10 text-customer' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search by slot or date..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[var(--bg-elevated)]/50 border-none rounded-xl text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-customer/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Sessions Grid */}
        {loading && page === 1 ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-customer border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="glass rounded-3xl border border-[var(--bg-border)] p-20 text-center">
            <History className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-6 opacity-30" />
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">No sessions found</h3>
            <p className="text-[var(--text-secondary)]">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSessions.map(s => (
                <SessionCard
                  key={s.id}
                  session={s}
                  onKhaltiPay={handleKhaltiPay}
                  payingId={payingSessionId}
                  onPaymentSuccess={() => fetchSessions(1, true)}
                />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => fetchSessions(page + 1)}
                  className="group relative px-10 py-4 bg-[var(--bg-surface)] border-2 border-[var(--bg-border)] rounded-3xl text-sm font-extrabold text-[var(--text-primary)] hover:border-customer transition-all overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? 'Loading...' : 'Load More Sessions'}
                  </span>
                  <div className="absolute inset-0 bg-customer/5 translate-y-full group-hover:translate-y-0 transition-transform" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] p-5 rounded-2xl flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-[var(--bg-elevated)] ${color}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{label}</p>
        <p className="text-xl font-bold text-[var(--text-primary)] font-mono">{value}</p>
      </div>
    </div>
  );
}

function SessionCard({ session, onKhaltiPay, payingId, onPaymentSuccess }) {
  // Normalize status fields — API can return either 'status' or 'session_status'
  const sessionStatus = session.session_status || session.status;
  const paymentStatus = session.payment_status;

  const isActive = sessionStatus === 'active';
  const isCompleted = sessionStatus === 'completed' || sessionStatus === 'abandoned';
  const isPaid = paymentStatus === 'paid';
  const isUnpaid = paymentStatus === 'pending' && isCompleted;
  const isProcessing = payingId === session.payment_id;

  // Compute duration display
  const getDuration = () => {
    if (isActive) return formatDistanceToNow(new Date(session.entry_time), { addSuffix: false });
    if (session.exit_time) {
      const mins = session.duration_minutes || differenceInMinutes(new Date(session.exit_time), new Date(session.entry_time));
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
    return '—';
  };

  // Border and accent
  let borderClass = 'border-[var(--bg-border)]';
  if (isActive) borderClass = 'border-accent/40';
  else if (isUnpaid) borderClass = 'border-pending/50 shadow-lg shadow-pending/5';
  else if (isPaid) borderClass = 'border-available/30';

  return (
    <div className={`group relative bg-[var(--bg-surface)] rounded-[2rem] border-2 ${borderClass} p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/10 flex flex-col`}>

      {/* Top Row: Slot + Status */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black transition-all duration-500 shadow-inner ${
            isActive
              ? 'bg-accent/20 text-accent'
              : isPaid
              ? 'bg-available/20 text-available'
              : isUnpaid
              ? 'bg-pending/20 text-pending'
              : 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
          }`}>
            {session.slot_label}
          </div>
          <div>
            <h3 className="font-black text-lg text-[var(--text-primary)]">Slot {session.slot_label}</h3>
            <StatusBadge sessionStatus={sessionStatus} paymentStatus={paymentStatus} />
          </div>
        </div>
        {/* Amount */}
        <div className="text-right">
          {session.amount != null ? (
            <>
              <p className="text-xl font-black text-[var(--text-primary)] font-mono">NPR {session.amount.toFixed(2)}</p>
              {isPaid && session.points_earned > 0 && (
                <p className="text-[10px] font-bold text-amber-500 flex items-center justify-end gap-1 mt-0.5">
                  <Zap className="w-3 h-3 fill-amber-500" />+{session.points_earned} pts
                </p>
              )}
            </>
          ) : (
            <span className="text-sm font-bold text-pending animate-pulse">Billing...</span>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2.5 mb-5">
        <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] font-medium">
          <ArrowUpRight className="w-3.5 h-3.5 text-available flex-shrink-0" />
          <span>Entered: {format(new Date(session.entry_time), 'MMM d, HH:mm')}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] font-medium">
          <ArrowDownRight className="w-3.5 h-3.5 text-occupied flex-shrink-0" />
          <span>
            {session.exit_time
              ? `Exited: ${format(new Date(session.exit_time), 'MMM d, HH:mm')}`
              : <span className="text-accent animate-pulse font-bold">Still Parked</span>
            }
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] font-medium">
          <Clock className="w-3.5 h-3.5 text-customer flex-shrink-0" />
          <span>Duration: <strong className="text-[var(--text-primary)]">{getDuration()}</strong></span>
        </div>
      </div>

      {/* Bottom: Payment action or info */}
      <div className="mt-auto pt-5 border-t border-[var(--bg-border)]">
        {isUnpaid ? (
          <div className="space-y-2">
            <p className="text-[9px] font-black text-pending uppercase tracking-widest text-center mb-3">
              ⚠ Payment Required
            </p>
            <button
              onClick={() => onKhaltiPay(session.payment_id)}
              disabled={isProcessing}
              className="w-full py-3 bg-[#5C2D91] hover:bg-[#4a2474] text-white text-sm font-black rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isProcessing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting...</>
                : <><Smartphone className="w-4 h-4" /> Pay with Khalti</>
              }
            </button>
            <CheckoutButton
              paymentId={session.payment_id}
              amount={session.amount}
              className="w-full py-3 bg-[#60bb46] hover:bg-[#52a13b] text-white text-sm font-black rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              Pay with eSewa
            </CheckoutButton>
          </div>
        ) : isPaid ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Payment</p>
              <p className="text-sm font-black text-available capitalize">
                <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                {session.method || session.payment_method || 'Paid'}
              </p>
            </div>
            {session.points_earned > 0 && (
              <div className="text-right">
                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Points</p>
                <p className="text-sm font-black text-amber-500">+{session.points_earned}</p>
              </div>
            )}
          </div>
        ) : isActive ? (
          <div className="flex items-center gap-2 justify-center text-accent">
            <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
            <span className="text-xs font-black uppercase tracking-widest">Session Live — Timer Running</span>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Session Closed</span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ sessionStatus, paymentStatus }) {
  if (sessionStatus === 'active') {
    return (
      <div className="flex items-center gap-1.5 mt-1">
        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        <span className="text-accent text-[10px] font-bold tracking-wider">ACTIVE</span>
      </div>
    );
  }
  if (paymentStatus === 'paid') {
    return <span className="text-[10px] font-bold text-available tracking-wider mt-1 block">✓ COMPLETED</span>;
  }
  if (paymentStatus === 'pending') {
    return <span className="text-[10px] font-bold text-pending tracking-wider mt-1 block uppercase">⚠ Unpaid</span>;
  }
  if (sessionStatus === 'abandoned') {
    return <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-wider mt-1 block">ABANDONED</span>;
  }
  return <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-wider mt-1 block capitalize">{sessionStatus}</span>;
}
