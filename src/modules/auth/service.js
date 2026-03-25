'use strict';

const repo = require('./repository');
const { hashPassword, comparePassword } = require('../../Utils/hash');
const { signAccessToken, signRefreshToken, hashToken } = require('../../Utils/jwt');
const { generateOtp } = require('../../Utils/otp');
const AppError = require('../../Utils/AppError');
const logger = require('../../Utils/logger');

async function register({ name, email, phone, password, role }) {
  const existing = await repo.findByEmailOrPhone(email, phone);
  if (existing) {
    throw new AppError('Email or phone already in use', 409);
  }

  const password_hash = await hashPassword(password);
  const { user_id, role: userRole } = await repo.createUser({ name, email, phone, password_hash, role });

  const otp = generateOtp();
  const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await repo.createOtp(user_id, otp, expires_at);

  logger.info({ user_id, otp }, 'OTP generated');

  return {
    user_id,
    role: userRole,
    message: 'Registration successful. OTP sent for verification.',
  };
}

async function login({ email, password }) {
  const user = await repo.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    throw new AppError('Invalid credentials', 401);
  }

  const accessToken = signAccessToken({
    user_id: user.user_id,
    role: user.role,
    is_verified: user.is_verified,
  });

  const refreshToken = signRefreshToken({ user_id: user.user_id });

  const tokenHash = hashToken(refreshToken);
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await repo.storeRefreshToken(user.user_id, tokenHash, expires_at);

  return { accessToken, refreshToken };
}

async function refreshToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  const row = await repo.findRefreshToken(tokenHash);
  if (!row) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const accessToken = signAccessToken({
    user_id: row.user_id,
    role: row.role,
    is_verified: row.is_verified,
  });

  return { accessToken };
}

async function logout(rawToken) {
  const tokenHash = hashToken(rawToken);
  await repo.deleteRefreshToken(tokenHash);
  return { message: 'Logged out successfully' };
}

async function verifyOtp({ user_id, otp }) {
  const otpRecord = await repo.findLatestOtp(user_id);
  if (!otpRecord) {
    throw new AppError('No OTP found', 404);
  }

  if (new Date(otpRecord.expires_at) < new Date()) {
    throw new AppError('OTP has expired', 410);
  }

  if (otpRecord.otp_code !== otp) {
    throw new AppError('Invalid OTP', 400);
  }

  await repo.markOtpUsed(otpRecord.id);
  await repo.setVerified(user_id);

  return { message: 'Account verified successfully' };
}

async function resendOtp({ user_id }) {
  const user = await repo.findById(user_id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.is_verified) {
    throw new AppError('Account already verified', 400);
  }

  await repo.invalidatePreviousOtps(user_id);

  const otp = generateOtp();
  const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await repo.createOtp(user_id, otp, expires_at);

  logger.info({ user_id, otp }, 'OTP resent');

  return { message: 'OTP resent successfully' };
}

module.exports = { register, login, refreshToken, logout, verifyOtp, resendOtp };
