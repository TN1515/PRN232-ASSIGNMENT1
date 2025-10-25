import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/apiConfig';
import orderService from '../services/orderService';
import '../styles/Debug.css';

const DebugPage: React.FC = () => {
  const { user, token, isLoading: authLoading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const updateDebugInfo = useCallback(() => {
    const info = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
      },
      api: {
        baseUrl: API_BASE_URL,
        ordersEndpoint: `${API_BASE_URL}/orders`,
        authMeEndpoint: `${API_BASE_URL}/auth/me`,
      },
      auth: {
        userLoaded: !!user,
        userObject: user ? {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
        } : null,
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 50) + '...' : null,
        authLoading,
      },
      localStorage: {
        tokenExists: !!localStorage.getItem('token'),
        userExists: !!localStorage.getItem('user'),
        tokenPreview: localStorage.getItem('token')?.substring(0, 50) + '...' || null,
      },
    };
    setDebugInfo(info);
  }, [user, token, authLoading]);

  useEffect(() => {
    updateDebugInfo();
  }, [updateDebugInfo]);

  const testAuthMe = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      setTestResults((prev: Record<string, any>) => ({
        ...prev,
        authMe: {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          data,
          timestamp: new Date().toISOString(),
        }
      }));
      
      console.log('✅ /auth/me test:', { status: response.status, data });
    } catch (error: any) {
      setTestResults((prev: Record<string, any>) => ({
        ...prev,
        authMe: {
          error: error.message,
          timestamp: new Date().toISOString(),
        }
      }));
      console.error('❌ /auth/me test failed:', error);
    }
  };

  const testOrders = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing /orders endpoint...');
      const response = await fetch(`${API_BASE_URL}/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      setTestResults((prev: Record<string, any>) => ({
        ...prev,
        orders: {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          dataType: typeof data,
          isArray: Array.isArray(data),
          itemCount: Array.isArray(data) ? data.length : 'N/A',
          firstItem: Array.isArray(data) && data.length > 0 ? data[0] : null,
          timestamp: new Date().toISOString(),
        }
      }));
      
      console.log('✅ /orders test:', { status: response.status, data });
    } catch (error: any) {
      setTestResults((prev: Record<string, any>) => ({
        ...prev,
        orders: {
          error: error.message,
          timestamp: new Date().toISOString(),
        }
      }));
      console.error('❌ /orders test failed:', error);
    }
  };

  const testOrderService = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing orderService.getUserOrders()...');
      const orders = await orderService.getUserOrders();
      
      setTestResults((prev: Record<string, any>) => ({
        ...prev,
        orderService: {
          success: true,
          dataType: typeof orders,
          isArray: Array.isArray(orders),
          itemCount: Array.isArray(orders) ? orders.length : 'N/A',
          firstItem: Array.isArray(orders) && orders.length > 0 ? orders[0] : null,
          timestamp: new Date().toISOString(),
        }
      }));
      
      console.log('✅ orderService test:', orders);
    } catch (error: any) {
      setTestResults((prev: Record<string, any>) => ({
        ...prev,
        orderService: {
          success: false,
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          timestamp: new Date().toISOString(),
        }
      }));
      console.error('❌ orderService test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearLocalStorage = () => {
    localStorage.clear();
    setDebugInfo((prev: Record<string, any>) => ({
      ...prev,
      localStorage: {
        tokenExists: false,
        userExists: false,
      }
    }));
    alert('✅ LocalStorage cleared!');
  };

  return (
    <div className="debug-page">
      <div className="debug-container">
        <h1>🧪 Debug Console</h1>

        {/* Debug Info Section */}
        <section className="debug-section">
          <h2>Environment & Configuration</h2>
          <div className="debug-box">
            <div className="debug-item">
              <h3>Environment</h3>
              <pre>{JSON.stringify(debugInfo.environment, null, 2)}</pre>
            </div>
            <div className="debug-item">
              <h3>API Configuration</h3>
              <pre>{JSON.stringify(debugInfo.api, null, 2)}</pre>
            </div>
            <div className="debug-item">
              <h3>Authentication Status</h3>
              <pre>{JSON.stringify(debugInfo.auth, null, 2)}</pre>
            </div>
            <div className="debug-item">
              <h3>LocalStorage</h3>
              <pre>{JSON.stringify(debugInfo.localStorage, null, 2)}</pre>
            </div>
          </div>
        </section>

        {/* Test Results Section */}
        <section className="debug-section">
          <h2>API Tests</h2>
          
          <div className="button-group">
            <button 
              onClick={testAuthMe} 
              className="btn-test"
              disabled={!token || loading}
            >
              🔐 Test /auth/me
            </button>
            <button 
              onClick={testOrders} 
              className="btn-test"
              disabled={!token || loading}
            >
              📦 Test /orders (Fetch)
            </button>
            <button 
              onClick={testOrderService} 
              className="btn-test"
              disabled={!token || loading}
            >
              📦 Test orderService
            </button>
            <button 
              onClick={clearLocalStorage} 
              className="btn-danger"
            >
              🗑️ Clear LocalStorage
            </button>
          </div>

          {loading && <div className="loading">Testing...</div>}

          <div className="debug-box">
            {Object.keys(testResults).length === 0 ? (
              <p>Click a test button to run tests</p>
            ) : (
              Object.entries(testResults).map(([key, value]: [string, any]) => (
                <div key={key} className="debug-item">
                  <h3>{key}</h3>
                  <pre>{JSON.stringify(value, null, 2)}</pre>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Help Section */}
        <section className="debug-section">
          <h2>❓ Troubleshooting Guide</h2>
          <div className="help-content">
            <div className="help-item">
              <h3>Issue: "Failed to load orders"</h3>
              <ul>
                <li>✅ Check "Authentication Status" above - is user loaded?</li>
                <li>✅ Is token present in localStorage?</li>
                <li>✅ Click "Test /auth/me" - should return user data with status 200</li>
                <li>✅ Click "Test /orders" - should return array with status 200</li>
                <li>✅ Click "Test orderService" - should succeed and show orders</li>
              </ul>
            </div>
            <div className="help-item">
              <h3>Common Issues & Solutions</h3>
              <ul>
                <li><strong>Status 401 (Unauthorized):</strong> JWT token is invalid or expired. Try logging out and logging back in.</li>
                <li><strong>Status 404 (Not Found):</strong> API endpoint is not available. Check if API is running.</li>
                <li><strong>Status 500 (Server Error):</strong> Backend error. Check API console for logs.</li>
                <li><strong>Network Error:</strong> Can't connect to API. Check if API is running and accessible.</li>
              </ul>
            </div>
            <div className="help-item">
              <h3>📝 Open Browser Console</h3>
              <p>Press <code>F12</code> or <code>Ctrl+Shift+I</code> to see detailed logs:</p>
              <ul>
                <li>🔐 Token validation logs</li>
                <li>📤 Request headers with token</li>
                <li>✅/❌ API response details</li>
                <li>🐛 Error stack traces</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DebugPage;
