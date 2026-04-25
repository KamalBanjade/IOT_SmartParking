import React, { useState, useEffect } from 'react';
import { usersApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/shared/Navbar';
import ConfirmModal from '../components/shared/ConfirmModal';
import { Search, Edit2, Trash2, UserPlus, Star, Calendar, Phone, Mail, MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MembersListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setEditingUser(null);
        setDeleteId(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await usersApi.getAll();
      setUsers(res.data);
    } catch (err) {
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await usersApi.delete(deleteId);
      toast.success("Member deleted");
      fetchUsers();
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setDeleteId(null);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await usersApi.update(editingUser.id, editingUser);
      toast.success("Member updated");
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.phone.includes(searchTerm) ||
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <Navbar />
      
      <main className="flex-grow p-6 lg:p-10 max-w-[1400px] w-full mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Member Directory</h1>
            <p className="text-sm text-text-secondary mt-1">Manage parking members, loyalty points, and account details.</p>
          </div>
          <button 
            onClick={() => navigate('/register')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-bold shadow-lg shadow-accent/20 hover:opacity-90 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Add New Member
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-bg-surface border border-bg-border rounded-xl p-4 mb-6 flex items-center gap-3">
          <Search className="w-5 h-5 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search by name, phone or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow bg-transparent border-none text-text-primary text-sm focus:ring-0 placeholder:text-text-muted"
          />
          <div className="text-[10px] uppercase tracking-widest text-text-muted font-bold px-3 py-1 bg-bg-elevated rounded-md">
            {filteredUsers.length} Members
          </div>
        </div>

        {/* Table */}
        <div className="bg-bg-surface border border-bg-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-bg-elevated/30 border-b border-bg-border">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-text-muted font-bold">Member</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-text-muted font-bold">Contact</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-text-muted font-bold">Loyalty</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-text-muted font-bold">Last Visit</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-text-muted font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border">
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-10 text-center text-text-muted animate-pulse">Loading members...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-10 text-center text-text-muted italic">No members found matching your search.</td></tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-bg-elevated/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/member/${user.id}`)}>
                          <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">{user.name}</div>
                            <div className="text-[10px] text-text-muted mt-0.5">Joined {new Date(user.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs text-text-secondary">
                            <Phone className="w-3 h-3 opacity-50" /> {user.phone}
                          </div>
                          {user.email && (
                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                              <Mail className="w-3 h-3 opacity-50" /> {user.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-bold text-text-primary">{user.total_points}</span>
                          <div className="w-16 h-1.5 bg-bg-elevated rounded-full overflow-hidden ml-2 hidden sm:block">
                            <div className="h-full bg-amber-400" style={{ width: `${Math.min(100, (user.total_points / 50) * 100)}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <Calendar className="w-3.5 h-3.5 opacity-50" />
                          {user.last_visit ? new Date(user.last_visit).toLocaleDateString() : 'New User'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                          <button 
                            onClick={() => setEditingUser(user)}
                            className="p-2 bg-bg-elevated/50 hover:bg-bg-elevated rounded-lg text-text-muted hover:text-accent transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setDeleteId(user.id)}
                            className="p-2 bg-bg-elevated/50 hover:bg-status-occupied/10 rounded-lg text-text-muted hover:text-status-occupied transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => navigate(`/member/${user.id}`)}
                            className="p-2 bg-bg-elevated/50 hover:bg-bg-elevated rounded-lg text-text-muted hover:text-text-primary transition-colors"
                            title="View Details"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-bg-surface border border-bg-border rounded-2xl max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-text-primary mb-6">Edit Member Details</h2>
            <form onSubmit={handleUpdate} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1.5 tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full bg-bg-base border border-bg-border rounded-lg h-11 px-4 text-sm text-text-primary focus:border-accent focus:outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1.5 tracking-wider">Phone Number</label>
                <input 
                  type="tel" 
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full bg-bg-base border border-bg-border rounded-lg h-11 px-4 text-sm text-text-primary focus:border-accent focus:outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1.5 tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full bg-bg-base border border-bg-border rounded-lg h-11 px-4 text-sm text-text-primary focus:border-accent focus:outline-none transition-all"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-grow h-11 border border-bg-border text-text-secondary rounded-lg text-sm font-medium hover:bg-bg-elevated transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-grow h-11 bg-text-primary text-bg-base rounded-lg text-sm font-bold hover:bg-text-secondary transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirm Delete Modal */}
      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Member?"
        message="Are you sure you want to permanently delete this member? All their loyalty points and history will be lost."
        confirmText="Delete Member"
        type="danger"
      />
    </div>
  );
}
