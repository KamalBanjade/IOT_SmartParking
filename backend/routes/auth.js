import express from 'express';
import * as authService from '../services/authService.js';
import * as userService from '../services/userService.js';
import { requireOperator, requireAdmin, requireCustomer } from '../middleware/auth.js';
import pool from '../config/db.js';
import crypto from 'crypto';
import * as emailService from '../services/emailService.js';

const router = express.Router();

// ==========================================
// OPERATOR AUTH
// ==========================================

router.post('/operator/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await authService.loginOperator(email, password);
    res.json(data);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

router.post('/operator/logout', requireOperator, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

router.get('/operator/me', requireOperator, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM operators WHERE id = $1', [req.operator.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Operator not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/operator/change-password', requireOperator, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate current password
    const result = await pool.query('SELECT password_hash FROM operators WHERE id = $1', [req.operator.id]);
    const isValid = await authService.comparePassword(currentPassword, result.rows[0].password_hash);
    
    if (!isValid) return res.status(400).json({ error: 'Incorrect current password' });
    
    // Hash new password
    const newHash = await authService.hashPassword(newPassword);
    await pool.query('UPDATE operators SET password_hash = $1 WHERE id = $2', [newHash, req.operator.id]);
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

router.post('/operator/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.forgotOperatorPassword(email);
    res.json({ message: 'Reset link sent to your email' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/operator/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    await authService.resetOperatorPassword(token, password);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// ADMIN ONLY - OPERATOR MANAGEMENT
// ==========================================

router.post('/operators/create', requireAdmin, async (req, res, next) => {
  try {
    const { name, email, role } = req.body;
    
    // Create operator with no password initially
    const result = await pool.query(
      'INSERT INTO operators (name, email, role) VALUES ($1, $2, $3) RETURNING id, name, email, role, is_active, created_at',
      [name, email, role || 'operator']
    );
    
    const operator = result.rows[0];
    
    // Generate setup token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000 * 48); // 48 hours for setup
    
    await pool.query(
      'UPDATE operators SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [token, expires, operator.id]
    );
    
    // Send welcome email
    await emailService.sendStaffWelcomeEmail(email, name, token);
    
    res.status(201).json({ ...operator, setupSent: true });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    next(err);
  }
});

router.get('/operators', requireAdmin, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, is_active, created_at, last_login FROM operators ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.patch('/operators/:id/deactivate', requireAdmin, async (req, res, next) => {
  try {
    const result = await pool.query('UPDATE operators SET is_active = false WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Operator not found' });
    res.json({ message: 'Operator deactivated' });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// CUSTOMER AUTH
// ==========================================

router.post('/customer/setup-password', async (req, res, next) => {
  try {
    const { phone, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    
    const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Phone number not registered. Please visit the parking booth to register.' });
    }
    
    const user = result.rows[0];
    if (user.password_hash) {
      return res.status(400).json({ error: 'Password already set. Please login instead.' });
    }
    
    await authService.registerCustomerPassword(user.id, password);
    
    // Auto login
    const data = await authService.loginCustomer(phone, password);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/customer/login', async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    const data = await authService.loginCustomer(phone, password);
    
    // Add points summary
    const pointsRes = await userService.getPointsSummary(data.customer.id);
    data.customer.points = pointsRes;
    
    res.json(data);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

router.get('/customer/me', requireCustomer, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id, name, phone, email, is_member, qr_token FROM users WHERE id = $1', [req.customer.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const user = result.rows[0];
    const pointsSummary = await userService.getPointsSummary(user.id);
    
    res.json({ ...user, pointsSummary });
  } catch (err) {
    next(err);
  }
});

router.post('/customer/forgot-password', async (req, res, next) => {
  try {
    const { emailOrPhone } = req.body;
    await userService.forgotPassword(emailOrPhone);
    res.json({ message: 'Reset link sent to your email' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/customer/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    await userService.resetPassword(token, password);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
