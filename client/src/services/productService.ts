import axios from 'axios';
import { Product } from '../types/Product';

// Smart API URL detection
const getApiBaseUrl = () => {
  // Check if we're running on Vercel (production)
  if (window.location.hostname.includes('vercel.app') || 
      window.location.hostname.includes('netlify.app') ||
      process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL_PRODUCTION || 'https://prn232-assignment1-kcez.onrender.com';
  }
  
  // Local development
  return process.env.REACT_APP_API_URL_LOCAL || 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Helper function to build API endpoint
const getApiEndpoint = (path: string) => {
  // If base URL already includes /api, don't add it again
  if (API_BASE_URL.includes('/api')) {
    return path;
  }
  // If base URL doesn't include /api, add it to the path
  return `/api${path}`;
};

// Debug logging
console.log('=== API Configuration ===');
console.log('Environment:', process.env.NODE_ENV);
console.log('Hostname:', window.location.hostname);
console.log('API Base URL:', API_BASE_URL);
console.log('Local API URL:', process.env.REACT_APP_API_URL_LOCAL);
console.log('Production API URL:', process.env.REACT_APP_API_URL_PRODUCTION);
console.log('========================');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface ProductsResponse {
  products: Product[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export const productService = {
  // Get all products (legacy method for compatibility)
  getAllProducts: async (): Promise<Product[]> => {
    const response = await api.get(getApiEndpoint('/products'));
    // Handle both old and new response format
    return Array.isArray(response.data) ? response.data : response.data.products;
  },

  // Search products with filters and pagination
  searchProducts: async (params: {
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    pageSize?: number;
  } = {}): Promise<ProductsResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    
    const response = await api.get(getApiEndpoint(`/products?${queryParams.toString()}`));
    return response.data;
  },

  // Get single product
  getProduct: async (id: number): Promise<Product> => {
    const response = await api.get(getApiEndpoint(`/products/${id}`));
    return response.data;
  },

  // Create product
  createProduct: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    const response = await api.post(getApiEndpoint('/products'), product);
    return response.data;
  },

  // Update product
  updateProduct: async (id: number, product: Omit<Product, 'createdAt' | 'updatedAt'>): Promise<void> => {
    await api.put(getApiEndpoint(`/products/${id}`), product);
  },

  // Delete product
  deleteProduct: async (id: number): Promise<void> => {
    await api.delete(getApiEndpoint(`/products/${id}`));
  },
};