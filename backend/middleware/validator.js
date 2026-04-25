export const validateRegister = (req, res, next) => {
  const { name, phone, email } = req.body;
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: true, message: 'Name is required (min 2 chars)', field: 'name' });
  }
  if (!phone || !/^\d{10}$/.test(phone)) {
    return res.status(400).json({ error: true, message: 'Phone must be exactly 10 digits', field: 'phone' });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: true, message: 'Invalid email format', field: 'email' });
  }
  next();
};

export const validateScan = (req, res, next) => {
  const { qrToken } = req.body;
  if (!qrToken || typeof qrToken !== 'string') {
    return res.status(400).json({ error: true, message: 'Invalid QR Token' });
  }
  next();
};

export const validatePayment = (req, res, next) => {
  const { method } = req.body;
  const allowed = ['cash', 'khalti'];
  if (!method || !allowed.includes(method)) {
    return res.status(400).json({ error: true, message: 'Invalid payment method' });
  }
  next();
};

export const validateSlotUpdate = (req, res, next) => {
  const { status } = req.body;
  const allowed = ['occupied', 'available'];
  if (!status || !allowed.includes(status)) {
    return res.status(400).json({ error: true, message: 'Invalid status' });
  }
  next();
};
