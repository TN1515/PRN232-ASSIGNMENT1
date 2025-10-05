import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { productService } from '../services/productService';
import { Product } from '../types/Product';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import FilterButtons from '../components/FilterButtons';
import './HomePage.css';

const HomePage: React.FC = () => {
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 9;

  const fetchProducts = useCallback(async (params: {
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
  } = {}) => {
    try {
      setLoading(true);
      const response = await productService.searchProducts({
        ...params,
        page: params.page || currentPage,
        pageSize: itemsPerPage
      });
      
      setProducts(response.products);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
      setError(null);
    } catch (err) {
      setError('Failed to fetch products. Please try again later.');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchProducts({
      search: searchTerm,
      minPrice,
      maxPrice,
      page: currentPage
    });
  }, [searchTerm, minPrice, maxPrice, currentPage, fetchProducts]);

  // Handle navigation state from ProductDetail deletion
  useEffect(() => {
    const state = location.state as { productDeleted?: boolean; deletedProductId?: number } | null;
    if (state?.productDeleted) {
      // Clear the navigation state to prevent repeated effects
      window.history.replaceState({}, document.title);
      
      // Reset to page 1 and clear any filters to show all remaining products
      // This prevents the user from staying on an empty filtered view
      setCurrentPage(1);
      setSearchTerm('');
      setMinPrice(undefined);
      setMaxPrice(undefined);
      setActiveFilter('all');
      
      // Fetch fresh data
      fetchProducts({
        search: '',
        minPrice: undefined,
        maxPrice: undefined,
        page: 1
      });
    }
  }, [location.state, fetchProducts]);

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePriceFilter = (min?: number, max?: number) => {
    setMinPrice(min);
    setMaxPrice(max);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setActiveFilter('all');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      await productService.deleteProduct(id);
      
      // If we're on the last page and it only has 1 item, go to previous page
      // This prevents showing empty pages after deletion
      let targetPage = currentPage;
      if (products.length === 1 && currentPage > 1) {
        targetPage = currentPage - 1;
        setCurrentPage(targetPage);
      }
      
      // Refresh the products after deletion
      fetchProducts({
        search: searchTerm,
        minPrice,
        maxPrice,
        page: targetPage
      });
    } catch (err) {
      setError('Failed to delete product. Please try again.');
      console.error('Error deleting product:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  const handleTestConnection = async () => {
    console.log('Testing API connection...');
    const isConnected = await productService.testConnection();
    console.log('Connection test result:', isConnected);
  };

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={() => fetchProducts()} className="btn btn-primary">
            Try Again
          </button>
          <button onClick={handleTestConnection} className="btn btn-secondary">
            Test Connection
          </button>
        </div>
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
          <p>Check browser console for debug information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="container">
        <div className="header">
          <h1>✨ Our Premium Collection ✨</h1>
          <p>Discover our handcrafted selection of modern fashion pieces designed for the contemporary lifestyle</p>
        </div>
        {products.length === 0 ? (
          <div className="no-products">
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No Products Yet</h3>
              <p>Start building your collection by adding your first product!</p>
              <Link to="/products/new" className="btn btn-primary cta-button">
                🚀 Add Your First Product
              </Link>
            </div>
          </div>
        ) : (
          <>
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search products by name or description..."
              disabled={loading}
            />
            
            <FilterButtons 
              onPriceFilter={(min, max) => {
                handlePriceFilter(min, max);
                setActiveFilter(
                  !min && !max ? 'all' :
                  min === 0 && max === 30 ? 'under30' :
                  min === 30 && max === 60 ? '30-60' :
                  min === 60 && max === 100 ? '60-100' :
                  min === 100 && !max ? 'over100' : 'custom'
                );
              }}
              onClearFilters={handleClearFilters}
              activeFilter={activeFilter}
            />
            
            <div className="products-header">
              <div className="products-stats">
                <span className="stat-item">
                  <span className="stat-number">{totalItems}</span>
                  <span className="stat-label">Products Found</span>
                </span>
              </div>
            </div>
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>

            {/* Pagination - hiển thị khi có ít nhất 1 sản phẩm */}
            {products.length > 0 && (
              <div className="pagination-container">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;