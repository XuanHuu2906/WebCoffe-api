const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const momoService = require('../services/momoService');
const { protect: auth } = require('../middleware/auth');

// @route   POST /api/payments/momo/create
// @desc    Create MoMo payment request
// @access  Private
router.post('/momo/create', auth, async (req, res) => {
  try {
    const { orderId, amount, orderInfo } = req.body;

    // Validate required fields
    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and amount are required'
      });
    }

    // Validate amount
    if (amount <= 0 || amount > 50000000) { // MoMo limit is 50M VND
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    // Find the order to verify it belongs to the user
    const order = await Order.findOne({
      orderNumber: orderId,
      customer: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is already paid
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid'
      });
    }

    // Create MoMo payment request
    const paymentResult = await momoService.createPayment({
      orderId,
      amount: Math.round(amount), // Ensure amount is integer
      orderInfo: orderInfo || `Payment for WebCaffe order ${orderId}`,
      extraData: JSON.stringify({
        userId: req.user.id,
        orderNumber: orderId
      })
    });

    if (!paymentResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create MoMo payment',
        error: paymentResult.error
      });
    }

    // Update order with MoMo transaction details
    order.momoTransaction = {
      requestId: paymentResult.requestId,
      payUrl: paymentResult.data.payUrl,
      deeplink: paymentResult.data.deeplink,
      qrCodeUrl: paymentResult.data.qrCodeUrl,
      resultCode: paymentResult.data.resultCode,
      message: paymentResult.data.message
    };
    
    await order.save();

    res.json({
      success: true,
      data: {
        payUrl: paymentResult.data.payUrl,
        deeplink: paymentResult.data.deeplink,
        qrCodeUrl: paymentResult.data.qrCodeUrl,
        requestId: paymentResult.requestId,
        orderId: orderId,
        amount: amount
      },
      message: 'MoMo payment created successfully'
    });
  } catch (error) {
    console.error('MoMo payment creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating MoMo payment'
    });
  }
});

// @route   POST /api/payments/momo/callback
// @desc    Handle MoMo payment callback (IPN)
// @access  Public
router.post('/momo/callback', async (req, res) => {
  try {
    console.log('MoMo callback received:', req.body);

    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature
    } = req.body;

    // Verify callback signature
    const isValidSignature = momoService.verifyCallback(req.body);
    
    if (!isValidSignature) {
      console.error('Invalid MoMo callback signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Find the order
    const order = await Order.findOne({ orderNumber: orderId });
    
    if (!order) {
      console.error(`Order not found for MoMo callback: ${orderId}`);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order with transaction details
    order.momoTransaction = {
      ...order.momoTransaction,
      transId,
      resultCode: parseInt(resultCode),
      message,
      responseTime,
      payType
    };

    // Update payment status based on result code
    if (resultCode === '0') {
      // Payment successful
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      console.log(`MoMo payment successful for order: ${orderId}`);
    } else {
      // Payment failed
      order.paymentStatus = 'failed';
      console.log(`MoMo payment failed for order: ${orderId}, code: ${resultCode}`);
    }

    await order.save();

    // Respond to MoMo
    res.json({
      success: true,
      message: 'Callback processed successfully'
    });
  } catch (error) {
    console.error('MoMo callback processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing callback'
    });
  }
});

// @route   GET /api/payments/momo/status/:orderId
// @desc    Check MoMo payment status
// @access  Private
router.get('/momo/status/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order
    const order = await Order.findOne({
      orderNumber: orderId,
      customer: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Return payment status
    res.json({
      success: true,
      data: {
        orderId: order.orderNumber,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        momoTransaction: order.momoTransaction,
        amount: order.total
      }
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking payment status'
    });
  }
});

// @route   POST /api/payments/momo/return
// @desc    Handle MoMo payment return URL
// @access  Public
router.get('/momo/return', async (req, res) => {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature
    } = req.query;

    console.log('MoMo return URL accessed:', req.query);

    // Verify signature
    const isValidSignature = momoService.verifyCallback(req.query);
    
    if (!isValidSignature) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/error?message=Invalid signature`);
    }

    // Redirect based on payment result
    if (resultCode === '0') {
      // Payment successful
      res.redirect(`${process.env.FRONTEND_URL}/payment/success?orderId=${orderId}&transId=${transId}`);
    } else {
      // Payment failed
      res.redirect(`${process.env.FRONTEND_URL}/payment/error?orderId=${orderId}&message=${encodeURIComponent(message)}`);
    }
  } catch (error) {
    console.error('MoMo return URL error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/payment/error?message=Processing error`);
  }
});

module.exports = router;