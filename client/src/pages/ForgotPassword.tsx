import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Auth.css';

const ForgotPassword: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    securityAnswer: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email: formData.email,
      });

      if (response.data.success) {
        setSuccess('Password reset token has been generated. Please proceed to reset your password.');
        
        // Auto-navigate to reset password page after 2 seconds
        setTimeout(() => {
          navigate('/reset-password', { 
            state: { 
              email: formData.email,
              resetToken: response.data.resetToken 
            } 
          });
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to process request');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.Message || 'An error occurred. Please try again.';
      setError(errorMessage);
      console.error('Forgot password error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Forgot Password</h2>
        <p className="auth-description">
          Enter your email address to reset your password.
        </p>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your registered email"
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-submit" disabled={loading}>
              {loading ? 'Processing...' : 'Continue'}
            </button>
          </form>
        )}

        <p className="auth-link">
          Remember your password? <a href="/login">Back to Login</a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
