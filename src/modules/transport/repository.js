'use strict';

const { query } = require('../../config/db');

async function createAssignment({ order_id, transporter_id }) {
  const result = await query(
    `INSERT INTO delivery_assignments (order_id, transporter_id)
     VALUES ($1, $2)
     RETURNING *`,
    [order_id, transporter_id]
  );
  return result.rows[0];
}

async function findById(assignment_id) {
  const result = await query(
    `SELECT da.*, o.buyer_id, o.status AS order_status, p.title AS product_title, p.farmer_id
     FROM delivery_assignments da
     JOIN orders o ON o.order_id = da.order_id
     JOIN products p ON p.product_id = o.product_id
     WHERE da.assignment_id = $1`,
    [assignment_id]
  );
  return result.rows[0] || null;
}

async function findByOrder(order_id) {
  const result = await query(
    `SELECT da.*, u.name AS transporter_name
     FROM delivery_assignments da
     JOIN users u ON u.user_id = da.transporter_id
     WHERE da.order_id = $1
     ORDER BY da.created_at DESC`,
    [order_id]
  );
  return result.rows;
}

async function findByTransporter(transporter_id) {
  const result = await query(
    `SELECT da.*, o.buyer_id, p.title AS product_title, p.location AS pickup_location
     FROM delivery_assignments da
     JOIN orders o ON o.order_id = da.order_id
     JOIN products p ON p.product_id = o.product_id
     WHERE da.transporter_id = $1
     ORDER BY da.created_at DESC`,
    [transporter_id]
  );
  return result.rows;
}

async function findAll(filters = {}) {
  const conditions = [];
  const values = [];

  if (filters.status) {
    values.push(filters.status);
    conditions.push('da.status = $' + values.length);
  }

  if (filters.transporter_id) {
    values.push(filters.transporter_id);
    conditions.push('da.transporter_id = $' + values.length);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const sql = 'SELECT da.*, p.title AS product_title, u.name AS transporter_name ' +
              'FROM delivery_assignments da ' +
              'JOIN orders o ON o.order_id = da.order_id ' +
              'JOIN products p ON p.product_id = o.product_id ' +
              'JOIN users u ON u.user_id = da.transporter_id ' +
              where + ' ' +
              'ORDER BY da.created_at DESC';
  const result = await query(sql, values);
  return result.rows;
}

async function updateStatus(assignment_id, status) {
  const result = await query(
    'UPDATE delivery_assignments SET status = $2, updated_at = NOW() WHERE assignment_id = $1 RETURNING *',
    [assignment_id, status]
  );
  return result.rows[0];
}

async function findActiveByOrder(order_id) {
  const result = await query(
    `SELECT * FROM delivery_assignments
     WHERE order_id = $1 AND status NOT IN ('Delivered','Failed')
     LIMIT 1`,
    [order_id]
  );
  return result.rows[0] || null;
}

module.exports = {
  createAssignment,
  findById,
  findByOrder,
  findByTransporter,
  findAll,
  updateStatus,
  findActiveByOrder,
};
