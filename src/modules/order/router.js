'use strict';

const router = require('express').Router();
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const AppError = require('../../Utils/AppError');
const { createOrderSchema, updateStatusSchema, uuidParamSchema } = require('./validation');
const {
  placeOrder,
  getMyOrdersAsBuyer,
  getMyOrdersAsFarmer,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  listAllOrders,
} = require('./controller');

const validateUuidParam = (req, res, next) => {
  const { error } = uuidParamSchema.validate(req.params);
  if (error) return next(new AppError(error.details.map(d => d.message).join(', '), 400));
  next();
};

router.use(authenticate);

// Buyer routes
router.post('/', authorize('buyer'), validate(createOrderSchema), placeOrder);
router.get('/my', authorize('buyer'), getMyOrdersAsBuyer);
router.patch('/:id/cancel', authorize('buyer'), validateUuidParam, cancelOrder);

// Farmer routes
router.get('/farmer', authorize('farmer'), getMyOrdersAsFarmer);

// Admin routes
router.get('/', authorize('admin'), listAllOrders);
router.patch('/:id/status', authorize('admin'), validateUuidParam, validate(updateStatusSchema), updateOrderStatus);

// Shared — buyer, farmer, admin can view a specific order
router.get('/:id', validateUuidParam, getOrderById);

module.exports = router;
