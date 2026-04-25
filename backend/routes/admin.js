import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/dashboard', async (req, res, next) => {
  try {
    const stats = {};
    
    const slots = await pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'occupied\') as occupied FROM parking_slots');
    stats.totalSlots = parseInt(slots.rows[0].total, 10);
    stats.occupiedSlots = parseInt(slots.rows[0].occupied, 10);
    stats.availableSlots = stats.totalSlots - stats.occupiedSlots;

    const sessions = await pool.query('SELECT COUNT(*) as active FROM parking_sessions WHERE status = \'active\'');
    stats.activeSessions = parseInt(sessions.rows[0].active, 10);

    const revenue = await pool.query(`
      SELECT 
        COALESCE(SUM(amount) FILTER (WHERE paid_at::date = CURRENT_DATE), 0) as today,
        COALESCE(SUM(amount), 0) as total
      FROM payments 
      WHERE status = 'paid'
    `);
    stats.todayRevenue = parseFloat(revenue.rows[0].today);
    stats.totalRevenue = parseFloat(revenue.rows[0].total);

    res.json(stats);
  } catch (err) {
    next(err);
  }
});

router.get('/sessions', async (req, res, next) => {
  try {
    const { date } = req.query;
    let query = 'SELECT ps.*, s.label as slot_label FROM parking_sessions ps JOIN parking_slots s ON ps.slot_id = s.id';
    const params = [];

    if (date) {
      query += ' WHERE ps.entry_time::date = $1';
      params.push(date);
    }
    
    query += ' ORDER BY ps.entry_time DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/analytics/revenue', async (req, res, next) => {
  try {
    const { period } = req.query; // 7d, 30d, 90d
    let days = 7;
    if (period === '30d') days = 30;
    if (period === '90d') days = 90;

    const query = `
      SELECT 
        DATE(paid_at) as date,
        SUM(amount) as revenue,
        COUNT(id) as sessions
      FROM payments
      WHERE status = 'paid' AND paid_at >= CURRENT_DATE - INTERVAL '1 day' * $1
      GROUP BY DATE(paid_at)
      ORDER BY DATE(paid_at) ASC
    `;
    const result = await pool.query(query, [days]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/analytics/peak-hours', async (req, res, next) => {
  try {
    const query = `
      SELECT 
        EXTRACT(HOUR FROM entry_time) as hour,
        COUNT(*) * 1.0 / (SELECT COUNT(DISTINCT DATE(entry_time)) FROM parking_sessions) / (SELECT COUNT(*) FROM parking_slots) as avgOccupancy
      FROM parking_sessions
      GROUP BY hour
      ORDER BY hour ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/analytics/slot-performance', async (req, res, next) => {
  try {
    const query = `
      SELECT 
        s.id as slotId, 
        s.label,
        COUNT(ps.id) as totalSessions,
        COALESCE(SUM(p.amount), 0) as totalRevenue,
        AVG(ps.duration_minutes) as avgDurationMinutes
      FROM parking_slots s
      LEFT JOIN parking_sessions ps ON s.id = ps.slot_id
      LEFT JOIN payments p ON ps.id = p.session_id AND p.status = 'paid'
      GROUP BY s.id, s.label
      ORDER BY totalRevenue DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/analytics/members', async (req, res, next) => {
  try {
    const stats = {};
    
    const totals = await pool.query(`
      SELECT 
        COUNT(*) as totalMembers,
        (SELECT COUNT(DISTINCT user_id) FROM parking_sessions WHERE entry_time >= CURRENT_DATE - INTERVAL '30 days') as activeThisMonth,
        COALESCE((SELECT SUM(points) FROM loyalty_points), 0) as totalPointsAwarded,
        COALESCE((SELECT COUNT(*) * 25 FROM loyalty_points WHERE points < 0), 0) as totalDiscountsGiven
      FROM users WHERE is_member = TRUE
    `);
    
    Object.assign(stats, totals.rows[0]);

    const topMembers = await pool.query(`
      SELECT 
        u.name, u.phone, 
        COUNT(ps.id) as totalSessions,
        SUM(p.amount) as totalSpent,
        (SELECT SUM(points) FROM loyalty_points WHERE user_id = u.id) as points
      FROM users u
      JOIN parking_sessions ps ON u.id = ps.user_id
      JOIN payments p ON ps.id = p.session_id AND p.status = 'paid'
      WHERE u.is_member = TRUE
      GROUP BY u.id
      ORDER BY totalSpent DESC
      LIMIT 5
    `);
    stats.topMembers = topMembers.rows;

    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
