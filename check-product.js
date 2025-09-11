const mongoose = require('mongoose');
const Product = require('./src/models/Product');
require('dotenv').config();

async function checkProduct() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const productId = '68b1ccea959356e6d0034818';
    const product = await Product.findById(productId);
    
    console.log('Product found:', product ? 'YES' : 'NO');
    
    if (!product) {
      console.log(`Product with ID ${productId} does not exist in database`);
    }
    
    const allProducts = await Product.find({}, '_id name');
    console.log('\nAvailable products in database:');
    allProducts.forEach(p => console.log(`${p._id} - ${p.name}`));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkProduct();