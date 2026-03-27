'use strict';

const repo = require('./repository');
const orderRepo = require('../order/repository');
const notificationService = require('../notification/service');
const AppError = require('../../Utils/AppError');

async function assignTransporter({ order_id, transporter_id }) {
  // Validate order exists
  const order = await orderRepo.findById(order_id);
  if (!order) throw new AppError('Order not found', 404);

  // Only assign when order is Confirmed or Processing
  const assignable = ['Confirmed', 'Processing'];
  if (!assignable.includes(order.status)) {
    throw new AppError(`Cannot assign transporter to an order with status "${order.status}"`, 400);
  }

  // Prevent duplicate active assignment
  const existing = await repo.findActiveByOrder(order_id);
  if (existing) throw new AppError('Order already has an active delivery assignment', 409);

  const assignment = await repo.createAssignment({ order_id, transporter_id });

  // Notify transporter
  notificationService.send(
    transporter_id,
    'delivery_assigned',
    `You have been assigned to deliver order for "${order.product_title}"`
  ).catch(() => {});

  // Notify buyer
  notificationService.send(
    order.buyer_id,
    'delivery_assigned',
    `A transporter has been assigned to your order for "${order.product_title}"`
  ).catch(() => {});

  return assignment;
}

async function getMyDeliveries(transporter_id) {
  return repo.findByTransporter(transporter_id);
}

async function getAssignmentById(assignment_id, user) {
  const assignment = await repo.findById(assignment_id);
  if (!assignment) throw new AppError('Assignment not found', 404);

  if (
    user.role !== 'admin' &&
    assignment.transporter_id !== user.user_id &&
    assignment.buyer_id !== user.user_id &&
    assignment.farmer_id !== user.user_id
  ) {
    throw new AppError('Forbidden', 403);
  }

  return assignment;
}

async function updateDeliveryStatus(assignment_id, status, transporter_id) {
  const assignment = await repo.findById(assignment_id);
  if (!assignment) throw new AppError('Assignment not found', 404);
  if (assignment.transporter_id !== transporter_id) throw new AppError('Forbidden', 403);

  const updated = await repo.updateStatus(assignment_id, status);

  // Notify buyer on key status changes
  if (['PickedUp', 'InTransit', 'Delivered', 'Failed'].includes(status)) {
    notificationService.send(
      assignment.buyer_id,
      'delivery_status_updated',
      `Your delivery status has been updated to "${status}"`
    ).catch(() => {});
  }

  return updated;
}

async function listAllAssignments(filters) {
  return repo.findAll(filters);
}

async function getAssignmentsByOrder(order_id) {
  return repo.findByOrder(order_id);
}

module.exports = {
  assignTransporter,
  getMyDeliveries,
  getAssignmentById,
  updateDeliveryStatus,
  listAllAssignments,
  getAssignmentsByOrder,
};
