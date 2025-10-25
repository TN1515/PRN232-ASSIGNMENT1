/**
 * PayOS Configuration
 * Configure PayOS payment gateway settings
 */

// Get API base URL from environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const payosConfig = {
  // PayOS API endpoints
  apiBaseUrl: API_BASE_URL,
  paymentEndpoint: `${API_BASE_URL}/payment/create-payment-link`,
  verifyEndpoint: `${API_BASE_URL}/payment/verify`,
  statusEndpoint: `${API_BASE_URL}/payment/status`,
  cancelEndpoint: `${API_BASE_URL}/payment/cancel`,
  webhookEndpoint: `${API_BASE_URL}/webhook/payos`,

  // Redirect URLs
  successRedirect: `${window.location.origin}/payment-callback?code=0`,
  failureRedirect: `${window.location.origin}/payment-callback?code=1`,
  cancelRedirect: `${window.location.origin}/payment-callback?code=2`,

  // Timeout settings
  requestTimeout: 30000, // 30 seconds
  retryCount: 3,
  retryDelay: 1000, // 1 second

  // Logging
  debug: process.env.NODE_ENV === 'development',
};

export default payosConfig;
