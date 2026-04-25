import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

// ── Database ──────────────────────────────────────────────────
import './config/db.js';

// ── Services (for startup tasks) ──────────────────────────────
import * as sessionService from './services/sessionService.js';

// ── Handlers ──────────────────────────────────────────────────
import { initSocket } from './socket/socketHandler.js';
import { initMqtt } from './mqtt/mqttHandler.js';

// ── Routes ────────────────────────────────────────────────────
import slotRoutes from './routes/slots.js';
import userRoutes from './routes/users.js';
import sessionRoutes from './routes/sessions.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';

// ── Middleware ────────────────────────────────────────────────
import { errorHandler } from './middleware/errorHandler.js';
import { requireAdmin } from './middleware/auth.js';
import { generalLimiter, scanLimiter, paymentLimiter } from './middleware/rateLimiter.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Set up Socket.IO
const io = initSocket(httpServer);
app.set('io', io); // Make io accessible in routes

// Set up MQTT
initMqtt(io);

// ── Standard Middleware ───────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(generalLimiter);

// ── Health Check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Smart Parking API',
    timestamp: new Date().toISOString(),
  });
});

// ── Mount Routes ──────────────────────────────────────────────
app.use('/api/slots', slotRoutes);
app.use('/api/users/scan', scanLimiter); // Extra protection for scanning
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/payments', paymentLimiter, paymentRoutes); // Protect payment flows
app.use('/api/auth', authRoutes);
app.use('/api/admin', requireAdmin, adminRoutes);

// ── Error Handler ─────────────────────────────────────────────
app.use(errorHandler);

// ── Startup Tasks ─────────────────────────────────────────────
const startServer = async () => {
  try {
    // 1. Cleanup stale sessions
    const abandonedCount = await sessionService.abandonStaleSessions();
    console.log(`✅ Stale session cleanup done: ${abandonedCount} abandoned`);

    // 2. Start listening
    httpServer.listen(PORT, () => {
      console.log(`🚀 Smart Parking Server running on port ${PORT}`);
      console.log(`   Health check → http://localhost:${PORT}/health`);
      console.log(`   MQTT connected`);
      console.log(`   Socket.IO ready`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
