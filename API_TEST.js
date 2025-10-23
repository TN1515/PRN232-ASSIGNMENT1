/**
 * Simple API Test - Copy & paste entire content into browser console
 * This helps diagnose the exact issue
 */

(async function testAPI() {
  console.clear();
  console.log('%c🔍 API Connectivity Test', 'color: blue; font-size: 18px; font-weight: bold;');
  console.log('================================================\n');

  const apiUrl = 'https://prn232-assignment1-kcez.onrender.com/api';

  // Test 1: Simple fetch
  console.log('%c1️⃣ Testing Simple Fetch', 'color: green; font-weight: bold;');
  try {
    const response = await fetch(`${apiUrl}/products`);
    console.log('✅ Fetch successful');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:');
    for (const [key, value] of response.headers) {
      if (key.toLowerCase().includes('access-control') || key.toLowerCase().includes('content-type')) {
        console.log(`  ${key}: ${value}`);
      }
    }
  } catch (error) {
    console.error('❌ Fetch failed:', error.message);
  }
  console.log();

  // Test 2: Fetch with credentials
  console.log('%c2️⃣ Testing Fetch with Credentials', 'color: green; font-weight: bold;');
  try {
    const response = await fetch(`${apiUrl}/products`, {
      credentials: 'include',
    });
    console.log('✅ Fetch with credentials successful');
    console.log('Status:', response.status);
  } catch (error) {
    console.error('❌ Fetch with credentials failed:', error.message);
  }
  console.log();

  // Test 3: POST request (Login simulation)
  console.log('%c3️⃣ Testing POST Request (Login)', 'color: green; font-weight: bold;');
  try {
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'test123',
      }),
    });
    console.log('✅ POST request successful');
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('❌ POST request failed:', error.message);
  }
  console.log();

  // Test 4: Check local storage
  console.log('%c4️⃣ Checking Local Storage', 'color: green; font-weight: bold;');
  console.log('Token:', localStorage.getItem('token') ? 'Present' : 'Empty');
  console.log('User:', localStorage.getItem('user') ? 'Present' : 'Empty');
  console.log();

  // Test 5: Environment check
  console.log('%c5️⃣ Environment Information', 'color: green; font-weight: bold;');
  console.log('Hostname:', window.location.hostname);
  console.log('Protocol:', window.location.protocol);
  console.log('Full URL:', window.location.href);
  console.log();

  console.log('%c✅ Test Complete', 'color: green; font-size: 16px; font-weight: bold;');
  console.log('If you see errors above, that\'s the issue to fix');
})();
