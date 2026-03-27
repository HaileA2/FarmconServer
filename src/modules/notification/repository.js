'use strict';

const { query } = require('../../config/db');

async function findByUser(user_id) {
  const result = await query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
    [user_id]
  );
  return result.rows;
}

async function findById(notification_id) {
  const result = await query(
    'SELECT * FROM notifications WHERE notification_id = $1',
    [notification_id]
  );
  return result.rows[0] || null;
}

async function markRead(notification_id) {
  const result = await query(
    'UPDATE notifications SET is_read = true WHERE notification_id = $1 RETURNING *',
    [notification_id]
  );
  return result.rows[0];
}

async function markAllRead(user_id) {
  await query(
    'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
    [user_id]
  );
}

async function deleteOne(notification_id) {
  await query(
    'DELETE FROM notifications WHERE notification_id = $1',
    [notification_id]
  );
}

async function create(user_id, type, message) {
  const result = await query(
    'INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3) RETURNING *',
    [user_id, type, message]
  );
  return result.rows[0];
}

module.exports = { findByUser, findById, markRead, markAllRead, deleteOne, create };
