const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  size: {
    type: String,
    default: 'Regular'
  },
  customizations: [{
    type: String,
    trim: true
  }]
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  orderType: {
    type: String,
    enum: ['pickup', 'delivery', 'dine-in'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'digital_wallet', 'momo', 'vnpay'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  // MoMo payment transaction details
  momoTransaction: {
    requestId: String,
    transId: String,
    payUrl: String,
    deeplink: String,
    qrCodeUrl: String,
    resultCode: Number,
    message: String,
    responseTime: String,
    payType: String
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    instructions: String
  },
  estimatedTime: {
    type: Date
  },
  actualCompletionTime: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 500
  },
  loyaltyPointsEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  loyaltyPointsUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  // Promotional code information
  promoCode: {
    code: String,
    type: String,
    value: Number,
    description: String
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Index for better performance
orderSchema.index({ customer: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `WC${dateStr}${randomNum}`;
  }
  next();
});

// Calculate estimated completion time
orderSchema.methods.calculateEstimatedTime = function() {
  const baseTime = 15; // 15 minutes base time
  const itemTime = this.items.reduce((total, item) => total + (item.quantity * 2), 0);
  const estimatedMinutes = baseTime + itemTime;
  
  const moment = require('moment-timezone');
  const nowVN = moment.tz('Asia/Ho_Chi_Minh');
  this.estimatedTime = nowVN.add(estimatedMinutes, 'minutes').toDate();
  return this.estimatedTime;
};

module.exports = mongoose.model('Order', orderSchema);