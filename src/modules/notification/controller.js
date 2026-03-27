'use strict';

const notificationService = require('./service');

const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getMyNotifications(req.user.user_id);
    res.status(200).json(notifications);
  } catch (e) {
    next(e);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.user_id);
    res.status(200).json(notification);
  } catch (e) {
    next(e);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.user_id);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const result = await notificationService.deleteNotification(req.params.id, req.user.user_id);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead, deleteNotification };
