import pool from '../config/db.js';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import * as emailService from './emailService.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// ── registerUser ──────────────────────────────────────────────
export async function registerUser(name, phone, email = null, isMember = false) {
  try {
    // Check if phone already exists
    const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existing.rows.length > 0) {
      const err = new Error(`User with phone ${phone} already exists`);
      err.statusCode = 400;
      throw err;
    }

    const qrToken = nanoid(16);
    const result = await pool.query(
      'INSERT INTO users (name, phone, email, is_member, qr_token) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, phone, email, isMember, qrToken]
    );

    const user = result.rows[0];
    let qrCodeImage = null;

    if (isMember) {
      qrCodeImage = await QRCode.toDataURL(qrToken);
    }

    // If email is provided, send welcome/setup email
    if (email) {
      try {
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000 * 24); // 24 hours for setup

        await pool.query(
          'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
          [resetToken, resetExpires, user.id]
        );

        await emailService.sendResetEmail(email, name, resetToken, true);
      } catch (emailErr) {
        console.error('[userService] Failed to send welcome email:', emailErr.message);
        // We don't throw here so the registration still succeeds
      }
    }

    return { user, qrCodeImage };
  } catch (err) {
    console.error('[userService] registerUser error:', err.message);
    throw err;
  }
}

// ── getUserByQrToken ──────────────────────────────────────────
export async function getUserByQrToken(qrToken) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE qr_token = $1', [qrToken]);
    return result.rows[0] || null;
  } catch (err) {
    console.error('[userService] getUserByQrToken error:', err.message);
    throw err;
  }
}

// ── getUserById ───────────────────────────────────────────────
export async function getUserById(id) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (err) {
    console.error('[userService] getUserById error:', err.message);
    throw err;
  }
}

// ── regenerateQrToken ─────────────────────────────────────────
export async function regenerateQrToken(userId) {
  try {
    const newToken = nanoid(16);
    const result = await pool.query(
      'UPDATE users SET qr_token = $1 WHERE id = $2 RETURNING *',
      [newToken, userId]
    );
    
    if (result.rows.length === 0) throw new Error('User not found');
    
    const qrCodeImage = await QRCode.toDataURL(newToken);
    return { qrToken: newToken, qrCodeImage };
  } catch (err) {
    console.error('[userService] regenerateQrToken error:', err.message);
    throw err;
  }
}

// ── addLoyaltyPoints ──────────────────────────────────────────
export async function addLoyaltyPoints(userId, sessionId, points) {
  try {
    const result = await pool.query(
      'INSERT INTO loyalty_points (user_id, session_id, points) VALUES ($1, $2, $3) RETURNING *',
      [userId, sessionId, points]
    );
    return result.rows[0];
  } catch (err) {
    console.error('[userService] addLoyaltyPoints error:', err.message);
    throw err;
  }
}

// ── getLoyaltyPoints ──────────────────────────────────────────
export async function getLoyaltyPoints(userId) {
  try {
    const result = await pool.query(
      'SELECT SUM(points) as total_points FROM loyalty_points WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].total_points || 0, 10);
  } catch (err) {
    console.error('[userService] getLoyaltyPoints error:', err.message);
    throw err;
  }
}

// ── getPointsSummary ──────────────────────────────────────────
export async function getPointsSummary(userId) {
  try {
    const total = await getLoyaltyPoints(userId);
    const nextRewardAt = 50;
    const progress = Math.min(100, Math.floor((total / nextRewardAt) * 100));
    const discountAvailable = total >= 50;
    
    return {
      total,
      nextRewardAt,
      progress,
      discountAvailable,
      discountAmount: discountAvailable ? 25 : 0
    };
  } catch (err) {
    console.error('[userService] getPointsSummary error:', err.message);
    throw err;
  }
}

// ── applyDiscount ─────────────────────────────────────────────
export async function applyDiscount(userId, sessionId) {
  try {
    const total = await getLoyaltyPoints(userId);
    if (total < 50) {
      throw new Error('Insufficient points for discount');
    }
    
    await addLoyaltyPoints(userId, sessionId, -50);
    return 25; // 25 NPR discount
  } catch (err) {
    console.error('[userService] applyDiscount error:', err.message);
    throw err;
  }
}

// ── searchUsers ───────────────────────────────────────────────
export async function searchUsers(query) {
  try {
    const searchTerm = `%${query}%`;
    const result = await pool.query(
      `SELECT u.*, 
        COALESCE(SUM(lp.points), 0) as total_points,
        (SELECT MAX(entry_time) FROM parking_sessions WHERE user_id = u.id) as last_visit
       FROM users u
       LEFT JOIN loyalty_points lp ON u.id = lp.user_id
       WHERE u.name ILIKE $1 OR u.phone ILIKE $1
       GROUP BY u.id
       ORDER BY u.name ASC
       LIMIT 10`,
      [searchTerm]
    );
    
    return result.rows.map(row => ({
      ...row,
      total_points: parseInt(row.total_points, 10)
    }));
  } catch (err) {
    console.error('[userService] searchUsers error:', err.message);
    throw err;
  }
}
// ── forgotPassword ─────────────────────────────────────────────
export async function forgotPassword(emailOrPhone) {
  try {
    const result = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1 OR phone = $1',
      [emailOrPhone]
    );
    
    if (result.rows.length === 0) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    
    const user = result.rows[0];
    if (!user.email) {
      const err = new Error('User has no email registered');
      err.statusCode = 400;
      throw err;
    }
    
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour
    
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [token, expires, user.id]
    );
    
    await emailService.sendResetEmail(user.email, user.name, token, false);
    return true;
  } catch (err) {
    console.error('[userService] forgotPassword error:', err.message);
    throw err;
  }
}

// ── resetPassword ──────────────────────────────────────────────
export async function resetPassword(token, newPassword) {
  try {
    const result = await pool.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );
    
    if (result.rows.length === 0) {
      const err = new Error('Invalid or expired reset token');
      err.statusCode = 400;
      throw err;
    }
    
    const userId = result.rows[0].id;
    const hash = await bcrypt.hash(newPassword, 12);
    
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hash, userId]
    );
    
    return true;
  } catch (err) {
    console.error('[userService] resetPassword error:', err.message);
    throw err;
  }
}

/**
 * Get all users with points summary
 */
export async function getAllUsers() {
  const result = await pool.query(
    `SELECT u.*, 
      COALESCE(SUM(lp.points), 0) as total_points,
      (SELECT MAX(entry_time) FROM parking_sessions WHERE user_id = u.id) as last_visit
     FROM users u
     LEFT JOIN loyalty_points lp ON u.id = lp.user_id
     GROUP BY u.id
     ORDER BY u.created_at DESC`
  );
  return result.rows.map(row => ({
    ...row,
    total_points: parseInt(row.total_points, 10)
  }));
}

/**
 * Update user details
 */
export async function updateUser(id, { name, email, phone }) {
  const result = await pool.query(
    'UPDATE users SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING *',
    [name, email, phone, id]
  );
  if (result.rows.length === 0) throw new Error('User not found');
  return result.rows[0];
}

/**
 * Delete user and associated loyalty points/sessions
 */
export async function deleteUser(id) {
  // Use a transaction for deletion
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM loyalty_points WHERE user_id = $1', [id]);
    await client.query('DELETE FROM users WHERE id = $1', [id]);
    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
