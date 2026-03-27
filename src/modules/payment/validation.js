'use strict';

const Joi = require('joi');

const initiatePaymentSchema = Joi.object({
  order_id: Joi.string().uuid().required(),
  payment_method: Joi.string().valid('telebirr', 'chapa').required(),
});

const uuidParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = { initiatePaymentSchema, uuidParamSchema };
