/**
 * Centralized Axios Client
 * All API requests go through this client for consistent configuration
 */

import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from './apiConfig';

let apiClient: AxiosInstance | null = null;

/**
 * Get or create the global axios instance
 */
export const getApiClient = (): AxiosInstance => {
  if (apiClient) {
    return apiClient;
  }

  apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: 15000,
    withCredentials: false,
  });

  // Request interceptor
  apiClient.interceptors.request.use(
    (config) => {
      // Add token to headers if available
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      console.log('📤 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        fullUrl: `${config.baseURL}${config.url}`,
      });

      return config;
    },
    (error) => {
      console.error('❌ Request setup error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  apiClient.interceptors.response.use(
    (response) => {
      console.log('✅ API Response:', response.status, response.config?.url);
      return response;
    },
    (error) => {
      // Detailed error logging
      const errorInfo = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        message: error.message,
        code: error.code,
      };

      console.error('❌ API Error:', errorInfo);

      // Handle specific error cases
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        console.error('🔥 NETWORK ERROR - Backend might be down');
        console.error('Troubleshooting:');
        console.error('1. Check if Render API is running');
        console.error('2. Verify API URL:', API_BASE_URL);
        console.error('3. Check browser console for CORS errors');
      }

      if (error.response?.status === 0) {
        console.error('🔥 CONNECTION ERROR - Check CORS configuration');
      }

      if (error.code === 'ECONNABORTED') {
        console.error('🔥 REQUEST TIMEOUT - Backend took too long to respond');
      }

      return Promise.reject(error);
    }
  );

  return apiClient;
};

/**
 * Reset API client (useful after logout)
 */
export const resetApiClient = (): void => {
  apiClient = null;
};

export default getApiClient();
