const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const sampleProducts = [
  {
    name: 'Espresso',
    category: 'Coffee',
    description: 'Rich and bold espresso shot',
    price: 2.50,
    image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400',
    featured: true,
    inStock: true,
    sizes: [
      { name: 'Single', price: 2.50 },
      { name: 'Double', price: 3.50 }
    ]
  },
  {
    name: 'Cappuccino',
    category: 'Coffee',
    description: 'Espresso with steamed milk and foam',
    price: 4.50,
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400',
    featured: true,
    inStock: true,
    sizes: [
      { name: 'Small', price: 4.50 },
      { name: 'Medium', price: 5.50 },
      { name: 'Large', price: 6.50 }
    ]
  },
  {
    name: 'Latte',
    category: 'Coffee',
    description: 'Espresso with steamed milk',
    price: 5.00,
    image: 'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=400',
    featured: false,
    inStock: true,
    sizes: [
      { name: 'Small', price: 5.00 },
      { name: 'Medium', price: 6.00 },
      { name: 'Large', price: 7.00 }
    ]
  },
  {
    name: 'Americano',
    category: 'Coffee',
    description: 'Espresso with hot water',
    price: 3.50,
    image: 'https://images.unsplash.com/photo-1497636577773-f1231844b336?w=400',
    featured: false,
    inStock: true,
    sizes: [
      { name: 'Small', price: 3.50 },
      { name: 'Medium', price: 4.50 },
      { name: 'Large', price: 5.50 }
    ]
  },
  {
    name: 'Croissant',
    category: 'Pastries',
    description: 'Buttery, flaky pastry',
    price: 3.00,
    image: 'https://images.unsplash.com/photo-1555507036-ab794f4afe5e?w=400',
    featured: false,
    inStock: true,
    sizes: [
      { name: 'Regular', price: 3.00 }
    ]
  },
  {
    name: 'Blueberry Muffin',
    category: 'Pastries',
    description: 'Fresh baked muffin with blueberries',
    price: 2.75,
    image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400',
    featured: true,
    inStock: true,
    sizes: [
      { name: 'Regular', price: 2.75 }
    ]
  }
];

async function seedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert sample products
    const products = await Product.insertMany(sampleProducts);
    console.log(`Inserted ${products.length} sample products`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedProducts();