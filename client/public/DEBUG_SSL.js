/**
 * CRITICAL DEBUG: Check if it's actually an SSL Certificate Issue
 * Run this in browser console: F12 > Console tab > paste this entire code
 */

async function checkCertificateIssue() {
  console.log('🔍 CHECKING FOR CERTIFICATE/SSL ISSUES...\n');
  
  try {
    // Test 1: Direct HTTPS call to Render backend
    console.log('Test 1: Direct HTTPS call to Render backend');
    const response1 = await fetch('https://prn232-assignment1-kcez.onrender.com/api/products');
    console.log('✅ Direct fetch succeeded:', response1.status);
    console.log('   Headers:', {
      'content-type': response1.headers.get('content-type'),
      'x-render-origin-server': response1.headers.get('x-render-origin-server')
    });
  } catch (error) {
    console.error('❌ Direct fetch failed:', error.message);
    if (error.message.includes('certificate')) {
      console.error('   ⚠️ SSL CERTIFICATE ISSUE DETECTED');
    }
  }
  
  try {
    // Test 2: Check if it's a CORS issue
    console.log('\n\nTest 2: CORS Headers Check');
    const response2 = await fetch('https://prn232-assignment1-kcez.onrender.com/api/products', {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'GET'
      }
    }).catch(e => ({error: e.message}));
    
    if (response2.error) {
      console.error('❌ CORS preflight failed:', response2.error);
    } else {
      console.log('✅ CORS check response:', response2.status);
    }
  } catch (error) {
    console.error('❌ CORS test error:', error.message);
  }

  try {
    // Test 3: Check browser's Safe Browsing database
    console.log('\n\nTest 3: Browser Safe Browsing Status');
    console.log('⚠️ If you see "Dangerous site" warning:');
    console.log('   → It\'s Chrome\'s Safe Browsing protection');
    console.log('   → NOT your app\'s fault');
    console.log('   → Click "Proceed" to bypass');
  } catch (error) {
    console.error('❌ Test 3 error:', error.message);
  }

  try {
    // Test 4: Network check
    console.log('\n\nTest 4: Network Details');
    const networkInfo = {
      'Current URL': window.location.href,
      'Frontend Host': window.location.hostname,
      'Frontend Protocol': window.location.protocol,
      'Backend URL': 'https://prn232-assignment1-kcez.onrender.com/api',
      'Same Origin?': window.location.origin === 'https://prn232-assignment1-kcez.onrender.com'
    };
    console.table(networkInfo);
  } catch (error) {
    console.error('❌ Network info error:', error.message);
  }
}

// Run it
checkCertificateIssue();
