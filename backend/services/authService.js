import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import crypto from 'crypto';
import * as emailService from './emailService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const JWT_OPERATOR_EXPIRES = process.env.JWT_OPERATOR_EXPIRES || '8h';
const JWT_CUSTOMER_EXPIRES = process.env.JWT_CUSTOMER_EXPIRES || '30d';

export async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, 12);
}

export async function comparePassword(plainPassword, hash) {
  return await bcrypt.compare(plainPassword, hash);
}

export function generateOperatorToken(operator) {
  const payload = {
    id: operator.id,
    email: operator.email,
    role: operator.role,
    type: 'operator'
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_OPERATOR_EXPIRES });
}

export function generateCustomerToken(customer) {
  const payload = {
    id: customer.id,
    phone: customer.phone,
    type: 'customer'
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_CUSTOMER_EXPIRES });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export async function loginOperator(email, password) {
  const result = await pool.query('SELECT * FROM operators WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }
  
  const operator = result.rows[0];
  if (!operator.is_active) {
    throw new Error('Account disabled');
  }
  
  const isValid = await comparePassword(password, operator.password_hash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }
  
  await pool.query('UPDATE operators SET last_login = NOW() WHERE id = $1', [operator.id]);
  
  const { password_hash, ...operatorData } = operator;
  const token = generateOperatorToken(operatorData);
  
  return { operator: operatorData, token };
}

export async function loginCustomer(phone, password) {
  const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }
  
  const customer = result.rows[0];
  if (!customer.password_hash) {
    throw new Error('Please set a password first');
  }
  if (!customer.is_active) {
    throw new Error('Account disabled');
  }
  
  const isValid = await comparePassword(password, customer.password_hash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }
  
  const { password_hash, ...customerData } = customer;
  const token = generateCustomerToken(customerData);
  
  return { customer: customerData, token };
}

export async function registerCustomerPassword(userId, password) {
  // Validate: min 8 chars, at least 1 number
  if (password.length < 8 || !/\d/.test(password)) {
    throw new Error('Password must be at least 8 characters and contain a number');
  }
  
  const hash = await hashPassword(password);
  
  const result = await pool.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, name, phone, email, is_member',
    [hash, userId]
  );
  
  return result.rows[0];
}

// ── forgotOperatorPassword ────────────────────────────────────
export async function forgotOperatorPassword(email) {
  try {
    const result = await pool.query(
      'SELECT id, name FROM operators WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) throw new Error('Operator not found');
    
    const operator = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour
    
    await pool.query(
      'UPDATE operators SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [token, expires, operator.id]
    );
    
    await emailService.sendOperatorResetEmail(email, operator.name, token);
    return true;
  } catch (err) {
    console.error('[authService] forgotOperatorPassword error:', err.message);
    throw err;
  }
}

// ── resetOperatorPassword ─────────────────────────────────────
export async function resetOperatorPassword(token, newPassword) {
  try {
    const result = await pool.query(
      'SELECT id FROM operators WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );
    
    if (result.rows.length === 0) throw new Error('Invalid or expired reset token');
    
    const operatorId = result.rows[0].id;
    const hash = await bcrypt.hash(newPassword, 12);
    
    await pool.query(
      'UPDATE operators SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hash, operatorId]
    );
    
    return true;
  } catch (err) {
    console.error('[authService] resetOperatorPassword error:', err.message);
    throw err;
  }
}
