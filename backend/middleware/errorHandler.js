export const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: true,
    message: message,
    code: statusCode,
    // Stack trace only in development
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
};
