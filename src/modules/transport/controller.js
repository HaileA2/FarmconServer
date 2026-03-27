'use strict';

const transportService = require('./service');

const assignTransporter = async (req, res, next) => {
  try {
    const assignment = await transportService.assignTransporter(req.body);
    res.status(201).json(assignment);
  } catch (e) {
    next(e);
  }
};

const getMyDeliveries = async (req, res, next) => {
  try {
    const assignments = await transportService.getMyDeliveries(req.user.user_id);
    res.status(200).json(assignments);
  } catch (e) {
    next(e);
  }
};

const getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await transportService.getAssignmentById(req.params.id, req.user);
    res.status(200).json(assignment);
  } catch (e) {
    next(e);
  }
};

const updateDeliveryStatus = async (req, res, next) => {
  try {
    const assignment = await transportService.updateDeliveryStatus(
      req.params.id,
      req.body.status,
      req.user.user_id
    );
    res.status(200).json(assignment);
  } catch (e) {
    next(e);
  }
};

const listAllAssignments = async (req, res, next) => {
  try {
    const assignments = await transportService.listAllAssignments(req.query);
    res.status(200).json(assignments);
  } catch (e) {
    next(e);
  }
};

const getAssignmentsByOrder = async (req, res, next) => {
  try {
    const assignments = await transportService.getAssignmentsByOrder(req.params.id);
    res.status(200).json(assignments);
  } catch (e) {
    next(e);
  }
};

module.exports = {
  assignTransporter,
  getMyDeliveries,
  getAssignmentById,
  updateDeliveryStatus,
  listAllAssignments,
  getAssignmentsByOrder,
};
