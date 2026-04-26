import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export function useSocket() {
  const [slots, setSlots] = useState([]);
  const [connected, setConnected] = useState(false);

  const [socket, setSocketInstance] = useState(null);

  useEffect(() => {
    const s = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"]
    });
    setSocketInstance(s);

    s.on('connect', () => {
      setConnected(true);
      console.log('Connected to Socket.IO');
    });

    s.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from Socket.IO');
    });

    s.on('initialState', (initialSlots) => {
      setSlots(initialSlots);
    });

    s.on('slotUpdated', (updatedSlot) => {
      console.log('📡 LIVE UPDATE RECEIVED:', updatedSlot);
      setSlots((prevSlots) =>
        prevSlots.map((slot) => {
          const isMatch = Number(slot.id) === Number(updatedSlot.slotId) || Number(slot.id) === Number(updatedSlot.id);
          return isMatch ? { ...slot, ...updatedSlot, id: slot.id } : slot;
        })
      );
    });

    return () => {
      s.disconnect();
    };
  }, []);

  return { slots, connected, socket };
}
