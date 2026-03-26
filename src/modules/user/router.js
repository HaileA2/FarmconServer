'use strict';

const router = require('express').Router();
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const AppError = require('../../Utils/AppError');
const { updateProfileSchema, changePasswordSchema, adminUpdateSchema, uuidParamSchema } = require('./validation');
const { getMe, updateMe, changePassword, deleteMe, listUsers, getUserById, adminUpdateUser } = require('./controller');

const validateUuidParam = (req, res, next) => {
  const { error } = uuidParamSchema.validate(req.params);
  if (error) return next(new AppError(error.details.map(d => d.message).join(', '), 400));
  next();
};

router.use(authenticate);

// Self-service routes — must come before /:id
router.get('/me', getMe);
router.patch('/me', validate(updateProfileSchema), updateMe);
router.patch('/me/password', validate(changePasswordSchema), changePassword);
router.delete('/me', deleteMe);

// Admin routes
router.get('/', authorize('admin'), listUsers);
router.get('/:id', authorize('admin'), validateUuidParam, getUserById);
router.patch('/:id', authorize('admin'), validateUuidParam, validate(adminUpdateSchema), adminUpdateUser);

module.exports = router;
