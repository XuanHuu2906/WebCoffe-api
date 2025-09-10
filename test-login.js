const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function testLogin() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamcoffee';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    
    // Test login credentials
    const testCredentials = [
      { email: 'admin@webcaffe.com', password: 'password' },
      { email: 'admin@webcaffe.com', password: 'admin123' },
      { email: 'admin@dreamcoffee.com', password: 'password' },
      { email: 'admin@dreamcoffee.com', password: 'admin123' }
    ];
    
    for (const cred of testCredentials) {
      console.log(`\n🔍 Testing: ${cred.email} / ${cred.password}`);
      
      // Find user
      const user = await User.findOne({ email: cred.email.toLowerCase().trim() }).select('+password');
      if (!user) {
        console.log('❌ User not found');
        continue;
      }
      
      console.log(`✅ User found: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      
      // Test password
      const isMatch = await user.comparePassword(cred.password);
      console.log(`   Password match: ${isMatch ? '✅ YES' : '❌ NO'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testLogin();