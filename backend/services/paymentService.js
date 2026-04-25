import pool from '../config/db.js';

// ── calculateAmount ───────────────────────────────────────────
// Rounds up to nearest hour, minimum 1 hour charge
export function calculateAmount(entryTime, exitTime) {
  const rate = parseFloat(process.env.PARKING_RATE_PER_HOUR) || 30;
  const diffMs = new Date(exitTime) - new Date(entryTime);
  const diffMinutes = diffMs / (1000 * 60);
  const hours = Math.max(1, Math.ceil(diffMinutes / 60)); // minimum 1 hour
  return parseFloat((hours * rate).toFixed(2));
}

// ── createPayment ─────────────────────────────────────────────
export async function createPayment(sessionId, amount, method = 'cash', pidx = null) {
  try {
    const result = await pool.query(
      `INSERT INTO payments (session_id, amount, method, status, pidx)
       VALUES ($1, $2, $3, 'pending', $4)
       RETURNING *`,
      [sessionId, amount, method, pidx]
    );
    return result.rows[0];
  } catch (err) {
    console.error('[paymentService] createPayment error:', err.message);
    throw err;
  }
}

import { addLoyaltyPoints } from './userService.js';

// ── markPaid ──────────────────────────────────────────────────
export async function markPaid(paymentId, method, appliedDiscount = 0, extras = {}) {
  try {
    const p = await pool.query("SELECT * FROM payments WHERE id = $1", [paymentId]);
    if (p.rows.length === 0) throw new Error(`Payment ${paymentId} not found`);
    
    const payment = p.rows[0];
    const finalAmount = Math.max(0, payment.amount - appliedDiscount);

    const result = await pool.query(
      `UPDATE payments
       SET status = 'paid', 
           paid_at = NOW(), 
           method = $1, 
           amount = $2,
           transaction_id = $3,
           gateway_response = $4
       WHERE id = $5
       RETURNING *`,
      [method, finalAmount, extras.transaction_id || null, extras.gateway_response || null, paymentId]
    );

    let pointsAwarded = 0;
    
    const sessionRes = await pool.query("SELECT user_id FROM parking_sessions WHERE id = $1", [payment.session_id]);
    const userId = sessionRes.rows[0]?.user_id;

    if (userId) {
      pointsAwarded = Math.floor(finalAmount / 10);
      if (pointsAwarded > 0) {
        await addLoyaltyPoints(userId, payment.session_id, pointsAwarded);
      }
    }

    return { ...result.rows[0], pointsAwarded };
  } catch (err) {
    console.error('[paymentService] markPaid error:', err.message);
    throw err;
  }
}

// ── getPaymentBySession ───────────────────────────────────────
export async function getPaymentBySession(sessionId) {
  try {
    const result = await pool.query(
      'SELECT * FROM payments WHERE session_id = $1',
      [sessionId]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error('[paymentService] getPaymentBySession error:', err.message);
    throw err;
  }
}
