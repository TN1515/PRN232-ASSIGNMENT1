import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import cartService, { Cart, CartItem } from '../services/cartService';
import orderService from '../services/orderService';
import { formatPriceVND } from '../utils/priceFormatter';
import { getApiUrl } from '../config/apiConfig';
import './Checkout.css';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  console.log('🟢 CheckoutPage loaded - Version with PaymentController fix');
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Checkout form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const cartData = await cartService.getCart();
      
      if (!cartData || cartData.items.length === 0) {
        setError('Your cart is empty');
        setTimeout(() => navigate('/cart'), 2000);
        return;
      }
      
      setCart(cartData);
    } catch (err: any) {
      console.error('Failed to load cart:', err);
      setError(err.response?.data?.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    loadCart();
  }, [user, navigate, loadCart]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!formData.address.trim()) {
      setError('Address is required');
      return false;
    }
    if (!formData.city.trim()) {
      setError('City is required');
      return false;
    }
    if (!formData.zipCode.trim()) {
      setError('ZIP code is required');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setPlacing(true);
      setError(null);
      
      // First, create the order
      console.log('📦 Creating order...');
      const orderResult = await orderService.placeOrder();
      console.log('📦 Order result:', orderResult);
      
      if (!orderResult.success || !orderResult.order) {
        console.error('❌ Order creation failed:', orderResult);
        setError(orderResult.message || 'Failed to create order');
        setPlacing(false);
        return;
      }

      const orderId = orderResult.order.id;
      const cartTotal = cartService.calculateCartTotal(cart?.items || []);
      const tax = cartTotal * 0.1;
      const total = Math.round((cartTotal + tax) * 1000); // Convert to VND and multiply by 1000 for PayOS

      console.log('📦 Creating PayOS payment:', {
        orderId,
        amount: total,
        description: `Order #${orderResult.order.orderNumber}`,
        orderInfo: `Payment for order ${orderResult.order.orderNumber}`,
        buyerName: `${formData.firstName} ${formData.lastName}`,
        buyerEmail: formData.email,
        buyerPhone: formData.phone,
        buyerAddress: `${formData.address}, ${formData.city}, ${formData.zipCode}`,
      });

      // Request PayOS payment link from backend
      const paymentUrl = getApiUrl('/payment/create-payment-link');
      console.log('🔗 Payment URL:', paymentUrl);
      console.log('🔑 Token:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
      
      const paymentResponse = await fetch(paymentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: orderId,
          amount: total,
          orderInfo: `Payment for order ${orderResult.order.orderNumber}`,
          buyerName: `${formData.firstName} ${formData.lastName}`,
          buyerEmail: formData.email,
          buyerPhone: formData.phone,
          buyerAddress: `${formData.address}, ${formData.city}, ${formData.zipCode}`,
          description: `Order #${orderResult.order.orderNumber}`,
        }),
      });

      console.log('📡 Payment response status:', paymentResponse.status);

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.message || 'Failed to create payment link');
      }

      const paymentData = await paymentResponse.json();
      
      if (paymentData.checkoutUrl) {
        // Redirect to PayOS checkout
        console.log('✅ Redirecting to PayOS:', paymentData.checkoutUrl);
        window.location.href = paymentData.checkoutUrl;
      } else {
        setError('Failed to get payment link');
        setPlacing(false);
      }
    } catch (err: any) {
      console.error('Failed to place order:', err);
      setError(err.message || 'Failed to place order. Please try again.');
      setPlacing(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="checkout-loading">Loading checkout...</div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <h2>Your cart is empty</h2>
          <p>Please add items before checkout</p>
        </div>
      </div>
    );
  }

  const cartTotal = cartService.calculateCartTotal(cart.items);
  const tax = cartTotal * 0.1;
  const total = cartTotal + tax;

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-content">
          {/* Checkout Form */}
          <div className="checkout-form-section">
            <h1>Checkout with PayOS</h1>
            
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handlePlaceOrder} className="checkout-form">
              {/* Billing Information */}
              <fieldset className="form-section">
                <legend>Billing Information</legend>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name *</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      placeholder="John"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name *</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="phone">Phone *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="+84 123 456 789"
                    />
                  </div>
                </div>
              </fieldset>

              {/* Shipping Address */}
              <fieldset className="form-section">
                <legend>Shipping Address</legend>
                
                <div className="form-group">
                  <label htmlFor="address">Address *</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    placeholder="123 Main St"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      placeholder="Ho Chi Minh"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="state">State *</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      placeholder="HCM"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="zipCode">ZIP Code *</label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      required
                      placeholder="70000"
                    />
                  </div>
                </div>
              </fieldset>

              <button 
                type="submit" 
                className="btn-place-order"
                disabled={placing}
              >
                {placing ? 'Redirecting to PayOS...' : 'Proceed to Payment'}
              </button>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="checkout-summary-section">
            <h2>Order Summary</h2>
            
            <div className="summary-items">
              <h3>Items ({cart.items.length})</h3>
              {cart.items.map((item: CartItem) => (
                <div key={item.id} className="summary-item-row">
                  <span className="item-name">
                    {item.product?.name} x{item.quantity}
                  </span>
                  <span className="item-price">
                    {formatPriceVND((
                      (typeof item.unitPrice === 'string' 
                        ? parseFloat(item.unitPrice) 
                        : item.unitPrice) * item.quantity
                    ))}
                  </span>
                </div>
              ))}
            </div>

            <div className="summary-totals">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>{formatPriceVND(cartTotal)}</span>
              </div>
              <div className="total-row">
                <span>Shipping:</span>
                <span>Free</span>
              </div>
              <div className="total-row">
                <span>Tax (10%):</span>
                <span>{formatPriceVND(tax)}</span>
              </div>
              <div className="total-row grand-total">
                <span>Total:</span>
                <span>{formatPriceVND(total)}</span>
              </div>
            </div>

            <p className="payment-info">
              💳 You will be redirected to PayOS to complete payment securely
            </p>

            <button 
              className="btn-back-to-cart"
              onClick={() => navigate('/cart')}
              disabled={placing}
            >
              Back to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
