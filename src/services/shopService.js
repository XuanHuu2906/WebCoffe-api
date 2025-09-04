const Shop = require('../models/Shop');
const Product = require('../models/Product');

class ShopService {
  /**
   * Get the active shop configuration
   * @returns {Promise<Object>} Shop configuration
   */
  static async getShopConfig() {
    try {
      const shop = await Shop.getActiveShop();
      return {
        success: true,
        data: shop
      };
    } catch (error) {
      console.error('Error fetching shop config:', error);
      return {
        success: false,
        message: 'Failed to fetch shop configuration',
        error: error.message
      };
    }
  }

  /**
   * Get complete shop data including menu from products
   * @returns {Promise<Object>} Complete shop data with menu
   */
  static async getCompleteShopData() {
    try {
      const shop = await Shop.getActiveShop();
      const products = await Product.find({ inStock: true }).sort({ category: 1, name: 1 });
      
      // Group products by category to create menu structure
      const menuCategories = {};
      
      products.forEach(product => {
        if (!menuCategories[product.category]) {
          menuCategories[product.category] = {
            name: product.category,
            vietnamese: this.getCategoryVietnameseName(product.category),
            items: []
          };
        }
        
        // Format product for menu
        const menuItem = {
          id: product._id,
          name: product.name,
          description: product.description,
          price: this.formatPrice(product.price),
          category: product.category,
          image: product.image,
          featured: product.featured,
          ingredients: product.ingredients || [],
          nutritionalInfo: product.nutritionalInfo || {},
          sizes: product.sizes || []
        };
        
        menuCategories[product.category].items.push(menuItem);
      });
      
      // Convert to array format
      const menu = {
        categories: Object.values(menuCategories),
        specialties: this.extractSpecialties(products)
      };
      
      // Combine shop data with dynamic menu
      const completeData = {
        ...shop.toObject(),
        menu,
        businessName: shop.business.name, // For backward compatibility
        storeName: shop.business.name,    // For backward compatibility
        lastUpdated: new Date().toISOString()
      };
      
      return {
        success: true,
        data: completeData
      };
    } catch (error) {
      console.error('Error fetching complete shop data:', error);
      return {
        success: false,
        message: 'Failed to fetch complete shop data',
        error: error.message
      };
    }
  }

  /**
   * Update shop configuration
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated shop configuration
   */
  static async updateShopConfig(updateData) {
    try {
      const shop = await Shop.getActiveShop();
      
      // Update shop data
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          shop[key] = updateData[key];
        }
      });
      
      await shop.save();
      
      return {
        success: true,
        data: shop,
        message: 'Shop configuration updated successfully'
      };
    } catch (error) {
      console.error('Error updating shop config:', error);
      return {
        success: false,
        message: 'Failed to update shop configuration',
        error: error.message
      };
    }
  }

  /**
   * Get shop status (open/closed)
   * @returns {Promise<Object>} Shop status information
   */
  static async getShopStatus() {
    try {
      const shop = await Shop.getActiveShop();
      const isOpen = shop.isCurrentlyOpen();
      
      const now = new Date();
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;
      const currentHours = isWeekend ? shop.hours.weekends : shop.hours.weekdays;
      
      return {
        success: true,
        data: {
          isOpen,
          currentHours: currentHours.display,
          nextChange: this.getNextStatusChange(shop, now),
          timezone: shop.hours.timezone
        }
      };
    } catch (error) {
      console.error('Error fetching shop status:', error);
      return {
        success: false,
        message: 'Failed to fetch shop status',
        error: error.message
      };
    }
  }

  /**
   * Get Vietnamese category name mapping
   * @param {string} category - English category name
   * @returns {string} Vietnamese category name
   */
  static getCategoryVietnameseName(category) {
    const mapping = {
      'Cà phê': 'Cà Phê',
      'Coffee': 'Cà Phê',
      'Thức uống đậm vị': 'Thức Uống Đậm Vị',
      'Đồ uống tươi mát': 'Đồ Uống Tươi Mát',
      'Bánh ngọt': 'Bánh Ngọt',
      'Pastries': 'Bánh Ngọt',
      'Light Meals': 'Món Ăn Nhẹ',
      'Món ăn nhẹ': 'Món Ăn Nhẹ'
    };
    
    return mapping[category] || category;
  }

  /**
   * Format price for display
   * @param {number} price - Price in number format
   * @returns {string} Formatted price string
   */
  static formatPrice(price) {
    if (typeof price === 'number') {
      return `${(price * 1000).toLocaleString('vi-VN')} VND`;
    }
    return price;
  }

  /**
   * Extract specialties from products
   * @param {Array} products - Array of products
   * @returns {Array} Array of specialty items
   */
  static extractSpecialties(products) {
    return products
      .filter(product => product.featured)
      .map(product => product.name)
      .slice(0, 4); // Limit to 4 specialties
  }

  /**
   * Calculate next status change time
   * @param {Object} shop - Shop configuration
   * @param {Date} now - Current date
   * @returns {string} Next status change description
   */
  static getNextStatusChange(shop, now) {
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const currentHours = isWeekend ? shop.hours.weekends : shop.hours.weekdays;
    const isOpen = shop.isCurrentlyOpen();
    
    if (isOpen) {
      return `Closes at ${currentHours.close}`;
    } else {
      return `Opens at ${currentHours.open}`;
    }
  }

  /**
   * Initialize default shop data if none exists
   * @returns {Promise<Object>} Initialization result
   */
  static async initializeShopData() {
    try {
      const existingShop = await Shop.findOne({ isActive: true });
      
      if (!existingShop) {
        const defaultShop = new Shop({});
        await defaultShop.save();
        
        return {
          success: true,
          message: 'Default shop data initialized',
          data: defaultShop
        };
      }
      
      return {
        success: true,
        message: 'Shop data already exists',
        data: existingShop
      };
    } catch (error) {
      console.error('Error initializing shop data:', error);
      return {
        success: false,
        message: 'Failed to initialize shop data',
        error: error.message
      };
    }
  }
}

module.exports = ShopService;