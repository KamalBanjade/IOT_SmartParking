import React, { useState } from 'react';
import { usersApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function RegisterForm({ onRegisterSuccess }) {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', isMember: true });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return toast.error("Name and Phone are required");

    setLoading(true);
    try {
      const res = await usersApi.register(formData);
      toast.success("Member registered successfully!");
      onRegisterSuccess(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-1.5">Full Name</label>
        <input 
          type="text" 
          className="w-full bg-bg-base border border-bg-border rounded-lg h-10 px-3 text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          placeholder="e.g. Ram Bahadur"
          required
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-1.5">Phone Number</label>
        <input 
          type="tel" 
          className="w-full bg-bg-base border border-bg-border rounded-lg h-10 px-3 text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
          value={formData.phone}
          onChange={e => setFormData({...formData, phone: e.target.value})}
          placeholder="98XXXXXXXX"
          required
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-1.5">Email Address (Optional)</label>
        <input 
          type="email" 
          className="w-full bg-bg-base border border-bg-border rounded-lg h-10 px-3 text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
          value={formData.email}
          onChange={e => setFormData({...formData, email: e.target.value})}
          placeholder="customer@example.com"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <label className="text-sm text-text-secondary">Generate QR Code</label>
        <button
          type="button"
          onClick={() => setFormData({...formData, isMember: !formData.isMember})}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${formData.isMember ? 'bg-accent' : 'bg-bg-border'}`}
        >
          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition duration-200 ${formData.isMember ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full mt-4 h-10 bg-accent hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors duration-150 disabled:opacity-50"
      >
        {loading ? "Registering..." : "Complete Registration"}
      </button>
    </form>
  );
}
