import React, { useMemo } from 'react';
import { useParking } from '../../context/ParkingContext';
import SlotCard from './SlotCard';
import LoadingSpinner from '../shared/LoadingSpinner';

export default function ParkingGrid() {
  const { slots } = useParking();

  const stats = useMemo(() => {
    const total = slots.length;
    const occupied = slots.filter((s) => s.status === 'occupied').length;
    return { total, occupied, available: total - occupied };
  }, [slots]);

  if (slots.length === 0) return <LoadingSpinner text="Loading slots..." />;

  const groupedSlots = slots.reduce((acc, slot) => {
    const zone = slot.label.charAt(0);
    if (!acc[zone]) acc[zone] = [];
    acc[zone].push(slot);
    return acc;
  }, {});

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-sm font-medium text-text-primary">Parking Slots</h2>
        <p className="text-xs text-text-secondary">
          <span className="text-text-primary font-medium">{stats.available}</span> available &middot; <span className="text-text-primary font-medium">{stats.occupied}</span> occupied
        </p>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedSlots).sort().map(([zone, zoneSlots]) => (
          <div key={zone}>
            <div className="border-b border-bg-border pb-2 mb-4">
              <h3 className="text-[10px] tracking-widest text-text-muted uppercase">
                Zone {zone}
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {zoneSlots.sort((a, b) => a.label.localeCompare(b.label)).map((slot) => (
                <SlotCard key={slot.id} slot={slot} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
