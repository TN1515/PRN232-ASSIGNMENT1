const http = require('http');

// Test registration
function registerUser() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: 'testuser123@test.com',
      password: 'Test@123456',
      confirmPassword: 'Test@123456',
      fullName: 'Test User'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      console.log(`\n📝 Register Status: ${res.statusCode}`);
      
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          console.log('Register Response:', JSON.stringify(json, null, 2));
          resolve(json);
        } catch (e) {
          console.log('Register Response (raw):', body);
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Register Error:', e.message);
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

// Test login
function loginUser(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: email,
      password: password
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      console.log(`\n🔐 Login Status: ${res.statusCode}`);
      
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          console.log('Login Response:', JSON.stringify(json, null, 2));
          resolve(json);
        } catch (e) {
          console.log('Login Response (raw):', body);
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Login Error:', e.message);
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

// Test products endpoint
function getProducts() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/products',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      console.log(`\n📦 Products Status: ${res.statusCode}`);
      
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          console.log('Got', json.length || 0, 'products');
          resolve(json);
        } catch (e) {
          console.log('Products Response (raw, first 200 chars):', body.substring(0, 200));
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Products Error:', e.message);
      reject(e);
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  
  try {
    // Test products first
    await getProducts();
    
    // Register user
    const registerResponse = await registerUser();
    
    // Wait a bit
    await new Promise(r => setTimeout(r, 1000));
    
    // Login
    await loginUser('testuser123@test.com', 'Test@123456');
    
  } catch (error) {
    console.error('Test error:', error);
  }
  
  console.log('\n✅ Tests complete');
  process.exit(0);
}

runTests();
