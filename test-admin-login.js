const axios = require('axios');

const testAdminLogin = async () => {
  try {
    console.log('Testing admin login...');
    
    // Test login
    const loginResponse = await axios.post('http://localhost:5004/api/auth/login', {
      email: 'admin@webcaffe.com',
      password: 'admin123'
    });
    
    console.log('Login successful!');
    console.log('User:', loginResponse.data.user);
    console.log('Token:', loginResponse.data.token.substring(0, 20) + '...');
    
    // Test dashboard stats with token
    const token = loginResponse.data.token;
    const statsResponse = await axios.get('http://localhost:5004/api/admin/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Dashboard stats:', statsResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

testAdminLogin();