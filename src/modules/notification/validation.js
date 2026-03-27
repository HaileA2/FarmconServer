'use strict';

const Joi = require('joi');

const uuidParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = { uuidParamSchema };
