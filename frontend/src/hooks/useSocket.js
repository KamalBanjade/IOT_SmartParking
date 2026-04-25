import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export function useSocket() {
  const [slots, setSlots] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      setConnected(true);
      console.log('Connected to Socket.IO');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from Socket.IO');
    });

    socket.on('initialState', (initialSlots) => {
      setSlots(initialSlots);
    });

    socket.on('slotUpdated', (updatedSlot) => {
      setSlots((prevSlots) =>
        prevSlots.map((slot) => (slot.id === updatedSlot.slotId || slot.id === updatedSlot.id ? { ...slot, ...updatedSlot } : slot))
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { slots, connected };
}
