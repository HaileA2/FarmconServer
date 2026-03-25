'use strict';

const Redis = require('ioredis');
const config = require('./env');
const logger = require('../Utils/logger');

const redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
  lazyConnect: true,
};

if (config.redis.password) {
  redisConfig.password = config.redis.password;
}

const client = new Redis(redisConfig);

client.on('connect', () => {
  logger.info('Redis connected');
});

client.on('error', (err) => {
  logger.error({ err: err.message }, 'Redis connection error');
});

client.on('close', () => {
  logger.warn('Redis connection closed');
});

module.exports = client;
