'use strict';

const logger = require('../Utils/logger');

/**
 * Central error handler middleware (4-arg).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  logger.error({
    err: err.message,
    stack: err.stack,
    requestId: req.id,
    statusCode,
  }, 'Request error');

  const message = statusCode >= 500 && isProduction
    ? 'Internal Server Error'
    : err.message;

  const response = {
    status: 'error',
    message,
    requestId: req.id,
  };

  if (!isProduction && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
