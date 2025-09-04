const mongoose = require('mongoose');
const Shop = require('../models/Shop');
require('dotenv').config();

// Default shop data that matches the current AI context
const defaultShopData = {
  business: {
    name: 'DREAM COFFEE',
    type: 'Premium Coffee Shop',
    description: 'A premium coffee shop in the heart of Ho Chi Minh City, offering exceptional coffee, pastries, and a welcoming atmosphere for work and relaxation.',
    established: '2020',
    mission: 'To provide the finest coffee experience while fostering community connections.'
  },

  location: {
    address: '123 Đường Cà Phê, Quận 1, Thành phố Hồ Chí Minh',
    englishAddress: '123 Coffee Street, District 1, Ho Chi Minh City',
    city: 'Ho Chi Minh City',
    district: 'District 1',
    country: 'Vietnam',
    coordinates: {
      lat: 10.7769,
      lng: 106.7009
    },
    landmarks: 'Near Ben Thanh Market, walking distance from Nguyen Hue Walking Street'
  },

  contact: {
    phone: '+84 28 1234 5678',
    hotline: '+84 28 1234 5678',
    email: 'info@dreamcoffee.vn',
    website: 'https://dreamcoffee.vn',
    socialMedia: {
      facebook: 'https://facebook.com/dreamcoffee',
      instagram: 'https://instagram.com/dreamcoffee',
      twitter: 'https://twitter.com/dreamcoffee'
    }
  },

  hours: {
    weekdays: {
      open: '06:00',
      close: '20:00',
      display: 'Thứ 2 - Thứ 6: 6:00 - 20:00 (GMT+7)'
    },
    weekends: {
      open: '07:00',
      close: '19:00',
      display: 'Thứ 7 - Chủ Nhật: 7:00 - 19:00 (GMT+7)'
    },
    timezone: 'GMT+7 (ICT)',
    notes: 'Closed on major holidays',
    kitchen: 'Kitchen closes 30 minutes before closing time'
  },

  services: {
    dineIn: true,
    takeaway: true,
    delivery: true,
    catering: true,
    events: {
      available: true,
      notice: 'Contact us at least 48 hours in advance for bookings',
      types: ['Private events', 'Meetings', 'Celebrations']
    },
    wholesale: {
      available: true,
      contact: 'wholesale@dreamcoffee.vn',
      description: 'Coffee beans and catering services for businesses'
    }
  },

  amenities: [
    'Free WiFi',
    'Air Conditioning',
    'Outdoor Seating',
    'Power Outlets',
    'Free Parking (20 spots, including 2 accessible spaces)',
    'Pet Friendly',
    'Study Area',
    'Meeting Rooms'
  ],

  payment: {
    methods: ['Cash', 'Credit Card', 'Debit Card', 'Mobile Payment', 'Bank Transfer'],
    currency: 'VND (Vietnamese Dong)'
  },

  policies: {
    wifi: 'Free high-speed WiFi for all customers',
    parking: 'Free parking available - 20 spots including 2 accessible spaces',
    pets: 'Pet-friendly environment',
    smoking: 'Non-smoking establishment',
    reservations: 'Walk-ins welcome, reservations recommended for groups of 6+'
  },

  responseTemplates: {
    greeting: 'Xin chào! Tôi là trợ lý AI của DREAM COFFEE. Tôi có thể giúp bạn tìm hiểu về menu, giờ mở cửa, địa chỉ và các dịch vụ của chúng tôi. Bạn cần hỗ trợ gì?',
    fallback: 'Xin lỗi, tôi không hiểu câu hỏi của bạn. Bạn có thể hỏi về menu, giờ mở cửa, địa chỉ, hoặc các dịch vụ của DREAM COFFEE không?',
    contact: 'Bạn có thể liên hệ với chúng tôi qua:\n📞 Điện thoại: +84 28 1234 5678\n📧 Email: info@dreamcoffee.vn\n📍 Địa chỉ: 123 Đường Cà Phê, Quận 1, TP.HCM'
  },

  isActive: true
};

const seedShop = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if shop data already exists
    const existingShop = await Shop.findOne({ isActive: true });
    
    if (existingShop) {
      console.log('Shop data already exists. Updating with latest data...');
      
      // Update existing shop with new data
      Object.keys(defaultShopData).forEach(key => {
        existingShop[key] = defaultShopData[key];
      });
      
      await existingShop.save();
      console.log('Shop data updated successfully!');
    } else {
      console.log('Creating new shop data...');
      
      // Create new shop
      const shop = new Shop(defaultShopData);
      await shop.save();
      console.log('Shop data created successfully!');
    }

    console.log('\n=== SHOP DATA SEEDED ===');
    console.log('Shop configuration has been initialized in the database.');
    console.log('You can now fetch shop data from the API endpoints:');
    console.log('- GET /api/shop/config - Basic shop configuration');
    console.log('- GET /api/shop/complete - Complete shop data with menu');
    console.log('- GET /api/shop/ai-context - Data formatted for AI context');
    console.log('- GET /api/shop/status - Shop open/closed status');
    console.log('========================\n');

  } catch (error) {
    console.error('Error seeding shop data:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  }
};

// Run the seed function
if (require.main === module) {
  seedShop();
}

module.exports = { seedShop, defaultShopData };