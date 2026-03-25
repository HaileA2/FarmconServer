'use strict';

const { query } = require('../../config/db');

async function findByEmail(email) {
  const result = await query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

async function findByEmailOrPhone(email, phone) {
  const result = await query(
    'SELECT * FROM users WHERE email = $1 OR phone = $2',
    [email, phone]
  );
  return result.rows[0] || null;
}

async function findById(user_id) {
  const result = await query(
    'SELECT * FROM users WHERE user_id = $1',
    [user_id]
  );
  return result.rows[0] || null;
}

async function createUser({ name, email, phone, password_hash, role }) {
  const result = await query(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING user_id, role`,
    [name, email, phone, password_hash, role]
  );
  return result.rows[0];
}

async function setVerified(user_id) {
  await query(
    'UPDATE users SET is_verified = true, updated_at = NOW() WHERE user_id = $1',
    [user_id]
  );
}

async function createOtp(user_id, otp_code, expires_at) {
  await query(
    'INSERT INTO otps (user_id, otp_code, expires_at) VALUES ($1, $2, $3)',
    [user_id, otp_code, expires_at]
  );
}

async function findLatestOtp(user_id) {
  const result = await query(
    `SELECT * FROM otps
     WHERE user_id = $1 AND used = false
     ORDER BY created_at DESC
     LIMIT 1`,
    [user_id]
  );
  return result.rows[0] || null;
}

async function markOtpUsed(otp_id) {
  await query(
    'UPDATE otps SET used = true WHERE id = $1',
    [otp_id]
  );
}

async function invalidatePreviousOtps(user_id) {
  await query(
    'UPDATE otps SET used = true WHERE user_id = $1 AND used = false',
    [user_id]
  );
}

async function storeRefreshToken(user_id, token_hash, expires_at) {
  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [user_id, token_hash, expires_at]
  );
}

async function findRefreshToken(token_hash) {
  const result = await query(
    `SELECT rt.*, u.role, u.is_verified
     FROM refresh_tokens rt
     JOIN users u ON u.user_id = rt.user_id
     WHERE rt.token_hash = $1 AND rt.expires_at > NOW()`,
    [token_hash]
  );
  return result.rows[0] || null;
}

async function deleteRefreshToken(token_hash) {
  await query(
    'DELETE FROM refresh_tokens WHERE token_hash = $1',
    [token_hash]
  );
}

module.exports = {
  findByEmail,
  findByEmailOrPhone,
  findById,
  createUser,
  setVerified,
  createOtp,
  findLatestOtp,
  markOtpUsed,
  invalidatePreviousOtps,
  storeRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
};
