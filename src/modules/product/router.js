'use strict';

const router = require('express').Router();
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const AppError = require('../../Utils/AppError');
const {
  createProductSchema, updateProductSchema, updateStatusSchema,
  listProductsQuerySchema, uuidParamSchema,
} = require('./validation');
const {
  createProduct, getMyProducts, listProducts, getProductById,
  updateProduct, deleteProduct, updateProductStatus,
} = require('./controller');

const validateUuidParam = (req, res, next) => {
  const { error } = uuidParamSchema.validate(req.params);
  if (error) return next(new AppError(error.details.map(d => d.message).join(', '), 400));
  next();
};

const validateQuery = (req, res, next) => {
  const { error, value } = listProductsQuerySchema.validate(req.query, { abortEarly: false });
  if (error) return next(new AppError(error.details.map(d => d.message).join(', '), 400));
  req.query = value;
  next();
};

router.use(authenticate);

router.post('/', authorize('farmer'), validate(createProductSchema), createProduct);
router.get('/my', authorize('farmer'), getMyProducts);
router.get('/', validateQuery, listProducts);
router.get('/:id', validateUuidParam, getProductById);
router.patch('/:id/status', authorize('admin'), validateUuidParam, validate(updateStatusSchema), updateProductStatus);
router.patch('/:id', authorize('farmer'), validateUuidParam, validate(updateProductSchema), updateProduct);
router.delete('/:id', authorize('farmer'), validateUuidParam, deleteProduct);

module.exports = router;
