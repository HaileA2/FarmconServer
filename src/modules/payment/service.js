'use strict';

const repo = require('./repository');
const orderRepo = require('../order/repository');
const notificationService = require('../notification/service');
const telebirr = require('./gateways/telebirr');
const chapa = require('./gateways/chapa');
const AppError = require('../../Utils/AppError');

async function initiatePayment(buyer_id, { order_id, payment_method }) {
  // Validate order belongs to buyer and is in a payable state
  const order = await orderRepo.findById(order_id);
  if (!order) throw new AppError('Order not found', 404);
  if (order.buyer_id !== buyer_id) throw new AppError('Forbidden', 403);

  const payable = ['Pending', 'Confirmed'];
  if (!payable.includes(order.status)) {
    throw new AppError(`Order with status "${order.status}" cannot be paid`, 400);
  }

  // Prevent duplicate pending payment
  const existing = await repo.findByOrder(order_id);
  const hasPending = existing.some(p => p.payment_status === 'pending');
  if (hasPending) throw new AppError('A pending payment already exists for this order', 409);

  let transaction_ref, checkout_url;

  if (payment_method === 'telebirr') {
    ({ transaction_ref, checkout_url } = await telebirr.initiatePayment({
      amount: parseFloat(order.total_amount),
      order_id,
      buyer_phone: null, // can be fetched from user profile if needed
    }));
  } else {
    ({ transaction_ref, checkout_url } = await chapa.initiatePayment({
      amount: parseFloat(order.total_amount),
      order_id,
      buyer_email: null,
      buyer_name: null,
    }));
  }

  const payment = await repo.createPayment({
    order_id,
    buyer_id,
    payment_method,
    amount: parseFloat(order.total_amount),
    transaction_ref,
  });

  return { payment, checkout_url };
}

async function handleTelebirrWebhook(payload) {
  const { success, gateway_ref } = telebirr.verifyCallback(payload);
  const transaction_ref = payload.transaction_ref || payload.out_trade_no;

  const payment = await repo.findByTransactionRef(transaction_ref);
  if (!payment) return; // unknown transaction, ignore

  const new_status = success ? 'success' : 'failed';
  const updated = await repo.updatePaymentStatus(payment.payment_id, new_status, gateway_ref);

  if (success) {
    await _onPaymentSuccess(payment);
  }

  return updated;
}

async function handleChapaWebhook(payload) {
  const transaction_ref = payload['trx_ref'] || payload.tx_ref;
  const payment = await repo.findByTransactionRef(transaction_ref);
  if (!payment) return;

  // Verify with Chapa API
  const { success, gateway_ref } = await chapa.verifyTransaction(transaction_ref);
  const new_status = success ? 'success' : 'failed';
  const updated = await repo.updatePaymentStatus(payment.payment_id, new_status, gateway_ref);

  if (success) {
    await _onPaymentSuccess(payment);
  }

  return updated;
}

// Simulate payment success — used in sandbox/testing
async function simulateSuccess(transaction_ref) {
  const payment = await repo.findByTransactionRef(transaction_ref);
  if (!payment) throw new AppError('Payment not found', 404);
  if (payment.payment_status !== 'pending') {
    throw new AppError('Payment already processed', 400);
  }

  const updated = await repo.updatePaymentStatus(payment.payment_id, 'success', 'SIMULATED-' + transaction_ref);
  await _onPaymentSuccess(payment);
  return updated;
}

async function _onPaymentSuccess(payment) {
  // Update order status to Confirmed
  await orderRepo.updateStatus(payment.order_id, 'Confirmed');

  // Notify buyer
  notificationService.send(
    payment.buyer_id,
    'payment_success',
    `Payment of ETB ${payment.amount} confirmed. Your order is now being processed.`
  ).catch(() => {});
}

async function getMyPayments(buyer_id) {
  return repo.findByBuyer(buyer_id);
}

async function getPaymentById(payment_id, user) {
  const payment = await repo.findById(payment_id);
  if (!payment) throw new AppError('Payment not found', 404);
  if (user.role !== 'admin' && payment.buyer_id !== user.user_id) {
    throw new AppError('Forbidden', 403);
  }
  return payment;
}

async function getPaymentsByOrder(order_id, user) {
  const order = await orderRepo.findById(order_id);
  if (!order) throw new AppError('Order not found', 404);
  if (user.role !== 'admin' && order.buyer_id !== user.user_id && order.farmer_id !== user.user_id) {
    throw new AppError('Forbidden', 403);
  }
  return repo.findByOrder(order_id);
}

async function listAllPayments(filters) {
  return repo.findAll(filters);
}

module.exports = {
  initiatePayment,
  handleTelebirrWebhook,
  handleChapaWebhook,
  simulateSuccess,
  getMyPayments,
  getPaymentById,
  getPaymentsByOrder,
  listAllPayments,
};
