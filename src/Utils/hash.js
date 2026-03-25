'use strict';

const bcrypt = require('bcrypt');
const config = require('../config/env');

/**
 * Hash a plaintext password using bcrypt.
 * @param {string} plain
 * @returns {Promise<string>}
 */
async function hashPassword(plain) {
  return bcrypt.hash(plain, config.bcrypt.rounds);
}

/**
 * Compare a plaintext password against a bcrypt hash.
 * @param {string} plain
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, comparePassword };
