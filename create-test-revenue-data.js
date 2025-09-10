const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Order = require('./src/models/Order');

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Create test revenue data
const createTestRevenueData = async () => {
  try {
    console.log('\n=== CREATING TEST REVENUE DATA ===\n');
    
    // Get some paid orders to convert to completed
    const paidOrders = await Order.find({ paymentStatus: 'paid' }).limit(5);
    console.log(`Found ${paidOrders.length} paid orders to convert to completed status`);
    
    if (paidOrders.length === 0) {
      // If no paid orders, let's update some pending orders to paid and completed
      const pendingOrders = await Order.find({ 
        status: { $in: ['pending', 'confirmed'] },
        paymentStatus: 'pending' 
      }).limit(5);
      
      console.log(`Found ${pendingOrders.length} pending orders to update`);
      
      for (let i = 0; i < Math.min(pendingOrders.length, 5); i++) {
        const order = pendingOrders[i];
        order.status = i < 3 ? 'completed' : 'ready';
        order.paymentStatus = 'paid';
        order.actualCompletionTime = new Date();
        await order.save();
        
        console.log(`Updated order ${order.orderNumber}: status=${order.status}, paymentStatus=${order.paymentStatus}, total=$${order.total}`);
      }
    } else {
      // Update existing paid orders to completed
      for (let i = 0; i < paidOrders.length; i++) {
        const order = paidOrders[i];
        order.status = i < 3 ? 'completed' : 'ready';
        order.actualCompletionTime = new Date();
        await order.save();
        
        console.log(`Updated order ${order.orderNumber}: status=${order.status}, paymentStatus=${order.paymentStatus}, total=$${order.total}`);
      }
    }
    
    // Now test the revenue calculation
    console.log('\n=== TESTING REVENUE CALCULATION ===\n');
    
    const revenueResult = await Order.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'ready'] },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalSubtotal: { $sum: '$subtotal' },
          totalTax: { $sum: '$tax' },
          totalDiscount: { $sum: '$discount' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$total' }
        }
      }
    ]);
    
    if (revenueResult.length > 0) {
      const result = revenueResult[0];
      console.log('✅ REVENUE CALCULATION SUCCESS!');
      console.log(`📊 Total Revenue: $${result.totalRevenue.toFixed(2)}`);
      console.log(`📈 Total Subtotal: $${result.totalSubtotal.toFixed(2)}`);
      console.log(`💰 Total Tax: $${result.totalTax.toFixed(2)}`);
      console.log(`🎯 Total Discount: $${result.totalDiscount.toFixed(2)}`);
      console.log(`📦 Completed Orders: ${result.orderCount}`);
      console.log(`📊 Average Order Value: $${result.averageOrderValue.toFixed(2)}`);
      
      // Get the completed orders for verification
      const completedOrders = await Order.find({
        status: { $in: ['completed', 'ready'] },
        paymentStatus: 'paid'
      }).select('orderNumber total status paymentStatus createdAt');
      
      console.log('\n📋 Completed Orders Details:');
      completedOrders.forEach((order, index) => {
        console.log(`  ${index + 1}. ${order.orderNumber} - $${order.total.toFixed(2)} (${order.status}, ${order.paymentStatus})`);
      });
      
    } else {
      console.log('❌ No completed orders found after update');
    }
    
  } catch (error) {
    console.error('Error creating test revenue data:', error);
  }
};

// Run the script
const runScript = async () => {
  await connectDB();
  await createTestRevenueData();
  process.exit(0);
};

runScript().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});