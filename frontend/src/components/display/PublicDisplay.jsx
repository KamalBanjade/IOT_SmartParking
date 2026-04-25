import React, { useMemo, useState, useEffect } from 'react';
import { useParking } from '../../context/ParkingContext';

export default function PublicDisplay() {
  const { slots } = useParking();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const total = slots.length;
    const occupied = slots.filter((s) => s.status === 'occupied').length;
    return { total, occupied, available: total - occupied };
  }, [slots]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-12 font-sans selection:bg-transparent">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-16">
        <div>
          <h1 className="text-5xl font-bold tracking-tight text-white mb-2 flex items-center">
            <span className="bg-blue-600 text-white rounded-lg w-12 h-12 flex items-center justify-center mr-4">P</span>
            SMART PARKING
          </h1>
          <p className="text-2xl text-gray-400 font-mono tracking-widest mt-4">
            <span className="text-green-400">{stats.available} AVAILABLE</span>
            <span className="mx-4">&middot;</span>
            <span className="text-red-400">{stats.occupied} OCCUPIED</span>
          </p>
        </div>
      </header>

      {/* Grid */}
      <main className="flex-grow grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {slots.sort((a, b) => a.label.localeCompare(b.label)).map(slot => {
          const isOccupied = slot.status === 'occupied';
          
          return (
            <div 
              key={slot.id} 
              className={`flex flex-col items-center justify-center rounded-3xl p-8 border-4 transition-all duration-500 min-h-[200px] ${
                isOccupied 
                  ? 'bg-red-950/30 border-red-600' 
                  : 'bg-green-950/30 border-green-500'
              }`}
            >
              <h2 className="text-7xl font-black mb-4 text-white">{slot.label}</h2>
              <p className={`text-2xl font-bold tracking-widest uppercase ${
                isOccupied ? 'text-red-400' : 'text-green-400'
              }`}>
                {isOccupied ? 'TAKEN' : 'FREE'}
              </p>
            </div>
          );
        })}
      </main>

      {/* Footer */}
      <footer className="mt-16 text-center">
        <p className="text-3xl text-gray-500 font-mono">
          {time.toLocaleTimeString('en-US', { hour12: false })}
        </p>
      </footer>
      
    </div>
  );
}
