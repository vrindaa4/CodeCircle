const axios = require('axios');

const API_BASE_URL = 'http://localhost:5050/api';

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'TestPass123',
  confirmPassword: 'TestPass123'
};

let authToken = null;

// Test functions
const testRegistration = async () => {
  console.log('🧪 Testing User Registration...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    console.log('✅ Registration successful:', response.data.message);
    authToken = response.data.data.token;
    return true;
  } catch (error) {
    console.log('❌ Registration failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testLogin = async () => {
  console.log('\n🧪 Testing User Login...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful:', response.data.message);
    authToken = response.data.data.token;
    return true;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testProfileAccess = async () => {
  console.log('\n🧪 Testing Protected Profile Access...');
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Profile access successful');
    console.log('👤 User data:', response.data.data.user);
    return true;
  } catch (error) {
    console.log('❌ Profile access failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testProfileUpdate = async () => {
  console.log('\n🧪 Testing Profile Update...');
  try {
    const updateData = {
      bio: 'This is my updated bio for testing!',
      username: 'updateduser'
    };
    
    const response = await axios.put(`${API_BASE_URL}/auth/profile`, updateData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Profile update successful:', response.data.message);
    return true;
  } catch (error) {
    console.log('❌ Profile update failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testTokenVerification = async () => {
  console.log('\n🧪 Testing Token Verification...');
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Token verification successful:', response.data.message);
    return true;
  } catch (error) {
    console.log('❌ Token verification failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testLogout = async () => {
  console.log('\n🧪 Testing Logout...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Logout successful:', response.data.message);
    return true;
  } catch (error) {
    console.log('❌ Logout failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testInvalidToken = async () => {
  console.log('\n🧪 Testing Invalid Token Access...');
  try {
    await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': 'Bearer invalid_token_here'
      }
    });
    console.log('❌ Should have failed with invalid token');
    return false;
  } catch (error) {
    console.log('✅ Correctly rejected invalid token:', error.response?.data?.message);
    return true;
  }
};

// Run all tests
const runTests = async () => {
  console.log('🚀 Starting Authentication Backend Tests\n');
  
  const tests = [
    { name: 'Registration', fn: testRegistration },
    { name: 'Login', fn: testLogin },
    { name: 'Profile Access', fn: testProfileAccess },
    { name: 'Profile Update', fn: testProfileUpdate },
    { name: 'Token Verification', fn: testTokenVerification },
    { name: 'Logout', fn: testLogout },
    { name: 'Invalid Token', fn: testInvalidToken }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    const result = await test.fn();
    if (result) passed++;
  }

  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Your authentication backend is working perfectly!');
  } else {
    console.log('\n⚠️ Some tests failed. Check your server configuration.');
  }
};

// Check if server is running
const checkServer = async () => {
  try {
    await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start your server first:');
    console.log('   npm run server');
    return false;
  }
};

// Main execution
const main = async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  }
};

main().catch(console.error); 