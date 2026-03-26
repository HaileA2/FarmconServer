'use strict';

const userService = require('./service');

const getMe = async (req, res, next) => {
  try {
    const profile = await userService.getProfile(req.user.user_id);
    res.status(200).json(profile);
  } catch (e) {
    next(e);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const profile = await userService.updateProfile(req.user.user_id, req.body);
    res.status(200).json(profile);
  } catch (e) {
    next(e);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const result = await userService.changePassword(req.user.user_id, req.body.current_password, req.body.new_password);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

const deleteMe = async (req, res, next) => {
  try {
    const result = await userService.deactivateAccount(req.user.user_id);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const users = await userService.listUsers(req.query);
    res.status(200).json(users);
  } catch (e) {
    next(e);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const profile = await userService.getUserById(req.params.id);
    res.status(200).json(profile);
  } catch (e) {
    next(e);
  }
};

const adminUpdateUser = async (req, res, next) => {
  try {
    const profile = await userService.adminUpdateUser(req.params.id, req.body);
    res.status(200).json(profile);
  } catch (e) {
    next(e);
  }
};

module.exports = { getMe, updateMe, changePassword, deleteMe, listUsers, getUserById, adminUpdateUser };
