import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PortalNavbar from '../../components/portal/PortalNavbar';
import { portalApi } from '../../services/api';
import { format } from 'date-fns';

export default function PortalSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchSessions(1);
  }, []);

  const fetchSessions = async (pageNum) => {
    try {
      const res = await portalApi.getSessions(pageNum);
      if (pageNum === 1) {
        setSessions(res.data);
      } else {
        setSessions(prev => [...prev, ...res.data]);
      }
      setHasMore(res.data.length === 10); // Assuming limit is 10
      setPage(pageNum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <PortalNavbar />
      
      <main className="flex-grow max-w-2xl w-full mx-auto p-4 space-y-4">
        
        <div className="flex items-center mb-6">
          <Link to="/portal/dashboard" className="text-text-muted hover:text-text-primary transition-colors mr-3">←</Link>
          <h1 className="text-xl font-bold text-text-primary">Parking History</h1>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded-xl overflow-hidden">
          <div className="divide-y divide-bg-border">
            {sessions.map(session => (
              <div key={session.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">Slot {session.slot_label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${
                      session.status === 'active' ? 'bg-status-available text-[#0f1419]' :
                      session.status === 'abandoned' ? 'bg-status-occupied/20 text-status-occupied' :
                      'bg-bg-elevated text-text-secondary border border-bg-border'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  <div className="text-xs text-text-muted mt-1">
                    {format(new Date(session.entry_time), 'MMM d, yyyy h:mm a')}
                    {session.exit_time && ` - ${format(new Date(session.exit_time), 'h:mm a')}`}
                  </div>
                </div>
                
                <div className="flex justify-between sm:flex-col sm:text-right sm:items-end mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-bg-border sm:border-0">
                  <div className="text-sm font-medium text-text-primary">
                    {session.amount ? `NPR ${session.amount}` : '-'}
                  </div>
                  <div className="flex gap-2 text-xs text-text-muted mt-1">
                    {session.duration_minutes && <span>{Math.ceil(session.duration_minutes / 60)}h</span>}
                    {session.amount && <span className="text-status-warning">+ {Math.floor(session.amount / 10)} pts</span>}
                  </div>
                </div>
              </div>
            ))}

            {sessions.length === 0 && !loading && (
              <div className="p-8 text-center text-text-muted text-sm">
                No parking history yet.
              </div>
            )}
            
            {loading && (
              <div className="p-4 text-center text-text-muted text-sm">Loading...</div>
            )}
          </div>
        </div>

        {hasMore && sessions.length > 0 && !loading && (
          <button 
            onClick={() => fetchSessions(page + 1)}
            className="w-full py-3 text-sm text-text-secondary hover:text-text-primary border border-bg-border rounded-xl transition-colors hover:bg-bg-surface"
          >
            Load More
          </button>
        )}

      </main>
    </div>
  );
}
