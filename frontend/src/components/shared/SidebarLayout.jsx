import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useOperatorAuth } from '../../hooks/useOperatorAuth';
import { useParking } from '../../context/ParkingContext';
import { Bell, QrCode, Search, User } from 'lucide-react';

const NAV_METADATA = {
  '/': { title: 'Dashboard', desc: 'Real-time infrastructure and slot occupancy' },
  '/admin': { title: 'Audit Intelligence', desc: 'Immutable system logs and transaction history' },
  '/monitor': { title: 'Live Monitor', desc: 'Visual slot tracking and status telemetry' },
  '/sessions': { title: 'Session Activity', desc: 'Comprehensive log of ongoing and past sessions' },
  '/members': { title: 'Member Directory', desc: 'Manage registered member profiles and access' },
  '/register': { title: 'System Enrollment', desc: 'Authorized member and official onboarding' },
};

export default function SidebarLayout({ children }) {
  const location = useLocation();
  const { operator, logout } = useOperatorAuth();
  const { connected } = useParking();

  const currentPath = location.pathname;
  const meta = NAV_METADATA[currentPath] || { title: 'Overview', desc: 'Smart Parking Management System' };

  return (
    <div className="relative flex h-screen font-sans overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)] p-2 gap-2 transition-colors duration-300">

      {/* Premium Top Light Gradient */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-accent/5 to-transparent" />
      </div>

      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 border border-[var(--bg-border)] bg-[var(--bg-surface)]/20 rounded-2xl shadow-inner">

        {/* Header Component */}
        <header className="h-20 flex items-center justify-between px-8 shrink-0 border-b border-[var(--bg-border)] backdrop-blur-md bg-[var(--bg-surface)]/80">
          <div className="flex flex-col justify-center">
            <h1 className="text-xl md:text-2xl font-black text-[var(--text-primary)] tracking-tighter leading-none uppercase truncate">
              {meta.title}
            </h1>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] mt-2 truncate">
              {meta.desc}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search - Decorative for now */}
            <div className="hidden md:flex items-center gap-3 px-4 h-10 bg-white/5 border border-white/5 rounded-xl text-[var(--text-muted)] focus-within:border-accent/30 transition-all">
              <Search className="w-4 h-4" />
              <input type="text" placeholder="Global search..." className="bg-transparent border-none outline-none text-xs w-32 focus:w-48 transition-all" />
            </div>

            {/* Connection Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)]`}>
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-available animate-pulse' : 'bg-occupied'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                {connected ? 'Syncing' : 'Disconnected'}
              </span>
            </div>

            <div className="h-6 w-px bg-white/5" />

            {/* User Popover Trigger */}
            <div className="flex items-center gap-3 pl-2 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-[var(--text-primary)] leading-tight uppercase tracking-tight">{operator?.name}</p>
                <p className={`text-[9px] font-black uppercase tracking-[0.15em] ${operator?.role === 'admin' ? 'text-admin' : 'text-operator'}`}>
                  {operator?.role} Access
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-blue-700 p-[1px] shadow-lg shadow-accent/10 transition-transform group-hover:scale-105 active:scale-95">
                <div className="w-full h-full rounded-[11px] bg-[#0c0c12] flex items-center justify-center font-black text-accent text-sm">
                  {operator?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 w-full overflow-y-auto no-scrollbar p-4 md:p-5">
          <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-700">
            {children}
          </div>
        </div>

      </main>
    </div>
  );
}
