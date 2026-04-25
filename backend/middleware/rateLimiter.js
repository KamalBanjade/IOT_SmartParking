import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: true, message: 'Too many requests' }
});

export const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: true, message: 'Scan rate limit exceeded' }
});

export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: true, message: 'Payment rate limit exceeded' }
});
