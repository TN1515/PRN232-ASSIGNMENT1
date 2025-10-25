import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

// Create a single axios instance using the centralized API configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout to handle Render.com cold starts
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Cart API error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  product?: {
    id: number;
    name: string;
    price: number;
    image?: string;
  };
  quantity: number;
  unitPrice: string | number;
  addedAt: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartResponse {
  id: number;
  userId?: number;
  items: CartItem[];
  cartItems?: CartItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartRequest {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export const cartService = {
  // Get user's cart with items
  getCart: async (): Promise<Cart> => {
    const response = await api.get('/cart');
    const data = response.data as CartResponse;
    // Normalize the response to always use 'items' field
    return {
      id: data.id,
      items: data.items || data.cartItems || [],
      total: data.total || 0,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },

  // Add product to cart
  addToCart: async (productId: number, quantity: number = 1): Promise<CartItem> => {
    const response = await api.post('/cart/items', {
      productId,
      quantity,
    });
    return response.data;
  },

  // Update cart item quantity
  updateCartItem: async (cartItemId: number, quantity: number): Promise<CartItem> => {
    const response = await api.put(`/cart/items/${cartItemId}`, {
      quantity,
    });
    return response.data;
  },

  // Remove item from cart
  removeCartItem: async (cartItemId: number): Promise<void> => {
    await api.delete(`/cart/items/${cartItemId}`);
  },

  // Clear entire cart
  clearCart: async (): Promise<void> => {
    await api.delete('/cart/items');
  },

  // Calculate cart total
  calculateCartTotal: (cartItems: CartItem[]): number => {
    return cartItems.reduce((total, item) => {
      const price = typeof item.unitPrice === 'string' 
        ? parseFloat(item.unitPrice) 
        : item.unitPrice;
      return total + (price * item.quantity);
    }, 0);
  },

  // Normalize cart data to ensure consistent structure
  normalizeCart: (data: any): Cart => {
    return {
      id: data.id,
      items: data.items || data.cartItems || [],
      total: data.total || 0,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};

export default cartService;
