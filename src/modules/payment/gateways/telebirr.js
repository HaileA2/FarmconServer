'use strict';

/**
 * Telebirr payment gateway adapter.
 * In production, replace the simulated logic with actual Telebirr API calls.
 * Docs: https://developer.ethiotelecom.et/docs/telebirr
 *
 * Required .env vars:
 *   TELEBIRR_APP_ID
 *   TELEBIRR_APP_KEY
 *   TELEBIRR_SHORT_CODE
 *   TELEBIRR_PUBLIC_KEY
 */

const crypto = require('crypto');
const config = require('../../../config/env');

/**
 * Initiate a Telebirr payment.
 * Returns { transaction_ref, checkout_url }
 */
async function initiatePayment({ amount, order_id, buyer_phone }) {
  const transaction_ref = 'TLB-' + crypto.randomBytes(8).toString('hex').toUpperCase();

  // --- PRODUCTION: replace below with real Telebirr API call ---
  // const response = await axios.post('https://api.ethiotelecom.et/payment/initiate', {
  //   appId: config.telebirr.appId,
  //   appKey: config.telebirr.appKey,
  //   shortCode: config.telebirr.shortCode,
  //   outTradeNo: transaction_ref,
  //   totalAmount: amount.toFixed(2),
  //   subject: `FarmConnect Order ${order_id}`,
  //   notifyUrl: `${config.app.baseUrl}/api/payments/webhook/telebirr`,
  //   returnUrl: `${config.app.baseUrl}/payment/success`,
  //   receiverMSISDN: buyer_phone,
  //   timeoutExpress: '30',
  // });
  // return { transaction_ref, checkout_url: response.data.toPayUrl };
  // --- END PRODUCTION ---

  // Sandbox simulation
  const checkout_url = `${config.app.baseUrl}/api/payments/simulate/telebirr?ref=${transaction_ref}`;
  return { transaction_ref, checkout_url };
}

/**
 * Verify a Telebirr webhook callback.
 * Returns { success: bool, gateway_ref: string }
 */
function verifyCallback(payload) {
  // --- PRODUCTION: decrypt and verify Telebirr callback signature ---
  // const decrypted = decryptWithPublicKey(payload.data, config.telebirr.publicKey);
  // return { success: decrypted.tradeStatus === 'SUCCESS', gateway_ref: decrypted.tradeNo };
  // --- END PRODUCTION ---

  // Sandbox: trust the payload directly
  return {
    success: payload.trade_status === 'SUCCESS',
    gateway_ref: payload.trade_no || payload.transaction_ref,
  };
}

module.exports = { initiatePayment, verifyCallback };
