import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiClient } from '../config/axiosClient';
import { getApiUrl } from '../config/apiConfig';
import '../styles/Auth.css';

const ForgotPassword: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
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

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const apiClient = getApiClient();
      const response = await apiClient.post(getApiUrl('/auth/forgot-password'), {
        email: formData.email,
      });

      if (response.data.success) {
        // ✅ Security fix: No longer receiving reset token in response
        // Token will be sent via email (in production)
        // For testing, we show a success message
        setSuccess('Check your email for password reset instructions');
        
        // Clear form after 3 seconds
        setTimeout(() => {
          setFormData({ email: '' });
          navigate('/login');
        }, 3000);
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
              {loading ? 'Processing...' : 'Send Reset Link'}
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
