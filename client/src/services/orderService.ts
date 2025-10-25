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
      console.log('🔐 Order API - Token added to request:', {
        url: config.url,
        hasToken: true,
        tokenPreview: token.substring(0, 20) + '...'
      });
    } else {
      console.warn('⚠️ Order API - No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('❌ Order API - Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ Order API Response:', {
      status: response.status,
      url: response.config?.url,
      itemsReceived: Array.isArray(response.data) ? response.data.length : 'N/A'
    });
    return response;
  },
  (error) => {
    console.error('❌ Order API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data,
      url: error.config?.url,
    });
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
    try {
      console.log('📤 Fetching orders from:', `${API_BASE_URL}/order`);
      const token = localStorage.getItem('token');
      console.log('🔐 Token present:', !!token);
      
      const response = await api.get('/order');
      console.log('✅ Orders fetched successfully:', response.data);
      
      // Map backend response to frontend Order interface
      // Backend returns 'items', frontend expects 'orderItems'
      const orders = response.data.map((order: any) => {
        const mappedItems = (order.items || []).map((item: any) => ({
          id: item.id,
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          product: {
            id: item.productId,
            name: item.productName || 'Unknown Product',
            price: item.unitPrice,
            image: item.productImage
          }
        }));
        
        return {
          ...order,
          orderItems: mappedItems
        };
      });
      
      console.log('📦 Mapped orders:', orders);
      return orders;
    } catch (error: any) {
      console.error('❌ Error fetching orders:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        }
      });
      throw error;
    }
  },

  // Get specific order details
  getOrder: async (orderId: number): Promise<Order> => {
    const response = await api.get(`/order/${orderId}`);
    return response.data;
  },

  // Place an order from the current cart
  placeOrder: async (): Promise<PlaceOrderResponse> => {
    const response = await api.post('/order', {});
    return response.data;
  },

  // Update order status (for admin or payment confirmation)
  updateOrderStatus: async (orderId: number, status: OrderStatus | string): Promise<Order> => {
    const response = await api.put(`/order/${orderId}`, { status });
    return response.data;
  },

  // Cancel order
  cancelOrder: async (orderId: number): Promise<any> => {
    try {
      console.log('❌ Cancelling order:', orderId);
      const response = await api.put(`/order/${orderId}/cancel`);
      console.log('✅ Order cancelled successfully:', response.data);
      return response.data;
    } catch (err: any) {
      console.error('❌ Failed to cancel order:', err);
      throw err;
    }
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
