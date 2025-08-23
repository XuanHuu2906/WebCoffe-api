const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect: auth } = require('../middleware/auth');

// @route   GET /api/orders
// @desc    Get all orders for authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    // Build query
    const query = { customer: req.user.id };
    if (status && status !== 'all') {
      query.status = status;
    }

    // Get orders with pagination
    const orders = await Order.find(query)
      .populate('items.product', 'name category image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
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

// @route   GET /api/orders/:id
// @desc    Get single order by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user.id
    }).populate('items.product', 'name category image description');

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
    console.error('Error fetching order:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order'
    });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      items,
      orderType,
      paymentMethod,
      deliveryAddress,
      notes
    } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    if (!orderType || !['pickup', 'delivery', 'dine-in'].includes(orderType)) {
      return res.status(400).json({
        success: false,
        message: 'Valid order type is required'
      });
    }

    if (!paymentMethod || !['cash', 'card', 'digital_wallet'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment method is required'
      });
    }

    // Validate delivery address for delivery orders
    if (orderType === 'delivery') {
      if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city) {
        return res.status(400).json({
          success: false,
          message: 'Delivery address is required for delivery orders'
        });
      }
    }

    // Validate and calculate order totals
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      // Validate product exists
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product with ID ${item.product} not found`
        });
      }

      // Validate quantity
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Item quantity must be at least 1'
        });
      }

      // Calculate item price (base price or size-specific price)
      let itemPrice = product.price;
      if (item.size && product.sizes && product.sizes.length > 0) {
        const sizeOption = product.sizes.find(s => s.name === item.size);
        if (sizeOption) {
          itemPrice = sizeOption.price;
        }
      }

      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        product: product._id,
        name: product.name,
        price: itemPrice,
        quantity: item.quantity,
        size: item.size || 'Regular',
        customizations: item.customizations || []
      });
    }

    // Calculate tax (8% for example)
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create order
    const order = new Order({
      orderNumber,
      customer: req.user.id,
      items: validatedItems,
      subtotal,
      tax,
      total,
      orderType,
      paymentMethod,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      notes: notes || '',
      loyaltyPointsEarned: Math.floor(total * 0.1) // 10% of total as points
    });

    await order.save();

    // Populate the order before sending response
    await order.populate('items.product', 'name category image');

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating order'
    });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (for admin use)
// @access  Private
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required'
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order or is admin (for now, allow user to cancel their own orders)
    if (order.customer.toString() !== req.user.id && status !== 'cancelled') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    // Only allow cancellation if order is still pending or confirmed
    if (status === 'cancelled' && !['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    order.status = status;
    if (status === 'completed') {
      order.actualCompletionTime = new Date();
    }

    await order.save();

    res.json({
      success: true,
      data: order,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating order status'
    });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Cancel/Delete order (only if pending)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only allow deletion if order is pending
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending orders can be cancelled'
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling order'
    });
  }
});

// @route   GET /api/orders/stats/summary
// @desc    Get order statistics for user
// @access  Private
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get order counts by status
    const statusCounts = await Order.aggregate([
      { $match: { customer: mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get total spent
    const totalSpent = await Order.aggregate([
      { 
        $match: { 
          customer: mongoose.Types.ObjectId(userId),
          status: { $in: ['completed', 'ready'] }
        } 
      },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    // Get recent orders count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentOrdersCount = await Order.countDocuments({
      customer: userId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get loyalty points
    const loyaltyPoints = await Order.aggregate([
      { $match: { customer: mongoose.Types.ObjectId(userId) } },
      { 
        $group: { 
          _id: null, 
          earned: { $sum: '$loyaltyPointsEarned' },
          used: { $sum: '$loyaltyPointsUsed' }
        } 
      }
    ]);

    res.json({
      success: true,
      data: {
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        totalSpent: totalSpent[0]?.total || 0,
        recentOrdersCount,
        loyaltyPoints: {
          earned: loyaltyPoints[0]?.earned || 0,
          used: loyaltyPoints[0]?.used || 0,
          available: (loyaltyPoints[0]?.earned || 0) - (loyaltyPoints[0]?.used || 0)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order statistics'
    });
  }
});

module.exports = router;