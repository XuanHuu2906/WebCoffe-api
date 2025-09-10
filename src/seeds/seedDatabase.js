const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
require('dotenv').config();

// Product data - comprehensive coffee shop inventory
const products = [
  {
    name: 'Espresso',
    description: 'Rich and bold espresso shot, perfect for coffee purists',
    price: 2.50,
    category: 'Cà phê',
    image: '/images/espresso.svg',
    featured: true,
    ingredients: ['Espresso beans', 'Water'],
    nutritionalInfo: {
      calories: 5,
      protein: 0.1,
      carbs: 0.8,
      fat: 0.2
    },
    sizes: [
      { name: 'Single', price: 2.50, available: true },
      { name: 'Double', price: 3.50, available: true }
    ]
  },
  {
    name: 'Cappuccino',
    description: 'Classic Italian coffee with steamed milk and foam',
    price: 4.25,
    category: 'Cà phê',
    image: '/images/cappuccino.svg',
    featured: true,
    ingredients: ['Espresso', 'Steamed milk', 'Milk foam'],
    nutritionalInfo: {
      calories: 120,
      protein: 6,
      carbs: 12,
      fat: 4
    },
    sizes: [
      { name: 'Small', price: 4.25, available: true },
      { name: 'Medium', price: 4.95, available: true },
      { name: 'Large', price: 5.65, available: true }
    ]
  },
  {
    name: 'Latte',
    description: 'Smooth espresso with steamed milk and light foam',
    price: 4.75,
    category: 'Cà phê',
    image: '/images/latte.svg',
    featured: true,
    ingredients: ['Espresso', 'Steamed milk', 'Light foam'],
    nutritionalInfo: {
      calories: 150,
      protein: 8,
      carbs: 15,
      fat: 6
    },
    sizes: [
      { name: 'Small', price: 4.75, available: true },
      { name: 'Medium', price: 5.45, available: true },
      { name: 'Large', price: 6.15, available: true }
    ]
  },
  {
    name: 'Americano',
    description: 'Espresso shots with hot water for a clean, strong taste',
    price: 3.25,
    category: 'Cà phê',
    image: '/images/americano.svg',
    ingredients: ['Espresso', 'Hot water'],
    nutritionalInfo: {
      calories: 10,
      protein: 0.3,
      carbs: 1.6,
      fat: 0.4
    },
    sizes: [
      { name: 'Small', price: 3.25, available: true },
      { name: 'Medium', price: 3.75, available: true },
      { name: 'Large', price: 4.25, available: true }
    ]
  },
  {
    name: 'Mocha',
    description: 'Rich chocolate and espresso with steamed milk',
    price: 5.25,
    category: 'Cà phê',
    image: '/images/mocha.svg',
    ingredients: ['Espresso', 'Chocolate syrup', 'Steamed milk', 'Whipped cream'],
    nutritionalInfo: {
      calories: 290,
      protein: 10,
      carbs: 35,
      fat: 12
    },
    sizes: [
      { name: 'Small', price: 5.25, available: true },
      { name: 'Medium', price: 5.95, available: true },
      { name: 'Large', price: 6.65, available: true }
    ]
  },
  {
    name: 'Green Tea',
    description: 'Premium organic green tea with antioxidants',
    price: 2.75,
    category: 'Đồ uống tươi mát',
    image: '/images/green-tea.svg',
    ingredients: ['Organic green tea leaves', 'Hot water'],
    nutritionalInfo: {
      calories: 2,
      protein: 0,
      carbs: 0,
      fat: 0
    },
    sizes: [
      { name: 'Small', price: 2.75, available: true },
      { name: 'Medium', price: 3.25, available: true },
      { name: 'Large', price: 3.75, available: true }
    ]
  },
  {
    name: 'Earl Grey',
    description: 'Classic black tea with bergamot oil',
    price: 2.95,
    category: 'Đồ uống tươi mát',
    image: '/images/earl-grey.svg',
    ingredients: ['Black tea', 'Bergamot oil', 'Hot water'],
    nutritionalInfo: {
      calories: 2,
      protein: 0,
      carbs: 0,
      fat: 0
    },
    sizes: [
      { name: 'Small', price: 2.95, available: true },
      { name: 'Medium', price: 3.45, available: true },
      { name: 'Large', price: 3.95, available: true }
    ]
  },
  {
    name: 'Croissant',
    description: 'Buttery, flaky French pastry baked fresh daily',
    price: 3.50,
    category: 'Bánh ngọt',
    image: '/images/croissant.jpg',
    featured: true,
    ingredients: ['Flour', 'Butter', 'Yeast', 'Salt', 'Sugar'],
    nutritionalInfo: {
      calories: 231,
      protein: 5,
      carbs: 26,
      fat: 12
    },
    sizes: [
      { name: 'Regular', price: 3.50, available: true }
    ]
  },
  {
    name: 'Blueberry Muffin',
    description: 'Moist muffin packed with fresh blueberries',
    price: 2.95,
    category: 'Bánh ngọt',
    image: '/images/blueberry-muffin.jpg',
    ingredients: ['Flour', 'Fresh blueberries', 'Sugar', 'Eggs', 'Butter'],
    nutritionalInfo: {
      calories: 265,
      protein: 4,
      carbs: 47,
      fat: 7
    },
    sizes: [
      { name: 'Regular', price: 2.95, available: true }
    ]
  },
  {
    name: 'Turkey Club Sandwich',
    description: 'Triple-decker with turkey, bacon, lettuce, and tomato',
    price: 8.95,
    category: 'Bánh ngọt',
    image: '/images/turkey-club.jpg',
    ingredients: ['Turkey', 'Bacon', 'Lettuce', 'Tomato', 'Mayo', 'Bread'],
    nutritionalInfo: {
      calories: 520,
      protein: 35,
      carbs: 45,
      fat: 22
    },
    sizes: [
      { name: 'Regular', price: 8.95, available: true }
    ]
  },
  {
    name: 'Chocolate Chip Cookie',
    description: 'Warm, gooey chocolate chip cookie made fresh',
    price: 2.25,
    category: 'Bánh ngọt',
    image: '/images/chocolate-chip-cookie.jpg',
    featured: true,
    ingredients: ['Flour', 'Chocolate chips', 'Butter', 'Sugar', 'Eggs'],
    nutritionalInfo: {
      calories: 180,
      protein: 2,
      carbs: 24,
      fat: 9
    },
    sizes: [
      { name: 'Regular', price: 2.25, available: true }
    ]
  },
  {
    name: 'Iced Coffee',
    description: 'Cold brew coffee served over ice',
    price: 3.75,
    category: 'Đồ uống tươi mát',
    image: '/images/iced-coffee.svg',
    ingredients: ['Cold brew coffee', 'Ice'],
    nutritionalInfo: {
      calories: 5,
      protein: 0.3,
      carbs: 1,
      fat: 0
    },
    sizes: [
      { name: 'Small', price: 3.75, available: true },
      { name: 'Medium', price: 4.25, available: true },
      { name: 'Large', price: 4.75, available: true }
    ]
  }
];

