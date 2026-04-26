import React, { useMemo, useState, useEffect } from 'react';
import { useParking } from '../../context/ParkingContext';
import { differenceInMinutes, differenceInHours } from 'date-fns';
import { sessionsApi } from '../../services/api';
import { Clock, MapPin, CheckCircle2, XCircle, ShieldCheck, Zap } from 'lucide-react';

function DisplayTimer({ slotId }) {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    let interval;
    sessionsApi.getBySlot(slotId).then(res => {
      if (res.data?.entry_time) {
        const entry = new Date(res.data.entry_time);
        const update = () => {
          const m = differenceInMinutes(new Date(), entry);
          const h = differenceInHours(new Date(), entry);
          setDisplay(h > 0 ? `${h}h ${m % 60}m` : `${m}m`);
        };
        update();
        interval = setInterval(update, 60000);
      }
    }).catch(() => {});
    return () => clearInterval(interval);
  }, [slotId]);
  return display ? <span className="text-xl font-mono text-white/40 mt-1 font-black">{display}</span> : null;
}

export default function PublicDisplay() {
  const { slots } = useParking();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => {
    const total = slots.length;
    const occupied = slots.filter(s => s.status === 'occupied').length;
    return { total, occupied, available: total - occupied };
  }, [slots]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col p-12 select-none overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-available/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Top Bar */}
      <header className="flex items-center justify-between mb-16 relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-gradient-to-br from-accent to-blue-700 rounded-[1.5rem] flex items-center justify-center text-3xl font-black shadow-2xl shadow-accent/40">
            P
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              SMART PARKING <span className="text-accent">OS</span>
            </h1>
            <div className="flex items-center gap-2 text-white/40 text-xs font-black uppercase tracking-[0.3em] mt-1">
              <MapPin className="w-3 h-3 text-accent" />
              Main Facility · Terminal 1
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="text-right">
            <p className="text-5xl font-black font-mono tracking-tighter">
              {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
              <span className="text-2xl text-white/20 ml-1">:{time.toLocaleTimeString('en-US', { second: '2-digit' })}</span>
            </p>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mt-1">
              {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col gap-10 relative z-10">
        {/* Availability Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass rounded-[3rem] p-10 flex items-center justify-between border border-white/5 shadow-2xl bg-gradient-to-br from-white/[0.03] to-transparent overflow-hidden relative">
            <div className="relative z-10">
              <h2 className="text-sm font-black text-available uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-available animate-pulse" />
                Live Availability
              </h2>
              <div className="flex items-end gap-4">
                <span className="text-[10rem] font-black leading-none tracking-tighter text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                  {stats.available}
                </span>
                <div className="mb-6">
                  <p className="text-4xl font-black text-white/20 leading-none">/ {stats.total}</p>
                  <p className="text-xl font-bold text-available uppercase tracking-widest mt-2">Slots Free</p>
                </div>
              </div>
            </div>
            <div className="hidden xl:block opacity-10">
              <Zap className="w-64 h-64 text-white" strokeWidth={3} />
            </div>
            {/* Visual Progress Bar */}
            <div className="absolute bottom-0 left-0 h-1.5 bg-available transition-all duration-1000 shadow-[0_0_20px_#22c55e]" style={{ width: `${(stats.available / stats.total) * 100}%` }} />
          </div>

          <div className="glass rounded-[3rem] p-10 border border-white/5 flex flex-col justify-center gap-6 bg-gradient-to-br from-white/[0.03] to-transparent">
            <StatRow label="Occupied" value={stats.occupied} color="text-occupied" icon={<XCircle className="w-6 h-6" />} />
            <div className="h-px bg-white/5" />
            <StatRow label="System Status" value="Online" color="text-available" icon={<ShieldCheck className="w-6 h-6" />} />
          </div>
        </div>

        {/* Dynamic Slot Grid */}
        <main className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 pb-12">
          {slots.sort((a, b) => a.label.localeCompare(b.label)).map(slot => {
            const isOccupied = slot.status === 'occupied';
            return (
              <div key={slot.id}
                className={`group relative flex flex-col items-center justify-center rounded-[2.5rem] p-8 min-h-[220px] transition-all duration-700 border-2 overflow-hidden ${
                  isOccupied 
                    ? 'bg-[#150505] border-occupied/20 shadow-none grayscale-[0.5]' 
                    : 'bg-[#05150a] border-available/30 shadow-[0_0_50px_rgba(34,197,94,0.05)] hover:shadow-[0_0_60px_rgba(34,197,94,0.15)] hover:scale-[1.02]'
                }`}
              >
                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
                
                <h2 className={`text-6xl font-black mb-2 tracking-tighter transition-colors duration-500 ${isOccupied ? 'text-white/20' : 'text-white'}`}>
                  {slot.label}
                </h2>
                
                <div className={`flex flex-col items-center gap-1 transition-all duration-500 ${isOccupied ? 'opacity-40' : 'opacity-100'}`}>
                  <p className={`text-xs font-black tracking-[0.4em] uppercase ${isOccupied ? 'text-occupied' : 'text-available'}`}>
                    {isOccupied ? 'Occupied' : 'Vacant'}
                  </p>
                  {isOccupied && <DisplayTimer slotId={slot.id} />}
                </div>

                {/* Corner Status Dot */}
                <div className={`absolute top-6 right-6 w-2.5 h-2.5 rounded-full ${isOccupied ? 'bg-occupied shadow-[0_0_10px_#ef4444]' : 'bg-available shadow-[0_0_10px_#22c55e] animate-pulse'}`} />
              </div>
            );
          })}
        </main>
      </div>

      {/* Footer Disclaimer */}
      <footer className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
        <span>Automated Guidance System v2.4.0</span>
        <span>Secure Parking Protocol Active</span>
      </footer>
    </div>
  );
}

function StatRow({ label, value, color, icon }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl bg-white/5 ${color}`}>
          {icon}
        </div>
        <span className="text-xs font-black text-white/40 uppercase tracking-widest">{label}</span>
      </div>
      <span className={`text-3xl font-black font-mono ${color}`}>{value}</span>
    </div>
  );
}
