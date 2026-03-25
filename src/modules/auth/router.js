'use strict';

const router = require('express').Router();
const { authLimiter } = require('../../middlewares/rateLimiter');
const validate = require('../../middlewares/validate');
const authenticate = require('../../middlewares/authenticate');
const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
} = require('./validation');
const {
  register,
  login,
  refresh,
  logout,
  verifyOtp,
  resendOtp,
} = require('./controller');

router.use(authLimiter);

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', validate(resendOtpSchema), resendOtp);

module.exports = router;
