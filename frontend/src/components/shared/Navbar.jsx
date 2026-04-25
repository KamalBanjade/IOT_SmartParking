import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useParking } from '../../context/ParkingContext';
import { useOperatorAuth } from '../../hooks/useOperatorAuth';

export default function Navbar() {
  const { connected } = useParking();
  const { operator, logout } = useOperatorAuth();
  const location = useLocation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageName = (path) => {
    switch (path) {
      case '/': return 'Dashboard';
      case '/admin': return 'Admin Stats';
      case '/register': return 'Register Member';
      case '/display': return 'Public Display';
      case '/analytics': return 'Analytics';
      default: return 'Dashboard';
    }
  };

  return (
    <nav className="bg-bg-base border-b border-bg-border h-12 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center space-x-4">
        {/* CSS-only P logo */}
        <div className="w-6 h-6 border border-bg-border rounded flex items-center justify-center bg-bg-surface text-text-primary text-xs font-bold select-none">
          P
        </div>
        
        <Link to="/" className="text-text-primary text-sm font-medium tracking-tight">
          Smart Parking
        </Link>
        
        <span className="text-bg-border">|</span>
        
        <span className="text-text-muted text-sm select-none">
          {getPageName(location.pathname)}
        </span>
      </div>

      <div className="flex items-center space-x-6">
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/" className={`text-xs ${location.pathname === '/' ? 'text-text-primary underline underline-offset-4' : 'text-text-muted hover:text-text-primary transition-colors'}`}>Dashboard</Link>
          
          {operator?.role === 'admin' && (
            <>
              <Link to="/admin" className={`text-xs ${location.pathname === '/admin' ? 'text-text-primary underline underline-offset-4' : 'text-text-muted hover:text-text-primary transition-colors'}`}>Admin</Link>
              <Link to="/analytics" className={`text-xs ${location.pathname === '/analytics' ? 'text-text-primary underline underline-offset-4' : 'text-text-muted hover:text-text-primary transition-colors'}`}>Analytics</Link>
            </>
          )}

          <Link to="/register" className={`text-xs ${location.pathname === '/register' ? 'text-text-primary underline underline-offset-4' : 'text-text-muted hover:text-text-primary transition-colors'}`}>Register</Link>
          <Link to="/members" className={`text-xs ${location.pathname === '/members' ? 'text-text-primary underline underline-offset-4' : 'text-text-muted hover:text-text-primary transition-colors'}`}>Members</Link>
          <Link to="/display" className={`text-xs ${location.pathname === '/display' ? 'text-text-primary underline underline-offset-4' : 'text-text-muted hover:text-text-primary transition-colors'}`}>Display</Link>
        </div>

        <span className="text-bg-border hidden md:inline">|</span>

        <span className="text-text-secondary text-sm font-mono tracking-tight hidden sm:inline">
          {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
        </span>

        <div className="flex items-center space-x-2 bg-bg-surface border border-bg-border px-2 py-1 rounded">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-status-available animate-pulse' : 'bg-status-occupied'}`}></div>
          <span className="text-xs text-text-secondary">{connected ? 'Live' : 'Reconnecting...'}</span>
        </div>

        {operator && (
          <div className="flex items-center space-x-3 border-l border-bg-border pl-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-text-primary uppercase leading-none">
                {operator.name.split(' ')[0]}
              </span>
              <span className="text-[8px] text-text-muted uppercase tracking-widest mt-1">
                {operator.role}
              </span>
            </div>
            <button 
              onClick={logout}
              className="w-7 h-7 flex items-center justify-center rounded border border-bg-border hover:border-status-occupied text-text-muted hover:text-status-occupied transition-colors group"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
