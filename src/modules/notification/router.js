'use strict';

const router = require('express').Router();
const authenticate = require('../../middlewares/authenticate');
const AppError = require('../../Utils/AppError');
const { uuidParamSchema } = require('./validation');
const { getMyNotifications, markAsRead, markAllAsRead, deleteNotification } = require('./controller');

const validateUuidParam = (req, res, next) => {
  const { error } = uuidParamSchema.validate(req.params);
  if (error) return next(new AppError(error.details.map(d => d.message).join(', '), 400));
  next();
};

router.use(authenticate);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', validateUuidParam, markAsRead);
router.delete('/:id', validateUuidParam, deleteNotification);

module.exports = router;
