import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function PortalResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const type = searchParams.get('type'); // 'setup' for first time

  const isSetup = type === 'setup';

  useEffect(() => {
    if (!token) {
      toast.error('Missing reset token');
      navigate('/portal/login');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    if (password.length < 8) return toast.error('Password must be at least 8 characters');

    setLoading(true);
    try {
      await authApi.resetCustomerPassword({ token, password });
      setSuccess(true);
      toast.success('Password updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-bg-surface border border-bg-border rounded-xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-status-available/10 text-status-available rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Password Updated</h2>
          <p className="text-text-secondary text-sm mb-8">
            Your password has been successfully {isSetup ? 'set' : 'reset'}. You can now log in to your portal.
          </p>
          <Link 
            to="/portal/login" 
            className="w-full inline-block py-2.5 bg-text-primary text-bg-base rounded-lg font-medium hover:bg-text-secondary transition-colors"
          >
            Login to Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-bg-surface border border-bg-border rounded-xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">
            {isSetup ? 'Welcome to Smart Parking' : 'Reset Password'}
          </h1>
          <p className="text-text-muted mt-2 text-sm">
            {isSetup ? 'Please set your first password to access your portal' : 'Enter your new password below'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-bg-base border border-bg-border rounded-lg text-text-primary focus:outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-bg-base border border-bg-border rounded-lg text-text-primary focus:outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-text-primary text-bg-base rounded-lg font-medium hover:bg-text-secondary transition-colors disabled:opacity-50"
          >
            {loading ? 'Updating...' : isSetup ? 'Set Password' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
