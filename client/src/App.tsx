import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import ProductDetail from './pages/ProductDetail';
import ProductForm from './pages/ProductForm';
import Register from './pages/Register';
import Login from './pages/Login';
import CartPage from './pages/Cart';
import CheckoutPage from './pages/Checkout';
import OrdersPage from './pages/Orders';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navigation />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/products/new" element={<ProductForm />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/products/:id/edit" element={<ProductForm />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<OrdersPage />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
