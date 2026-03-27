'use strict';

const Joi = require('joi');

const assignTransporterSchema = Joi.object({
  order_id: Joi.string().uuid().required(),
  transporter_id: Joi.string().uuid().required(),
});

const updateDeliveryStatusSchema = Joi.object({
  status: Joi.string()
    .valid('Assigned', 'PickedUp', 'InTransit', 'Delivered', 'Failed')
    .required(),
});

const uuidParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = { assignTransporterSchema, updateDeliveryStatusSchema, uuidParamSchema };
