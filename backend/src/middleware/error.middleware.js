const logger = require('../utils/logger');

exports.errorHandler = (err, req, res, next) => {
  logger.error(`[Unhandled Error] ${req.method} ${req.originalUrl}: ${err.message}`, {
    stack: err.stack,
    ip: req.ip
  });

  const status = err.statusCode || 500;
  
  // In production, avoid leaking internal database or system error details for 500 errors
  let clientMessage = err.message || 'Internal Server Error';
  if (process.env.NODE_ENV === 'production' && status === 500) {
    clientMessage = 'An unexpected server error occurred. Please try again later.';
  }

  res.status(status).json({
    ok: false,
    message: clientMessage,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
