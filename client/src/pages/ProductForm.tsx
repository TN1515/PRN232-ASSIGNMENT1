import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import './ProductForm.css';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  image: string;
}

const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'new');
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    image: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (isEdit && id) {
      fetchProduct(parseInt(id));
    } else {
      setInitialLoad(false);
    }
  }, [id, isEdit]);

  const fetchProduct = async (productId: number) => {
    try {
      setLoading(true);
      const product = await productService.getProduct(productId);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image || ''
      });
      setError(null);
    } catch (err) {
      setError('Failed to fetch product. Please try again.');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Convert image to base64 data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({
          ...prev,
          image: base64String
        }));
        setLoading(false);
      };
      reader.onerror = () => {
        setError('Failed to read image file.');
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      console.error('Error uploading image:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim() || formData.price <= 0) {
      setError('Please fill in all required fields with valid values.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      if (isEdit && id) {
        await productService.updateProduct(parseInt(id), {
          id: parseInt(id),
          ...formData
        });
      } else {
        await productService.createProduct(formData);
      }
      
      navigate('/');
    } catch (err) {
      setError(`Failed to ${isEdit ? 'update' : 'create'} product. Please try again.`);
      console.error(`Error ${isEdit ? 'updating' : 'creating'} product:`, err);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad && loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="product-form-page">
      <div className="container">
        <button onClick={() => navigate('/')} className="btn btn-secondary back-btn">
          ← Back to Products
        </button>
        
        <div className="form-container">
          <h1>{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-group">
              <label htmlFor="name">Product Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                maxLength={200}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                maxLength={1000}
                rows={4}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">Price *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0.01"
                step="0.01"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="image">Image URL (Optional)</label>
              <div className="image-input-wrapper">
                <input
                  type="url"
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="Enter product image URL"
                  disabled={loading}
                />
                <input
                  type="file"
                  id="imageFile"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="btn btn-upload"
                  onClick={() => document.getElementById('imageFile')?.click()}
                  disabled={loading}
                >
                  📁 Upload
                </button>
              </div>
              {formData.image && (
                <div className="image-preview">
                  <img src={formData.image} alt="Product preview" />
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;