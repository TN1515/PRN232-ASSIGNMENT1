import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { Product } from '../types/Product';
import './ProductDetail.css';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (error) {
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
            <p className="product-price-large">${product.price.toFixed(2)}</p>
            <div className="product-description-full">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>
            <div className="product-meta">
              <p><strong>Created:</strong> {new Date(product.createdAt).toLocaleDateString()}</p>
              <p><strong>Updated:</strong> {new Date(product.updatedAt).toLocaleDateString()}</p>
            </div>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;