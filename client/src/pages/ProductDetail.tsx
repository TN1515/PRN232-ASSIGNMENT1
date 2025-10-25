import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import cartService from '../services/cartService';
import { Product } from '../types/Product';
import { formatPriceVND } from '../utils/priceFormatter';
import './ProductDetail.css';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProduct(parseInt(id));
    }
  }, [id]);

  const fetchProduct = async (productId: number) => {
    try {
      setLoading(true);
      const fetchedProduct = await productService.getProduct(productId);
      setProduct(fetchedProduct);
      setError(null);
    } catch (err) {
      setError('Failed to fetch product. Please try again later.');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || !user) {
      navigate('/login');
      return;
    }

    try {
      setAddingToCart(true);
      setError(null);
      await cartService.addToCart(product.id, quantity);
      setSuccess('Added to cart successfully!');
      setQuantity(1);
      
      // Navigate to cart page after 1 second to show success message
      setTimeout(() => {
        navigate('/cart');
      }, 1000);
    } catch (err: any) {
      console.error('Error adding to cart:', err);
      setError(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(product.id);
        
        // Navigate to home page with state to indicate a deletion occurred
        // This helps the HomePage component handle the refresh properly
        navigate('/', { 
          replace: true,
          state: { 
            productDeleted: true,
            deletedProductId: product.id 
          } 
        });
      } catch (err) {
        setError('Failed to delete product. Please try again.');
        console.error('Error deleting product:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading product...</p>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="error">
        <p>Product not found</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="product-detail">
      <div className="container">
        <button onClick={() => navigate('/')} className="btn btn-secondary back-btn">
          ← Back to Products
        </button>
        <div className="product-detail-content">
          <div className="product-image-large">
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.name}
              />
            ) : (
              <div className="no-image-placeholder-large">
                <span>No Image Available</span>
              </div>
            )}
          </div>
          <div className="product-info-detailed">
            <h1>{product.name}</h1>
            <p className="product-price-large">{formatPriceVND(product.price)}</p>
            <div className="product-description-full">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>
            <div className="product-meta">
              <p><strong>Created:</strong> {new Date(product.createdAt).toLocaleDateString()}</p>
              <p><strong>Updated:</strong> {new Date(product.updatedAt).toLocaleDateString()}</p>
            </div>

            {/* Shopping Section */}
            <div className="product-shopping">
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              
              <div className="quantity-selector">
                <label htmlFor="quantity">Quantity:</label>
                <div className="quantity-input">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={addingToCart}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    disabled={addingToCart}
                  />
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={addingToCart}
                  >
                    +
                  </button>
                </div>
              </div>

              {user ? (
                <button 
                  className="btn btn-success btn-add-to-cart"
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                >
                  {addingToCart ? 'Adding...' : 'Add to Cart 🛒'}
                </button>
              ) : (
                <button 
                  className="btn btn-success btn-add-to-cart"
                  onClick={() => navigate('/login')}
                >
                  Login to Purchase
                </button>
              )}
            </div>

            {/* Admin Actions */}
            {user && (
              <div className="product-actions-detailed">
                <button 
                  onClick={() => navigate(`/products/${product.id}/edit`)} 
                  className="btn btn-primary"
                >
                  Edit Product
                </button>
                <button onClick={handleDelete} className="btn btn-danger">
                  Delete Product
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;