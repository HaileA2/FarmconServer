'use strict';

require('dotenv').config();

const app = require('./app');
const config = require('./config/env');
const logger = require('./Utils/logger');

const PORT = config.server.port;

const server = app.listen(PORT, () => {
  logger.info({ port: PORT, env: config.server.nodeEnv }, 'FarmConnect server started');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason: String(reason) }, 'Unhandled Promise Rejection');
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  logger.error({ err: err.message, stack: err.stack }, 'Uncaught Exception');
  server.close(() => {
    process.exit(1);
  });
});

module.exports = server;
