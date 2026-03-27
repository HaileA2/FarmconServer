'use strict';

const repo = require('./repository');
const AppError = require('../../Utils/AppError');

async function getMyNotifications(user_id) {
  return repo.findByUser(user_id);
}

async function markAsRead(notification_id, user_id) {
  const notification = await repo.findById(notification_id);
  if (!notification) throw new AppError('Notification not found', 404);
  if (notification.user_id !== user_id) throw new AppError('Forbidden', 403);
  return repo.markRead(notification_id);
}

async function markAllAsRead(user_id) {
  await repo.markAllRead(user_id);
  return { message: 'All notifications marked as read' };
}

async function deleteNotification(notification_id, user_id) {
  const notification = await repo.findById(notification_id);
  if (!notification) throw new AppError('Notification not found', 404);
  if (notification.user_id !== user_id) throw new AppError('Forbidden', 403);
  await repo.deleteOne(notification_id);
  return { message: 'Notification deleted' };
}

// Internal helper — called by other modules (orders, payments, etc.)
async function send(user_id, type, message) {
  return repo.create(user_id, type, message);
}

module.exports = { getMyNotifications, markAsRead, markAllAsRead, deleteNotification, send };
