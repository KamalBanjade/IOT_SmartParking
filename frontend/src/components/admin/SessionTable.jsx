import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import StatusBadge from '../shared/StatusBadge';
import ConfirmModal from '../shared/ConfirmModal';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Eye, Trash2, Calendar, Clock, CreditCard, User, Hash, MapPin, X, History as HistoryIcon } from 'lucide-react';

export default function SessionTable() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [forceExitId, setForceExitId] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  const LIMIT = 15;

  const fetchSessions = async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await adminApi.getSessions(date, pageNum, LIMIT);
      setSessions(res.data);
      setHasMore(res.data.length === LIMIT);
      setPage(pageNum);
    } catch { toast.error('Failed to load sessions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSessions(1); }, [date]);

  const handleForceExit = async () => {
    if (!forceExitId) return;
    try {
      await adminApi.forceExit(forceExitId);
      toast.success('Session force-ended');
      fetchSessions();
    } catch { toast.error('Force exit failed'); }
    finally { setForceExitId(null); }
  };

  return (
    <div className="bg-[var(--bg-surface)] rounded-[2.5rem] border border-[var(--bg-border)] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[var(--bg-border)] flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-[var(--bg-surface)] to-[var(--bg-elevated)]/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/10 text-accent">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Audit Log</h3>
            <p className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-widest">Real-time Session History</p>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] text-available ml-4 font-bold">
            <span className="w-2 h-2 rounded-full bg-available animate-pulse inline-block" />
            LIVE
          </span>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              className="text-xs bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl pl-10 pr-4 py-2.5 text-[var(--text-primary)] focus:border-accent focus:outline-none transition-all w-full sm:w-44" 
            />
          </div>
          {date && (
            <button 
              onClick={() => setDate('')} 
              className="p-2.5 text-[var(--text-muted)] hover:text-occupied hover:bg-occupied/5 rounded-xl transition-all"
              title="Clear Filter"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--bg-elevated)]/50 border-b border-[var(--bg-border)]">
              {['Slot', 'User', 'Arrival', 'Departure', 'Duration', 'Amount', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-6 py-5 text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-black whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--bg-border)]">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-black uppercase tracking-widest text-accent">Syncing Logs</span>
                  </div>
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-40">
                    <HistoryIcon className="w-16 h-16 text-[var(--text-muted)] mb-2" />
                    <p className="text-base font-black text-[var(--text-muted)] uppercase tracking-widest">No audit data found</p>
                  </div>
                </td>
              </tr>
            ) : sessions.map(s => (
              <tr key={s.id} className="hover:bg-[var(--bg-elevated)]/30 transition-all group">
                <td className="px-6 py-5">
                  <span className="font-black text-xs px-3 py-1 rounded-xl bg-accent/10 text-accent border border-accent/20 group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
                    {s.slot_label}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--bg-elevated)] border border-[var(--bg-border)] flex items-center justify-center text-xs font-black text-[var(--text-secondary)] shadow-sm">
                      {s.user_name ? s.user_name.charAt(0).toUpperCase() : 'W'}
                    </div>
                    <div>
                      <span className="text-sm font-black text-[var(--text-primary)] block leading-none">
                        {s.user_name || 'Walk-in Guest'}
                      </span>
                      {!s.user_name && <span className="text-[9px] font-bold text-occupied uppercase tracking-tighter mt-1 block">Unregistered</span>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-xs text-[var(--text-secondary)] font-bold">
                  {s.entry_time ? format(new Date(s.entry_time), 'MMM d, HH:mm') : '—'}
                </td>
                <td className="px-6 py-5 text-xs text-[var(--text-secondary)] font-bold">
                  {s.exit_time ? format(new Date(s.exit_time), 'MMM d, HH:mm') : <span className="text-accent animate-pulse font-black">PRESENT</span>}
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
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSelectedSession(s)}
                      className="p-2.5 rounded-xl bg-[var(--bg-elevated)] text-accent hover:bg-accent/10 transition-all border border-accent/10 shadow-sm"
                      title="Deep Audit"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {s.status === 'active' && (
                      <button 
                        onClick={() => setForceExitId(s.id)}
                        className="p-2.5 rounded-xl bg-[var(--bg-elevated)] text-occupied hover:bg-occupied/10 transition-all border border-occupied/10 shadow-sm"
                        title="Force Termination"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-8 py-6 border-t border-[var(--bg-border)] flex items-center justify-between bg-[var(--bg-elevated)]/20">
        <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">
          Page {page} {sessions.length > 0 && `• Showing ${sessions.length} records`}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchSessions(page - 1)}
            disabled={page === 1 || loading}
            className="px-5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--bg-border)] text-xs font-black uppercase tracking-widest text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <button 
            onClick={() => fetchSessions(page + 1)}
            disabled={!hasMore || loading}
            className="px-6 py-2 rounded-xl bg-accent text-white text-xs font-black uppercase tracking-widest hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20"
          >
            Next Page
          </button>
        </div>
      </div>

      <ConfirmModal 
        isOpen={!!forceExitId} 
        onClose={() => setForceExitId(null)} 
        onConfirm={handleForceExit}
        title="Force End Session?" 
        message="This will immediately terminate the session and create a payment record."
        confirmText="Force Exit" 
        type="danger" 
      />

      {/* Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedSession(null)} />
          <div className="relative w-full max-w-lg glass rounded-3xl border border-[var(--bg-border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-[var(--bg-border)] flex items-center justify-between bg-gradient-to-r from-accent/10 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent text-white flex items-center justify-center text-xl font-black shadow-lg shadow-accent/20">
                  {selectedSession.slot_label}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Session Details</h2>
                  <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-tighter">Audit ID: #{selectedSession.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedSession(null)} className="p-2 hover:bg-[var(--bg-elevated)] rounded-xl transition-all">
                <X className="w-6 h-6 text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <DetailItem icon={<User className="w-4 h-4" />} label="Customer" value={selectedSession.user_name || 'Walk-in'} />
                <DetailItem icon={<MapPin className="w-4 h-4" />} label="Slot Location" value={`Zone A - ${selectedSession.slot_label}`} />
                <DetailItem icon={<Clock className="w-4 h-4" />} label="Entry Time" value={selectedSession.entry_time ? format(new Date(selectedSession.entry_time), 'HH:mm:ss, MMM d') : '—'} />
                <DetailItem icon={<Clock className="w-4 h-4" />} label="Exit Time" value={selectedSession.exit_time ? format(new Date(selectedSession.exit_time), 'HH:mm:ss, MMM d') : 'Active Session'} />
                <DetailItem icon={<HistoryIcon className="w-4 h-4" />} label="Total Duration" value={selectedSession.duration_minutes ? `${Math.floor(selectedSession.duration_minutes / 60)}h ${selectedSession.duration_minutes % 60}m` : '—'} />
                <DetailItem icon={<CreditCard className="w-4 h-4" />} label="Payment Amount" value={selectedSession.amount ? `NPR ${selectedSession.amount}` : 'Not Paid'} />
              </div>

              <div className="p-6 rounded-2xl bg-[var(--bg-elevated)]/50 border border-[var(--bg-border)] space-y-4">
                <h4 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Payment Context</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-secondary)]">Payment Status</span>
                  <StatusBadge status={selectedSession.payment_status || selectedSession.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-secondary)]">Method</span>
                  <span className="text-sm font-bold text-[var(--text-primary)] capitalize">{selectedSession.payment_method || '—'}</span>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-[var(--bg-elevated)]/30 border-t border-[var(--bg-border)] text-right">
              <button 
                onClick={() => setSelectedSession(null)}
                className="px-6 py-2.5 bg-accent hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-accent/20"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">
        <span className="text-accent">{icon}</span>
        {label}
      </div>
      <p className="text-sm font-bold text-[var(--text-primary)] pl-6">{value}</p>
    </div>
  );
}
