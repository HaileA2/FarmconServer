'use strict';

const isProduction = process.env.NODE_ENV === 'production';

function formatMessage(level, data, message) {
  const timestamp = new Date().toISOString();
  if (isProduction) {
    return JSON.stringify({ timestamp, level, message, ...data });
  }
  const dataStr = data && Object.keys(data).length ? ` ${JSON.stringify(data)}` : '';
  return `[${timestamp}] ${level.toUpperCase()}${dataStr}: ${message}`;
}

const logger = {
  info(dataOrMessage, message) {
    if (typeof dataOrMessage === 'string') {
      console.log(formatMessage('info', {}, dataOrMessage));
    } else {
      console.log(formatMessage('info', dataOrMessage, message || ''));
    }
  },
  warn(dataOrMessage, message) {
    if (typeof dataOrMessage === 'string') {
      console.warn(formatMessage('warn', {}, dataOrMessage));
    } else {
      console.warn(formatMessage('warn', dataOrMessage, message || ''));
    }
  },
  error(dataOrMessage, message) {
    if (typeof dataOrMessage === 'string') {
      console.error(formatMessage('error', {}, dataOrMessage));
    } else {
      console.error(formatMessage('error', dataOrMessage, message || ''));
    }
  },
  debug(dataOrMessage, message) {
    if (process.env.NODE_ENV === 'production') return;
    if (typeof dataOrMessage === 'string') {
      console.debug(formatMessage('debug', {}, dataOrMessage));
    } else {
      console.debug(formatMessage('debug', dataOrMessage, message || ''));
    }
  },
};

module.exports = logger;
