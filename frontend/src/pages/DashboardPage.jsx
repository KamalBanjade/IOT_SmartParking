import React from 'react';
import ParkingGrid from '../components/parking/ParkingGrid';
import StaffLayout from '../components/StaffLayout';
import PaymentModal from '../components/payment/PaymentModal';

export default function DashboardPage() {
  return (
    <StaffLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Parking Slots</h1>
        <p className="text-xs text-text-secondary mt-1">Real-time occupancy monitor and session management.</p>
      </div>
      <ParkingGrid />
      <PaymentModal />
    </StaffLayout>
  );
}
