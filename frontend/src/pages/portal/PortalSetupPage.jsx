import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';
import { Lock, ArrowRight, Loader2, Car, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function PortalSetupPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const isPasswordValid = password.length >= 6;
  const passwordsMatch = password === confirmPassword && confirmPassword !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error('Setup token is missing.');
    if (password !== confirmPassword) return toast.error('Passwords do not match.');
    if (password.length < 6) return toast.error('Password must be at least 6 characters.');

    setLoading(true);
    try {
      await authApi.customerSetup({ token, password });
      toast.success('Account setup complete! Please login.');
      navigate('/login/customer');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Setup failed. The token may be expired.');
    } finally { setLoading(false); }
  };

  const inputCls = (isValid) => `w-full bg-[var(--bg-base)] border ${isValid ? 'border-customer/40' : 'border-white/10'} rounded-2xl h-14 px-12 text-sm text-[var(--text-primary)] font-medium placeholder:text-[var(--text-muted)] focus:border-customer/40 focus:ring-4 focus:ring-customer/5 focus:outline-none transition-all duration-300`;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#050508] relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-rose-600/5 blur-[120px] rounded-full animate-mesh opacity-40" />
        </div>
        <div className="w-full max-w-[440px] relative z-10 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center justify-center mx-auto text-rose-500 shadow-2xl">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-black text-white tracking-tight">Invalid Setup Link</h1>
            <p className="text-sm text-white/40 leading-relaxed px-10">This setup link is either missing, invalid, or has already been used.</p>
          </div>
          <Link to="/login/customer" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all">
            Return to Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#050508] relative overflow-hidden">
      {/* Mesh Gradient Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-customer/10 blur-[120px] rounded-full animate-mesh opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[100px] rounded-full animate-mesh opacity-60" style={{ animationDelay: '-5s' }} />
      </div>

      <div className="w-full max-w-[440px] relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out">
        <div className="p-[1px] bg-gradient-to-b from-white/10 via-white/5 to-transparent rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="bg-[#0c0c12]/95 backdrop-blur-3xl rounded-[39px] p-10 md:p-12 space-y-10 border border-white/5">
            
            <div className="text-center space-y-6">
              <div className="relative inline-block group">
                <div className="absolute inset-0 bg-customer/30 blur-3xl rounded-full scale-0 group-hover:scale-125 transition-transform duration-700 opacity-50" />
                <div className="relative w-20 h-20 bg-gradient-to-b from-white/10 to-transparent border border-white/10 rounded-[28px] flex items-center justify-center shadow-2xl mx-auto mb-2 transition-all duration-500 group-hover:scale-105 group-hover:rotate-3">
                  <Car className="w-10 h-10 text-customer drop-shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tighter leading-none mb-3">
                  Account Setup
                </h1>
                <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.3em] ml-1">
                  Finalize Your Security Profile
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div className="group">
                  <div className="flex justify-between items-center mb-2.5 px-1">
                    <label className="block text-[11px] font-bold text-white/40 uppercase tracking-[0.15em]">
                      Set Password <span className="text-rose-500/80 ml-0.5">*</span>
                    </label>
                    {isPasswordValid && <CheckCircle2 className="w-3.5 h-3.5 text-customer animate-in zoom-in" />}
                  </div>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors duration-300 ${isPasswordValid ? 'text-customer' : 'text-white/20 group-focus-within:text-customer'}`} />
                    <input 
                      type="password" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required 
                      className={inputCls(isPasswordValid)} 
                      placeholder="••••••••" 
                    />
                  </div>
                </div>

                <div className="group">
                  <div className="flex justify-between items-center mb-2.5 px-1">
                    <label className="block text-[11px] font-bold text-white/40 uppercase tracking-[0.15em]">
                      Confirm Password <span className="text-rose-500/80 ml-0.5">*</span>
                    </label>
                    {passwordsMatch && <CheckCircle2 className="w-3.5 h-3.5 text-customer animate-in zoom-in" />}
                  </div>
                  <div className="relative">
                    <ShieldCheck className={`absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors duration-300 ${passwordsMatch ? 'text-customer' : 'text-white/20 group-focus-within:text-customer'}`} />
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      required 
                      className={inputCls(passwordsMatch)} 
                      placeholder="••••••••" 
                    />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="group relative w-full h-14 bg-customer hover:bg-emerald-600 text-[#0f1419] font-black uppercase tracking-widest text-xs rounded-2xl transition-all duration-300 shadow-[0_10px_30px_rgba(16,185,129,0.25)] active:scale-95 flex items-center justify-center gap-3 overflow-hidden border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Complete Setup
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-6 text-center">
              <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">
                Secure Encryption Enabled
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
