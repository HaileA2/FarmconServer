'use strict';

const paymentService = require('./service');

const initiatePayment = async (req, res, next) => {
  try {
    const result = await paymentService.initiatePayment(req.user.user_id, req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

const telebirrWebhook = async (req, res, next) => {
  try {
    await paymentService.handleTelebirrWebhook(req.body);
    res.status(200).json({ message: 'ok' });
  } catch (e) {
    next(e);
  }
};

const chapaWebhook = async (req, res, next) => {
  try {
    await paymentService.handleChapaWebhook(req.body);
    res.status(200).json({ message: 'ok' });
  } catch (e) {
    next(e);
  }
};

const simulateSuccess = async (req, res, next) => {
  try {
    const { ref } = req.query;
    const payment = await paymentService.simulateSuccess(ref);
    res.status(200).json({ message: 'Payment simulated as successful', payment });
  } catch (e) {
    next(e);
  }
};

const getMyPayments = async (req, res, next) => {
  try {
    const payments = await paymentService.getMyPayments(req.user.user_id);
    res.status(200).json(payments);
  } catch (e) {
    next(e);
  }
};

const getPaymentById = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id, req.user);
    res.status(200).json(payment);
  } catch (e) {
    next(e);
  }
};

const getPaymentsByOrder = async (req, res, next) => {
  try {
    const payments = await paymentService.getPaymentsByOrder(req.params.id, req.user);
    res.status(200).json(payments);
  } catch (e) {
    next(e);
  }
};

const listAllPayments = async (req, res, next) => {
  try {
    const payments = await paymentService.listAllPayments(req.query);
    res.status(200).json(payments);
  } catch (e) {
    next(e);
  }
};

module.exports = {
  initiatePayment,
  telebirrWebhook,
  chapaWebhook,
  simulateSuccess,
  getMyPayments,
  getPaymentById,
  getPaymentsByOrder,
  listAllPayments,
};
