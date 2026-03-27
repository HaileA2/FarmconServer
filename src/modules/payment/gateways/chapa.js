'use strict';

/**
 * Chapa payment gateway adapter.
 * Docs: https://developer.chapa.co/docs
 *
 * Required .env vars:
 *   CHAPA_SECRET_KEY
 *   CHAPA_BASE_URL  (default: https://api.chapa.co/v1)
 */

const crypto = require('crypto');
const https = require('https');
const config = require('../../../config/env');

const CHAPA_BASE_URL = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY || '';

/**
 * Simple HTTPS POST helper (avoids adding axios dependency).
 */
function httpsPost(url, body, headers) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const data = JSON.stringify(body);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
      },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch { resolve(raw); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Initiate a Chapa payment.
 * Returns { transaction_ref, checkout_url }
 */
async function initiatePayment({ amount, order_id, buyer_email, buyer_name }) {
  const transaction_ref = 'CHP-' + crypto.randomBytes(8).toString('hex').toUpperCase();

  if (!CHAPA_SECRET_KEY) {
    // Sandbox simulation when no key configured
    const checkout_url = `${config.app.baseUrl}/api/payments/simulate/chapa?ref=${transaction_ref}`;
    return { transaction_ref, checkout_url };
  }

  // Production: real Chapa API call
  const [first_name, ...rest] = (buyer_name || 'FarmConnect User').split(' ');
  const response = await httpsPost(
    CHAPA_BASE_URL + '/transaction/initialize',
    {
      amount: amount.toFixed(2),
      currency: 'ETB',
      email: buyer_email,
      first_name: first_name,
      last_name: rest.join(' ') || 'User',
      tx_ref: transaction_ref,
      callback_url: `${config.app.baseUrl}/api/payments/webhook/chapa`,
      return_url: `${config.app.baseUrl}/payment/success`,
      customization: { title: 'FarmConnect Payment', description: `Order ${order_id}` },
    },
    { Authorization: 'Bearer ' + CHAPA_SECRET_KEY }
  );

  if (response.status !== 'success') {
    throw new Error('Chapa initiation failed: ' + (response.message || 'Unknown error'));
  }

  return { transaction_ref, checkout_url: response.data.checkout_url };
}

/**
 * Verify a Chapa transaction by tx_ref.
 * Returns { success: bool, gateway_ref: string }
 */
async function verifyTransaction(transaction_ref) {
  if (!CHAPA_SECRET_KEY) {
    // Sandbox: always success
    return { success: true, gateway_ref: 'SANDBOX-' + transaction_ref };
  }

  const response = await new Promise((resolve, reject) => {
    const parsed = new URL(CHAPA_BASE_URL + '/transaction/verify/' + transaction_ref);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'GET',
      headers: { Authorization: 'Bearer ' + CHAPA_SECRET_KEY },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve(raw); } });
    });
    req.on('error', reject);
    req.end();
  });

  return {
    success: response.status === 'success' && response.data?.status === 'success',
    gateway_ref: response.data?.reference || transaction_ref,
  };
}

module.exports = { initiatePayment, verifyTransaction };
