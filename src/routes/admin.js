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

// @route   GET /api/admin/revenue/total
// @desc    Get detailed total revenue calculation from completed orders
// @access  Private (Admin only)
router.get('/revenue/total', protect, authorize('admin'), async (req, res) => {
  try {
    // Get detailed revenue breakdown from completed orders
    const revenueBreakdown = await Order.aggregate([
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

    // Get revenue by payment method
    const revenueByPaymentMethod = await Order.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'ready'] },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          revenue: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { revenue: -1 }
      }
    ]);

    // Get revenue by order type
    const revenueByOrderType = await Order.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'ready'] },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: '$orderType',
          revenue: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { revenue: -1 }
      }
    ]);

    // Get all completed orders for verification
    const completedOrders = await Order.find({
      status: { $in: ['completed', 'ready'] },
      paymentStatus: 'paid'
    }).select('orderNumber total status paymentStatus createdAt paymentMethod orderType');

    const breakdown = revenueBreakdown[0] || {
      totalRevenue: 0,
      totalSubtotal: 0,
      totalTax: 0,
      totalDiscount: 0,
      orderCount: 0,
      averageOrderValue: 0
    };

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue: breakdown.totalRevenue,
          totalSubtotal: breakdown.totalSubtotal,
          totalTax: breakdown.totalTax,
          totalDiscount: breakdown.totalDiscount,
          completedOrderCount: breakdown.orderCount,
          averageOrderValue: breakdown.averageOrderValue
        },
        breakdown: {
          byPaymentMethod: revenueByPaymentMethod,
          byOrderType: revenueByOrderType
        },
        completedOrders: completedOrders.map(order => ({
          orderNumber: order.orderNumber,
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          orderType: order.orderType,
          createdAt: order.createdAt
        }))
      },
      message: `Total revenue calculated from ${breakdown.orderCount} completed orders`
    });
  } catch (error) {
    console.error('Error calculating total revenue:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating total revenue'
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
      .populate('customer', 'firstName lastName email phone address')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('orderNumber customer total status createdAt');

    // Format the response
    const formattedOrders = recentOrders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      customer: order.customer,
      customerName: order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Unknown Customer',
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



router.get('/orders', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const search = req.query.search;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build filter object
    let filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.firstName': { $regex: search, $options: 'i' } },
        { 'customer.lastName': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(filter)
      .populate('customer', 'firstName lastName email phone address')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
});

// @route   GET /api/admin/orders/:id
// @desc    Get single order details
// @access  Private (Admin only)
router.get('/orders/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'firstName lastName email phone address');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order details'
    });
  }
});

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status
// @access  Private (Admin only)
router.put('/orders/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    order.updatedAt = new Date();

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating order status'
    });
  }
});

// Customer Management Routes

// @route   GET /api/admin/customers
// @desc    Get all customers with filtering and pagination
// @access  Private (Admin only)
router.get('/customers', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build filter object
    let filter = { role: 'customer' };
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const customers = await User.find(filter)
      .select('-password')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    // Get order statistics for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const orderStats = await Order.aggregate([
          { $match: { customer: customer._id } },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalSpent: { $sum: '$total' },
              lastOrderDate: { $max: '$createdAt' }
            }
          }
        ]);

        return {
          ...customer.toObject(),
          orderStats: orderStats[0] || {
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: null
          }
        };
      })
    );

    const totalCustomers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalCustomers / limit);

    res.json({
      success: true,
      data: {
        customers: customersWithStats,
        pagination: {
          currentPage: page,
          totalPages,
          totalCustomers,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching customers'
    });
  }
});

// @route   GET /api/admin/customers/:id
// @desc    Get single customer details with order history
// @access  Private (Admin only)
router.get('/customers/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const customer = await User.findById(req.params.id)
      .select('-password');

    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get customer's order history
    const orders = await Order.find({ customer: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get customer statistics
    const stats = await Order.aggregate([
      { $match: { customer: mongoose.Types.ObjectId(req.params.id) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          lastOrderDate: { $max: '$createdAt' },
          firstOrderDate: { $min: '$createdAt' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        customer,
        orders,
        stats: stats[0] || {
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          lastOrderDate: null,
          firstOrderDate: null
        }
      }
    });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching customer details'
    });
  }
});

// Contact Management Routes

// @route   GET /api/admin/contacts
// @desc    Get all contact messages with filtering and pagination
// @access  Private (Admin only)
router.get('/contacts', protect, authorize('admin'), async (req, res) => {
  try {
    const Contact = require('../models/Contact');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const search = req.query.search;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build filter object
    let filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { ticketId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const contacts = await Contact.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const totalContacts = await Contact.countDocuments(filter);
    const totalPages = Math.ceil(totalContacts / limit);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          currentPage: page,
          totalPages,
          totalContacts,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching contacts'
    });
  }
});

// @route   GET /api/admin/contacts/:id
// @desc    Get single contact message details
// @access  Private (Admin only)
router.get('/contacts/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const Contact = require('../models/Contact');
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error fetching contact details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching contact details'
    });
  }
});

// @route   PUT /api/admin/contacts/:id/status
// @desc    Update contact message status
// @access  Private (Admin only)
router.put('/contacts/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const Contact = require('../models/Contact');
    const { status } = req.body;

    // Validate status
    const validStatuses = ['new', 'read', 'replied', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: new, read, replied, closed'
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    res.json({
      success: true,
      data: contact,
      message: 'Contact status updated successfully'
    });
  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating contact status'
    });
  }
});

module.exports = router;