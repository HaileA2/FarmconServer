'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Attach a UUID v4 as req.id and set X-Request-Id response header.
 */
function requestId(req, res, next) {
  req.id = uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
}

module.exports = requestId;