// User data - default admin and test users
const users = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@dreamcoffee.com',
    password: 'password', // Will be hashed automatically
    phone: '+15550123456',
    role: 'admin',
    isActive: true
  },
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'password', // Will be hashed automatically
    phone: '+15550124567',
    role: 'customer',
    isActive: true
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    password: 'password',
    phone: '+15550125678',
    role: 'customer',
    isActive: true
  }
];

/**
 * Seed products to the database
 */
const seedProducts = async () => {
  try {
    console.log('🌱 Seeding products...');
    
    // Clear existing products
    await Product.deleteMany({});
    console.log('✅ Cleared existing products');
    
    // Insert new products
    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Created ${createdProducts.length} products`);
    
    return createdProducts;
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  }
};

/**
 * Seed users to the database
 */
const seedUsers = async () => {
  try {
    console.log('🌱 Seeding users...');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@dreamcoffee.com' });
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists, skipping user seeding');
      return;
    }
    
    // Clear existing users (optional - comment out if you want to preserve existing users)
    // await User.deleteMany({});
    // console.log('✅ Cleared existing users');
    
    // Create users one by one to ensure password hashing
    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
    }
    
    console.log(`✅ Created ${createdUsers.length} users`);
    console.log('\n📋 Default user credentials:');
    console.log('   Admin: admin@dreamcoffee.com / password');
    console.log('   User: john@example.com / password');
    console.log('   User: jane@example.com / password');
    
    return createdUsers;
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

/**
 * Main seeding function - seeds both products and users
 */
const seedDatabase = async () => {
  try {
    console.log('🚀 Starting database seeding...');
    
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamcoffee';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    
    // Seed products
    await seedProducts();
    
    // Seed users
    await seedUsers();
    
    console.log('\n🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  }
};

/**
 * Individual seeding functions for selective seeding
 */
const seedProductsOnly = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/webcaffe';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    
    await seedProducts();
    console.log('🎉 Products seeding completed!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

const seedUsersOnly = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/webcaffe';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    
    await seedUsers();
    console.log('🎉 Users seeding completed!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Run the appropriate seeding function based on command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--products-only')) {
    seedProductsOnly();
  } else if (args.includes('--users-only')) {
    seedUsersOnly();
  } else {
    seedDatabase();
  }
}

// Export functions for use in other files
module.exports = {
  seedDatabase,
  seedProducts,
  seedUsers,
  seedProductsOnly,
  seedUsersOnly
};