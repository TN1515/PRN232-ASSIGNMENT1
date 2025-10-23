/**
 * API Configuration
 * Centralized API URL configuration for all API calls
 */

// Smart API URL detection with fallback options
const getApiBaseUrl = (): string => {
  // Check if we're running in production environment
  if (
    process.env.NODE_ENV === 'production' ||
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('netlify.app') ||
    window.location.hostname.includes('onrender.com')
  ) {
    // Production URLs
    const productionUrl =
      process.env.REACT_APP_API_URL_PRODUCTION ||
      'https://prn232-assignment1-kcez.onrender.com/api';

    console.log('🌐 Production API URL:', productionUrl);
    return productionUrl;
  }

  // Local development
  const localUrl = process.env.REACT_APP_API_URL_LOCAL || 'http://localhost:5000/api';

  console.log('💻 Development API URL:', localUrl);
  return localUrl;
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Build full API URL for any endpoint
 * @param endpoint - API endpoint (e.g., '/products', '/auth/login')
 * @returns Full API URL
 */
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  // Remove trailing slash from base URL
  const cleanBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${cleanBase}/${cleanEndpoint}`;
};

/**
 * Debug API configuration
 */
export const debugApiConfig = (): void => {
  console.log('=== API Configuration Debug ===');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Hostname:', window.location.hostname);
  console.log('API Base URL:', API_BASE_URL);
  console.log('Example Product URL:', getApiUrl('/products'));
  console.log('Example Auth URL:', getApiUrl('/auth/login'));
  console.log('================================');
};
