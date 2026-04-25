import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

export default function OperatorForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotOperatorPassword(email);
      setSent(true);
      toast.success('Reset link sent!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4 text-white">
        <div className="w-full max-w-md bg-bg-surface border border-bg-border rounded-xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-status-occupied/10 text-status-occupied rounded-full flex items-center justify-center mx-auto mb-6">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Instructions Sent</h2>
          <p className="text-text-secondary text-sm mb-8">
            If an account exists for {email}, we have sent instructions to reset your password.
          </p>
          <Link to="/login" className="text-accent hover:underline text-sm">
            Back to Operator Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-bg-surface border border-bg-border rounded-xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Staff Access Recovery</h1>
          <p className="text-text-muted mt-2 text-sm">Enter your administrative email address</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-bg-base border border-bg-border rounded-lg text-text-primary focus:outline-none focus:border-status-occupied transition-colors"
              placeholder="admin@smartparking.np"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-status-occupied text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Send Recovery Link'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="text-text-muted hover:text-text-primary transition-colors">
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
