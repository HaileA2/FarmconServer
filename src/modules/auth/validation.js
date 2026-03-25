'use strict';

const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[0-9]{7,15}$/).required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('farmer', 'buyer', 'transporter').required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const verifyOtpSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  otp: Joi.string().length(6).pattern(/^[0-9]{6}$/).required(),
});

const resendOtpSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  refreshSchema,
};
