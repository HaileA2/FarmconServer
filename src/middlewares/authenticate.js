'use strict';

const { verifyToken } = require('../Utils/jwt');
const config = require('../config/env');
const AppError = require('../Utils/AppError');

/**
 * JWT authentication middleware.
 * Reads token from Authorization: Bearer <token> header or access_token cookie.
 * Attaches req.user = { user_id, role, is_verified }.
 * Throws 401 if missing/invalid, 403 if unverified.
 */
async function authenticate(req, res, next) {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return next(new AppError('No token provided', 401));
    }

    let decoded;
    try {
      decoded = verifyToken(token, config.jwt.accessSecret);
    } catch (err) {
      return next(new AppError('Invalid or expired token', 401));
    }

    req.user = {
      user_id: decoded.user_id,
      role: decoded.role,
      is_verified: decoded.is_verified,
    };

    if (req.user.is_verified === false) {
      return next(new AppError('Account not verified. Please verify your OTP.', 403));
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticate;
