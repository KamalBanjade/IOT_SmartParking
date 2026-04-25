import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function PortalLoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.customerLogin({ phone, password });
      localStorage.setItem('customerToken', res.data.token);
      toast.success('Welcome back!');
      navigate('/portal/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-bg-surface border border-bg-border rounded-xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Member Portal</h1>
          <p className="text-text-muted mt-2">Track your parking & rewards</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-4 py-2 bg-bg-base border border-bg-border rounded-lg text-text-primary focus:outline-none focus:border-status-available transition-colors"
              placeholder="98XXXXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-bg-base border border-bg-border rounded-lg text-text-primary focus:outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
            />
            <div className="flex justify-end mt-1">
              <Link to="/portal/forgot-password" size="xs" className="text-[11px] text-text-muted hover:text-accent transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-status-available text-[#0f1419] rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 flex flex-col space-y-3 items-center text-sm">
          <Link to="/portal/setup" className="text-text-muted hover:text-text-primary transition-colors">
            First time? Set up your password →
          </Link>
          <Link to="/login" className="text-[11px] text-text-muted hover:text-text-primary opacity-50">
            Operator Access
          </Link>
        </div>
      </div>
    </div>
  );
}
