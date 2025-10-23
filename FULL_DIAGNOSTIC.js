/**
 * BROWSER CONSOLE DIAGNOSTIC - PASTE THIS IN F12 CONSOLE
 * This will tell you EXACTLY what's wrong
 */

async function runFullDiagnostic() {
  console.clear();
  console.log('🔧 STARTING FULL DIAGNOSTIC...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {}
  };

  // Test 1: Environment Info
  console.log('📋 Test 1: Environment Information');
  results.tests.environment = {
    currentUrl: window.location.href,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    origin: window.location.origin,
    userAgent: navigator.userAgent.substring(0, 100)
  };
  console.table(results.tests.environment);

  // Test 2: Backend Connectivity
  console.log('\n🌐 Test 2: Backend Connectivity');
  try {
    const response = await fetch('https://prn232-assignment1-kcez.onrender.com/api/products');
    results.tests.backend = {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'content-type': response.headers.get('content-type'),
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'x-render-origin-server': response.headers.get('x-render-origin-server')
      },
      success: response.ok
    };
    console.log('✅ Backend Response:', results.tests.backend);
  } catch (error) {
    results.tests.backend = {
      status: 'ERROR',
      message: error.message,
      type: error.name,
      success: false
    };
    console.error('❌ Backend Error:', results.tests.backend);
  }

  // Test 3: CORS Check
  console.log('\n🔄 Test 3: CORS Configuration');
  try {
    const corsTest = await fetch('https://prn232-assignment1-kcez.onrender.com/api/products', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': corsTest.headers.get('access-control-allow-origin'),
      'Access-Control-Allow-Methods': corsTest.headers.get('access-control-allow-methods'),
      'Access-Control-Allow-Headers': corsTest.headers.get('access-control-allow-headers'),
      'Access-Control-Allow-Credentials': corsTest.headers.get('access-control-allow-credentials')
    };
    
    results.tests.cors = corsHeaders;
    console.log('✅ CORS Headers:', corsHeaders);
  } catch (error) {
    results.tests.cors = { error: error.message };
    console.error('❌ CORS Test Error:', error.message);
  }

  // Test 4: SSL Certificate
  console.log('\n🔒 Test 4: SSL Certificate');
  try {
    const response = await fetch('https://prn232-assignment1-kcez.onrender.com/');
    results.tests.ssl = {
      status: 'OK',
      message: 'SSL certificate is valid',
      statusCode: response.status
    };
    console.log('✅ SSL Certificate:', results.tests.ssl);
  } catch (error) {
    results.tests.ssl = {
      status: 'ERROR',
      message: error.message
    };
    if (error.message.includes('certificate')) {
      console.error('⚠️ CERTIFICATE ERROR DETECTED');
    }
    console.error('❌ SSL Check:', results.tests.ssl);
  }

  // Test 5: Local Storage
  console.log('\n💾 Test 5: Local Storage');
  results.tests.localStorage = {
    token: localStorage.getItem('token') ? '✅ Present' : '❌ Missing',
    user: localStorage.getItem('user') ? '✅ Present' : '❌ Missing',
    keys: Object.keys(localStorage)
  };
  console.log('Local Storage:', results.tests.localStorage);

  // Test 6: Network Timing
  console.log('\n⏱️ Test 6: Network Timing');
  const startTime = Date.now();
  try {
    await fetch('https://prn232-assignment1-kcez.onrender.com/api/products');
    const timeTaken = Date.now() - startTime;
    results.tests.timing = {
      milliseconds: timeTaken,
      seconds: (timeTaken / 1000).toFixed(2),
      status: timeTaken > 5000 ? '⚠️ SLOW' : '✅ NORMAL'
    };
    console.log('Response time:', results.tests.timing);
  } catch (error) {
    results.tests.timing = { error: error.message };
  }

  // Test 7: Chrome Safe Browsing Status
  console.log('\n🛡️ Test 7: Chrome Safe Browsing');
  console.log('If you see "Dangerous site" warning:');
  console.log('→ Type: thisisunsafe (while warning visible)');
  console.log('→ Or click: Details → Visit this unsafe site');
  console.log('→ This is Chrome\'s security feature, not your app\'s fault');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(60));
  
  const backendWorking = results.tests.backend.success;
  const corsOk = results.tests.cors['Access-Control-Allow-Origin'] !== null;
  const sslOk = results.tests.ssl.status === 'OK';

  console.log('Backend working:', backendWorking ? '✅' : '❌');
  console.log('CORS configured:', corsOk ? '✅' : '❌');
  console.log('SSL certificate:', sslOk ? '✅' : '❌');

  if (backendWorking && corsOk && sslOk) {
    console.log('\n✅ ALL SYSTEMS OPERATIONAL - App should work!');
    console.log('If you see "Dangerous site" warning, just bypass it:');
    console.log('1. Click "Details"');
    console.log('2. Click "Visit this unsafe site"');
  } else {
    console.log('\n❌ Issues detected:');
    if (!backendWorking) console.log('  - Backend not responding');
    if (!corsOk) console.log('  - CORS headers missing');
    if (!sslOk) console.log('  - SSL certificate issue');
  }

  console.log('\n📋 Full results available at window.diagnosticResults');
  window.diagnosticResults = results;
  
  return results;
}

// Run it
console.log('💡 Running diagnostic. This may take a few seconds...\n');
runFullDiagnostic().catch(e => console.error('Diagnostic failed:', e));
