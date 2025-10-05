import axios from 'axios';
import { Product } from '../types/Product';

// Smart API URL detection with fallback options
const getApiBaseUrl = () => {
  // Check if we're running on Vercel (production)
  if (window.location.hostname.includes('vercel.app') || 
      window.location.hostname.includes('netlify.app') ||
      process.env.NODE_ENV === 'production') {
    
    // Try multiple production URLs in order of preference
    const productionUrls = [
      process.env.REACT_APP_API_URL_PRODUCTION,
      'https://prn232-assignment1-kcez.onrender.com/swagger',
      'https://prn232-assignment1-kcez.onrender.com'
    ].filter(Boolean);
    
    return productionUrls[0] || 'https://prn232-assignment1-kcez.onrender.com/swagger';
  }
  
  // Local development
  return process.env.REACT_APP_API_URL_LOCAL || 'http://localhost:5000/api';
};

const RAW_API_BASE_URL = getApiBaseUrl();

// Convert swagger URL to API URL - handle both /swagger and /swagger/
const API_BASE_URL = RAW_API_BASE_URL.includes('/swagger') 
  ? RAW_API_BASE_URL.replace(/\/swagger\/?$/, '/api')
  : RAW_API_BASE_URL;

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
console.log('Raw Base URL:', RAW_API_BASE_URL);
console.log('API Base URL:', API_BASE_URL);
console.log('Local API URL:', process.env.REACT_APP_API_URL_LOCAL);
console.log('Production API URL:', process.env.REACT_APP_API_URL_PRODUCTION);
console.log('========================');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log('Making request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullUrl: `${config.baseURL}${config.url}`,
    });
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('Response error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });
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

// Fallback demo data when API is not available
const getDemoProducts = (): Product[] => {
  return [
    {
      id: 1,
      name: "Classic White T-Shirt",
      description: "Premium cotton t-shirt perfect for everyday wear. Made from 100% organic cotton.",
      price: 29.99,
      image: "/api/placeholder/300/400",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      name: "Denim Jacket",
      description: "Vintage-style denim jacket with a modern twist. Perfect for layering.",
      price: 89.99,
      image: "/api/placeholder/300/400",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 3,
      name: "Black Hoodie",
      description: "Comfortable fleece hoodie with adjustable drawstring and kangaroo pocket.",
      price: 59.99,
      image: "/api/placeholder/300/400",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
};

export const productService = {
  // Test API connection
  testConnection: async (): Promise<boolean> => {
    try {
      // Try different endpoints to test connectivity
      const endpoints = [
        getApiEndpoint('/products'),
        '/products',
        'products'
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Testing endpoint: ${API_BASE_URL}${endpoint}`);
          await api.get(endpoint);
          console.log(`✓ Successfully connected to: ${endpoint}`);
          return true;
        } catch (error: any) {
          console.log(`✗ Failed to connect to: ${endpoint} - ${error.message}`);
        }
      }
      return false;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  },

  // Get all products (legacy method for compatibility)
  getAllProducts: async (): Promise<Product[]> => {
    try {
      console.log('Fetching products from:', API_BASE_URL + getApiEndpoint('/products'));
      const response = await api.get(getApiEndpoint('/products'));
      console.log('API Response:', response.data);
      
      // Handle both old and new response format
      return Array.isArray(response.data) ? response.data : response.data.products;
    } catch (error: any) {
      console.error('Failed to fetch products from primary endpoint:', error);
      
      // Try alternative endpoint
      try {
        console.log('Trying alternative endpoint...');
        const altResponse = await api.get('/products');
        return Array.isArray(altResponse.data) ? altResponse.data : altResponse.data.products;
      } catch (altError: any) {
        console.error('Alternative endpoint also failed:', altError);
        
        // In production, return demo data to prevent complete failure
        if (process.env.NODE_ENV === 'production' || window.location.hostname.includes('vercel.app')) {
          console.warn('API unavailable, using demo data for better user experience');
          return getDemoProducts();
        }
        
        throw new Error(`Failed to fetch products: ${error.message}`);
      }
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
      
      const response = await api.get(getApiEndpoint(`/products?${queryParams.toString()}`));
      return response.data;
    } catch (error: any) {
      console.error('Search products failed:', error);
      
      // Fallback for production
      if (process.env.NODE_ENV === 'production' || window.location.hostname.includes('vercel.app')) {
        console.warn('API search unavailable, using demo data');
        const demoProducts = getDemoProducts();
        
        // Simple filtering for demo data
        let filtered = demoProducts;
        if (params.search) {
          filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(params.search!.toLowerCase()) ||
            p.description.toLowerCase().includes(params.search!.toLowerCase())
          );
        }
        if (params.minPrice !== undefined) {
          filtered = filtered.filter(p => p.price >= params.minPrice!);
        }
        if (params.maxPrice !== undefined) {
          filtered = filtered.filter(p => p.price <= params.maxPrice!);
        }
        
        const page = params.page || 1;
        const pageSize = params.pageSize || 6;
        const startIndex = (page - 1) * pageSize;
        const paginatedProducts = filtered.slice(startIndex, startIndex + pageSize);
        
        return {
          products: paginatedProducts,
          pagination: {
            currentPage: page,
            pageSize: pageSize,
            totalItems: filtered.length,
            totalPages: Math.ceil(filtered.length / pageSize),
            hasNextPage: page < Math.ceil(filtered.length / pageSize),
            hasPreviousPage: page > 1
          }
        };
      }
      
      throw error;
    }
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