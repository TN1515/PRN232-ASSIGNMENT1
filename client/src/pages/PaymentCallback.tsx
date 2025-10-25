import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import paymentService from '../services/paymentService';
import orderService from '../services/orderService';
import './PaymentCallback.css';

const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, token, isLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'cancelled'>('loading');
  const [message, setMessage] = useState('Processing payment...');
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const code = searchParams.get('code');
        const id = searchParams.get('id');

        console.log('🔐 Payment callback received:', { code, id, user, token });

        if (!code || !id) {
          setStatus('failed');
          setMessage('Invalid payment parameters');
          return;
        }

        // Code: 0 = Success, 1 = Failed, 2 = Cancelled, 3 = Pending
        if (code === '0') {
          // Success - verify with backend
          try {
            const result = await paymentService.verifyPayment(id);
            
            if (result.success) {
              setStatus('success');
              setMessage('Payment successful! Redirecting to your orders...');
              setOrderNumber(result.orderNumber);
              
              setTimeout(() => {
                navigate('/orders', { 
                  state: { 
                    message: 'Payment successful! Order confirmed.',
                    orderNumber: result.orderNumber 
                  } 
                });
              }, 2000);
            } else {
              setStatus('failed');
              setMessage(result.message || 'Payment verification failed');
            }
          } catch (err: any) {
            console.error('Verification error:', err);
            setStatus('failed');
            setMessage('Failed to verify payment');
          }
        } else if (code === '2') {
          setStatus('cancelled');
          setMessage('Payment was cancelled. Redirecting back to checkout...');
          
          // Cancel the order since payment was cancelled
          try {
            const orderId = parseInt(id, 10);
            if (orderId) {
              await orderService.cancelOrder(orderId);
              console.log('✅ Order cancelled due to user cancelling payment');
            }
          } catch (err) {
            console.warn('⚠️ Failed to cancel order:', err);
          }
          
          setTimeout(() => {
            navigate('/checkout');
          }, 2000);
        } else {
          setStatus('failed');
          setMessage('Payment failed. Please try again.');
          
          // Cancel the order since payment failed
          try {
            const orderId = parseInt(id, 10);
            if (orderId) {
              await orderService.cancelOrder(orderId);
              console.log('✅ Order cancelled due to payment failure');
            }
          } catch (err) {
            console.warn('⚠️ Failed to cancel order:', err);
          }
          
          setTimeout(() => {
            navigate('/checkout');
          }, 2000);
        }
      } catch (error: any) {
        console.error('Payment callback error:', error);
        setStatus('failed');
        setMessage('Error processing payment');
      }
    };

    // Wait for auth context to finish loading
    if (isLoading) {
      console.log('⏳ Waiting for auth context to load...');
      return;
    }

    // Check if user is authenticated (either user object or token exists)
    if (user || token) {
      console.log('✅ User authenticated, proceeding with payment verification');
      verifyPayment();
    } else {
      console.warn('❌ No user or token found, redirecting to login');
      navigate('/login');
    }
  }, [searchParams, navigate, user, token, isLoading]);

  return (
    <div className="payment-callback">
      <div className="callback-container">
        {status === 'loading' && (
          <div className="callback-loading">
            <div className="spinner"></div>
            <h2>{message}</h2>
            <p>Please wait while we verify your payment...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="callback-success">
            <div className="success-icon">✓</div>
            <h2>Payment Successful!</h2>
            <p>{message}</p>
            {orderNumber && <p className="order-number">Order: {orderNumber}</p>}
          </div>
        )}

        {status === 'cancelled' && (
          <div className="callback-cancelled">
            <div className="cancelled-icon">✕</div>
            <h2>Payment Cancelled</h2>
            <p>{message}</p>
            <p>Returning to checkout...</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="callback-failed">
            <div className="failed-icon">✕</div>
            <h2>Payment Failed</h2>
            <p>{message}</p>
            <p>Please try again or contact support.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;
