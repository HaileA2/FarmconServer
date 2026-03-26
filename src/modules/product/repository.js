'use strict';

const { query } = require('../../config/db');

async function insertProduct({ farmer_id, title, description, price, quantity, category, location }) {
  const result = await query(
    `INSERT INTO products (farmer_id, title, description, price, quantity, category, location)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [farmer_id, title, description, price, quantity, category, location]
  );
  return result.rows[0];
}

async function findByFarmer(farmer_id) {
  const result = await query(
    'SELECT * FROM products WHERE farmer_id = $1 ORDER BY created_at DESC',
    [farmer_id]
  );
  return result.rows;
}

async function findActive(filters = {}) {
  const conditions = ["status = 'active'"];
  const values = [];

  if (filters.category) {
    values.push(filters.category);
    conditions.push(`LOWER(category) = LOWER($${values.length})`);
  }

  if (filters.location) {
    values.push(`%${filters.location}%`);
    conditions.push(`LOWER(location) LIKE LOWER($${values.length})`);
  }

  if (filters.min_price !== undefined) {
    values.push(filters.min_price);
    conditions.push(`price >= $${values.length}`);
  }

  if (filters.max_price !== undefined) {
    values.push(filters.max_price);
    conditions.push(`price <= $${values.length}`);
  }

  const sql = `SELECT * FROM products WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`;
  const result = await query(sql, values);
  return result.rows;
}

async function findById(id) {
  const result = await query(
    'SELECT * FROM products WHERE product_id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function updateProduct(id, fields) {
  const setClauses = Object.entries(fields).map(([key], i) => `${key} = $${i + 1}`);
  const values = Object.values(fields);
  setClauses.push('updated_at = NOW()');
  const sql = `UPDATE products SET ${setClauses.join(', ')} WHERE product_id = $${values.length + 1} RETURNING *`;
  const result = await query(sql, [...values, id]);
  return result.rows[0];
}

async function softDelete(id) {
  await query(
    "UPDATE products SET status = 'deleted', updated_at = NOW() WHERE product_id = $1",
    [id]
  );
}

async function updateStatus(id, status) {
  const result = await query(
    'UPDATE products SET status = $2, updated_at = NOW() WHERE product_id = $1 RETURNING *',
    [id, status]
  );
  return result.rows[0];
}

module.exports = {
  insertProduct,
  findByFarmer,
  findActive,
  findById,
  updateProduct,
  softDelete,
  updateStatus,
};
