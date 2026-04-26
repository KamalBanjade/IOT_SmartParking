import React, { useState, useEffect } from 'react';
import PortalNavbar from '../../components/portal/PortalNavbar';
import { portalApi } from '../../services/api';
import { useCustomerAuth } from '../../hooks/useCustomerAuth';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, ChevronRight, Star, History, CreditCard, Clock, MapPin, TrendingUp, Award, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function PortalDashboardPage() {
  const { customer } = useCustomerAuth();
  const [profile, setProfile] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingSessionId, setPayingSessionId] = useState(null);

  const fetchData = async () => {
    try {
      const [profRes, sessRes] = await Promise.all([
        portalApi.getProfile(),
        portalApi.getSessions(1, 10), // Fetch more for better flow
      ]);
      setProfile(profRes.data);
      setRecentSessions(sessRes.data);
    } catch (err) {
      toast.error('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchData();
  }, []);

  const ps = profile?.pointsSummary;
  const stats = profile?.stats;
  const progress = ps ? Math.min(100, ((ps.total % (ps.nextRewardAt || 50)) / (ps.nextRewardAt || 50)) * 100) : 0;
  const toNext = ps ? (ps.nextRewardAt || 50) - ((ps.total || 0) % (ps.nextRewardAt || 50)) : 50;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)]">
        <PortalNavbar />
        <div className="flex items-center justify-center pt-32">
          <div className="w-10 h-10 border-4 border-customer border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Pending payments (ones the user needs to take action on)
  const pendingSessions = recentSessions.filter(s => s.session_status === 'completed' && s.payment_status === 'pending');
  const activeSessions = recentSessions.filter(s => s.session_status === 'active');

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-20">
      <PortalNavbar />
      
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 pt-8 space-y-8">
        
        {/* Hero Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-customer to-accent flex items-center justify-center text-white shadow-lg shadow-customer/20">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">Welcome back, {profile?.name}!</h1>
              <p className="text-[var(--text-secondary)]">Manage your parking sessions and rewards.</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 bg-[var(--bg-surface)] border border-[var(--bg-border)] px-4 py-2 rounded-2xl">
            <div className="w-2 h-2 rounded-full bg-available animate-pulse" />
            <span className="text-sm font-medium text-[var(--text-secondary)]">System Status: Optimal</span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={<Star className="w-5 h-5 text-amber-400" />}
            label="Loyalty Points"
            value={ps?.total ?? 0}
            subtext={`${toNext} to next reward`}
          />
          <StatCard 
            icon={<TrendingUp className="w-5 h-5 text-available" />}
            label="Total Saved"
            value={`NPR ${Math.floor((ps?.total ?? 0) / 50) * 25}`}
            subtext="From loyalty rewards"
          />
          <StatCard 
            icon={<Clock className="w-5 h-5 text-accent" />}
            label="Total Sessions"
            value={stats?.totalSessions ?? 0}
            subtext="Lifetime activity"
          />
          <StatCard 
            icon={<Award className="w-5 h-5 text-purple-400" />}
            label="Membership"
            value={profile?.is_member ? "Pro Member" : "Guest"}
            subtext="Member since 2024"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Urgent Actions: Pending Payments */}
            {pendingSessions.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-pending" />
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Action Required</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {pendingSessions.map(s => (
                    <ActionCard 
                      key={s.id}
                      session={s}
                      onPay={handleKhaltiPay}
                      loading={payingSessionId === s.payment_id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Active Sessions */}
            {activeSessions.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent" />
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Live Sessions</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {activeSessions.map(s => (
                    <LiveCard key={s.id} session={s} />
                  ))}
                </div>
              </section>
            )}

            {/* Loyalty Progress & Points Chart */}
            <section className="glass rounded-3xl border border-[var(--bg-border)] p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Rewards Progress</h2>
                  <p className="text-sm text-[var(--text-secondary)]">You're getting closer to your next discount!</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-[var(--text-primary)]">{ps?.total ?? 0}</span>
                  <span className="text-sm text-[var(--text-muted)] ml-1">pts</span>
                </div>
              </div>
              
              <div className="mb-8 h-32 flex items-end gap-1">
                {recentSessions.slice().reverse().map((s, i) => (
                  <div 
                    key={s.id} 
                    className="flex-1 bg-gradient-to-t from-customer to-accent rounded-t-lg transition-all duration-500 hover:opacity-80 group relative"
                    style={{ height: `${Math.min(100, (s.points_earned || 2) * 10)}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--bg-elevated)] px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      +{s.points_earned || 0}
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative h-4 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden mb-4">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-customer to-accent transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                <span>0 PTS</span>
                <span>{ps?.nextRewardAt ?? 50} PTS</span>
              </div>

              {ps?.discountAvailable && (
                <div className="mt-8 p-4 rounded-2xl bg-available/10 border border-available/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-available/20 flex items-center justify-center text-xl">🎁</div>
                    <div>
                      <p className="font-bold text-available">NPR 25 Discount Ready!</p>
                      <p className="text-xs text-available/80">Show your QR to staff to redeem.</p>
                    </div>
                  </div>
                  <Award className="w-6 h-6 text-available" />
                </div>
              )}
            </section>

            {/* Recent History Grid */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Recent Activity</h2>
                </div>
                <Link to="/portal/sessions" className="text-sm text-accent hover:underline flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentSessions.slice(0, 4).map(s => (
                  <HistoryMiniCard key={s.id} session={s} />
                ))}
              </div>
            </section>
          </div>

          {/* Side Bar Column */}
          <div className="space-y-8">
            
            {/* QR PASS CARD */}
            <section className="glass rounded-3xl border border-[var(--bg-border)] p-8 text-center bg-gradient-to-b from-[var(--bg-surface)] to-transparent">
              <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest mb-6">Digital Parking Pass</h3>
              <div className="bg-white p-6 rounded-3xl inline-block shadow-xl shadow-black/10 transition-transform hover:scale-105 duration-300">
                <QRCodeCanvas 
                  value={profile?.qr_token || ''} 
                  size={180} 
                  level="H"
                  includeMargin={false}
                />
              </div>
              <div className="mt-6 space-y-2">
                <p className="text-lg font-bold text-[var(--text-primary)]">Member ID: {profile?.id}</p>
                <p className="text-sm text-[var(--text-secondary)]">Scan at any Smart Parking terminal</p>
              </div>
              <button
                onClick={() => {
                  const canvas = document.querySelector('canvas');
                  const link = document.createElement('a');
                  link.download = 'parking-pass.png';
                  link.href = canvas.toDataURL();
                  link.click();
                }}
                className="mt-8 w-full py-4 bg-[var(--bg-elevated)] hover:bg-[var(--bg-border)] text-[var(--text-primary)] rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-5 h-5" /> Save Pass
              </button>
            </section>

            {/* Quick Support / Contact Info */}
            <section className="glass rounded-3xl border border-[var(--bg-border)] p-6 bg-accent/5">
              <h3 className="font-bold text-[var(--text-primary)] mb-4">Need Help?</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] flex items-center justify-center shadow-sm">
                    📞
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Support Line</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">+977 1 4234567</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] flex items-center justify-center shadow-sm">
                    📧
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Email Us</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">help@sparking.np</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, subtext }) {
  return (
    <div className="glass rounded-2xl border border-[var(--bg-border)] p-4 sm:p-5 hover:bg-[var(--bg-surface)] transition-all duration-300 group">
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className="p-1.5 sm:p-2 rounded-xl bg-[var(--bg-elevated)] group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{label}</span>
      </div>
      <div className="space-y-0.5 sm:space-y-1">
        <p className="text-lg sm:text-2xl font-bold text-[var(--text-primary)] font-mono">{value}</p>
        <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)]">{subtext}</p>
      </div>
    </div>
  );
}

function ActionCard({ session, onPay, loading }) {
  return (
    <div className="glass rounded-2xl border-2 border-pending/30 bg-pending/5 p-5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-3">
        <div className="w-8 h-8 rounded-full bg-pending/10 flex items-center justify-center text-pending animate-bounce">
          $
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-bold px-2 py-1 bg-pending/20 text-pending rounded-lg border border-pending/20">
          SLOT {session.slot_label}
        </span>
        <span className="text-[10px] font-bold text-pending uppercase tracking-tighter">Payment Pending</span>
      </div>
      <div className="mb-6">
        <p className="text-3xl font-bold text-[var(--text-primary)]">NPR {session.amount}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Exit at {format(new Date(session.exit_time), 'HH:mm')}</p>
      </div>
      <button 
        onClick={() => onPay(session.payment_id)}
        disabled={loading}
        className="w-full py-3 bg-pending hover:bg-orange-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-pending/20 disabled:opacity-50"
      >
        {loading ? 'Redirecting...' : 'Complete Payment'}
      </button>
    </div>
  );
}

function LiveCard({ session }) {
  return (
    <div className="glass rounded-2xl border border-accent/30 bg-accent/5 p-5 relative">
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
          <span className="text-[10px] font-bold text-accent uppercase">Active</span>
        </div>
      </div>
      <div className="mb-4">
        <span className="text-xs font-bold px-2 py-1 bg-accent/20 text-accent rounded-lg border border-accent/20">
          SLOT {session.slot_label}
        </span>
      </div>
      <div className="space-y-3 sm:space-y-4">
        <div>
          <p className="text-[10px] sm:text-xs text-[var(--text-muted)] uppercase mb-1">Time Elapsed</p>
          <p className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-mono">
            {format(new Date(session.entry_time), 'HH:mm')} - Now
          </p>
        </div>
        <div className="pt-3 sm:pt-4 border-t border-accent/10">
          <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)]">Live updates enabled via controller {session.controller_id || '—'}</p>
        </div>
      </div>
    </div>
  );
}

function HistoryMiniCard({ session }) {
  const isPaid = session.payment_status === 'paid';
  return (
    <div className="glass rounded-2xl border border-[var(--bg-border)] p-4 flex items-center justify-between hover:border-[var(--bg-border-hover)] transition-all">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isPaid ? 'bg-available/10 text-available' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>
          {isPaid ? '✓' : '•'}
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--text-primary)]">Slot {session.slot_label}</p>
          <p className="text-[10px] text-[var(--text-muted)]">{format(new Date(session.entry_time), 'MMM d, HH:mm')}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-[var(--text-primary)] font-mono">NPR {session.amount}</p>
        {isPaid && <p className="text-[10px] font-bold text-amber-400">+{session.points_earned} pts</p>}
      </div>
    </div>
  );
}
