import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseDown = (buttonId: string) => {
    setActiveButton(buttonId);
  };

  const handleMouseUp = () => {
    setActiveButton(null);
  };

  return (
    <nav className={`navigation ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">🛍️</span>
          <span className="logo-text">
            <span className="logo-main">Fashion</span>
            <span className="logo-sub">Store</span>
          </span>
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' ? 'active' : ''} ${activeButton === 'home' ? 'clicking' : ''}`}
              onMouseDown={() => handleMouseDown('home')}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <span className="nav-icon">⌂</span>
              <span>Home</span>
            </Link>
          </li>
          {user && (
            <li className="nav-item">
              <Link 
                to="/products/new" 
                className={`nav-link ${location.pathname === '/products/new' ? 'active' : ''} ${activeButton === 'add-product' ? 'clicking' : ''}`}
                onMouseDown={() => handleMouseDown('add-product')}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <span className="nav-icon">+</span>
                <span>Add Product</span>
              </Link>
            </li>
          )}
          {user ? (
            <>
              <li className="nav-item">
                <Link 
                  to="/cart" 
                  className={`nav-link ${location.pathname === '/cart' ? 'active' : ''}`}
                >
                  <span className="nav-icon">🛒</span>
                  <span>Cart</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  to="/orders" 
                  className={`nav-link ${location.pathname === '/orders' ? 'active' : ''}`}
                >
                  <span className="nav-icon">📦</span>
                  <span>Orders</span>
                </Link>
              </li>
              <li className="nav-item nav-user">
                <span className="nav-user-name">👤 {user.fullName}</span>
                <button 
                  className="nav-link btn-logout"
                  onClick={logout}
                >
                  <span>Logout</span>
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link 
                  to="/login" 
                  className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
                >
                  <span>Login</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  to="/register" 
                  className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}
                >
                  <span>Register</span>
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;