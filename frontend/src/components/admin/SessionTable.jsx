import React, { useState, useEffect } from 'react';
import { adminApi, sessionsApi } from '../../services/api';
import { format } from 'date-fns';
import StatusBadge from '../shared/StatusBadge';
import ConfirmModal from '../shared/ConfirmModal';
import toast from 'react-hot-toast';

export default function SessionTable() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exitSlotId, setExitSlotId] = useState(null);

  const fetchSessions = () => {
    setLoading(true);
    adminApi.getSessions()
      .then(res => setSessions(res.data))
      .catch(err => toast.error("Failed to load sessions"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const confirmForceExit = async () => {
    if (!exitSlotId) return;
    try {
      await sessionsApi.exit({ slotId: exitSlotId });
      toast.success("Session force exited");
      fetchSessions();
    } catch (err) {
      toast.error("Failed to exit session");
    } finally {
      setExitSlotId(null);
    }
  };

  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-bg-border flex justify-between items-center">
        <h3 className="text-sm font-medium text-text-primary">Sessions</h3>
        <button onClick={fetchSessions} className="text-xs text-text-muted hover:text-text-primary transition-colors">
          Refresh
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr>
              <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-text-muted font-normal">Slot</th>
              <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-text-muted font-normal">Entry Time</th>
              <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-text-muted font-normal">Exit Time</th>
              <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-text-muted font-normal">Duration</th>
              <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-text-muted font-normal">Status</th>
              <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-text-muted font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="px-5 py-8 text-center text-sm text-text-muted">Loading...</td></tr>
            ) : sessions.length === 0 ? (
              <tr><td colSpan="6" className="px-5 py-8 text-center text-sm text-text-muted">No sessions found.</td></tr>
            ) : (
              sessions.map((session) => (
                <tr key={session.id} className="border-t border-bg-elevated hover:bg-bg-elevated/50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-text-primary">
                    {session.slot_label}
                  </td>
                  <td className="px-5 py-3 text-sm text-text-secondary">
                    {format(new Date(session.entry_time), 'PPp')}
                  </td>
                  <td className="px-5 py-3 text-sm text-text-secondary">
                    {session.exit_time ? format(new Date(session.exit_time), 'PPp') : '--'}
                  </td>
                  <td className="px-5 py-3 text-sm text-text-secondary">
                    {session.duration_minutes !== null ? `${session.duration_minutes}m` : '--'}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={session.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    {session.status === 'active' && (
                      <button 
                        onClick={() => setExitSlotId(session.slot_id)}
                        className="text-xs text-status-occupied hover:opacity-80 transition-opacity"
                      >
                        Force Exit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal 
        isOpen={!!exitSlotId}
        onClose={() => setExitSlotId(null)}
        onConfirm={confirmForceExit}
        title="Force Exit Session?"
        message="This will manually end the parking session. Ensure the vehicle has physically vacated the slot."
        confirmText="Force Exit"
        type="warning"
      />
    </div>
  );
}
