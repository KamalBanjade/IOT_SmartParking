import { verifyToken } from '../services/authService.js';
import pool from '../config/db.js';

export async function requireOperator(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    
    if (payload.type !== 'operator') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Verify operator still exists and is active
    const result = await pool.query('SELECT * FROM operators WHERE id = $1', [payload.id]);
    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    req.operator = {
      id: payload.id,
      email: payload.email,
      role: payload.role
    };
    
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function requireAdmin(req, res, next) {
  requireOperator(req, res, () => {
    if (req.operator && req.operator.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Admin access required' });
    }
  });
}

export async function requireCustomer(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    
    if (payload.type !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Verify customer still exists and is active
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [payload.id]);
    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    req.customer = {
      id: payload.id,
      phone: payload.phone
    };
    
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function optionalOperator(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verifyToken(token);
      if (payload.type === 'operator') {
        req.operator = {
          id: payload.id,
          email: payload.email,
          role: payload.role
        };
      } else if (payload.type === 'customer') {
        req.customer = {
          id: payload.id,
          phone: payload.phone
        };
      }
    }
  } catch (err) {
    // Ignore errors for optional authentication
  }
  next();
}
