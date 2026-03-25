'use strict';

const redis = require('../config/redis');
const logger = require('./logger');

/**
 * Get a cached value by key. Returns null on miss or error.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
async function get(key) {
  try {
    const raw = await redis.get(key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch (err) {
    logger.warn({ err: err.message, key }, 'Cache get error');
    return null;
  }
}

/**
 * Set a cached value with a TTL in seconds.
 * @param {string} key
 * @param {any} value
 * @param {number} ttlSeconds
 * @returns {Promise<void>}
 */
async function set(key, value, ttlSeconds) {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn({ err: err.message, key }, 'Cache set error');
  }
}

/**
 * Delete a cached key.
 * @param {string} key
 * @returns {Promise<void>}
 */
async function del(key) {
  try {
    await redis.del(key);
  } catch (err) {
    logger.warn({ err: err.message, key }, 'Cache del error');
  }
}

/**
 * Delete all keys matching a glob pattern.
 * @param {string} pattern
 * @returns {Promise<void>}
 */
async function delByPattern(pattern) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    logger.warn({ err: err.message, pattern }, 'Cache delByPattern error');
  }
}

module.exports = { get, set, del, delByPattern };
