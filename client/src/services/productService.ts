import axios from 'axios';
import { Product } from '../types/Product';
import { API_BASE_URL } from '../config/apiConfig';

// Create a single axios instance using the centralized API configuration
// This ensures consistent URL handling across the entire application
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout to handle Render.com cold starts (first request can take 10-15s)
});

// Request interceptor for logging and adding auth token
api.interceptors.request.use(
  (config) => {
    // Add JWT token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('📤 Product API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullUrl: `${config.baseURL}${config.url}`,
      hasToken: !!token,
    });
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ Product API Response:', {
      status: response.status,
      url: response.config?.url,
      itemsReceived: Array.isArray(response.data) ? response.data.length : 
                     response.data?.products?.length || 'N/A',
    });
    return response;
  },
  (error) => {
    console.error('❌ Product API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
    });
    
    // Provide helpful error messages for common issues
    if (error.code === 'ERR_NETWORK') {
      console.error('🔥 NETWORK ERROR - API might be down or unreachable');
      console.error('Possible causes:');
      console.error('1. Backend server is not running');
      console.error('2. CORS configuration issue');
      console.error('3. Invalid API URL configuration');
    }
    
    if (error.code === 'ECONNABORTED') {
      console.error('🔥 CONNECTION TIMEOUT - API took too long to respond (>30s)');
      console.error('This can happen on Render.com cold starts');
    }
    
    return Promise.reject(error);
  }
);

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
  // Test API connection
  testConnection: async (): Promise<boolean> => {
    try {
      console.log('Testing API connection to:', API_BASE_URL + '/products');
      await api.get('/products');
      console.log('✅ API connection successful');
      return true;
    } catch (error: any) {
      console.error('❌ API connection failed:', error.message);
      return false;
    }
  },

  // Get all products (legacy method for compatibility)
  getAllProducts: async (): Promise<Product[]> => {
    try {
      console.log('Fetching all products from:', API_BASE_URL + '/products');
      const response = await api.get('/products');
      
      // Handle both old and new response format
      return Array.isArray(response.data) ? response.data : response.data.products;
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  },

  // Search products with filters and pagination
  searchProducts: async (params: {
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    pageSize?: number;
  } = {}): Promise<ProductsResponse> => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.search) queryParams.append('search', params.search);
      if (params.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
      if (params.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/products?${queryString}` : '/products';
      
      console.log('🔍 Searching products:', { endpoint, params });
      const response = await api.get(endpoint);
      return response.data;
    } catch (error: any) {
      console.error('❌ Search products failed:', error);
      throw error;
    }
  },

  // Get single product
  getProduct: async (id: number): Promise<Product> => {
    try {
      console.log('📦 Fetching product:', id);
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Failed to fetch product ${id}:`, error);
      throw error;
    }
  },

  // Create product
  createProduct: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    try {
      console.log('➕ Creating product:', product);
      const response = await api.post('/products', product);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create product:', error);
      throw error;
    }
  },

  // Update product
  updateProduct: async (id: number, product: Omit<Product, 'createdAt' | 'updatedAt'>): Promise<void> => {
    try {
      console.log('✏️ Updating product:', id, product);
      await api.put(`/products/${id}`, product);
    } catch (error: any) {
      console.error(`❌ Failed to update product ${id}:`, error);
      throw error;
    }
  },

  // Delete product
  deleteProduct: async (id: number): Promise<void> => {
    try {
      console.log('🗑️ Deleting product:', id);
      await api.delete(`/products/${id}`);
    } catch (error: any) {
      console.error(`❌ Failed to delete product ${id}:`, error);
      throw error;
    }
  },
};