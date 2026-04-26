import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
import { Lock, Mail, ArrowRight, Loader2, Car, ChevronRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [formData, setFormData] = useState({ 
    email: localStorage.getItem('rememberedStaffEmail') || '', 
    password: '' 
  });
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberedStaffEmail'));
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const isPasswordValid = formData.password.length >= 6;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authApi.operatorLogin(formData);
      
      if (rememberMe) {
        localStorage.setItem('rememberedStaffEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedStaffEmail');
      }

      localStorage.setItem('operatorToken', response.data.token);
      toast.success('Authentication successful. Welcome back.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please check credentials.');
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
                Staff Login
              </h1>
              <p className="text-[12px] font-bold text-white/30 uppercase tracking-[0.4em]">
                System Administration
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-10">
            <div className="space-y-6">
              <div className="group space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">
                    Email Address <span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  {isEmailValid && <CheckCircle2 className="w-4 h-4 text-available animate-in zoom-in" />}
                </div>
                <div className="relative">
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({ ...formData, email: e.target.value })} 
                    required 
                    className={inputCls(isEmailValid)} 
                    placeholder="admin@smartparking.np" 
                  />
                  <Mail className={`absolute right-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors duration-300 ${isEmailValid ? 'text-available' : 'text-white/20'}`} />
                </div>
              </div>

              <div className="group space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">
                    Password <span className="text-rose-500 ml-0.5">*</span>
                  </label>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password} 
                    onChange={e => setFormData({ ...formData, password: e.target.value })} 
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

                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-3 cursor-pointer group/check">
                    <div className="relative w-5 h-5">
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="peer sr-only" 
                      />
                      <div className="w-full h-full border border-white/10 rounded-md bg-white/5 transition-all peer-checked:bg-accent peer-checked:border-accent" />
                      <CheckCircle2 className="absolute inset-0 w-5 h-5 text-black scale-0 peer-checked:scale-100 transition-transform p-1" />
                    </div>
                    <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest group-hover/check:text-white/50 transition-colors">Remember Me</span>
                  </label>
                  
                  <Link to="/forgot-password" size="sm" className="text-[11px] font-bold text-accent hover:text-white transition-colors uppercase tracking-widest underline underline-offset-4">
                    Forgot Password?
                  </Link>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="group relative w-full h-16 bg-accent hover:bg-blue-400 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all duration-500 shadow-[0_20px_40px_-8px_rgba(59,130,246,0.3)] active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden border border-white/10">
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  Sign In to Portal
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-10 border-t border-white/5 text-center">
            <Link to="/login/customer" className="inline-flex items-center gap-3 text-[11px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-white transition-all duration-300">
              Switch to Member Portal
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        
        <p className="mt-8 text-center text-[10px] font-black text-white/10 uppercase tracking-[0.5em]">
          Smart Parking System &copy; 2026
        </p>
      </div>
    </div>
  );
}
