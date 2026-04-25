import express from 'express';
import pool from '../config/db.js';
import * as sessionService from '../services/sessionService.js';
import * as paymentService from '../services/paymentService.js';
import { requireOperator, requireCustomer } from '../middleware/auth.js';

const router = express.Router();

router.get('/active', requireOperator, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT ps.*, s.label as slot_label 
      FROM parking_sessions ps
      JOIN parking_slots s ON ps.slot_id = s.id
      WHERE ps.status = 'active'
    `);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/entry', requireOperator, async (req, res, next) => {
  try {
    const { slotId, userId } = req.body;
    const session = await sessionService.startSession(slotId, userId);
    res.json(session);
  } catch (err) {
    next(err);
  }
});


router.get('/slot/:slotId', requireOperator, async (req, res, next) => {
  try {
    const session = await sessionService.getActiveSession(req.params.slotId);
    res.json(session);
  } catch (err) {
    next(err);
  }
});

router.post('/exit', requireOperator, async (req, res, next) => {
  try {
    const { slotId, userId } = req.body;
    const session = await sessionService.endSession(slotId);
    
    if (!session) {
      return res.status(404).json({ error: 'No active session for this slot' });
    }

    if (userId) {
      await pool.query('UPDATE parking_sessions SET user_id = $1 WHERE id = $2', [userId, session.id]);
    }

    const payment = await paymentService.createPayment(session.id, session.amountDue);
    
    res.json({ 
      message: 'Session ended',
      session,
      payment
    });
  } catch (err) {
    next(err);
  }
});

export default router;

router.get('/my', requireCustomer, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(`
      SELECT ps.*, s.label as slot_label, p.amount, p.method, p.status as payment_status
      FROM parking_sessions ps
      JOIN parking_slots s ON ps.slot_id = s.id
      LEFT JOIN payments p ON p.session_id = ps.id
      WHERE ps.user_id = $1
      ORDER BY ps.entry_time DESC
      LIMIT $2 OFFSET $3
    `, [req.customer.id, limit, offset]);

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});
