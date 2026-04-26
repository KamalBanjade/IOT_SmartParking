import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Activity, Users, UserPlus, BarChart3,
  Monitor, LogOut, ChevronLeft, ChevronRight,
  Sun, Moon, Car, ShieldCheck, Power
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { useOperatorAuth } from '../../hooks/useOperatorAuth';
import { useTheme } from '../../context/ThemeContext';
import { SIDEBAR_KEY } from '../../styles/tokens';

const NAV = [
  {
    section: 'Main',
    items: [
      { label: 'Dashboard',    path: '/',        icon: LayoutDashboard, desc: 'Real-time parking overview' },
      { label: 'Live Monitor', path: '/monitor', icon: Activity, desc: 'Active slot monitoring' },
    ]
  },
  {
    section: 'Manage',
    items: [
      { label: 'Members',  path: '/members',  icon: Users, desc: 'Registered user directory' },
    ]
  },
  {
    section: 'System',
    adminOnly: true,
    items: [
      { label: 'Audit Log', path: '/admin', icon: BarChart3, desc: 'Transaction and system history' },
    ]
  },
  {
    section: 'Public',
    items: [
      { label: 'Display Board', path: '/display', icon: Monitor, desc: 'Exterior vacancy display' },
    ]
  },
];

const SidebarItem = ({ icon: Icon, label, path, isActive, isCollapsed }) => {
  return (
    <Link
      to={path}
      className="group relative block"
    >
      <div
        className={`
          relative flex items-center transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          hover:-translate-y-[1px]
          ${isCollapsed ?
            'justify-center w-12 h-12 mx-auto rounded-2xl' :
            'px-4 py-3 gap-3 rounded-2xl mx-2'}
          ${isActive ?
            'text-accent bg-accent/10 shadow-md shadow-accent/5' :
            'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'}
        `}
      >
        {/* Active Box Gradient */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent rounded-2xl pointer-events-none" />
        )}

        {/* Left active indicator bar */}
        {!isCollapsed && isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-accent rounded-r-full" />
        )}

        <Icon className={`
          shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          w-5 h-5 ${isCollapsed ? 'mx-auto' : ''}
          ${isActive ? 'text-accent scale-110' : 'group-hover:scale-110'}
        `} />

        {!isCollapsed && (
          <span className={`text-sm truncate transition-all duration-300 ${isActive ? 'text-accent font-bold' : 'text-[var(--text-primary)] font-semibold opacity-70'}`}>
            {label}
          </span>
        )}

        {/* Collapsed Tooltip */}
        {isCollapsed && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 translate-x-[-6px] group-hover:translate-x-0 whitespace-nowrap z-50 shadow-xl border border-white/10">
            {label}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
          </div>
        )}
      </div>
    </Link>
  );
};

const SectionLabel = ({ label, isCollapsed }) => {
  if (isCollapsed) return <div className="my-2 mx-4 h-px bg-white/5" />;
  return (
    <div className="px-5 pt-4 pb-1">
      <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-60">{label}</span>
    </div>
  );
};

export default function Sidebar() {
  const location = useLocation();
  const { operator, logout } = useOperatorAuth();
  const { connected } = useParking();
  const { theme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) === 'collapsed'
  );

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, isCollapsed ? 'collapsed' : 'expanded');
  }, [isCollapsed]);

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const isAdmin = operator?.role === 'admin';

  return (
    <aside
      className={`
        relative hidden lg:flex flex-col h-full overflow-hidden z-30 shrink-0
        rounded-r-2xl border border-[var(--bg-border)]
        bg-[var(--bg-surface)] backdrop-blur-md transition-all duration-500
        ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[width]
        ${isCollapsed ? 'w-[76px]' : 'w-64'}
        shadow-[8px_0_30px_-10px_rgba(0,0,0,0.3)]
      `}
    >
      {/* Logo Area */}
      <div className={`flex items-center shrink-0 transition-all duration-500 border-b border-[var(--bg-border)] h-20 ${isCollapsed ? 'justify-center px-0' : 'px-4 gap-3'}`}>
        <div className="w-10 h-10 bg-gradient-to-br from-accent to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 shrink-0 transition-transform hover:rotate-3">
          <Car className="w-6 h-6 text-white" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
            <span className="text-sm font-black text-[var(--text-primary)] tracking-tighter uppercase">Smart Parking</span>
            <span className="text-[9px] font-bold text-accent uppercase tracking-widest leading-none">System Portal</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-3 transition-all duration-500">
        <div className={`flex flex-col transition-all duration-500 ${isCollapsed ? 'items-center gap-1 px-3 py-4' : 'gap-0.5 px-2 py-3'}`}>
          {NAV.map(({ section, items, adminOnly }) => {
            if (adminOnly && !isAdmin) return null;
            return (
              <div key={section} className="w-full">
                <SectionLabel label={section} isCollapsed={isCollapsed} />
                <div className="flex flex-col gap-0.5">
                  {items.map((item) => (
                    <SidebarItem 
                      key={item.path} 
                      {...item} 
                      isActive={isActive(item.path)} 
                      isCollapsed={isCollapsed} 
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Bottom Controls */}
      <div className="shrink-0 border-t border-[var(--bg-border)] bg-[var(--bg-surface)]">
        <div className={`flex items-center transition-all duration-500 ${isCollapsed ? 'flex-col border-t-0' : ''}`}>
          
          <button
            onClick={logout}
            className={`flex items-center gap-2 hover:text-rose-500 transition-all duration-200 text-xs font-bold text-[var(--text-muted)] ${isCollapsed ? 'w-full justify-center py-4' : 'flex-1 px-5 py-5'}`}
            title="Logout"
          >
            <Power className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="animate-in fade-in duration-500">Logout</span>}
          </button>

          <div className={`w-px h-6 bg-white/5 ${isCollapsed ? 'h-px w-6' : ''}`} />

          <button
            onClick={toggleTheme}
            className={`flex items-center justify-center hover:text-accent transition-all duration-200 text-[var(--text-muted)] ${isCollapsed ? 'w-full py-4' : 'px-5 py-5'}`}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className={`w-px h-6 bg-white/5 ${isCollapsed ? 'h-px w-6' : ''}`} />

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex items-center justify-center hover:text-accent transition-all duration-200 text-[var(--text-muted)] ${isCollapsed ? 'w-full py-4' : 'px-5 py-5'}`}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
