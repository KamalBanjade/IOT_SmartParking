import pool from '../config/db.js';

// ── getAllSlots ────────────────────────────────────────────────
export async function getAllSlots() {
  try {
    const result = await pool.query(
      'SELECT * FROM parking_slots ORDER BY id ASC'
    );
    return result.rows;
  } catch (err) {
    console.error('[slotService] getAllSlots error:', err.message);
    throw err;
  }
}

// ── getSlotById ───────────────────────────────────────────────
export async function getSlotById(id) {
  try {
    const result = await pool.query(
      'SELECT * FROM parking_slots WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error('[slotService] getSlotById error:', err.message);
    throw err;
  }
}

// ── getSlotByControllerId ─────────────────────────────────────
// RULE: Never hardcode slot IDs — always resolve via controller_id
export async function getSlotByControllerId(controllerId) {
  try {
    const result = await pool.query(
      'SELECT * FROM parking_slots WHERE controller_id = $1',
      [controllerId]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error('[slotService] getSlotByControllerId error:', err.message);
    throw err;
  }
}

// ── updateSlotStatus ──────────────────────────────────────────
// Finds slot by controller_id, updates status + last_updated
export async function updateSlotStatus(controllerId, status) {
  const allowed = ['available', 'occupied'];
  if (!allowed.includes(status)) {
    throw new Error(`Invalid status "${status}". Must be: ${allowed.join(', ')}`);
  }

  try {
    const result = await pool.query(
      `UPDATE parking_slots
       SET status = $1, last_updated = NOW()
       WHERE controller_id = $2
       RETURNING *`,
      [status, controllerId]
    );

    if (result.rows.length === 0) {
      throw new Error(`No slot found with controller_id "${controllerId}"`);
    }

    return result.rows[0];
  } catch (err) {
    console.error('[slotService] updateSlotStatus error:', err.message);
    throw err;
  }
}
