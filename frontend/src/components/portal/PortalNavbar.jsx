import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '../../hooks/useCustomerAuth';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, History, LogOut, LayoutDashboard, Bell } from 'lucide-react';

export default function PortalNavbar() {
  const { customer, logout } = useCustomerAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { 
    logout(); 
    navigate('/login/customer'); 
  };

  const navLinks = [
    { label: 'Dashboard', path: '/portal/dashboard', icon: LayoutDashboard },
    { label: 'Sessions', path: '/portal/sessions', icon: History },
  ];

  return (
    <header className="glass sticky top-0 z-50 border-b border-[var(--bg-border)]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 h-16 flex items-center justify-between">
        
        <div className="flex items-center gap-4 lg:gap-12">
          {/* Logo */}
          <Link to="/portal/dashboard" className="flex items-center gap-2 lg:gap-3 group">
            <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-gradient-to-br from-customer to-accent flex items-center justify-center text-white font-bold text-base lg:text-lg shadow-lg shadow-customer/20 transition-transform group-hover:scale-110 flex-shrink-0">
              P
            </div>
            <div className="hidden xs:block">
              <span className="font-bold text-[var(--text-primary)] text-sm lg:text-base tracking-tight block">
                Smart Parking
              </span>
              <span className="text-[9px] lg:text-[10px] text-customer font-bold uppercase tracking-widest block -mt-1">
                Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, path, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-customer/10 text-customer' 
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications */}
          <button className="hidden sm:flex p-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-available rounded-full border-2 border-[var(--bg-surface)]"></span>
          </button>

          {/* Theme toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="w-px h-6 bg-[var(--bg-border)] mx-1 hidden sm:block"></div>

          {/* User & Logout */}
          {customer && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 pl-2 pr-1 py-1.5 rounded-2xl bg-[var(--bg-elevated)]/50 border border-[var(--bg-border)]">
                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-xl bg-customer/20 border border-customer/30 flex items-center justify-center text-customer font-bold text-xs">
                  {customer.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="hidden lg:block text-left pr-2">
                  <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">{customer.name?.split(' ')[0]}</p>
                  <p className="text-[9px] text-customer font-bold uppercase tracking-tighter">Member</p>
                </div>
              </div>
              
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-occupied bg-occupied/5 hover:bg-occupied/10 rounded-xl transition-all border border-occupied/10"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
