import React, { createContext, useContext, useState } from 'react';
import { useSocket } from '../hooks/useSocket';

const ParkingContext = createContext();

export function ParkingProvider({ children }) {
  const { slots, connected, socket } = useSocket();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [scannedUser, setScannedUserRaw] = useState(() => {
    try {
      const stored = sessionStorage.getItem('scannedUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setScannedUser = (user) => {
    setScannedUserRaw(user);
    if (user) {
      sessionStorage.setItem('scannedUser', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('scannedUser');
    }
  };

  const [activeModal, setActiveModal] = useState(null); // 'payment', 'register', 'scan', null

  const selectSlot = (slot) => setSelectedSlot(slot);
  const clearSelection = () => setSelectedSlot(null);
  const openModal = (type) => setActiveModal(type);
  const closeModal = () => setActiveModal(null);

  const value = {
    slots,
    connected,
    socket,
    selectedSlot,
    selectSlot,
    clearSelection,
    scannedUser,
    setScannedUser,
    activeModal,
    openModal,
    closeModal,
  };

  return <ParkingContext.Provider value={value}>{children}</ParkingContext.Provider>;
}

export const useParking = () => useContext(ParkingContext);
