const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/Product');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function removeDuplicateProducts() {
  try {
    console.log('Searching for duplicate products...');
    
    // Get all products
    const products = await Product.find({});
    console.log(`Total products found: ${products.length}`);
    
    // Find duplicates by name
    const productsByName = {};
    const duplicates = [];
    
    products.forEach(product => {
      if (!productsByName[product.name]) {
        productsByName[product.name] = [product];
      } else {
        productsByName[product.name].push(product);
        duplicates.push(product.name);
      }
    });
    
    // Get unique duplicate names
    const uniqueDuplicateNames = [...new Set(duplicates)];
    console.log(`Found ${uniqueDuplicateNames.length} products with duplicates`);
    
    // Remove duplicates (keep the newest one)
    for (const name of uniqueDuplicateNames) {
      console.log(`Processing duplicates for: ${name}`);
      
      // Sort by creation date (newest first)
      const dupes = productsByName[name].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      // Keep the first one (newest), delete the rest
      for (let i = 1; i < dupes.length; i++) {
        console.log(`Removing duplicate product: ${dupes[i]._id} (${dupes[i].name})`);
        await Product.findByIdAndDelete(dupes[i]._id);
      }
    }
    
    console.log('Duplicate removal completed successfully');
  } catch (error) {
    console.error('Error removing duplicates:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

// Run the function
removeDuplicateProducts();