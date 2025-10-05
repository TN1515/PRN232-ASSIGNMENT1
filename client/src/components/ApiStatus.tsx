import React, { useState, useEffect } from 'react';

const ApiStatus: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline' | 'mock'>('checking');
  
  useEffect(() => {
    // Check API status on component mount
    const checkApiStatus = async () => {
      try {
        // Try to fetch a simple endpoint
        const response = await fetch(`${process.env.REACT_APP_API_URL_PRODUCTION?.replace('/swagger/', '/api')}/products`);
        if (response.ok) {
          setApiStatus('online');
        } else {
          setApiStatus('offline');
        }
      } catch (error) {
        console.warn('API check failed, using mock data mode');
        setApiStatus('mock');
      }
    };
    
    // Only check in production
    if (process.env.NODE_ENV === 'production') {
      checkApiStatus();
    } else {
      setApiStatus('online'); // Assume local is working
    }
  }, []);

  if (apiStatus === 'checking') {
    return null; // Don't show anything while checking
  }

  const getStatusConfig = () => {
    switch (apiStatus) {
      case 'online':
        return { color: '#28a745', text: '🟢 API Connected', show: false };
      case 'offline':
        return { color: '#dc3545', text: '🔴 API Offline', show: true };
      case 'mock':
        return { color: '#ffc107', text: '⚠️ Demo Mode', show: true };
      default:
        return { color: '#6c757d', text: '⚪ Unknown', show: false };
    }
  };

  const config = getStatusConfig();
  
  if (!config.show) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      color: config.color,
      padding: '8px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold',
      border: `1px solid ${config.color}`,
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {config.text}
    </div>
  );
};

export default ApiStatus;