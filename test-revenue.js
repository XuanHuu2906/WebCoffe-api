const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Order = require('./src/models/Order');
const User = require('./src/models/User');

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

// Test revenue calculation
const testRevenueCalculation = async () => {
  try {
    console.log('\n=== REVENUE CALCULATION TEST ===\n');
    
    // Get all orders
    const allOrders = await Order.find({}).select('orderNumber status paymentStatus total createdAt');
    console.log(`Total orders in database: ${allOrders.length}`);
    
    // Group orders by status
    const ordersByStatus = {};
    allOrders.forEach(order => {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    });
    console.log('\nOrders by status:');
    Object.entries(ordersByStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Group orders by payment status
    const ordersByPaymentStatus = {};
    allOrders.forEach(order => {
      ordersByPaymentStatus[order.paymentStatus] = (ordersByPaymentStatus[order.paymentStatus] || 0) + 1;
    });
    console.log('\nOrders by payment status:');
    Object.entries(ordersByPaymentStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Calculate revenue from completed orders
    const completedOrders = allOrders.filter(order => 
      ['completed', 'ready'].includes(order.status) && order.paymentStatus === 'paid'
    );
    
    console.log(`\nCompleted orders (status: completed/ready AND paymentStatus: paid): ${completedOrders.length}`);
    
    if (completedOrders.length > 0) {
      const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
      const averageOrderValue = totalRevenue / completedOrders.length;
      
      console.log(`\n=== REVENUE SUMMARY ===`);
      console.log(`Total Revenue: $${totalRevenue.toFixed(2)}`);
      console.log(`Average Order Value: $${averageOrderValue.toFixed(2)}`);
      console.log(`Number of Revenue-Generating Orders: ${completedOrders.length}`);
      
      console.log('\nCompleted Orders Details:');
      completedOrders.forEach((order, index) => {
        console.log(`  ${index + 1}. ${order.orderNumber} - $${order.total.toFixed(2)} (${order.status}, ${order.paymentStatus})`);
      });
    } else {
      console.log('\nNo completed orders found. Revenue is $0.00');
    }
    
    // Test the aggregation pipeline (same as in the API)
    console.log('\n=== TESTING AGGREGATION PIPELINE ===');
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
      console.log('Aggregation Pipeline Results:');
      console.log(`  Total Revenue: $${result.totalRevenue.toFixed(2)}`);
      console.log(`  Total Subtotal: $${result.totalSubtotal.toFixed(2)}`);
      console.log(`  Total Tax: $${result.totalTax.toFixed(2)}`);
      console.log(`  Total Discount: $${result.totalDiscount.toFixed(2)}`);
      console.log(`  Order Count: ${result.orderCount}`);
      console.log(`  Average Order Value: $${result.averageOrderValue.toFixed(2)}`);
    } else {
      console.log('Aggregation Pipeline Results: No completed orders found');
    }
    
  } catch (error) {
    console.error('Error in revenue calculation test:', error);
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testRevenueCalculation();
  process.exit(0);
};

runTest().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});