import express from 'express';
import * as userService from '../services/userService.js';
import { validateRegister, validateScan } from '../middleware/validator.js';
import { requireOperator, requireCustomer, optionalOperator } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', requireOperator, validateRegister, async (req, res, next) => {
  try {
    const { name, phone, email, isMember } = req.body;
    const result = await userService.registerUser(name, phone, email, isMember);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/', requireOperator, async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.get('/search', requireOperator, async (req, res, next) => {
  try {
    const { q } = req.query;
    const users = await userService.searchUsers(q || '');
    res.json(users);
  } catch (err) {
    next(err);
  }
});


// CUSTOMER SPECIFIC ENDPOINT
router.get('/my/profile', requireCustomer, async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.customer.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const pointsSummary = await userService.getPointsSummary(req.customer.id);
    res.json({ ...user, pointsSummary });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireOperator, async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.post('/scan', requireOperator, validateScan, async (req, res, next) => {
  try {
    const { qrToken } = req.body;
    const user = await userService.getUserByQrToken(qrToken);
    if (!user) return res.status(404).json({ error: 'Invalid QR Token' });
    
    const points = await userService.getPointsSummary(user.id);
    res.json({ user, loyaltyPoints: points.total, pointsSummary: points });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/regenerate-qr', requireOperator, async (req, res, next) => {
  try {
    const result = await userService.regenerateQrToken(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/points', optionalOperator, async (req, res, next) => {
  if (!req.operator && (!req.customer || String(req.customer.id) !== String(req.params.id))) {
    return res.status(403).json({ error: 'Access denied' });
  }
  try {
    const points = await userService.getLoyaltyPoints(req.params.id);
    res.json({ totalPoints: points });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/points-summary', optionalOperator, async (req, res, next) => {
  if (!req.operator && (!req.customer || String(req.customer.id) !== String(req.params.id))) {
    return res.status(403).json({ error: 'Access denied' });
  }
  try {
    const summary = await userService.getPointsSummary(req.params.id);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/apply-discount', requireOperator, async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const discountAmount = await userService.applyDiscount(req.params.id, sessionId);
    res.json({ discountAmount });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireOperator, async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireOperator, async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
