import React, { useEffect, useState } from 'react';
import SlotTimer from './SlotTimer';
import { useParking } from '../../context/ParkingContext';
import { sessionsApi } from '../../services/api';
import ConfirmModal from '../shared/ConfirmModal';
import toast from 'react-hot-toast';

export default function SlotCard({ slot }) {
  const { selectSlot, openModal, scannedUser } = useParking();
  const isOccupied = slot.status === 'occupied';
  const [pulse, setPulse] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 1000);
    return () => clearTimeout(t);
  }, [slot.status]);

  const handleClick = async () => {
    if (isOccupied) {
      selectSlot(slot);
      openModal('payment');
    } else {
      if (scannedUser) {
        setShowConfirm(true);
      }
    }
  };

  const startSession = async () => {
    try {
      await sessionsApi.entry({ slotId: slot.id, userId: scannedUser.user.id });
      toast.success(`Session started for ${scannedUser.user.name} — ${slot.label}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to link session");
    }
  };

  const baseStyles = "relative w-full aspect-square bg-bg-surface rounded-xl p-5 flex flex-col justify-between transition-colors duration-500";
  const statusStyles = isOccupied 
    ? "border border-status-occupied/30 cursor-pointer hover:border-status-occupied" 
    : "border border-bg-border hover:border-accent/40 cursor-pointer hover:opacity-80 transition-opacity duration-150";
    
  const pulseClass = pulse ? "ring-2 ring-offset-0 ring-text-muted/50" : "";

  return (
    <>
      <div className={`${baseStyles} ${statusStyles} ${pulseClass}`} onClick={handleClick}>
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-text-primary">{slot.label}</h3>
          <div className={`w-2 h-2 rounded-full mt-1.5 ${isOccupied ? 'bg-status-occupied' : 'bg-status-available'}`}></div>
        </div>

        <div className="flex-grow flex items-center justify-center">
          {isOccupied && <SlotTimer slotId={slot.id} />}
        </div>

        <div>
          <p className="text-[10px] tracking-widest text-text-secondary uppercase">
            {isOccupied ? 'OCCUPIED' : 'AVAILABLE'}
          </p>
        </div>
      </div>

      <ConfirmModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={startSession}
        title="Start Session?"
        message={`Link active member ${scannedUser?.user?.name} to slot ${slot.label}?`}
        confirmText="Start Session"
        type="info"
      />
    </>
  );
}
