'use strict';

const repo = require('./repository');
const productRepo = require('../product/repository');
const notificationService = require('../notification/service');
const AppError = require('../../Utils/AppError');

async function placeOrder(buyer_id, { product_id, quantity }) {
  // Validate product exists and is active
  const product = await productRepo.findById(product_id);
  if (!product || product.status !== 'active') {
    throw new AppError('Product not found or unavailable', 404);
  }

  if (product.quantity < quantity) {
    throw new AppError('Insufficient product quantity', 400);
  }

  const total_amount = parseFloat(product.price) * quantity;

  // Decrement stock and create order
  await repo.decrementProductQuantity(product_id, quantity);
  const order = await repo.createOrder({ buyer_id, product_id, quantity, total_amount });

  // Notify farmer
  notificationService.send(
    product.farmer_id,
    'order_placed',
    `New order for "${product.title}" — qty: ${quantity}`
  ).catch(() => {}); // fire-and-forget, don't fail the request

  return order;
}

async function getMyOrdersAsBuyer(buyer_id) {
  return repo.findByBuyer(buyer_id);
}

async function getMyOrdersAsFarmer(farmer_id) {
  return repo.findByFarmer(farmer_id);
}

async function getOrderById(order_id, user) {
  const order = await repo.findById(order_id);
  if (!order) throw new AppError('Order not found', 404);

  // Buyer can see their own orders; farmer can see orders on their products; admin sees all
  if (
    user.role !== 'admin' &&
    order.buyer_id !== user.user_id &&
    order.farmer_id !== user.user_id
  ) {
    throw new AppError('Forbidden', 403);
  }

  return order;
}

async function updateOrderStatus(order_id, status, admin_user_id) {
  const order = await repo.findById(order_id);
  if (!order) throw new AppError('Order not found', 404);

  const updated = await repo.updateStatus(order_id, status);

  // Notify buyer of status change
  notificationService.send(
    order.buyer_id,
    'order_status_updated',
    `Your order status has been updated to "${status}"`
  ).catch(() => {});

  return updated;
}

async function cancelOrder(order_id, buyer_id) {
  const order = await repo.findById(order_id);
  if (!order) throw new AppError('Order not found', 404);
  if (order.buyer_id !== buyer_id) throw new AppError('Forbidden', 403);

  const cancellable = ['Pending', 'Confirmed'];
  if (!cancellable.includes(order.status)) {
    throw new AppError(`Cannot cancel an order with status "${order.status}"`, 400);
  }

  // Restore product quantity
  await repo.decrementProductQuantity(order.product_id, -order.quantity);
  const updated = await repo.updateStatus(order_id, 'Cancelled');

  notificationService.send(
    order.buyer_id,
    'order_cancelled',
    `Your order for "${order.product_title}" has been cancelled`
  ).catch(() => {});

  return updated;
}

async function listAllOrders(filters) {
  return repo.findAll(filters);
}

module.exports = {
  placeOrder,
  getMyOrdersAsBuyer,
  getMyOrdersAsFarmer,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  listAllOrders,
};
