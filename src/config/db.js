'use strict';

const { Pool } = require('pg');
const config = require('./env');
const logger = require('../Utils/logger');

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  max: config.db.poolMax,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected PostgreSQL pool error');
});

/**
 * Execute a parameterized query with slow-query logging.
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(sql, params) {
  const start = Date.now();
  const result = await pool.query(sql, params);
  const duration = Date.now() - start;
  if (duration > 500) {
    logger.warn({ duration, sql: sql.substring(0, 100) }, 'Slow query detected');
  }
  return result;
}
module.exports = { pool, query };
