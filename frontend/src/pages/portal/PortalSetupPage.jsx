import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function PortalSetupPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.customerSetup({ phone, password, confirmPassword });
      localStorage.setItem('customerToken', res.data.token);
      toast.success('Account setup complete!');
      navigate('/portal/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-bg-surface border border-bg-border rounded-xl p-8 shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Set Up Your Account</h1>
          <p className="text-text-muted mt-2 text-sm">Enter the phone number you used when registering</p>
        </div>

        <form onSubmit={handleSetup} className="space-y-4">
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
            <label className="block text-sm font-medium text-text-secondary mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-bg-base border border-bg-border rounded-lg text-text-primary focus:outline-none focus:border-status-available transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-bg-base border border-bg-border rounded-lg text-text-primary focus:outline-none focus:border-status-available transition-colors"
            />
          </div>

          <div className="text-xs text-text-muted bg-bg-base p-3 rounded-lg border border-bg-border">
            <p className="mb-1">Password rules:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li className={password.length >= 8 ? 'text-status-available' : ''}>At least 8 characters</li>
              <li className={/\d/.test(password) ? 'text-status-available' : ''}>At least 1 number</li>
            </ul>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-text-primary text-bg-base rounded-lg font-medium hover:bg-text-secondary transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? 'Setting up...' : 'Set up account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link to="/portal/login" className="text-text-muted hover:text-text-primary transition-colors">
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
