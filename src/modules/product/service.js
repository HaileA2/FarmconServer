'use strict';

const repo = require('./repository');
const AppError = require('../../Utils/AppError');

async function createProduct(farmer_id, body) {
  const { title, description, price, quantity, category, location } = body;
  const allowedFields = {};
  if (title !== undefined) allowedFields.title = title;
  if (description !== undefined) allowedFields.description = description;
  if (price !== undefined) allowedFields.price = price;
  if (quantity !== undefined) allowedFields.quantity = quantity;
  if (category !== undefined) allowedFields.category = category;
  if (location !== undefined) allowedFields.location = location;

  const product = await repo.insertProduct({ farmer_id, ...allowedFields });
  return product;
}

async function getMyProducts(farmer_id) {
  const products = await repo.findByFarmer(farmer_id);
  return products;
}

async function listProducts(filters) {
  const products = await repo.findActive(filters);
  return products;
}

async function getProductById(id) {
  const product = await repo.findById(id);
  if (!product || product.status === 'deleted') throw new AppError('Product not found', 404);
  return product;
}

async function updateProduct(id, farmer_id, body) {
  const product = await repo.findById(id);
  if (!product) throw new AppError('Product not found', 404);
  if (product.farmer_id !== farmer_id) throw new AppError('Forbidden', 403);
  if (product.status === 'deleted') throw new AppError('Cannot update a deleted product', 400);

  const { title, description, price, quantity, category, location } = body;
  const allowedFields = {};
  if (title !== undefined) allowedFields.title = title;
  if (description !== undefined) allowedFields.description = description;
  if (price !== undefined) allowedFields.price = price;
  if (quantity !== undefined) allowedFields.quantity = quantity;
  if (category !== undefined) allowedFields.category = category;
  if (location !== undefined) allowedFields.location = location;

  const updated = await repo.updateProduct(id, allowedFields);
  return updated;
}

async function deleteProduct(id, farmer_id) {
  const product = await repo.findById(id);
  if (!product) throw new AppError('Product not found', 404);
  if (product.farmer_id !== farmer_id) throw new AppError('Forbidden', 403);
  if (product.status === 'deleted') throw new AppError('Product is already deleted', 400);

  await repo.softDelete(id);
  return { message: 'Product deleted successfully' };
}

async function updateProductStatus(id, status) {
  const product = await repo.findById(id);
  if (!product) throw new AppError('Product not found', 404);

  const updated = await repo.updateStatus(id, status);
  return updated;
}

module.exports = { createProduct, getMyProducts, listProducts, getProductById, updateProduct, deleteProduct, updateProductStatus };
