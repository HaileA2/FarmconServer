'use strict';

const authService = require('./service');

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
};

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;        // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

const login = async (req, res, next) => {
  try {
    const { accessToken, refreshToken } = await authService.login(req.body);
    res
      .cookie('access_token', accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_MAX_AGE })
      .cookie('refresh_token', refreshToken, { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_MAX_AGE })
      .status(200)
      .json({ accessToken, refreshToken });
  } catch (e) {
    next(e);
  }
};

const refresh = async (req, res, next) => {
  try {
    const rawToken = req.body.refreshToken || (req.cookies && req.cookies.refresh_token);
    const result = await authService.refreshToken(rawToken);
    res
      .cookie('access_token', result.accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_MAX_AGE })
      .status(200)
      .json(result);
  } catch (e) {
    next(e);
  }
};

const logout = async (req, res, next) => {
  try {
    const rawToken = req.body.refreshToken || (req.cookies && req.cookies.refresh_token);
    const result = await authService.logout(rawToken);
    res
      .clearCookie('access_token', COOKIE_OPTIONS)
      .clearCookie('refresh_token', COOKIE_OPTIONS)
      .status(200)
      .json(result);
  } catch (e) {
    next(e);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyOtp(req.body);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const result = await authService.resendOtp(req.body);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

module.exports = { register, login, refresh, logout, verifyOtp, resendOtp };
