'use strict';

const repo = require('./repository');
const { hashPassword, comparePassword } = require('../../Utils/hash');
const AppError = require('../../Utils/AppError');

function stripPassword(user) {
  const { password_hash, ...profile } = user;
  return profile;
}

async function getProfile(user_id) {
  const user = await repo.findById(user_id);
  if (!user) throw new AppError('User not found', 404);
  return stripPassword(user);
}

async function updateProfile(user_id, fields) {
  const { name, phone, location, fcm_token } = fields;
  const allowedFields = {};
  if (name !== undefined) allowedFields.name = name;
  if (phone !== undefined) allowedFields.phone = phone;
  if (location !== undefined) allowedFields.location = location;
  if (fcm_token !== undefined) allowedFields.fcm_token = fcm_token;

  if (allowedFields.phone !== undefined) {
    const existing = await repo.findByPhone(allowedFields.phone, user_id);
    if (existing) throw new AppError('Phone number already in use', 409);
  }

  const updated = await repo.updateUser(user_id, allowedFields);
  return stripPassword(updated);
}

async function changePassword(user_id, current_password, new_password) {
  const user = await repo.findById(user_id);
  if (!user) throw new AppError('User not found', 404);

  const valid = await comparePassword(current_password, user.password_hash);
  if (!valid) throw new AppError('Current password is incorrect', 401);

  const password_hash = await hashPassword(new_password);
  await repo.updateUser(user_id, { password_hash });

  return { message: 'Password updated successfully' };
}

async function deactivateAccount(user_id) {
  const user = await repo.findById(user_id);
  if (!user) throw new AppError('User not found', 404);
  if (user.is_active === false) throw new AppError('Account is already deactivated', 400);

  await repo.setInactive(user_id);
  return { message: 'Account deactivated successfully' };
}

async function listUsers(filters) {
  const users = await repo.findAll(filters);
  return users.map(stripPassword);
}

async function getUserById(id) {
  const user = await repo.findById(id);
  if (!user) throw new AppError('User not found', 404);
  return stripPassword(user);
}

async function adminUpdateUser(id, fields) {
  const user = await repo.findById(id);
  if (!user) throw new AppError('User not found', 404);

  const { role, is_active } = fields;
  const allowedFields = {};
  if (role !== undefined) allowedFields.role = role;
  if (is_active !== undefined) allowedFields.is_active = is_active;

  const updated = await repo.updateUser(id, allowedFields);
  return stripPassword(updated);
}

module.exports = { getProfile, updateProfile, changePassword, deactivateAccount, listUsers, getUserById, adminUpdateUser };
