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
    console.error('Order API error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export enum OrderStatus {
  Pending = 'Pending',
  Paid = 'Paid',
  Shipped = 'Shipped',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled',
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  product?: {
    id: number;
    name: string;
    price: number;
    image?: string;
  };
  quantity: number;
  unitPrice: string | number;
}

export interface Order {
  id: number;
  userId: number;
  orderNumber: string;
  totalAmount: string | number;
  status: OrderStatus | string;
  orderDate: string;
  paidDate?: string;
  shippedDate?: string;
  deliveredDate?: string;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
}

export interface CreateOrderRequest {
  // Cart items are sent as part of the order
  // The API will read from the user's cart
}

export interface PlaceOrderResponse {
  success: boolean;
  message: string;
  order?: Order;
}

export const orderService = {
  // Get all orders for the current user
  getUserOrders: async (): Promise<Order[]> => {
    const response = await api.get(getApiEndpoint('/orders'));
    return response.data;
  },

  // Get specific order details
  getOrder: async (orderId: number): Promise<Order> => {
    const response = await api.get(getApiEndpoint(`/orders/${orderId}`));
    return response.data;
  },

  // Place an order from the current cart
  placeOrder: async (): Promise<PlaceOrderResponse> => {
    const response = await api.post(getApiEndpoint('/orders'), {});
    return response.data;
  },

  // Update order status (for admin or payment confirmation)
  updateOrderStatus: async (orderId: number, status: OrderStatus | string): Promise<Order> => {
    const response = await api.put(getApiEndpoint(`/orders/${orderId}`), { status });
    return response.data;
  },

  // Calculate order total
  calculateOrderTotal: (orderItems: OrderItem[]): number => {
    return orderItems.reduce((total, item) => {
      const price = typeof item.unitPrice === 'string' 
        ? parseFloat(item.unitPrice) 
        : item.unitPrice;
      return total + (price * item.quantity);
    }, 0);
  },

  // Format order date for display
  formatOrderDate: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
};

export default orderService;
