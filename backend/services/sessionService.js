import pool from '../config/db.js';
import { calculateAmount } from './paymentService.js';

// ── startSession ──────────────────────────────────────────────
export async function startSession(slotId, userId = null) {
  try {
    // Check if slot already has an active session
    const activeResult = await pool.query(
      "SELECT id, user_id FROM parking_sessions WHERE slot_id = $1 AND status = 'active'",
      [slotId]
    );

    if (activeResult.rows.length > 0) {
      const existing = activeResult.rows[0];
      // If a userId is provided and the session doesn't have one, update it
      if (userId && !existing.user_id) {
        const updated = await pool.query(
          "UPDATE parking_sessions SET user_id = $1 WHERE id = $2 RETURNING *",
          [userId, existing.id]
        );
        return updated.rows[0];
      }
      return existing; // Idempotent: return existing session
    }

    const result = await pool.query(
      `INSERT INTO parking_sessions (slot_id, user_id, status)
       VALUES ($1, $2, 'active')
       RETURNING *`,
      [slotId, userId]
    );
    return result.rows[0];
  } catch (err) {
    console.error('[sessionService] startSession error:', err.message);
    throw err;
  }
}

// ── endSession ────────────────────────────────────────────────
export async function endSession(slotId) {
  try {
    // Find active session for this slotId
    const activeResult = await pool.query(
      "SELECT * FROM parking_sessions WHERE slot_id = $1 AND status = 'active'",
      [slotId]
    );

    if (activeResult.rows.length === 0) {
      console.warn(`[sessionService] No active session found for slotId ${slotId}`);
      return null;
    }

    const session = activeResult.rows[0];
    const exitTime = new Date();
    const diffMs = exitTime - new Date(session.entry_time);
    const durationMinutes = Math.floor(diffMs / (1000 * 60));
    const amountDue = calculateAmount(session.entry_time, exitTime);

    const result = await pool.query(
      `UPDATE parking_sessions
       SET exit_time = $1, duration_minutes = $2, status = 'completed'
       WHERE id = $3
       RETURNING *`,
      [exitTime, durationMinutes, session.id]
    );

    return { ...result.rows[0], amountDue };
  } catch (err) {
    console.error('[sessionService] endSession error:', err.message);
    throw err;
  }
}

// ── getActiveSession ──────────────────────────────────────────
export async function getActiveSession(slotId) {
  try {
    const result = await pool.query(
      "SELECT * FROM parking_sessions WHERE slot_id = $1 AND status = 'active'",
      [slotId]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error('[sessionService] getActiveSession error:', err.message);
    throw err;
  }
}

// ── abandonStaleSessions ──────────────────────────────────────
export async function abandonStaleSessions() {
  try {
    const result = await pool.query(
      `UPDATE parking_sessions
       SET status = 'abandoned'
       WHERE status = 'active' AND entry_time < NOW() - INTERVAL '24 hours'
       RETURNING id`
    );
    if (result.rows.length > 0) {
      console.log(`[sessionService] Abandoned ${result.rows.length} stale sessions`);
    }
    return result.rows.length;
  } catch (err) {
    console.error('[sessionService] abandonStaleSessions error:', err.message);
    throw err;
  }
}
