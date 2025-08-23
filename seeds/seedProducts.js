const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const products = [
  {
    name: 'Espresso',
    description: 'Rich and bold espresso shot, perfect for coffee purists',
    price: 2.50,
    category: 'Coffee',
    image: '/images/espresso.jpg',
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
    category: 'Coffee',
    image: '/images/cappuccino.jpg',
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
    category: 'Coffee',
    image: '/images/latte.jpg',
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
    category: 'Coffee',
    image: '/images/americano.jpg',
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
    category: 'Coffee',
    image: '/images/mocha.jpg',
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
    category: 'Tea',
    image: '/images/green-tea.jpg',
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
    category: 'Tea',
    image: '/images/earl-grey.jpg',
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
    category: 'Pastries',
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
    category: 'Pastries',
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
    category: 'Sandwiches',
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
    category: 'Desserts',
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
    category: 'Cold Drinks',
    image: '/images/iced-coffee.jpg',
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

const seedProducts = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/webcaffe';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert new products
    const createdProducts = await Product.insertMany(products);
    console.log(`Created ${createdProducts.length} products`);

    console.log('Seed data inserted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedProducts();
}

module.exports = seedProducts;