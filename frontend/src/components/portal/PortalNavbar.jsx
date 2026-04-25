import React from 'react';
import { useCustomerAuth } from '../../hooks/useCustomerAuth';

export default function PortalNavbar() {
  const { customer, logout } = useCustomerAuth();

  return (
    <header className="bg-bg-surface border-b border-bg-border sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-bg-elevated border border-bg-border flex items-center justify-center text-lg">
            🅿️
          </div>
          <span className="font-semibold text-text-primary tracking-wide hidden sm:block">
            Smart Parking
          </span>
        </div>
        
        {customer && (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-text-secondary hidden sm:block">
              Hi, {customer.name.split(' ')[0]}
            </span>
            <button 
              onClick={logout}
              className="px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary border border-bg-border hover:bg-bg-elevated rounded transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
