import React from 'react';
import Navbar from '../components/shared/Navbar';
import AdminDashboard from '../components/admin/AdminDashboard';
import SessionTable from '../components/admin/SessionTable';
import MemberSearch from '../components/admin/MemberSearch';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <Navbar />
      
      <main className="flex-grow max-w-7xl w-full mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-text-primary">Admin Statistics</h1>
          <p className="text-sm text-text-secondary mt-1">Real-time revenue and system utilization overview.</p>
        </div>

        <AdminDashboard />
        
        <MemberSearch />

        <div className="mt-8">
          <SessionTable />
        </div>
      </main>
    </div>
  );
}
