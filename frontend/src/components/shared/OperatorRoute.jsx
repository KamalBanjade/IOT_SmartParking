import React from 'react';
import { Navigate } from 'react-router-dom';
import { useOperatorAuth } from '../../hooks/useOperatorAuth';

export default function OperatorRoute({ children }) {
  const { operator, loading } = useOperatorAuth();

  if (loading) return <div className="min-h-screen bg-bg-base flex items-center justify-center text-text-muted">Loading...</div>;
  if (!operator) return <Navigate to="/login" replace />;

  return children;
}
