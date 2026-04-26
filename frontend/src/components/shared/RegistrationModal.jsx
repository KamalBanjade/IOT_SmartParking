import React, { useState } from 'react';
import RegisterForm from '../user/RegisterForm';
import { useOperatorAuth } from '../../hooks/useOperatorAuth';
import toast from 'react-hot-toast';
import {
  Users, CheckCircle, Download, ShieldCheck, Mail, User,
  ArrowRight, Shield, PlusCircle, Loader2, CheckCircle2, X
} from 'lucide-react';

const inputCls = (isValid) => `w-full bg-white/[0.03] border ${isValid ? 'border-admin/40' : 'border-white/10'} rounded-2xl h-14 px-6 text-sm text-white font-medium placeholder:text-white/20 focus:border-admin/40 focus:ring-4 focus:ring-admin/5 focus:outline-none transition-all duration-300`;

function StaffForm({ onSuccess }) {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isNameValid = formData.name.length >= 2 && /^[A-Za-z\s]+$/.test(formData.name);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  const handleStaffEnroll = async (e) => {
    e.preventDefault();
    if (!isNameValid) return toast.error('Name must be letters only and at least 2 chars');
    if (!isEmailValid) return toast.error('Please enter a valid work email');

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/operator/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('operatorToken')}`,
        },
        body: JSON.stringify({ ...formData, role: 'operator' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.error || 'Failed to create account');
      setSuccess(true);
      toast.success('Staff account authorized!');
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.message || 'Failed to create staff account');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center text-center py-12 space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-admin/10 border-2 border-admin/20 rounded-full flex items-center justify-center text-admin shadow-[0_0_50px_rgba(56,189,248,0.2)]">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <div className="space-y-4">
          <h3 className="text-3xl font-black text-white tracking-tight leading-none">Official Authorized</h3>
          <p className="text-sm text-white/40 leading-relaxed px-8">
            The account for <span className="text-admin font-bold">{formData.email}</span> has been established.
            They can now set their password via the recovery protocol.
          </p>
        </div>
        <button
          onClick={() => { setSuccess(false); setFormData({ name: '', email: '' }); }}
          className="text-[11px] font-black text-admin uppercase tracking-widest hover:text-white transition-colors underline underline-offset-8"
        >
          Enroll another official
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleStaffEnroll} className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-6">
        <div className="group space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">
              Full Name <span className="text-rose-500 ml-0.5">*</span>
            </label>
            {isNameValid && <CheckCircle2 className="w-4 h-4 text-admin animate-in zoom-in" />}
          </div>
          <div className="relative">
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
              className={inputCls(isNameValid)}
              placeholder="e.g. Biraj Khatiwada"
            />
            <User className={`absolute right-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors duration-300 ${isNameValid ? 'text-admin' : 'text-white/20'}`} />
          </div>
        </div>

        <div className="group space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">
              Official Email <span className="text-rose-500 ml-0.5">*</span>
            </label>
            {isEmailValid && <CheckCircle2 className="w-4 h-4 text-admin animate-in zoom-in" />}
          </div>
          <div className="relative">
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
              className={inputCls(isEmailValid)}
              placeholder="staff@smartparking.np"
            />
            <Mail className={`absolute right-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors duration-300 ${isEmailValid ? 'text-admin' : 'text-white/20'}`} />
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="group relative w-full h-16 bg-admin hover:bg-sky-400 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all duration-500 shadow-[0_20px_40px_-8px_rgba(56,189,248,0.3)] active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
          <>
            Authorize Staff Account
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
          </>
        )}
      </button>
    </form>
  );
}

export default function RegistrationModal({ isOpen, onClose, onRefresh }) {
  const [tab, setTab] = useState('customer');
  const [qrCode, setQrCode] = useState(null);
  const { operator } = useOperatorAuth();
  const isAdmin = operator?.role === 'admin';

  React.useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[550px] relative animate-in zoom-in-95 duration-300 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="glass-morphism rounded-[48px] p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] border border-white/5 bg-[#0c0c12]/95 backdrop-blur-sm relative overflow-hidden">

          {/* Tab Selection */}
          <div className="flex p-2 bg-[#050508] border border-white/5 rounded-3xl mb-10 shadow-inner relative z-10">
            <button
              onClick={() => { setTab('customer'); setQrCode(null); }}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${tab === 'customer'
                ? 'bg-accent text-white shadow-xl shadow-accent/25'
                : 'text-white/20 hover:text-white hover:bg-white/[0.02]'}`}
            >
              <Users className="w-4 h-4" /> Member
            </button>
            {isAdmin && (
              <button
                onClick={() => { setTab('staff'); setQrCode(null); }}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${tab === 'staff'
                  ? 'bg-admin text-white shadow-xl shadow-admin/25'
                  : 'text-white/20 hover:text-white hover:bg-white/[0.02]'}`}
              >
                <PlusCircle className="w-4 h-4" /> Official
              </button>
            )}
          </div>

          {/* Form Content */}
          <div className="relative z-10">
            {tab === 'customer' ? (
              !qrCode ? (
                <RegisterForm onRegisterSuccess={(data) => {
                  setQrCode(data.qrCode);
                  if (onRefresh) onRefresh();
                }} />
              ) : (
                <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500 py-2">
                  <div className="w-20 h-20 rounded-full bg-available/10 border-2 border-available/20 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
                    <CheckCircle className="w-10 h-10 text-available" />
                  </div>
                  <div className="space-y-3 mb-10">
                    <h3 className="text-2xl font-black text-white tracking-tight leading-none">Enrollment Success</h3>
                    <p className="text-xs text-white/30 leading-relaxed px-6">
                      Member is now active. Dispatch the digital QR pass for infrastructure access.
                    </p>
                  </div>

                  <div className="relative group mb-12">
                    <div className="absolute inset-0 bg-accent/20 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="relative bg-white p-6 rounded-[2.5rem] shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:rotate-1">
                      <img src={qrCode} alt="Member QR Code" className="w-40 h-40 object-contain" />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <a href={qrCode} download="member-qr.png"
                      className="flex-1 flex items-center justify-center gap-3 h-14 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-400 transition-all shadow-xl shadow-accent/20 active:scale-[0.98]">
                      <Download className="w-5 h-5" /> Download Pass
                    </a>
                    <button onClick={() => { setQrCode(null); onClose(); }}
                      className="flex-1 h-14 border border-white/10 bg-white/5 text-white/60 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all active:scale-[0.98]">
                      Finish
                    </button>
                  </div>
                </div>
              )
            ) : (
              <StaffForm onSuccess={onRefresh} />
            )}
          </div>

          {!isAdmin && tab === 'customer' && (
            <div className="mt-8 flex items-center justify-center gap-4 px-8 py-5 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-1000 delay-300">
              <Shield className="w-4 h-4 text-amber-500/60" />
              <p className="text-[9px] text-amber-500/60 font-black uppercase tracking-[0.2em] leading-relaxed">
                Administrator verification required for <br /> official staff enrollment protocols.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
