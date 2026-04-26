import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
import { Mail, ArrowRight, Loader2, Car, ChevronLeft, CheckCircle2 } from 'lucide-react';

export default function OperatorForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEmailValid) return toast.error('Please enter a valid work email');
    
    setLoading(true);
    try {
      await authApi.operatorForgotPassword(email);
      setSent(true);
      toast.success('Recovery link Sent Successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send recovery email.');
    } finally { setLoading(false); }
  };

  const inputCls = (isValid) => `w-full bg-white/[0.03] border ${isValid ? 'border-accent/40' : 'border-white/10'} rounded-2xl h-14 px-6 text-sm text-white font-medium placeholder:text-white/20 focus:border-accent/40 focus:ring-4 focus:ring-accent/5 focus:outline-none transition-all duration-300`;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#08080c] relative overflow-hidden">
      {/* Reference Project Background Style */}
      <div className="absolute inset-0 bg-medical-gradient pointer-events-none" />
      <div className="absolute inset-0 bg-medical-pattern pointer-events-none" />

      <div className="w-full max-w-[480px] relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
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
                Recovery
              </h1>
              <p className="text-[12px] font-bold text-white/30 uppercase tracking-[0.4em]">
                Staff Security Protocol
              </p>
            </div>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">
                    Email Address <span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  {isEmailValid && <CheckCircle2 className="w-4 h-4 text-available animate-in zoom-in" />}
                </div>
                <div className="relative group">
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    className={inputCls(isEmailValid)} 
                    placeholder="admin@smartparking.np" 
                  />
                  <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-accent transition-all duration-500 ease-out group-focus-within:w-[60%] opacity-0 group-focus-within:opacity-100 rounded-full ${isEmailValid ? 'bg-available' : 'bg-white/20'}`} />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="group relative w-full h-16 bg-accent hover:bg-blue-400 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all duration-500 shadow-[0_20px_40px_-8px_rgba(59,130,246,0.3)] active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    Send Recovery Link
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-10 space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-available/10 border border-available/20 rounded-full flex items-center justify-center mx-auto text-available shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                <Mail className="w-10 h-10" />
              </div>
              <div className="space-y-4">
                <p className="text-xl font-black text-white tracking-tight">Check your inbox</p>
                <p className="text-sm text-white/40 leading-relaxed px-6">
                  We've sent a secure recovery link to <br/>
                  <span className="text-accent font-bold">{email}</span>
                </p>
              </div>
              <button onClick={() => setSent(false)} className="text-[11px] font-black text-white/40 uppercase tracking-widest hover:text-accent transition-colors underline underline-offset-8">
                Try another email
              </button>
            </div>
          )}

          <div className="mt-12 pt-10 border-t border-white/5 text-center">
            <Link to="/login" className="inline-flex items-center gap-3 text-[11px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-white transition-all duration-300">
              <ChevronLeft className="w-4 h-4" />
              Back to Staff Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
