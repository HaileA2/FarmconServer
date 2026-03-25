'use strict';

/**
 * Generate a random 6-digit numeric OTP string (zero-padded).
 * @returns {string}
 */
function generateOtp() {
  const num = Math.floor(Math.random() * 1000000);
  return String(num).padStart(6, '0');
}

module.exports = { generateOtp };
