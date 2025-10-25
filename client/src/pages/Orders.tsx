import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import orderService, { Order } from '../services/orderService';
import { formatPriceVND } from '../utils/priceFormatter';
import './Orders.css';

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const successMessage = (location.state as any)?.message;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    loadOrders();
    
    if (successMessage) {
      setSuccess(successMessage);
      setTimeout(() => setSuccess(null), 5000);
    }
  }, [user, navigate, successMessage]);

  // Tự động xóa error sau 3 giây
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📥 Loading orders...');
      const ordersList = await orderService.getUserOrders();
      console.log('✅ Orders loaded successfully:', ordersList);
      setOrders(ordersList);
      // Không hiển thị lỗi nếu load thành công
      setError(null);
    } catch (err: any) {
      console.error('❌ Failed to load orders:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        fullError: err
      });
      // Không set error - chỉ log ra console
      // Hiển thị empty state thay vì error message
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'paid':
        return 'status-paid';
      case 'shipped':
        return 'status-shipped';
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="orders-page">
        <div className="orders-loading">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        <h1>My Orders</h1>
        
        {success && <div className="success-message">{success}</div>}
        {error && error.trim() && <div className="error-message">{error}</div>}

        {orders.length === 0 ? (
          <div className="orders-empty">
            <h2>No orders yet</h2>
            <p>Start shopping to place your first order!</p>
            <button onClick={handleContinueShopping} className="btn-primary">
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="orders-content">
            {/* Orders List */}
            <div className="orders-list-section">
              <h2>Order History</h2>
              <div className="orders-list">
                {orders.map(order => (
                  <div
                    key={order.id}
                    className={`order-card ${selectedOrder?.id === order.id ? 'selected' : ''}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="order-header">
                      <div className="order-number">
                        <h3>{order.orderNumber}</h3>
                        <p className="order-date">
                          {orderService.formatOrderDate(order.orderDate)}
                        </p>
                      </div>
                      <div className={`order-status ${getStatusColor(order.status)}`}>
                        {order.status}
                      </div>
                    </div>
                    
                    <div className="order-info">
                      <div className="info-item">
                        <span className="label">Items:</span>
                        <span className="value">{order.orderItems?.length || 0}</span>
                      </div>
                      {order.orderItems && order.orderItems.length > 0 && (
                        <div className="info-item products-list">
                          <span className="label">Products:</span>
                          <div className="products-info">
                            {order.orderItems.slice(0, 3).map((item, idx) => (
                              <span key={idx} className="product-info">
                                {item.product?.name} (x{item.quantity})
                              </span>
                            ))}
                            {order.orderItems.length > 3 && (
                              <span className="product-info">+{order.orderItems.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="info-item">
                        <span className="label">Total:</span>
                        <span className="value">
                          {formatPriceVND(typeof order.totalAmount === 'string' 
                            ? parseFloat(order.totalAmount) 
                            : order.totalAmount)}
                        </span>
                      </div>
                    </div>

                    <button className="btn-view-details">View Details →</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Details */}
            {selectedOrder && (
              <div className="order-details-section">
                <h2>Order Details</h2>
                
                <div className="order-detail-card">
                  <div className="detail-section">
                    <h3>Order Information</h3>
                    <div className="detail-row">
                      <span>Order Number:</span>
                      <strong>{selectedOrder.orderNumber}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Order Date:</span>
                      <strong>{orderService.formatOrderDate(selectedOrder.orderDate)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Status:</span>
                      <span className={`order-status ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                  </div>

                  {selectedOrder.paidDate && (
                    <div className="detail-section">
                      <h3>Payment Status</h3>
                      <div className="detail-row">
                        <span>Paid Date:</span>
                        <strong>{orderService.formatOrderDate(selectedOrder.paidDate)}</strong>
                      </div>
                    </div>
                  )}

                  {selectedOrder.shippedDate && (
                    <div className="detail-section">
                      <h3>Shipping Information</h3>
                      <div className="detail-row">
                        <span>Shipped Date:</span>
                        <strong>{orderService.formatOrderDate(selectedOrder.shippedDate)}</strong>
                      </div>
                    </div>
                  )}

                  {selectedOrder.deliveredDate && (
                    <div className="detail-section">
                      <h3>Delivery</h3>
                      <div className="detail-row">
                        <span>Delivered Date:</span>
                        <strong>{orderService.formatOrderDate(selectedOrder.deliveredDate)}</strong>
                      </div>
                    </div>
                  )}

                  <div className="detail-section">
                    <h3>Items ({selectedOrder.orderItems?.length || 0})</h3>
                    <div className="items-list">
                      {selectedOrder.orderItems?.map(item => (
                        <div key={item.id} className="item-row">
                          <div className="item-info">
                            {item.product?.image && (
                              <img 
                                src={item.product.image} 
                                alt={item.product.name}
                                className="item-thumb"
                              />
                            )}
                            <div>
                              <p className="item-name">{item.product?.name || 'Product'}</p>
                              <p className="item-qty">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <div className="item-price">
                            <p>{formatPriceVND((
                              (typeof item.unitPrice === 'string' 
                                ? parseFloat(item.unitPrice) 
                                : item.unitPrice) * item.quantity
                            ))}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="detail-section total-section">
                    <div className="total-item">
                      <span>Subtotal:</span>
                      <strong>{formatPriceVND(typeof selectedOrder.totalAmount === 'string' 
                        ? parseFloat(selectedOrder.totalAmount) 
                        : selectedOrder.totalAmount)}</strong>
                    </div>
                  </div>
                </div>

                <button onClick={handleContinueShopping} className="btn-continue-shopping">
                  Continue Shopping
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
