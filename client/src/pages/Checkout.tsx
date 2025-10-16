import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import cartService, { Cart, CartItem } from '../services/cartService';
import orderService from '../services/orderService';
import './Checkout.css';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
    cardNumber: '',
    cardExpiry: '',
    cardCVV: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    loadCart();
  }, [user, navigate]);

  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const cartData = await cartService.getCart();
      
      if (!cartData || cartData.cartItems.length === 0) {
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
  };

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
    if (!formData.cardNumber.replace(/\s/g, '').match(/^\d{13,19}$/)) {
      setError('Valid card number is required');
      return false;
    }
    if (!formData.cardExpiry.match(/^\d{2}\/\d{2}$/)) {
      setError('Card expiry must be in MM/YY format');
      return false;
    }
    if (!formData.cardCVV.match(/^\d{3,4}$/)) {
      setError('Valid CVV is required');
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
      
      // Place the order
      const result = await orderService.placeOrder();
      
      if (result.success) {
        setSuccess(true);
        // Redirect to orders page after 2 seconds
        setTimeout(() => {
          navigate('/orders', { 
            state: { 
              message: 'Order placed successfully!',
              orderNumber: result.order?.orderNumber 
            } 
          });
        }, 2000);
      } else {
        setError(result.message || 'Failed to place order');
      }
    } catch (err: any) {
      console.error('Failed to place order:', err);
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
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

  if (!cart || cart.cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <h2>Your cart is empty</h2>
          <p>Please add items before checkout</p>
        </div>
      </div>
    );
  }

  const cartTotal = cartService.calculateCartTotal(cart.cartItems);
  const tax = cartTotal * 0.1;
  const total = cartTotal + tax;

  if (success) {
    return (
      <div className="checkout-page">
        <div className="checkout-success">
          <div className="success-icon">✓</div>
          <h2>Order Placed Successfully!</h2>
          <p>Thank you for your purchase.</p>
          <p>Redirecting to your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-content">
          {/* Checkout Form */}
          <div className="checkout-form-section">
            <h1>Checkout</h1>
            
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
                      placeholder="+1 (555) 123-4567"
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
                      placeholder="New York"
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
                      placeholder="NY"
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
                      placeholder="10001"
                    />
                  </div>
                </div>
              </fieldset>

              {/* Payment Information */}
              <fieldset className="form-section">
                <legend>Payment Information</legend>
                
                <div className="form-group">
                  <label htmlFor="cardNumber">Card Number *</label>
                  <input
                    type="text"
                    id="cardNumber"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                  <small>Use 4242 4242 4242 4242 for testing</small>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="cardExpiry">Expiry Date (MM/YY) *</label>
                    <input
                      type="text"
                      id="cardExpiry"
                      name="cardExpiry"
                      value={formData.cardExpiry}
                      onChange={handleInputChange}
                      required
                      placeholder="12/25"
                      maxLength={5}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="cardCVV">CVV *</label>
                    <input
                      type="text"
                      id="cardCVV"
                      name="cardCVV"
                      value={formData.cardCVV}
                      onChange={handleInputChange}
                      required
                      placeholder="123"
                      maxLength={4}
                    />
                  </div>
                </div>
              </fieldset>

              <button 
                type="submit" 
                className="btn-place-order"
                disabled={placing}
              >
                {placing ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="checkout-summary-section">
            <h2>Order Summary</h2>
            
            <div className="summary-items">
              <h3>Items</h3>
              {cart.cartItems.map(item => (
                <div key={item.id} className="summary-item-row">
                  <span className="item-name">
                    {item.product?.name} x{item.quantity}
                  </span>
                  <span className="item-price">
                    ${(
                      (typeof item.unitPrice === 'string' 
                        ? parseFloat(item.unitPrice) 
                        : item.unitPrice) * item.quantity
                    ).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="summary-totals">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Shipping:</span>
                <span>Free</span>
              </div>
              <div className="total-row">
                <span>Tax (10%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="total-row grand-total">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

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
