'use strict';

const orderService = require('./service');

const placeOrder = async (req, res, next) => {
  try {
    const order = await orderService.placeOrder(req.user.user_id, req.body);
    res.status(201).json(order);
  } catch (e) {
    next(e);
  }
};

const getMyOrdersAsBuyer = async (req, res, next) => {
  try {
    const orders = await orderService.getMyOrdersAsBuyer(req.user.user_id);
    res.status(200).json(orders);
  } catch (e) {
    next(e);
  }
};

const getMyOrdersAsFarmer = async (req, res, next) => {
  try {
    const orders = await orderService.getMyOrdersAsFarmer(req.user.user_id);
    res.status(200).json(orders);
  } catch (e) {
    next(e);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user);
    res.status(200).json(order);
  } catch (e) {
    next(e);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus(req.params.id, req.body.status, req.user.user_id);
    res.status(200).json(order);
  } catch (e) {
    next(e);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder(req.params.id, req.user.user_id);
    res.status(200).json(order);
  } catch (e) {
    next(e);
  }
};

const listAllOrders = async (req, res, next) => {
  try {
    const orders = await orderService.listAllOrders(req.query);
    res.status(200).json(orders);
  } catch (e) {
    next(e);
  }
};

module.exports = {
  placeOrder,
  getMyOrdersAsBuyer,
  getMyOrdersAsFarmer,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  listAllOrders,
};
