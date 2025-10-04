import React from 'react';
import { Product } from '../types/Product';
import { Link } from 'react-router-dom';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  onDelete: (id: number) => Promise<void>;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onDelete }) => {
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await onDelete(product.id);
    }
  };

  return (
    <div className="product-card">
      <div className="product-image">
        <img 
          src={product.image || 'https://via.placeholder.com/300x300?text=No+Image'} 
          alt={product.name}
        />
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <p className="product-price">${product.price.toFixed(2)}</p>
        <div className="product-actions">
          <Link to={`/products/${product.id}`} className="btn btn-primary">
            View Details
          </Link>
          <Link to={`/products/${product.id}/edit`} className="btn btn-secondary">
            Edit
          </Link>
          <button onClick={handleDelete} className="btn btn-danger">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;