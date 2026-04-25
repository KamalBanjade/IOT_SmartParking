import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

export default function OperatorResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const type = searchParams.get('type');
  const isSetup = type === 'setup';

  useEffect(() => {
    if (!token) {
      toast.error('Missing reset token');
      navigate('/login');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    if (password.length < 8) return toast.error('Password must be at least 8 characters');

    setLoading(true);
    try {
      await authApi.resetOperatorPassword({ token, password });
      setSuccess(true);
      toast.success('Staff password updated!');
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
          <h2 className="text-xl font-bold text-text-primary mb-2">Account Ready</h2>
          <p className="text-text-secondary text-sm mb-8">
            Your staff credentials have been successfully {isSetup ? 'configured' : 'updated'}.
          </p>
          <Link 
            to="/login" 
            className="w-full inline-block py-2.5 bg-status-occupied text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Go to Login
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
            {isSetup ? 'Welcome to the Team!' : 'New Staff Password'}
          </h1>
          <p className="text-text-muted mt-2 text-sm">
            {isSetup ? 'Please set up your administrative password' : 'Please choose a secure administrative password'}
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
              className="w-full px-4 py-2 bg-bg-base border border-bg-border rounded-lg text-text-primary focus:outline-none focus:border-status-occupied transition-colors"
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
              className="w-full px-4 py-2 bg-bg-base border border-bg-border rounded-lg text-text-primary focus:outline-none focus:border-status-occupied transition-colors"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-status-occupied text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Updating...' : isSetup ? 'Complete Setup' : 'Reset Staff Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
