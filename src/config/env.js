'use strict';

const required = (name) => {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
};

const optional = (name, defaultValue = '') => process.env[name] || defaultValue;

const config = {
  server: {
    port: parseInt(optional('PORT', '3000'), 10),
    nodeEnv: optional('NODE_ENV', 'development'),
  },
  db: {
    host: optional('DB_HOST', 'localhost'),
    port: parseInt(optional('DB_PORT', '5432'), 10),
    name: optional('DB_NAME', 'farmconnect'),
    user: optional('DB_USER', 'postgres'),
    password: optional('DB_PASSWORD', ''),
    poolMax: parseInt(optional('DB_POOL_MAX', '10'), 10),
  },
  redis: {
    host: optional('REDIS_HOST', 'localhost'),
    port: parseInt(optional('REDIS_PORT', '6379'), 10),
    password: optional('REDIS_PASSWORD', ''),
  },
  jwt: {
    accessSecret: optional('ACCESS_TOKEN_SECRET', 'dev_access_secret_change_in_production'),
    refreshSecret: optional('REFRESH_TOKEN_SECRET', 'dev_refresh_secret_change_in_production'),
    accessExpiry: optional('ACCESS_TOKEN_EXPIRY', '15m'),
    refreshExpiry: optional('REFRESH_TOKEN_EXPIRY', '7d'),
  },
  bcrypt: {
    rounds: parseInt(optional('BCRYPT_ROUNDS', '10'), 10),
  },
  app: {
    baseUrl: optional('APP_BASE_URL', 'http://localhost:3000'),
    corsOrigin: optional('CORS_ORIGIN', '*'),
  },
};

// Validate critical secrets in production
if (config.server.nodeEnv === 'production') {
  required('ACCESS_TOKEN_SECRET');
  required('REFRESH_TOKEN_SECRET');
  required('DB_PASSWORD');
}

module.exports = Object.freeze(config);
