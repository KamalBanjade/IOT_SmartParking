import React, { useEffect, useState } from 'react';
import SlotTimer from './SlotTimer';
import { useParking } from '../../context/ParkingContext';
import { sessionsApi } from '../../services/api';
import ConfirmModal from '../shared/ConfirmModal';
import toast from 'react-hot-toast';

export default function SlotCard({ slot }) {
  const { selectSlot, openModal, scannedUser, setScannedUser } = useParking();
  const isOccupied = slot.status === 'occupied';
  const [pulse, setPulse] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLinkConfirm, setShowLinkConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 1500);
    return () => clearTimeout(t);
  }, [slot.status]);

  const handleClick = async () => {
    if (isOccupied) {
      if (scannedUser) {
        // If a member is scanned, offer to link them to this occupied slot
        setShowLinkConfirm(true);
      } else {
        setShowEndConfirm(true);
      }
    } else if (scannedUser) {
      setShowConfirm(true);
    }
  };

  const handleEndSession = async () => {
    try {
      // End the session immediately to stop the timer and release the slot
      await sessionsApi.exit({ slotId: slot.id, userId: scannedUser?.user?.id });
      toast.success('Session ended. Ready for payment.');
      
      // Open the modal to process payment
      selectSlot(slot);
      openModal('payment');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to end session');
    } finally {
      setShowEndConfirm(false);
    }
  };

  const linkMember = async () => {
    try {
      // Find active session for this slot and link the user
      await sessionsApi.entry({ slotId: slot.id, userId: scannedUser.user.id });
      toast.success(`Linked ${scannedUser.user.name} to slot ${slot.label}`);
      setScannedUser(null);
      setShowLinkConfirm(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to link member');
    }
  };

  const startSession = async () => {
    try {
      await sessionsApi.entry({ slotId: slot.id, userId: scannedUser.user.id });
      toast.success(`Session started for ${scannedUser.user.name} — ${slot.label}`);
      setScannedUser(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to link session');
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        className={`
          relative w-full aspect-square glass rounded-2xl p-4 flex flex-col justify-between cursor-pointer
          transition-all duration-300
          ${pulse ? 'ring-2 ring-accent ring-offset-2 ring-offset-[var(--bg-base)]' : ''}
          ${isOccupied
            ? 'border border-occupied/30 shadow-lg shadow-occupied/10 hover:border-occupied/60'
            : 'border border-available/20 hover:border-available/50 hover:shadow-lg hover:shadow-available/5'
          }
        `}
      >
        {/* Top row: label + status dot */}
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{slot.label}</h3>
          {isOccupied ? (
            <span className="w-2.5 h-2.5 rounded-full bg-occupied mt-1 flex-shrink-0" />
          ) : (
            <span className="relative flex h-2.5 w-2.5 mt-1 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-available opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-available" />
            </span>
          )}
        </div>

        {/* Center: timer for occupied */}
        <div className="flex-grow flex items-center justify-center">
          {isOccupied && <SlotTimer slotId={slot.id} />}
        </div>

        {/* Bottom row: status label + controller ID */}
        <div className="flex items-end justify-between">
          <p className={`text-[10px] tracking-widest font-semibold uppercase ${isOccupied ? 'text-occupied/70' : 'text-available/70'}`}>
            {isOccupied ? 'Occupied' : 'Available'}
          </p>
          {slot.controller_id && (
            <p className="text-[9px] font-mono text-[var(--text-muted)]">
              {slot.controller_id}
            </p>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={startSession}
        title="Start Session?"
        message={`Link ${scannedUser?.user?.name} to slot ${slot.label}?`}
        confirmText="Start Session"
        type="info"
      />

      <ConfirmModal
        isOpen={showLinkConfirm}
        onClose={() => setShowLinkConfirm(false)}
        onConfirm={linkMember}
        title="Link Member?"
        message={`Assign ${scannedUser?.user?.name} to the active session in ${slot.label}?`}
        confirmText="Link Member"
        type="info"
      />

      <ConfirmModal
        isOpen={showEndConfirm}
        onClose={() => setShowEndConfirm(false)}
        onConfirm={handleEndSession}
        title="Process Exit?"
        message={`Do you want to end the session for ${slot.label} and proceed to payment?`}
        confirmText="Yes, End Session"
        cancelText="No, Keep Active"
        type="warning"
      />
    </>
  );
}
