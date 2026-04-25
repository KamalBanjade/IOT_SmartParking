import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usersApi, sessionsApi } from '../services/api';
import { useParking } from '../context/ParkingContext';
import Navbar from '../components/shared/Navbar';
import MemberCard from '../components/user/MemberCard';
import StatusBadge from '../components/shared/StatusBadge';
import { format } from 'date-fns';

export default function MemberPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [pointsSummary, setPointsSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const { setScannedUser } = useParking();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const [userRes, pointsRes, sessionsRes] = await Promise.all([
          usersApi.getById(id),
          usersApi.getPointsSummary(id),
          sessionsApi.getUserSessions(id)
        ]);
        setUser(userRes.data);
        setPointsSummary(pointsRes.data);
        setSessions(sessionsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-bg-base flex items-center justify-center text-text-muted">Loading...</div>;
  if (!user) return <div className="min-h-screen bg-bg-base flex items-center justify-center text-status-occupied">Member not found</div>;

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <Navbar />
      
      <main className="flex-grow max-w-[1200px] w-full mx-auto p-6">
        
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center text-sm">
            <Link to="/members" className="text-text-muted hover:text-text-primary transition-colors">← Back to Members</Link>
            <span className="mx-3 text-bg-border">|</span>
            <span className="text-text-primary font-medium">Member Profile</span>
          </div>

          <button 
            onClick={() => {
              setScannedUser({ user, pointsSummary });
              navigate('/');
            }}
            className="px-4 py-1.5 bg-accent text-white text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity"
          >
            Select as Active Member
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-[35%] shrink-0">
            <MemberCard 
              user={user} 
              pointsSummary={pointsSummary} 
              onQrUpdate={(newToken) => setUser({ ...user, qr_token: newToken })} 
            />
          </div>

          <div className="w-full lg:w-[65%]">
            <div className="bg-bg-surface border border-bg-border rounded-xl overflow-hidden h-full flex flex-col">
              <div className="px-5 py-3 border-b border-bg-border bg-bg-surface sticky top-0 z-10">
                <h3 className="text-sm font-medium text-text-primary">Session History</h3>
              </div>
              
              <div className="overflow-x-auto flex-grow">
                <table className="w-full text-left">
                  <thead className="bg-bg-base border-b border-bg-border">
                    <tr className="text-[10px] uppercase tracking-widest text-text-muted">
                      <th className="px-5 py-3">Slot</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3 text-right">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-bg-border">
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="p-8 text-center text-text-muted italic">
                          No sessions yet
                        </td>
                      </tr>
                    ) : (
                      sessions.map((s) => (
                        <tr key={s.id} className="hover:bg-bg-elevated/50 transition-colors">
                          <td className="px-5 py-4 font-medium text-text-primary">Slot {s.slot_label}</td>
                          <td className="px-5 py-4 text-text-secondary">
                            {format(new Date(s.entry_time), 'MMM d, yyyy p')}
                          </td>
                          <td className="px-5 py-4 text-right text-text-primary font-medium">
                            {s.amount ? `NPR ${s.amount}` : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
