'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');


const requestId = require('./middlewares/requestId');
const errorHandler = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');
const config = require('./config/env');

const authRouter = require('./modules/auth/router');
const userRouter = require('./modules/user/router');
const productRouter = require('./modules/product/router');
const notificationRouter = require('./modules/notification/router');
const orderRouter = require('./modules/order/router');

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // API-only, no HTML
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: config.app.corsOrigin,
  credentials: true,
}));

// Request ID (must be early)
app.use(requestId);

// Body parsing
app.use(express.json());
app.use(cookieParser());

// Global rate limiter for /api
app.use('/api', apiLimiter);

// Module routers
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/products', productRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/orders', orderRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Central error handler (must be last)
app.use(errorHandler);

module.exports = app;
