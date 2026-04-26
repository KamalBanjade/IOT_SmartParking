import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
import { Lock, ArrowRight, Loader2, Car, ChevronLeft, ShieldCheck, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function OperatorResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const isPasswordValid = password.length >= 6;
  const passwordsMatch = password === confirmPassword && confirmPassword !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error("Passwords don't match");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    
    setLoading(true);
    try {
      await authApi.resetOperatorPassword({ token, password });
      toast.success('Security credentials updated. Authentication authorized.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update credentials.');
    } finally { setLoading(false); }
  };

  const inputCls = (isValid) => `w-full bg-white/[0.03] border ${isValid ? 'border-accent/40' : 'border-white/10'} rounded-2xl h-14 px-6 text-sm text-white font-medium placeholder:text-white/20 focus:border-accent/40 focus:ring-4 focus:ring-accent/5 focus:outline-none transition-all duration-300`;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#08080c] relative overflow-hidden">
      {/* Reference Project Background Style */}
      <div className="absolute inset-0 bg-medical-gradient pointer-events-none" />
      <div className="absolute inset-0 bg-medical-pattern pointer-events-none" />

      <div className="w-full max-w-[500px] relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
        <div className="glass-morphism rounded-[48px] p-12 md:p-14 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] border border-white/5 bg-[#0c0c12]/95 backdrop-blur-3xl">
          
          <div className="text-center space-y-8 mb-12">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full scale-150 opacity-50" />
              <div className="relative w-24 h-24 bg-gradient-to-b from-white/10 to-transparent border border-white/10 rounded-[32px] flex items-center justify-center shadow-2xl mx-auto transition-transform duration-500 hover:scale-105">
                <Car className="w-12 h-12 text-accent drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-black text-white tracking-tight leading-none">
                Establish Credentials
              </h1>
              <p className="text-[12px] font-bold text-white/30 uppercase tracking-[0.4em]">
                Staff Security Reset
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-6">
              <div className="group space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">
                    New Password <span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  {isPasswordValid && <CheckCircle2 className="w-4 h-4 text-available animate-in zoom-in" />}
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    className={inputCls(isPasswordValid)} 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <div className="group space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">
                    Verify Password <span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  {passwordsMatch && <CheckCircle2 className="w-4 h-4 text-available animate-in zoom-in" />}
                </div>
                <div className="relative">
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    required 
                    className={inputCls(passwordsMatch)} 
                    placeholder="••••••••" 
                  />
                  <ShieldCheck className={`absolute right-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors duration-300 ${passwordsMatch ? 'text-available' : 'text-white/20'}`} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="group relative w-full h-16 bg-accent hover:bg-blue-400 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all duration-500 shadow-[0_20px_40px_-8px_rgba(59,130,246,0.3)] active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden border border-white/10">
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  Confirm & Update
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-10 border-t border-white/5 text-center">
            <Link to="/login" className="inline-flex items-center gap-3 text-[11px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-white transition-all duration-300">
              <ChevronLeft className="w-4 h-4" />
              Return to Control Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
