import React from 'react';
import Navbar from './shared/Navbar';
import UserCard from './user/UserCard';
import QRScanner from './user/QRScanner';
import { useParking } from '../context/ParkingContext';

export default function StaffLayout({ children, showScanner = true }) {
  const { connected } = useParking();

  return (
    <div className="min-h-screen flex flex-col bg-bg-base">
      <Navbar />
      
      <main className="flex-grow flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto">
        {/* Main Content Area */}
        <div className="w-full lg:w-[65%] p-6 lg:p-10 border-b lg:border-b-0 lg:border-r border-bg-border overflow-y-auto">
          {children}
        </div>

        {/* Global Operations Sidebar */}
        <div className="w-full lg:w-[35%] bg-bg-surface flex flex-col">
          {showScanner && (
            <div className="border-b border-bg-border">
              <QRScanner />
            </div>
          )}
          
          <div className="border-b border-bg-border bg-bg-surface/50">
            <UserCard />
          </div>

          {/* System Health Status (Always visible in sidebar) */}
          <div className="p-6">
            <h3 className="text-[10px] uppercase tracking-widest text-text-muted mb-4">
              System Health
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">MQTT Broker</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${connected ? 'bg-status-available/10 text-status-available' : 'bg-status-occupied/10 text-status-occupied'}`}>
                  {connected ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Database</span>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-status-available/10 text-status-available">
                  Connected
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
