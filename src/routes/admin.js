const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const mongoose = require('mongoose');

// Dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @desc    Get dashboard statistics for admin
// @access  Private (Admin only)
router.get('/dashboard/stats', protect, authorize('admin'), async (req, res) => {
  try {
    // Get total products count
    const totalProducts = await Product.countDocuments();

    // Get total orders count
    const totalOrders = await Order.countDocuments();

    // Get total customers count (users with customer role)
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // Get total revenue from completed orders
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
          totalRevenue: { $sum: '$total' }
        }
      }
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        totalCustomers,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics'
    });
  }
});

// @route   GET /api/admin/dashboard/recent-orders
// @desc    Get recent orders for admin dashboard
// @access  Private (Admin only)
router.get('/dashboard/recent-orders', protect, authorize('admin'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const recentOrders = await Order.find()
      .populate('customer', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('orderNumber customer total status createdAt');

    // Format the response
    const formattedOrders = recentOrders.map(order => ({
      id: order.orderNumber,
      customer: order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Unknown Customer',
      customerEmail: order.customer ? order.customer.email : '',
      total: order.total,
      status: order.status,
      createdAt: order.createdAt
    }));

    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recent orders'
    });
  }
});

// @route   GET /api/admin/dashboard/analytics
// @desc    Get detailed analytics for admin dashboard
// @access  Private (Admin only)
router.get('/dashboard/analytics', protect, authorize('admin'), async (req, res) => {
  try {
    // Get orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get revenue by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueByMonth = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: { $in: ['completed', 'ready'] },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get top selling products
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    // Get customer growth (new customers per month)
    const customerGrowth = await User.aggregate([
      {
        $match: {
          role: 'customer',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          newCustomers: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        ordersByStatus: ordersByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        revenueByMonth,
        topProducts,
        customerGrowth
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics'
    });
  }
});

module.exports = router;