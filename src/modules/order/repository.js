'use strict';

const { query } = require('../../config/db');

async function createOrder({ buyer_id, product_id, quantity, total_amount }) {
  const result = await query(
    `INSERT INTO orders (buyer_id, product_id, quantity, total_amount)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [buyer_id, product_id, quantity, total_amount]
  );
  return result.rows[0];
}

async function findById(order_id) {
  const result = await query(
    `SELECT o.*, p.title AS product_title, p.farmer_id
     FROM orders o
     JOIN products p ON p.product_id = o.product_id
     WHERE o.order_id = $1`,
    [order_id]
  );
  return result.rows[0] || null;
}

async function findByBuyer(buyer_id) {
  const result = await query(
    `SELECT o.*, p.title AS product_title
     FROM orders o
     JOIN products p ON p.product_id = o.product_id
     WHERE o.buyer_id = $1
     ORDER BY o.created_at DESC`,
    [buyer_id]
  );
  return result.rows;
}

async function findByFarmer(farmer_id) {
  const result = await query(
    `SELECT o.*, p.title AS product_title
     FROM orders o
     JOIN products p ON p.product_id = o.product_id
     WHERE p.farmer_id = $1
     ORDER BY o.created_at DESC`,
    [farmer_id]
  );
  return result.rows;
}

async function findAll(filters = {}) {
  const conditions = [];
  const values = [];

  if (filters.status) {
    values.push(filters.status);
    conditions.push('o.status = $' + values.length);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const sql = 'SELECT o.*, p.title AS product_title ' +
              'FROM orders o ' +
              'JOIN products p ON p.product_id = o.product_id ' +
              where + ' ' +
              'ORDER BY o.created_at DESC';
  const result = await query(sql, values);
  return result.rows;
}

async function updateStatus(order_id, status) {
  const result = await query(
    'UPDATE orders SET status = $2, updated_at = NOW() WHERE order_id = $1 RETURNING *',
    [order_id, status]
  );
  return result.rows[0];
}

async function decrementProductQuantity(product_id, quantity) {
  await query(
    'UPDATE products SET quantity = quantity - $2, updated_at = NOW() WHERE product_id = $1',
    [product_id, quantity]
  );
}

module.exports = {
  createOrder,
  findById,
  findByBuyer,
  findByFarmer,
  findAll,
  updateStatus,
  decrementProductQuantity,
};
