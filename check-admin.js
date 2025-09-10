const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function checkAdmin() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamcoffee';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    
    // Find all admin users
    const adminUsers = await User.find({ role: 'admin' });
    console.log('\n📋 Admin users found:');
    adminUsers.forEach(user => {
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Active: ${user.isActive}`);
      console.log('   ---');
    });
    
    // Find all users
    const allUsers = await User.find({});
    console.log(`\n📊 Total users: ${allUsers.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkAdmin();