import React from 'react';
import SidebarLayout from '../components/shared/SidebarLayout';
import ParkingGrid from '../components/parking/ParkingGrid';
import PaymentModal from '../components/payment/PaymentModal';
import QRScanner from '../components/user/QRScanner';
import UserCard from '../components/user/UserCard';
import { Activity, ShieldCheck, Zap } from 'lucide-react';

export default function MonitorPage() {
  return (
    <SidebarLayout>
      <div className="p-6 lg:p-10 space-y-10">
        {/* Operations Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-customer">
              <Zap className="w-5 h-5 fill-customer" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Operational Console</span>
            </div>
            <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Live Monitor</h1>
            <p className="text-sm text-[var(--text-secondary)] font-medium">Real-time occupancy management and biometric security sync.</p>
          </div>

          <div className="flex items-center gap-4 bg-[var(--bg-surface)] p-2 rounded-2xl border border-[var(--bg-border)] shadow-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-available/10 rounded-xl border border-available/20">
              <div className="w-2 h-2 rounded-full bg-available animate-pulse" />
              <span className="text-[10px] font-black text-available uppercase tracking-widest">Network Secure</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-xl border border-accent/20">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-black text-accent uppercase tracking-widest">Auth Active</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* Main Grid View */}
          <div className="xl:col-span-8">
            <div className="bg-[var(--bg-surface)] rounded-[2.5rem] border border-[var(--bg-border)] p-8 shadow-2xl relative overflow-hidden">
              {/* Background ambient glow */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-available/5 rounded-full blur-[100px] pointer-events-none" />
              
              <ParkingGrid />
            </div>
          </div>

          {/* Side Control Panel */}
          <div className="xl:col-span-4 space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <Activity className="w-4 h-4 text-customer" />
                <h2 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-left">Identity Services</h2>
              </div>
              <QRScanner />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <h2 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-left">Member Insights</h2>
              </div>
              <UserCard />
            </div>
          </div>
        </div>
      </div>
      <PaymentModal />
    </SidebarLayout>
  );
}
