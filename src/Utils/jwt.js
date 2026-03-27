'use strict';
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');

/**
 * Sign an access token with the given payload.
 * @param {object} payload - { user_id, role, is_verified }
 * @returns {string}
 */
function signAccessToken(payload) {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
  });
}

/**
 * Sign a refresh token with the given payload.
 * @param {object} payload - { user_id }
 * @returns {string}
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });
}

/**
 * Verify a token against the given secret.
 * @param {string} token
 * @param {string} secret
 * @returns {object} decoded payload
 * @throws {Error} if invalid or expired
 */
function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}

/**
 * SHA-256 hex hash of a token string.
 * @param {string} token
 * @returns {string}
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { signAccessToken, signRefreshToken, verifyToken, hashToken };
