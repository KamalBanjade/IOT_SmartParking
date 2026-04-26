import React from 'react';
import SidebarLayout from '../components/shared/SidebarLayout';
import AdminDashboard from '../components/admin/AdminDashboard';
import SessionTable from '../components/admin/SessionTable';
import MemberSearch from '../components/admin/MemberSearch';
import { ShieldCheck, Activity, Download, RefreshCw } from 'lucide-react';

export default function AdminPage() {
  return (
    <SidebarLayout>
      <div className="p-6 lg:p-10 space-y-10">
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--bg-border)] text-accent shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-accent">
                <Activity className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Live System Audit</span>
              </div>
              <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight mt-1">Management Console</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl text-xs font-black uppercase tracking-widest text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all">
              <Download className="w-4 h-4" /> Export Audit
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="p-3 rounded-xl bg-accent text-white hover:bg-blue-600 transition-all shadow-lg shadow-accent/20"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <AdminDashboard />
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-[var(--text-primary)]">Operational Logs</h3>
            <MemberSearch />
          </div>
          <SessionTable />
        </div>
      </div>
    </SidebarLayout>
  );
}
