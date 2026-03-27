'use strict';

const router = require('express').Router();
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const AppError = require('../../Utils/AppError');
const { initiatePaymentSchema, uuidParamSchema } = require('./validation');
const {
  initiatePayment,
  telebirrWebhook,
  chapaWebhook,
  simulateSuccess,
  getMyPayments,
  getPaymentById,
  getPaymentsByOrder,
  listAllPayments,
} = require('./controller');

const validateUuidParam = (req, res, next) => {
  const { error } = uuidParamSchema.validate(req.params);
  if (error) return next(new AppError(error.details.map(d => d.message).join(', '), 400));
  next();
};

// Webhook routes — no auth (called by payment gateways)
router.post('/webhook/telebirr', telebirrWebhook);
router.post('/webhook/chapa', chapaWebhook);

// Sandbox simulation — no auth (dev/test only)
router.get('/simulate/telebirr', simulateSuccess);
router.get('/simulate/chapa', simulateSuccess);

// All routes below require authentication
router.use(authenticate);

// Buyer: initiate payment
router.post('/', authorize('buyer'), validate(initiatePaymentSchema), initiatePayment);

// Buyer: own payment history
router.get('/my', authorize('buyer'), getMyPayments);

// Admin: list all payments (?payment_status=&payment_method=)
router.get('/', authorize('admin'), listAllPayments);

// Shared: payments for a specific order (buyer/farmer/admin)
router.get('/order/:id', validateUuidParam, getPaymentsByOrder);

// Shared: get single payment (buyer/admin)
router.get('/:id', validateUuidParam, getPaymentById);

module.exports = router;
