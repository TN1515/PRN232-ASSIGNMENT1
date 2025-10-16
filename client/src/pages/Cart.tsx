import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import cartService, { Cart, CartItem } from '../services/cartService';
import './Cart.css';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());

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
      setCart(cartData);
    } catch (err: any) {
      console.error('Failed to load cart:', err);
      setError(err.response?.data?.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(cartItemId);
      return;
    }

    try {
      setUpdatingItems(prev => new Set(prev).add(cartItemId));
      await cartService.updateCartItem(cartItemId, newQuantity);
      
      // Update local state
      if (cart) {
        setCart({
          ...cart,
          cartItems: cart.cartItems.map(item =>
            item.id === cartItemId ? { ...item, quantity: newQuantity } : item
          ),
        });
      }
    } catch (err: any) {
      console.error('Failed to update quantity:', err);
      setError('Failed to update quantity');
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(cartItemId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (cartItemId: number) => {
    try {
      setUpdatingItems(prev => new Set(prev).add(cartItemId));
      await cartService.removeCartItem(cartItemId);
      
      // Update local state
      if (cart) {
        setCart({
          ...cart,
          cartItems: cart.cartItems.filter(item => item.id !== cartItemId),
        });
      }
    } catch (err: any) {
      console.error('Failed to remove item:', err);
      setError('Failed to remove item');
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(cartItemId);
        return next;
      });
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="cart-page">
        <div className="cart-loading">Loading cart...</div>
      </div>
    );
  }

  if (!cart || cart.cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-empty">
          <h2>Your cart is empty</h2>
          <p>Add some items to get started!</p>
          <button onClick={handleContinueShopping} className="btn-primary">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const cartTotal = cartService.calculateCartTotal(cart.cartItems);

  return (
    <div className="cart-page">
      <div className="cart-container">
        <h1>Shopping Cart</h1>
        
        {error && <div className="error-message">{error}</div>}

        <div className="cart-content">
          <div className="cart-items-section">
            <h2>Items in Cart</h2>
            <div className="cart-items-list">
              {cart.cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-image">
                    {item.product?.image ? (
                      <img src={item.product.image} alt={item.product.name} />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>
                  
                  <div className="item-details">
                    <h3>{item.product?.name || 'Product'}</h3>
                    <p className="item-price">
                      ${typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice}
                    </p>
                  </div>

                  <div className="item-quantity">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={updatingItems.has(item.id)}
                      className="qty-btn"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value))}
                      disabled={updatingItems.has(item.id)}
                      className="qty-input"
                    />
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      disabled={updatingItems.has(item.id)}
                      className="qty-btn"
                    >
                      +
                    </button>
                  </div>

                  <div className="item-total">
                    ${(
                      (typeof item.unitPrice === 'string' 
                        ? parseFloat(item.unitPrice) 
                        : item.unitPrice) * item.quantity
                    ).toFixed(2)}
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={updatingItems.has(item.id)}
                    className="btn-remove"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>
            <div className="summary-items">
              <div className="summary-item">
                <span>Subtotal:</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="summary-item">
                <span>Shipping:</span>
                <span>Free</span>
              </div>
              <div className="summary-item">
                <span>Tax:</span>
                <span>${(cartTotal * 0.1).toFixed(2)}</span>
              </div>
              <div className="summary-item total">
                <span>Total:</span>
                <span>${(cartTotal * 1.1).toFixed(2)}</span>
              </div>
            </div>

            <button onClick={handleCheckout} className="btn-checkout">
              Proceed to Checkout
            </button>
            <button onClick={handleContinueShopping} className="btn-continue">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
