'use strict';

const { query } = require('../../config/db');

async function findById(user_id) {
  const result = await query(
    'SELECT * FROM users WHERE user_id = $1',
    [user_id]
  );
  return result.rows[0] || null;
}

async function findByPhone(phone, excludeUserId) {
  const result = await query(
    'SELECT user_id FROM users WHERE phone = $1 AND user_id != $2',
    [phone, excludeUserId]
  );
  return result.rows[0] || null;
}

async function updateUser(user_id, fields) {
  const setClauses = Object.entries(fields).map(([key], i) => `${key} = $${i + 1}`);
  const values = Object.values(fields);
  setClauses.push('updated_at = NOW()');
  const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE user_id = $${values.length + 1} RETURNING *`;
  const result = await query(sql, [...values, user_id]);
  return result.rows[0];
}

async function setInactive(user_id) {
  await query(
    'UPDATE users SET is_active = false, updated_at = NOW() WHERE user_id = $1',
    [user_id]
  );
}

async function findAll(filters = {}) {
  const conditions = [];
  const values = [];

  if (filters.role) {
    values.push(filters.role);
    conditions.push(`role = $${values.length}`);
  }

  if (filters.is_active !== undefined && filters.is_active !== null && filters.is_active !== '') {
    values.push(filters.is_active === 'true');
    conditions.push(`is_active = $${values.length}`);
  }

  const whereClause = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT * FROM users${whereClause} ORDER BY created_at DESC`;
  const result = await query(sql, values);
  return result.rows;
}

module.exports = {
  findById,
  findByPhone,
  updateUser,
  setInactive,
  findAll,
};
