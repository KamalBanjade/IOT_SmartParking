import React from 'react';
import { Navigate } from 'react-router-dom';
import { useOperatorAuth } from '../../hooks/useOperatorAuth';
import toast from 'react-hot-toast';

export default function AdminRoute({ children }) {
  const { operator, loading, isAdmin } = useOperatorAuth();

  if (loading) return <div className="min-h-screen bg-bg-base flex items-center justify-center text-text-muted">Loading...</div>;
  
  if (!operator) return <Navigate to="/login" replace />;
  
  if (!isAdmin) {
    toast.error('Admin access required');
    return <Navigate to="/" replace />;
  }

  return children;
}
