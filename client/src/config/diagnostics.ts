/**
 * API Health Check & Diagnostics
 * Run this in browser console to diagnose deployment issues
 */

export const apiDiagnostics = async () => {
  console.clear();
  console.log('%c🔍 API Health Check & Diagnostics', 'color: blue; font-size: 16px; font-weight: bold;');
  console.log('=====================================\n');

  // 1. Check Environment
  console.log('%c📍 Environment Information', 'color: green; font-weight: bold;');
  console.log('Hostname:', window.location.hostname);
  console.log('Protocol:', window.location.protocol);
  console.log('Full URL:', window.location.href);
  console.log('Environment:', process.env.NODE_ENV);
  console.log();

  // 2. Check API Configuration
  console.log('%c⚙️ API Configuration', 'color: green; font-weight: bold;');
  try {
    const { API_BASE_URL, getApiUrl } = await import('../config/apiConfig');
    console.log('API Base URL:', API_BASE_URL);
    console.log('Example Product URL:', getApiUrl('/products'));
    console.log('Example Auth URL:', getApiUrl('/auth/login'));
    console.log('Example Products Endpoint:', getApiUrl('/products/1'));
    console.log();

    // 3. Test Connectivity
    console.log('%c🌐 Testing Backend Connectivity', 'color: green; font-weight: bold;');
    try {
      const response = await fetch(API_BASE_URL + '/products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ Backend is reachable!');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Response Headers:');
      response.headers.forEach((value, key) => {
        if (key.toLowerCase().includes('access-control') || key.toLowerCase().includes('content')) {
          console.log(`  ${key}:`, value);
        }
      });
      console.log();

      // Try to parse response
      const data = await response.json();
      console.log('Response Data:', data);
      console.log();
    } catch (fetchError: any) {
      console.error('❌ Backend connection failed!');
      console.error('Error:', fetchError.message);
      console.log('\nTroubleshooting:');
      console.log('1. Check if Render API is running');
      console.log('2. Verify API URL is correct:', API_BASE_URL);
      console.log('3. Check browser Network tab for CORS errors');
      console.log('4. Verify SSL certificate is valid');
      console.log();
    }

    // 4. Check Local Storage
    console.log('%c💾 Local Storage', 'color: green; font-weight: bold;');
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('Token present:', !!token);
    console.log('User present:', !!user);
    if (token) {
      console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
    }
    console.log();

    // 5. Test Authentication Endpoint
    console.log('%c🔐 Testing Authentication Endpoint', 'color: green; font-weight: bold;');
    try {
      const authResponse = await fetch(API_BASE_URL + '/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'test',
        }),
      });

      console.log('Auth endpoint reachable!');
      console.log('Status:', authResponse.status);
      const authData = await authResponse.json();
      console.log('Response:', authData);
      console.log();
    } catch (authError: any) {
      console.error('Auth endpoint error:', authError.message);
      console.log();
    }

  } catch (error: any) {
    console.error('Error running diagnostics:', error);
  }

  console.log('%c✅ Diagnostics complete!', 'color: green; font-size: 14px; font-weight: bold;');
  console.log('If you see "Backend is reachable!" and no errors above, your API is working correctly.\n');
};

// Make it accessible globally
(window as any).apiDiagnostics = apiDiagnostics;

export default apiDiagnostics;
