import { Server } from 'socket.io';
import * as slotService from '../services/slotService.js';

export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', async (socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);

    try {
      // Send initial state to the newly connected client
      const slots = await slotService.getAllSlots();
      socket.emit('initialState', slots);
    } catch (err) {
      console.error('[SOCKET] Error sending initial state:', err.message);
    }

    socket.on('disconnect', () => {
      console.log(`[SOCKET] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}
