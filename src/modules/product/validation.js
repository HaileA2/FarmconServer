'use strict';

const Joi = require('joi');

const createProductSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().max(2000),
  price: Joi.number().min(0).required(),
  quantity: Joi.number().integer().min(0).required(),
  category: Joi.string().min(2).max(100).required(),
  location: Joi.string().max(255),
});

const updateProductSchema = Joi.object({
  title: Joi.string().min(3).max(255),
  description: Joi.string().max(2000),
  price: Joi.number().min(0),
  quantity: Joi.number().integer().min(0),
  category: Joi.string().min(2).max(100),
  location: Joi.string().max(255),
}).or('title', 'description', 'price', 'quantity', 'category', 'location');

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'out_of_stock', 'deleted').required(),
});

const listProductsQuerySchema = Joi.object({
  category: Joi.string(),
  location: Joi.string(),
  min_price: Joi.number().min(0),
  max_price: Joi.number().min(0),
});

const uuidParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  updateStatusSchema,
  listProductsQuerySchema,
  uuidParamSchema,
};
