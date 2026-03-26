'use strict';

const productService = require('./service');

const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.user.user_id, req.body);
    res.status(201).json(product);
  } catch (e) {
    next(e);
  }
};

const getMyProducts = async (req, res, next) => {
  try {
    const products = await productService.getMyProducts(req.user.user_id);
    res.status(200).json(products);
  } catch (e) {
    next(e);
  }
};

const listProducts = async (req, res, next) => {
  try {
    const products = await productService.listProducts(req.query);
    res.status(200).json(products);
  } catch (e) {
    next(e);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.status(200).json(product);
  } catch (e) {
    next(e);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.user.user_id, req.body);
    res.status(200).json(product);
  } catch (e) {
    next(e);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const result = await productService.deleteProduct(req.params.id, req.user.user_id);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

const updateProductStatus = async (req, res, next) => {
  try {
    const product = await productService.updateProductStatus(req.params.id, req.body.status);
    res.status(200).json(product);
  } catch (e) {
    next(e);
  }
};

module.exports = { createProduct, getMyProducts, listProducts, getProductById, updateProduct, deleteProduct, updateProductStatus };
