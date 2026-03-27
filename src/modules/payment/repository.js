'use strict';

const { query } = require('../../config/db');

async function createPayment({ order_id, buyer_id, payment_method, amount, transaction_ref }) {
  const result = await query(
    'INSERT INTO payments (order_id, buyer_id, payment_method, amount, transaction_ref) ' +
    'VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [order_id, buyer_id, payment_method, amount, transaction_ref]
  );
  return result.rows[0];
}

async function findById(payment_id) {
  const result = await query(
    'SELECT * FROM payments WHERE payment_id = $1',
    [payment_id]
  );
  return result.rows[0] || null;
}

async function findByOrder(order_id) {
  const result = await query(
    'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC',
    [order_id]
  );
  return result.rows;
}

async function findByBuyer(buyer_id) {
  const result = await query(
    'SELECT p.*, o.status AS order_status ' +
    'FROM payments p ' +
    'JOIN orders o ON o.order_id = p.order_id ' +
    'WHERE p.buyer_id = $1 ORDER BY p.created_at DESC',
    [buyer_id]
  );
  return result.rows;
}

async function findByTransactionRef(transaction_ref) {
  const result = await query(
    'SELECT * FROM payments WHERE transaction_ref = $1',
    [transaction_ref]
  );
  return result.rows[0] || null;
}

async function updatePaymentStatus(payment_id, payment_status, gateway_ref) {
  const result = await query(
    'UPDATE payments SET payment_status = $2, gateway_ref = $3, updated_at = NOW() ' +
    'WHERE payment_id = $1 RETURNING *',
    [payment_id, payment_status, gateway_ref || null]
  );
  return result.rows[0];
}

async function findAll(filters = {}) {
  const conditions = [];
  const values = [];

  if (filters.payment_status) {
    values.push(filters.payment_status);
    conditions.push('payment_status = $' + values.length);
  }

  if (filters.payment_method) {
    values.push(filters.payment_method);
    conditions.push('payment_method = $' + values.length);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const sql = 'SELECT * FROM payments ' + where + ' ORDER BY created_at DESC';
  const result = await query(sql, values);
  return result.rows;
}

module.exports = {
  createPayment,
  findById,
  findByOrder,
  findByBuyer,
  findByTransactionRef,
  updatePaymentStatus,
  findAll,
};
