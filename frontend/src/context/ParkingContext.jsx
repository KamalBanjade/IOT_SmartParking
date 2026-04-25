import React, { createContext, useContext, useState } from 'react';
import { useSocket } from '../hooks/useSocket';

const ParkingContext = createContext();

export function ParkingProvider({ children }) {
  const { slots, connected } = useSocket();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [scannedUser, setScannedUser] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'payment', 'register', 'scan', null

  const selectSlot = (slot) => setSelectedSlot(slot);
  const clearSelection = () => setSelectedSlot(null);
  const openModal = (type) => setActiveModal(type);
  const closeModal = () => setActiveModal(null);

  const value = {
    slots,
    connected,
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
