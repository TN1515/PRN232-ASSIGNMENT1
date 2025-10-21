import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Auth.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email: email,
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        // In production, the token would be sent via email
        // For development, we display it
        if (response.data.resetToken) {
          setResetToken(response.data.resetToken);
        }
      } else {
        setError(response.data.message || 'Failed to send reset link');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.Message || 'An error occurred. Please try again.';
      setError(errorMessage);
      console.error('Forgot password error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToReset = () => {
    navigate('/reset-password', { state: { token: resetToken } });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Forgot Password</h2>
        <p className="auth-description">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">
            {success}
            {resetToken && (
              <div style={{ marginTop: '15px' }}>
                <p><strong>Development Mode:</strong> Your reset token:</p>
                <code style={{ 
                  display: 'block', 
                  padding: '10px', 
                  background: '#f5f5f5', 
                  borderRadius: '4px',
                  wordBreak: 'break-all',
                  fontSize: '12px',
                  marginTop: '10px'
                }}>
                  {resetToken}
                </code>
                <button 
                  type="button" 
                  className="btn btn-submit" 
                  onClick={handleGoToReset}
                  style={{ marginTop: '15px' }}
                >
                  Go to Reset Password
                </button>
              </div>
            )}
          </div>
        )}
        
        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
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
