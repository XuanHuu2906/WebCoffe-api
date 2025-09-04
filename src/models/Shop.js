const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  business: {
    name: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      default: 'DREAM COFFEE'
    },
    type: {
      type: String,
      default: 'Premium Coffee Shop'
    },
    description: {
      type: String,
      default: 'A premium coffee shop in the heart of Ho Chi Minh City, offering exceptional coffee, pastries, and a welcoming atmosphere for work and relaxation.'
    },
    established: {
      type: String,
      default: '2020'
    },
    mission: {
      type: String,
      default: 'To provide the finest coffee experience while fostering community connections.'
    }
  },

  location: {
    address: {
      type: String,
      required: [true, 'Address is required'],
      default: '123 Đường Cà Phê, Quận 1, Thành phố Hồ Chí Minh'
    },
    englishAddress: {
      type: String,
      default: '123 Coffee Street, District 1, Ho Chi Minh City'
    },
    city: {
      type: String,
      default: 'Ho Chi Minh City'
    },
    district: {
      type: String,
      default: 'District 1'
    },
    country: {
      type: String,
      default: 'Vietnam'
    },
    coordinates: {
      lat: {
        type: Number,
        default: 10.7769
      },
      lng: {
        type: Number,
        default: 106.7009
      }
    },
    landmarks: {
      type: String,
      default: 'Near Ben Thanh Market, walking distance from Nguyen Hue Walking Street'
    }
  },

  contact: {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      default: '+84 28 1234 5678'
    },
    hotline: {
      type: String,
      default: '+84 28 1234 5678'
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
      default: 'info@dreamcoffee.vn'
    },
    website: {
      type: String,
      default: 'https://dreamcoffee.vn'
    },
    socialMedia: {
      facebook: {
        type: String,
        default: 'https://facebook.com/dreamcoffee'
      },
      instagram: {
        type: String,
        default: 'https://instagram.com/dreamcoffee'
      },
      twitter: {
        type: String,
        default: 'https://twitter.com/dreamcoffee'
      }
    }
  },

  hours: {
    weekdays: {
      open: {
        type: String,
        default: '06:00'
      },
      close: {
        type: String,
        default: '20:00'
      },
      display: {
        type: String,
        default: 'Thứ 2 - Thứ 6: 6:00 - 20:00 (GMT+7)'
      }
    },
    weekends: {
      open: {
        type: String,
        default: '07:00'
      },
      close: {
        type: String,
        default: '19:00'
      },
      display: {
        type: String,
        default: 'Thứ 7 - Chủ Nhật: 7:00 - 19:00 (GMT+7)'
      }
    },
    timezone: {
      type: String,
      default: 'GMT+7 (ICT)'
    },
    notes: {
      type: String,
      default: 'Closed on major holidays'
    },
    kitchen: {
      type: String,
      default: 'Kitchen closes 30 minutes before closing time'
    }
  },

  services: {
    dineIn: {
      type: Boolean,
      default: true
    },
    takeaway: {
      type: Boolean,
      default: true
    },
    delivery: {
      type: Boolean,
      default: true
    },
    catering: {
      type: Boolean,
      default: true
    },
    events: {
      available: {
        type: Boolean,
        default: true
      },
      notice: {
        type: String,
        default: 'Contact us at least 48 hours in advance for bookings'
      },
      types: [{
        type: String,
        default: ['Private events', 'Meetings', 'Celebrations']
      }]
    },
    wholesale: {
      available: {
        type: Boolean,
        default: true
      },
      contact: {
        type: String,
        default: 'wholesale@dreamcoffee.vn'
      },
      description: {
        type: String,
        default: 'Coffee beans and catering services for businesses'
      }
    }
  },

  amenities: [{
    type: String,
    default: [
      'Free WiFi',
      'Air Conditioning',
      'Outdoor Seating',
      'Power Outlets',
      'Free Parking (20 spots, including 2 accessible spaces)',
      'Pet Friendly',
      'Study Area',
      'Meeting Rooms'
    ]
  }],

  payment: {
    methods: [{
      type: String,
      default: ['Cash', 'Credit Card', 'Debit Card', 'Mobile Payment', 'Bank Transfer']
    }],
    currency: {
      type: String,
      default: 'VND (Vietnamese Dong)'
    }
  },

  policies: {
    wifi: {
      type: String,
      default: 'Free high-speed WiFi for all customers'
    },
    parking: {
      type: String,
      default: 'Free parking available - 20 spots including 2 accessible spaces'
    },
    pets: {
      type: String,
      default: 'Pet-friendly environment'
    },
    smoking: {
      type: String,
      default: 'Non-smoking establishment'
    },
    reservations: {
      type: String,
      default: 'Walk-ins welcome, reservations recommended for groups of 6+'
    }
  },

  responseTemplates: {
    greeting: {
      type: String,
      default: 'Xin chào! Tôi là trợ lý AI của DREAM COFFEE. Tôi có thể giúp bạn tìm hiểu về menu, giờ mở cửa, địa chỉ và các dịch vụ của chúng tôi. Bạn cần hỗ trợ gì?'
    },
    fallback: {
      type: String,
      default: 'Xin lỗi, tôi không hiểu câu hỏi của bạn. Bạn có thể hỏi về menu, giờ mở cửa, địa chỉ, hoặc các dịch vụ của DREAM COFFEE không?'
    },
    contact: {
      type: String,
      default: 'Bạn có thể liên hệ với chúng tôi qua:\n📞 Điện thoại: +84 28 1234 5678\n📧 Email: info@dreamcoffee.vn\n📍 Địa chỉ: 123 Đường Cà Phê, Quận 1, TP.HCM'
    }
  },

  // This will be true for the main shop configuration
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better performance
shopSchema.index({ isActive: 1 });

// Static method to get the active shop configuration
shopSchema.statics.getActiveShop = async function() {
  let shop = await this.findOne({ isActive: true });
  
  // If no shop exists, create default one
  if (!shop) {
    shop = new this({});
    await shop.save();
  }
  
  return shop;
};

// Instance method to check if currently open
shopSchema.methods.isCurrentlyOpen = function() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  const hours = isWeekend ? this.hours.weekends : this.hours.weekdays;
  
  const [openHour, openMinute] = hours.open.split(':').map(Number);
  const [closeHour, closeMinute] = hours.close.split(':').map(Number);
  
  const openTime = openHour * 60 + openMinute;
  const closeTime = closeHour * 60 + closeMinute;
  
  return currentTime >= openTime && currentTime <= closeTime;
};

module.exports = mongoose.model('Shop', shopSchema);