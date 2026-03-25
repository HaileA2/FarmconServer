'use strict';

const AppError = require('../Utils/AppError');

/**
 * Joi validation middleware factory.
 * @param {import('joi').Schema} schema
 * @returns {Function} Express middleware
 */
function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const message = error.details.map((d) => d.message).join(', ');
      return next(new AppError(message, 400));
    }
    next();
  };
}

module.exports = validate;
