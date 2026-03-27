'use strict';

const router = require('express').Router();
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const AppError = require('../../Utils/AppError');
const { assignTransporterSchema, updateDeliveryStatusSchema, uuidParamSchema } = require('./validation');
const {
  assignTransporter,
  getMyDeliveries,
  getAssignmentById,
  updateDeliveryStatus,
  listAllAssignments,
  getAssignmentsByOrder,
} = require('./controller');

const validateUuidParam = (req, res, next) => {
  const { error } = uuidParamSchema.validate(req.params);
  if (error) return next(new AppError(error.details.map(d => d.message).join(', '), 400));
  next();
};

router.use(authenticate);

// Admin: assign transporter to an order
router.post('/', authorize('admin'), validate(assignTransporterSchema), assignTransporter);

// Admin: list all assignments (?status=&transporter_id=)
router.get('/', authorize('admin'), listAllAssignments);

// Transporter: view own deliveries
router.get('/my', authorize('transporter'), getMyDeliveries);

// Transporter: update delivery status
router.patch('/:id/status', authorize('transporter'), validateUuidParam, validate(updateDeliveryStatusSchema), updateDeliveryStatus);

// Admin: get assignments for a specific order
router.get('/order/:id', authorize('admin'), validateUuidParam, getAssignmentsByOrder);

// Shared: get single assignment (transporter/buyer/farmer/admin)
router.get('/:id', validateUuidParam, getAssignmentById);

module.exports = router;
