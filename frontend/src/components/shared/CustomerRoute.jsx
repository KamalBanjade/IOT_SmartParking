import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCustomerAuth } from '../../hooks/useCustomerAuth';

export default function CustomerRoute({ children }) {
  const { customer, loading } = useCustomerAuth();

  if (loading) return <div className="min-h-screen bg-bg-base flex items-center justify-center text-text-muted">Loading...</div>;
  if (!customer) return <Navigate to="/portal/login" replace />;

  return children;
}
