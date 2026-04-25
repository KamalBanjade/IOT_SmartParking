import express from 'express';
import * as slotService from '../services/slotService.js';
import { validateSlotUpdate } from '../middleware/validator.js';
import { requireOperator, requireAdmin } from '../middleware/auth.js';


const router = express.Router();

router.get('/', requireOperator, async (req, res, next) => {
  try {
    const slots = await slotService.getAllSlots();
    res.json(slots);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireOperator, async (req, res, next) => {
  try {
    const slot = await slotService.getSlotById(req.params.id);
    if (!slot) return res.status(404).json({ error: 'Slot not found' });
    res.json(slot);
  } catch (err) {
    next(err);
  }
});

router.post('/update', requireAdmin, validateSlotUpdate, async (req, res, next) => {
  try {
    const { controllerId, status } = req.body;
    const slot = await slotService.updateSlotStatus(controllerId, status);
    
    // We should also emit socket update here if triggered manually
    if (req.app.get('io')) {
      req.app.get('io').emit('slotUpdated', slot);
    }
    
    res.json(slot);
  } catch (err) {
    next(err);
  }
});

export default router;
