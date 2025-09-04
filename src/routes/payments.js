const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const momoService = require('../services/momoService');
const vnpayConfig = require('../config/vnpay');
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
      orderInfo: orderInfo || `Payment for DREAM COFFEE order ${orderId}`,
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

// @route   POST /api/payments/vnpay/create
// @desc    Create VNPay payment request
// @access  Private
router.post('/vnpay/create', auth, async (req, res) => {
  try {
    const { orderId, amount, orderInfo, bankCode } = req.body;

    // Validate required fields
    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and amount are required'
      });
    }

    // Validate amount
    if (amount <= 0 || amount > 500000000) { // VNPay limit is 500M VND
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

    // Get client IP address
    const ipAddr = req.headers['x-forwarded-for'] ||
                   req.connection.remoteAddress ||
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                   '127.0.0.1';

    // Debug: Log the parameters being sent to VNPay
    console.log('VNPay Payment Parameters:', {
      orderId,
      amount,
      orderInfo: orderInfo || `Thanh toan don hang ${orderId}`,
      ipAddr,
      bankCode
    });

    // Create payment URL
    try {
      const paymentUrl = vnpayConfig.createPaymentUrl(
        orderId,
        amount,
        orderInfo || `Thanh toan don hang ${orderId}`,
        ipAddr,
        bankCode
      );

      console.log('Generated VNPay URL:', paymentUrl);

      // Update order with payment method
      await Order.findByIdAndUpdate(order._id, {
        paymentMethod: 'vnpay',
        paymentStatus: 'pending'
      });

      res.json({
        success: true,
        message: 'VNPay payment URL created successfully',
        data: {
          paymentUrl,
          orderId,
          amount
        }
      });
    } catch (vnpayError) {
      console.error('VNPay URL creation error:', vnpayError.message);
      return res.status(400).json({
        success: false,
        message: 'Failed to create payment URL: ' + vnpayError.message
      });
    }

  } catch (error) {
    console.error('VNPay create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/payments/vnpay/return
// @desc    Handle VNPay return URL
// @access  Public
router.get('/vnpay/return', async (req, res) => {
  try {
    const vnp_Params = req.query;
    const orderId = vnp_Params.vnp_TxnRef;
    const responseCode = vnp_Params.vnp_ResponseCode;
    const transactionNo = vnp_Params.vnp_TransactionNo;
    const amount = vnp_Params.vnp_Amount / 100; // Convert from VND cents

    // Verify the return URL
    const isValidSignature = vnpayConfig.verifyReturnUrl(vnp_Params);

    if (!isValidSignature) {
      return res.redirect(`${process.env.FRONTEND_URL}/checkout/result?status=error&message=Invalid signature`);
    }

    // Find the order
    const order = await Order.findOne({ orderNumber: orderId });
    if (!order) {
      return res.redirect(`${process.env.FRONTEND_URL}/checkout/result?status=error&message=Order not found`);
    }

    let paymentStatus = 'failed';
    let message = vnpayConfig.getPaymentStatus(responseCode);

    if (responseCode === '00') {
      paymentStatus = 'paid';
      // Update order status
      await Order.findByIdAndUpdate(order._id, {
        paymentStatus: 'paid',
        status: 'confirmed',
        paymentDetails: {
          method: 'vnpay',
          transactionId: transactionNo,
          amount: amount,
          responseCode: responseCode,
          paidAt: new Date()
        }
      });
    } else {
      // Update order with failed payment
      await Order.findByIdAndUpdate(order._id, {
        paymentStatus: 'failed',
        paymentDetails: {
          method: 'vnpay',
          responseCode: responseCode,
          failedAt: new Date(),
          failureReason: message
        }
      });
    }

    // Redirect to frontend with result
    const redirectUrl = `${process.env.FRONTEND_URL}/checkout/result?status=${paymentStatus}&orderId=${orderId}&message=${encodeURIComponent(message)}`;
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('VNPay return URL error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/checkout/result?status=error&message=Payment processing error`);
  }
});

// @route   POST /api/payments/vnpay/ipn
// @desc    Handle VNPay IPN (Instant Payment Notification)
// @access  Public
router.post('/vnpay/ipn', async (req, res) => {
  try {
    const vnp_Params = req.query;
    const orderId = vnp_Params.vnp_TxnRef;
    const responseCode = vnp_Params.vnp_ResponseCode;
    const transactionNo = vnp_Params.vnp_TransactionNo;
    const amount = vnp_Params.vnp_Amount / 100;

    // Verify the IPN
    const isValidSignature = vnpayConfig.verifyReturnUrl(vnp_Params);

    if (!isValidSignature) {
      return res.status(400).json({ RspCode: '97', Message: 'Invalid signature' });
    }

    // Find the order
    const order = await Order.findOne({ orderNumber: orderId });
    if (!order) {
      return res.status(400).json({ RspCode: '01', Message: 'Order not found' });
    }

    // Check if order amount matches
    if (Math.abs(order.total - amount) > 1) { // Allow 1 VND difference for rounding
      return res.status(400).json({ RspCode: '04', Message: 'Invalid amount' });
    }

    if (responseCode === '00') {
      // Payment successful
      if (order.paymentStatus !== 'paid') {
        await Order.findByIdAndUpdate(order._id, {
          paymentStatus: 'paid',
          status: 'confirmed',
          paymentDetails: {
            method: 'vnpay',
            transactionId: transactionNo,
            amount: amount,
            responseCode: responseCode,
            paidAt: new Date()
          }
        });
      }
      return res.status(200).json({ RspCode: '00', Message: 'Success' });
    } else {
      // Payment failed
      await Order.findByIdAndUpdate(order._id, {
        paymentStatus: 'failed',
        paymentDetails: {
          method: 'vnpay',
          responseCode: responseCode,
          failedAt: new Date(),
          failureReason: vnpayConfig.getPaymentStatus(responseCode)
        }
      });
      return res.status(200).json({ RspCode: '00', Message: 'Success' });
    }

  } catch (error) {
    console.error('VNPay IPN error:', error);
    res.status(500).json({ RspCode: '99', Message: 'Internal server error' });
  }
});

// @route   GET /api/payments/vnpay/status/:orderId
// @desc    Get VNPay payment status
// @access  Private
router.get('/vnpay/status/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;

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

    res.json({
      success: true,
      data: {
        orderId: order.orderNumber,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        paymentDetails: order.paymentDetails,
        totalAmount: order.total
      }
    });

  } catch (error) {
    console.error('Get VNPay status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/payments/card/process
// @desc    Process card payment
// @access  Private
router.post('/card/process', auth, async (req, res) => {
  try {
    const { orderId, amount, cardData } = req.body;

    // Validate required fields
    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and amount are required'
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

    // In a real implementation, you would:
    // 1. Validate card details with a payment processor (Stripe, Square, etc.)
    // 2. Process the actual payment
    // 3. Handle payment success/failure
    
    // For demo purposes, we'll simulate a successful payment
    // In production, NEVER store full card details in your database
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update order with payment details
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.paymentDetails = {
      method: 'card',
      lastFour: cardData.lastFour,
      cardholderName: cardData.cardholderName,
      paidAt: new Date(),
      transactionId: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    await order.save();

    res.json({
      success: true,
      message: 'Card payment processed successfully',
      data: {
        orderId: order.orderNumber,
        transactionId: order.paymentDetails.transactionId,
        amount: amount
      }
    });
  } catch (error) {
    console.error('Card payment processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing card payment'
    });
  }
});

// @route   POST /api/payments/cash/confirm
// @desc    Confirm cash payment order
// @access  Private
router.post('/cash/confirm', auth, async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    // Validate required fields
    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and amount are required'
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

    // Check if order is already confirmed
    if (order.status === 'confirmed' || order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order is already confirmed'
      });
    }

    // Update order status for cash payment
    // Cash orders are confirmed but payment status remains pending until actual payment
    order.status = 'confirmed';
    order.paymentDetails = {
      method: 'cash',
      confirmedAt: new Date(),
      orderType: order.orderType // delivery or pickup
    };
    
    await order.save();

    res.json({
      success: true,
      message: 'Cash payment order confirmed successfully',
      data: {
        orderId: order.orderNumber,
        status: order.status,
        paymentMethod: 'cash',
        orderType: order.orderType
      }
    });
  } catch (error) {
    console.error('Cash payment confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while confirming cash payment'
    });
  }
});

module.exports = router;