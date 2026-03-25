'use strict';

const AppError = require('../Utils/AppError');

/**
 * RBAC authorization middleware factory.
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Forbidden', 403));
    }
    next();
  };
}

module.exports = authorize;
