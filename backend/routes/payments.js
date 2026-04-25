import express from 'express';
import * as paymentService from '../services/paymentService.js';
import * as userService from '../services/userService.js';
import * as khaltiService from '../services/khaltiService.js';
import { validatePayment } from '../middleware/validator.js';
import pool from '../config/db.js';
import { requireOperator } from '../middleware/auth.js';

const router = express.Router();

router.get('/:sessionId', requireOperator, async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentBySession(req.params.sessionId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/pay', requireOperator, validatePayment, async (req, res, next) => {
  try {
    const { method, appliedDiscount = 0 } = req.body;
    const payment = await paymentService.markPaid(req.params.id, method, appliedDiscount);
    
    res.json({ 
      payment, 
      pointsAwarded: payment.pointsAwarded 
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/khalti/initiate', requireOperator, async (req, res, next) => {
  try {
    const paymentId = req.params.id;
    
    // Get payment and session info
    const query = `
      SELECT p.*, ps.slot_id, s.label as slot_label, ps.user_id 
      FROM payments p
      JOIN parking_sessions ps ON p.session_id = ps.id
      JOIN parking_slots s ON ps.slot_id = s.id
      WHERE p.id = $1
    `;
    const result = await pool.query(query, [paymentId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
    
    const data = result.rows[0];
    
    // Get customer info if member
    let customerInfo = {};
    if (data.user_id) {
      const user = await userService.getUserById(data.user_id);
      if (user) {
        customerInfo = { name: user.name, phone: user.phone };
      }
    }
    
    const initiateRes = await khaltiService.initiatePayment(
      paymentId, 
      data.amount, 
      data.slot_label, 
      customerInfo
    );
    
    // Save pidx
    await pool.query('UPDATE payments SET pidx = $1 WHERE id = $2', [initiateRes.pidx, paymentId]);
    
    res.json({ paymentUrl: initiateRes.payment_url, pidx: initiateRes.pidx });
  } catch (err) {
    next(err);
  }
});

router.post('/khalti/verify', requireOperator, async (req, res, next) => {
  try {
    const { pidx, paymentId } = req.body;
    const verifyRes = await khaltiService.verifyPayment(pidx);
    
    if (verifyRes.status === 'Completed') {
      const payment = await paymentService.markPaid(paymentId, 'khalti', 0, {
        transaction_id: verifyRes.transaction_id,
        gateway_response: verifyRes
      });
      
      res.json({ success: true, amount: verifyRes.total_amount / 100, pointsAwarded: payment.pointsAwarded });
    } else {
      res.json({ success: false, status: verifyRes.status });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
