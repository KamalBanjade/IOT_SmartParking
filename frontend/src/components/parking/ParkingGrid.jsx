import React, { useMemo } from 'react';
import { useParking } from '../../context/ParkingContext';
import SlotCard from './SlotCard';
import { LayoutGrid, CheckCircle2, XCircle, Info, Activity } from 'lucide-react';

export default function ParkingGrid() {
  const { slots } = useParking();

  const zones = useMemo(() => {
    const map = {};
    slots.forEach(slot => {
      const zone = slot.label?.match(/^[A-Z]+/)?.[0] ?? 'General';
      if (!map[zone]) map[zone] = [];
      map[zone].push(slot);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [slots]);

  const total = slots.length;
  const available = slots.filter(s => s.status !== 'occupied').length;
  const occupied = total - available;

  return (
    <div className="space-y-10">
      {/* Precision Stats Bar */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-8 bg-[var(--bg-elevated)]/30 p-4 rounded-2xl border border-[var(--bg-border)]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-available/10 text-available">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-black text-[var(--text-primary)] font-mono">{available}</p>
            <p className="text-[10px] font-black text-available uppercase tracking-widest">Available</p>
          </div>
        </div>

        <div className="w-px h-10 bg-[var(--bg-border)] hidden sm:block" />

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-occupied/10 text-occupied">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-black text-[var(--text-primary)] font-mono">{occupied}</p>
            <p className="text-[10px] font-black text-occupied uppercase tracking-widest">Occupied</p>
          </div>
        </div>

        <div className="w-px h-10 bg-[var(--bg-border)] hidden sm:block" />

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/10 text-accent">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-black text-[var(--text-primary)] font-mono">{total}</p>
            <p className="text-[10px] font-black text-accent uppercase tracking-widest">Total Slots</p>
          </div>
        </div>

        <div className="ml-auto hidden md:flex items-center gap-2 bg-available/5 px-4 py-2 rounded-xl border border-available/10">
          <Activity className="w-4 h-4 text-available animate-pulse" />
          <span className="text-[10px] font-black text-available uppercase tracking-widest">System Live</span>
        </div>
      </div>

      {/* Zone Rendering */}
      {zones.map(([zone, zoneSlots]) => (
        <div key={zone} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-6 w-1.5 bg-accent rounded-full" />
            <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">
              Zone {zone}
            </h3>
            <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-elevated)] px-3 py-1 rounded-full border border-[var(--bg-border)]">
              {zoneSlots.length} Units
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
            {zoneSlots.map(slot => (
              <SlotCard key={slot.id} slot={slot} />
            ))}
          </div>
        </div>
      ))}

      {zones.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-[var(--text-muted)] border-2 border-dashed border-[var(--bg-border)] rounded-[2.5rem]">
          <Info className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm font-bold uppercase tracking-widest opacity-40">No configured slots detected</p>
        </div>
      )}
    </div>
  );
}
