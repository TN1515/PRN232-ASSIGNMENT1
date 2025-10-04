import axios from 'axios';
import { Product } from '../types/Product';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
    const response = await api.get('/products');
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
    
    const response = await api.get(`/products?${queryParams.toString()}`);
    return response.data;
  },

  // Get single product
  getProduct: async (id: number): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Create product
  createProduct: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    const response = await api.post('/products', product);
    return response.data;
  },

  // Update product
  updateProduct: async (id: number, product: Omit<Product, 'createdAt' | 'updatedAt'>): Promise<void> => {
    await api.put(`/products/${id}`, product);
  },

  // Delete product
  deleteProduct: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};