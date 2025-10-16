import axios from 'axios';

// API URL configuration
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production' || 
      window.location.hostname.includes('vercel.app') || 
      window.location.hostname.includes('netlify.app')) {
    return process.env.REACT_APP_API_URL_PRODUCTION || 'https://prn232-assignment1-kcez.onrender.com/api';
  }
  return process.env.REACT_APP_API_URL_LOCAL || 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

const getApiEndpoint = (path: string) => {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `/${cleanPath}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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
  userId: number;
  cartItems: CartItem[];
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
    const response = await api.get(getApiEndpoint('/cart'));
    return response.data;
  },

  // Add product to cart
  addToCart: async (productId: number, quantity: number = 1): Promise<CartItem> => {
    const response = await api.post(getApiEndpoint('/cart/items'), {
      productId,
      quantity,
    });
    return response.data;
  },

  // Update cart item quantity
  updateCartItem: async (cartItemId: number, quantity: number): Promise<CartItem> => {
    const response = await api.put(getApiEndpoint(`/cart/items/${cartItemId}`), {
      quantity,
    });
    return response.data;
  },

  // Remove item from cart
  removeCartItem: async (cartItemId: number): Promise<void> => {
    await api.delete(getApiEndpoint(`/cart/items/${cartItemId}`));
  },

  // Clear entire cart
  clearCart: async (): Promise<void> => {
    await api.delete(getApiEndpoint('/cart/items'));
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
};

export default cartService;
