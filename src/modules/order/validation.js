'use strict';

const Joi = require('joi');

const createOrderSchema = Joi.object({
  product_id: Joi.string().uuid().required(),
  quantity: Joi.number().integer().min(1).required(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Failed', 'Cancelled')
    .required(),
});

const uuidParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = { createOrderSchema, updateStatusSchema, uuidParamSchema };
