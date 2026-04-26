import React, { useState } from 'react';
import { usersApi } from '../../services/api';
import toast from 'react-hot-toast';
import { User, Mail, Phone, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function RegisterForm({ onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  // Validation Regex
  const isNameValid = formData.name.length >= 2 && /^[A-Za-z\s]+$/.test(formData.name);
  const isPhoneValid = /^\d{10}$/.test(formData.phone);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isNameValid) return toast.error('Please enter a valid name (letters only)');
    if (!isPhoneValid) return toast.error('Please enter a valid 10-digit phone number');
    if (formData.email && !isEmailValid) return toast.error('Please enter a valid email address');
    
    setLoading(true);
    try {
      const res = await usersApi.register(formData);
      if (onRegisterSuccess) onRegisterSuccess(res.data);
      toast.success('Member registration successful!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (isValid) => `w-full bg-white/[0.03] border ${isValid ? 'border-available/40' : 'border-white/10'} rounded-2xl h-14 px-6 text-sm text-white font-medium placeholder:text-white/20 focus:border-accent/40 focus:ring-4 focus:ring-accent/5 focus:outline-none transition-all duration-300`;

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-6">
        <div className="group space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">
              Full Name <span className="text-rose-500 ml-0.5">*</span>
            </label>
            {isNameValid && <CheckCircle2 className="w-4 h-4 text-available animate-in zoom-in" />}
          </div>
          <div className="relative">
            <input
              type="text"
              required
              className={inputCls(isNameValid)}
              placeholder="e.g. Biraj Khatiwada"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <User className={`absolute right-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors duration-300 ${isNameValid ? 'text-available' : 'text-white/20'}`} />
          </div>
        </div>

        <div className="group space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">
              Phone Number <span className="text-rose-500 ml-0.5">*</span>
            </label>
            {isPhoneValid && <CheckCircle2 className="w-4 h-4 text-available animate-in zoom-in" />}
          </div>
          <div className="relative">
            <div className={`absolute left-6 top-1/2 -translate-y-1/2 text-xs font-black font-mono transition-colors duration-300 ${isPhoneValid ? 'text-available' : 'text-white/40'}`}>+977</div>
            <input
              type="tel"
              required
              maxLength="10"
              className={`${inputCls(isPhoneValid)} pl-16`}
              placeholder="98XXXXXXXX"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
            />
            <Phone className={`absolute right-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors duration-300 ${isPhoneValid ? 'text-available' : 'text-white/20'}`} />
          </div>
        </div>

        <div className="group space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">
              Email Address <span className="text-white/10 ml-1 font-normal lowercase italic">(Required for Recovery)</span>
            </label>
            {isEmailValid && <CheckCircle2 className="w-4 h-4 text-available animate-in zoom-in" />}
          </div>
          <div className="relative">
            <input
              type="email"
              required
              className={inputCls(isEmailValid)}
              placeholder="member@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Mail className={`absolute right-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors duration-300 ${isEmailValid ? 'text-available' : 'text-white/20'}`} />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="group relative w-full h-16 bg-accent hover:bg-blue-400 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all duration-500 shadow-[0_20px_40px_-8px_rgba(59,130,246,0.3)] active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden border border-white/10"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
          <>
            Complete Enrollment
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
          </>
        )}
      </button>
    </form>
  );
}
