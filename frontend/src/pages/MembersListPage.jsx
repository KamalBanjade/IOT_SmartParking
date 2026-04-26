import React, { useState, useEffect } from 'react';
import { usersApi, adminApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '../components/shared/SidebarLayout';
import { useOperatorAuth } from '../hooks/useOperatorAuth';
import ConfirmModal from '../components/shared/ConfirmModal';
import RegistrationModal from '../components/shared/RegistrationModal';
import { 
  Search, Edit2, Trash2, UserPlus, Star, Calendar, 
  Phone, Mail, MoreHorizontal, Users, ShieldCheck, 
  TrendingUp, Award, ChevronRight, X, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_BADGE = {
  admin:    'bg-admin/10 text-admin border-admin/20',
  operator: 'bg-operator/10 text-operator border-operator/20',
  customer: 'bg-customer/10 text-customer border-customer/20',
};

const TABS = ['All', 'Customers', 'Staff'];

export default function MembersListPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const navigate = useNavigate();
  const { operator } = useOperatorAuth();
  const isAdmin = operator?.role === 'admin';

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') { setEditingUser(null); setDeleteId(null); } };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => { 
    fetchUsers();
    if (isAdmin) fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await usersApi.getAll();
      setUsers(res.data);
    } catch { toast.error('Failed to load members'); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await adminApi.getMembersAnalytics();
      setStats(res.data);
    } catch (e) { console.error("Stats fail", e); }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try { await usersApi.delete(deleteId); toast.success('Member deleted'); fetchUsers(); }
    catch { toast.error('Delete failed'); }
    finally { setDeleteId(null); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try { await usersApi.update(editingUser.id, editingUser); toast.success('Member updated'); setEditingUser(null); fetchUsers(); }
    catch { toast.error('Update failed'); }
  };

  const filtered = users.filter(u => {
    const nameStr = u.name || '';
    const phoneStr = u.phone || '';
    const emailStr = u.email || '';
    const matchSearch = nameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phoneStr.includes(searchTerm) || emailStr.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTab = activeTab === 'All' ? true : activeTab === 'Customers' ? !u.role || u.role === 'customer' : u.role === 'operator' || u.role === 'admin';
    return matchSearch && matchTab;
  });

  const countFor = (tab) => {
    if (tab === 'All') return users.length;
    if (tab === 'Customers') return users.filter(u => !u.role || u.role === 'customer').length;
    if (tab === 'Staff') return users.filter(u => u.role === 'operator' || u.role === 'admin').length;
    return 0;
  };

  const inputCls = "w-full bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-2xl h-12 px-5 text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:border-accent focus:ring-4 focus:ring-accent/10 focus:outline-none transition-all";

  return (
    <SidebarLayout>
      <div className="p-6 lg:p-10 space-y-10">
        {/* Analytics Dashboard (Admin Only) */}
        {isAdmin && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={<Users className="w-5 h-5" />} label="Total Directory" value={stats.totalMembers} sub="Registered users" color="text-accent" />
            <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Active This Month" value={stats.activeThisMonth} sub="Unique visitors" color="text-available" />
            <StatCard icon={<Award className="w-5 h-5" />} label="Loyalty Issued" value={stats.totalPointsAwarded} sub="Lifetime points" color="text-pending" />
            <StatCard icon={<ShieldCheck className="w-5 h-5" />} label="Staff Access" value={countFor('Staff')} sub="Admins & Operators" color="text-admin" />
          </div>
        )}

        {/* Unified Filter, Search & Action Bar */}
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-[2rem] p-3 shadow-xl flex flex-col xl:flex-row gap-4 items-center">
          {/* Tabs */}
          <div className="flex bg-[var(--bg-elevated)]/50 p-1.5 rounded-2xl w-full xl:w-auto gap-1 border border-[var(--bg-border)]/30 shrink-0">
            {TABS.map(tab => {
              if (tab === 'Staff' && !isAdmin) return null;
              const active = activeTab === tab;
              return (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 xl:flex-none px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                    active ? 'bg-[var(--bg-surface)] text-accent shadow-sm border border-[var(--bg-border)]/50' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  {tab}
                  <span className={`text-[9px] px-2 py-0.5 rounded-full ${active ? 'bg-accent/10 text-accent' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>
                    {countFor(tab)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative flex-grow w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="Search directory..."
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-elevated)]/30 border border-transparent rounded-2xl h-14 pl-12 pr-12 text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:bg-[var(--bg-surface)] focus:border-accent/30 focus:outline-none transition-all" 
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-[var(--bg-elevated)] rounded-full text-[var(--text-muted)] transition-all">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Add Button */}
          <button 
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-accent/20 transition-all hover:-translate-y-0.5 active:scale-95 shrink-0 h-14 whitespace-nowrap"
          >
            <UserPlus className="w-5 h-5" /> 
            Add New Member
          </button>
        </div>

        {/* Directory Table */}
        <div className="bg-[var(--bg-surface)] rounded-[2.5rem] border border-[var(--bg-border)] shadow-2xl overflow-hidden relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-elevated)]/30 border-b border-[var(--bg-border)]">
                  {['Member Profile', 'Communication', 'Access Tier', 'Loyalty Status', 'Activity', 'Actions'].map(h => (
                    <th key={h} className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-black whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--bg-border)]">
                {loading ? (
                  <tr><td colSpan="6" className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-black uppercase tracking-widest text-accent">Syncing Directory</span>
                    </div>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="6" className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-40">
                      <Users className="w-16 h-16 text-[var(--text-muted)] mb-2" />
                      <p className="text-base font-black text-[var(--text-muted)] uppercase tracking-widest">No profiles identified</p>
                      <button onClick={() => setIsRegisterOpen(true)} className="px-6 py-2 bg-accent/10 text-accent rounded-xl text-xs font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all">Initialize New Profile</button>
                    </div>
                  </td></tr>
                ) : filtered.map(user => (
                  <tr key={`${user.role || 'customer'}-${user.id}`} className="hover:bg-[var(--bg-elevated)]/30 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          {(user.total_points || 0) >= 100 && (
                            <div className="absolute -top-1.5 -right-1.5 bg-pending text-black text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[var(--bg-surface)] shadow-lg" title="Premium Member">
                              <Award className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-base font-black text-[var(--text-primary)] leading-none capitalize">{user.name}</p>
                          <p className="text-[10px] text-[var(--text-muted)] font-bold mt-1.5 uppercase tracking-tighter">Member since {new Date(user.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1.5">
                        {user.phone && (
                          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
                            <Phone className="w-3.5 h-3.5 text-customer/60" />
                            {user.phone}
                          </div>
                        )}
                        {user.email && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)]">
                            <Mail className="w-3.5 h-3.5 text-accent/60" />
                            {user.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[10px] px-3 py-1.5 rounded-xl uppercase font-black tracking-widest border-2 shadow-sm whitespace-nowrap inline-flex items-center justify-center min-w-[120px] ${ROLE_BADGE[user.role || 'customer']}`}>
                        {user.role === 'admin' ? 'System Admin' : user.role === 'operator' ? 'Facility Staff' : 'Customer Member'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      {(!user.role || user.role === 'customer') ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-pending uppercase tracking-tighter">Loyalty Credits</span>
                            <span className="text-sm font-black text-[var(--text-primary)] font-mono">{user.total_points ?? 0} PTS</span>
                          </div>
                          <div className="w-32 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden border border-[var(--bg-border)]">
                            <div 
                              className="h-full bg-gradient-to-r from-pending to-amber-500 rounded-full" 
                              style={{ width: `${Math.min((user.total_points ?? 0) / 200 * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase italic">Not Applicable</span>}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2.5 text-xs font-bold text-[var(--text-secondary)]">
                        <Calendar className="w-4 h-4 text-accent/50" />
                        {user.last_visit ? format(new Date(user.last_visit), 'MMM d, yyyy') : 'No History'}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => navigate(`/member/${user.id}`)}
                          className="p-2.5 rounded-xl bg-[var(--bg-elevated)] text-accent hover:bg-accent/10 transition-all border border-accent/10 shadow-sm shadow-accent/5"
                          title="Detailed Profile"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        {(isAdmin || (!user.role || user.role === 'customer')) && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => setEditingUser(user)} className="p-2.5 rounded-xl bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-available hover:bg-available/10 transition-all border border-[var(--bg-border)]" title="Edit Profile"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => setDeleteId(user.id)} className="p-2.5 rounded-xl bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-occupied hover:bg-occupied/10 transition-all border border-[var(--bg-border)]" title="Permanently Remove"><Trash2 className="w-4 h-4" /></button>
                          </div>
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

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-[2.5rem] max-w-md w-full p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent via-blue-400 to-accent" />
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-[var(--text-primary)]">Modify Profile</h2>
              <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-[var(--bg-elevated)] rounded-xl transition-all">
                <X className="w-6 h-6 text-[var(--text-muted)]" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-6">
              {['name', 'phone', 'email'].map(field => (
                <div key={field} className="space-y-2">
                  <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">{field}</label>
                  <input type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                    value={editingUser[field] || ''}
                    onChange={e => setEditingUser({ ...editingUser, [field]: e.target.value })}
                    className={inputCls} required={field !== 'email'} 
                    placeholder={`Enter member ${field}...`}
                  />
                </div>
              ))}
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 h-14 border-2 border-[var(--bg-border)] text-[var(--text-secondary)] rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[var(--bg-elevated)] transition-all">Cancel</button>
                <button type="submit" className="flex-1 h-14 bg-accent hover:bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-accent/20">Commit Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={confirmDelete}
        title="Permanently Remove Profile?" message="All associated loyalty points, session history, and financial records will be purged. This action is irreversible."
        confirmText="Purge Profile" type="danger" />

      <RegistrationModal 
        isOpen={isRegisterOpen} 
        onClose={() => setIsRegisterOpen(false)} 
        onRefresh={fetchUsers} 
      />
    </SidebarLayout>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] p-6 rounded-3xl shadow-xl hover:border-accent/30 transition-all group">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2.5 rounded-2xl bg-[var(--bg-elevated)] group-hover:scale-110 transition-transform ${color}`}>
          {icon}
        </div>
        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{label}</span>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-black text-[var(--text-primary)] font-mono">{value}</p>
        <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tighter">{sub}</p>
      </div>
    </div>
  );
}

function format(date, fmt) {
  if (!date) return '';
  const d = new Date(date);
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return d.toLocaleDateString('en-US', options);
}
