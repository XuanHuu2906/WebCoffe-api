const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@webcaffe.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@webcaffe.com',
      password: 'password', // Will be hashed automatically
      phone: '+15550123456',
      role: 'admin',
      isActive: true
    });

    await adminUser.save();
    console.log('Admin user created successfully');

    // Create test user
    const testUser = new User({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password', // Will be hashed automatically
      phone: '+15550124567',
      role: 'customer',
      isActive: true
    });

    await testUser.save();
    console.log('Test user created successfully');

    console.log('\nDefault users created:');
    console.log('Admin: admin@webcaffe.com / password');
    console.log('User: john@example.com / password');

  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seed function
seedUsers();