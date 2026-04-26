import React, { useState, useEffect } from 'react';
import PortalNavbar from '../../components/portal/PortalNavbar';
import { portalApi } from '../../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { History, Search, Filter, Calendar, CreditCard, Download, Zap, BarChart3, Clock } from 'lucide-react';

export default function PortalSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [payingSessionId, setPayingSessionId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchSessions = async (p = 1) => {
    try {
      const res = await portalApi.getSessions(p, 12);
      if (p === 1) setSessions(res.data);
      else setSessions(prev => [...prev, ...res.data]);
      setHasMore(res.data.length === 12);
      setPage(p);
    } catch { toast.error('Failed to load sessions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSessions(1); }, []);

  const loadMore = () => fetchSessions(page + 1);

  const handleKhaltiPay = async (paymentId) => {
    try {
      setPayingSessionId(paymentId);
      const res = await portalApi.initiatePayment(paymentId);
      window.location.href = res.data.payment_url;
    } catch (err) {
      setPayingSessionId(null);
      toast.error('Failed to initiate Khalti payment');
    }
  };

  const filteredSessions = sessions.filter(s => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return s.session_status === 'completed' && s.payment_status === 'pending';
    if (activeFilter === 'paid') return s.payment_status === 'paid';
    return true;
  });

  const totalSpent = sessions.filter(s => s.payment_status === 'paid').reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  const totalPoints = sessions.reduce((sum, s) => sum + (s.points_earned || 0), 0);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <PortalNavbar />
      
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-10">
        
        {/* Appeal Header */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-customer/10 text-customer">
                  <History className="w-6 h-6" />
                </div>
                <h1 className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">Session History</h1>
              </div>
              <p className="text-[var(--text-secondary)] text-lg">Detailed record of your parking activity and loyalty earnings.</p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-[var(--bg-elevated)] hover:bg-[var(--bg-border)] text-[var(--text-primary)] rounded-2xl font-bold transition-all border border-[var(--bg-border)] shadow-sm">
              <Download className="w-4 h-4 text-customer" />
              Download Statement
            </button>
          </div>

          {/* Quick Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <SummaryCard icon={<Zap className="w-4 h-4" />} label="Total Activity" value={`${sessions.length} Sessions`} color="text-accent" />
            <SummaryCard icon={<CreditCard className="w-4 h-4" />} label="Lifetime Spent" value={`NPR ${totalSpent.toFixed(0)}`} color="text-available" />
            <SummaryCard icon={<BarChart3 className="w-4 h-4" />} label="Loyalty Gained" value={`${totalPoints} Points`} color="text-amber-400" />
          </div>

          {/* Advanced Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 p-2 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-2xl shadow-sm">
            <div className="flex p-1 bg-[var(--bg-elevated)] rounded-xl flex-grow max-w-md">
              {['all', 'paid', 'pending'].map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`flex-1 py-2 px-4 text-sm font-bold rounded-lg transition-all capitalize ${
                    activeFilter === f 
                      ? 'bg-[var(--bg-surface)] text-customer shadow-sm' 
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input 
                type="text" 
                placeholder="Search by date or slot..." 
                className="w-full pl-11 pr-4 py-3 bg-[var(--bg-elevated)]/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-customer/20 transition-all"
              />
            </div>
          </div>
        </div>

        {loading && page === 1 ? (
          <div className="flex flex-center py-20">
            <div className="w-12 h-12 border-4 border-customer border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="glass rounded-3xl border border-[var(--bg-border)] p-20 text-center">
            <div className="w-20 h-20 bg-[var(--bg-elevated)] rounded-full flex items-center justify-center mx-auto mb-6">
              <History className="w-10 h-10 text-[var(--text-muted)]" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">No results found</h3>
            <p className="text-[var(--text-secondary)]">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredSessions.map(s => (
                <SessionCard 
                  key={s.id} 
                  session={s} 
                  onPay={handleKhaltiPay}
                  payingId={payingSessionId}
                />
              ))}
            </div>
            
            {hasMore && (
              <div className="flex justify-center pt-8">
                <button 
                  onClick={loadMore}
                  className="group relative px-10 py-4 bg-[var(--bg-surface)] border-2 border-[var(--bg-border)] rounded-3xl text-sm font-extrabold text-[var(--text-primary)] hover:border-customer transition-all overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? 'Crunching Data...' : 'Explore Older Sessions'}
                  </span>
                  <div className="absolute inset-0 bg-customer/5 translate-y-full group-hover:translate-y-0 transition-transform"></div>
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
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] p-4 rounded-2xl flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-[var(--bg-elevated)] ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{label}</p>
        <p className="text-xl font-bold text-[var(--text-primary)] font-mono">{value}</p>
      </div>
    </div>
  );
}

function SessionCard({ session, onPay, payingId }) {
  const isCompleted = session.session_status === 'completed';
  const isAbandoned = session.session_status === 'abandoned';
  const isPending = session.payment_status === 'pending';
  const isPaid = session.payment_status === 'paid';
  const needsPayment = isCompleted && isPending && session.payment_id;
  const isProcessing = payingId === session.payment_id;

  let statusBadge = null;
  let accentColor = 'border-[var(--bg-border)]';

  if (session.session_status === 'active') {
    statusBadge = <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> <span className="text-accent text-[10px] font-bold tracking-wider">IN PROGRESS</span></div>;
    accentColor = 'border-accent/40';
  } else if (isAbandoned) {
    statusBadge = <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-wider">ABANDONED</span>;
  } else if (needsPayment) {
    statusBadge = <span className="text-pending text-[10px] font-bold tracking-wider uppercase">Pending Payment</span>;
    accentColor = 'border-pending/50 shadow-lg shadow-pending/5';
  } else if (isPaid) {
    statusBadge = <span className="text-available text-[10px] font-bold tracking-wider uppercase">Completed & Paid</span>;
    accentColor = 'border-available/40';
  }

  return (
    <div className={`group relative bg-[var(--bg-surface)] rounded-2xl sm:rounded-[2rem] border-2 ${accentColor} p-5 sm:p-7 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/10`}>
      <div className="flex justify-between items-start mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-border)] flex items-center justify-center text-xl sm:text-2xl font-black text-[var(--text-primary)] group-hover:from-customer group-hover:to-accent group-hover:text-white transition-all duration-500 shadow-inner">
            {session.slot_label}
          </div>
          <div>
            <h3 className="font-black text-base sm:text-xl text-[var(--text-primary)]">Slot {session.slot_label}</h3>
            <div className="mt-1">{statusBadge}</div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl sm:text-2xl font-black text-[var(--text-primary)] font-mono">NPR {session.amount}</p>
          {isPaid && <p className="text-[10px] font-bold text-amber-500 flex items-center justify-end gap-1"><Zap className="w-3 h-3 fill-amber-500" /> +{session.points_earned} PTS</p>}
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] font-medium">
          <Calendar className="w-4 h-4 text-customer" />
          {format(new Date(session.entry_time), 'EEEE, MMM do')}
        </div>
        <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] font-medium">
          <Clock className="w-4 h-4 text-customer" />
          {format(new Date(session.entry_time), 'HH:mm')} — {session.exit_time ? format(new Date(session.exit_time), 'HH:mm') : <span className="text-accent animate-pulse">Present</span>}
        </div>
      </div>

      <div className="pt-6 border-t-2 border-[var(--bg-border)] flex items-center justify-between">
        {needsPayment ? (
          <button 
            onClick={() => onPay(session.payment_id)}
            disabled={isProcessing}
            className="w-full py-4 bg-pending hover:bg-orange-600 text-white text-sm font-black rounded-2xl transition-all shadow-xl shadow-pending/20 flex items-center justify-center gap-2"
          >
            {isProcessing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {isProcessing ? 'Redirecting...' : 'Complete Payment'}
          </button>
        ) : (
          <>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Duration</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">
                {session.session_status === 'active' 
                  ? 'In Progress' 
                  : `${Math.floor((session.duration_minutes || 0) / 60)}h ${(session.duration_minutes || 0) % 60}m`
                }
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Method</span>
              <p className="text-sm font-bold text-[var(--text-secondary)] capitalize">{session.method || '—'}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
