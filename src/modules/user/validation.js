'use strict';

const Joi = require('joi');

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  phone: Joi.string().pattern(/^\+?[0-9]{7,15}$/),
  location: Joi.string().max(255),
  fcm_token: Joi.string(),
}).or('name', 'phone', 'location', 'fcm_token');

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).required(),
});

const adminUpdateSchema = Joi.object({
  role: Joi.string().valid('farmer', 'buyer', 'transporter', 'admin'),
  is_active: Joi.boolean(),
}).or('role', 'is_active');

const uuidParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
  adminUpdateSchema,
  uuidParamSchema,
};
