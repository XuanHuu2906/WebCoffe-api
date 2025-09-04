const express = require('express');
const router = express.Router();
const ShopService = require('../services/shopService');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/shop/config
// @desc    Get shop configuration
// @access  Public
router.get('/config', async (req, res) => {
  try {
    const result = await ShopService.getShopConfig();
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in shop config route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching shop configuration'
    });
  }
});

// @route   GET /api/shop/complete
// @desc    Get complete shop data including menu from database
// @access  Public
router.get('/complete', async (req, res) => {
  try {
    const result = await ShopService.getCompleteShopData();
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in complete shop data route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching complete shop data'
    });
  }
});

// @route   GET /api/shop/status
// @desc    Get shop status (open/closed)
// @access  Public
router.get('/status', async (req, res) => {
  try {
    const result = await ShopService.getShopStatus();
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in shop status route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching shop status'
    });
  }
});

// @route   PUT /api/shop/config
// @desc    Update shop configuration
// @access  Private (Admin only)
router.put('/config', protect, authorize('admin'), async (req, res) => {
  try {
    const result = await ShopService.updateShopConfig(req.body);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in update shop config route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating shop configuration'
    });
  }
});

// @route   POST /api/shop/initialize
// @desc    Initialize default shop data
// @access  Private (Admin only)
router.post('/initialize', protect, authorize('admin'), async (req, res) => {
  try {
    const result = await ShopService.initializeShopData();
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in initialize shop data route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while initializing shop data'
    });
  }
});

// @route   GET /api/shop/menu
// @desc    Get menu data from products
// @access  Public
router.get('/menu', async (req, res) => {
  try {
    const result = await ShopService.getCompleteShopData();
    
    if (result.success) {
      // Return only menu data
      res.json({
        success: true,
        data: {
          menu: result.data.menu,
          businessName: result.data.businessName,
          lastUpdated: result.data.lastUpdated
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in menu route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching menu data'
    });
  }
});

// @route   GET /api/shop/ai-context
// @desc    Get shop data formatted for AI context
// @access  Public
router.get('/ai-context', async (req, res) => {
  try {
    const result = await ShopService.getCompleteShopData();
    
    if (result.success) {
      // Format data specifically for AI context usage
      const aiContext = {
        business: result.data.business,
        businessName: result.data.business.name,
        storeName: result.data.business.name,
        location: result.data.location,
        contact: result.data.contact,
        hours: result.data.hours,
        menu: result.data.menu,
        services: result.data.services,
        amenities: result.data.amenities,
        payment: result.data.payment,
        policies: result.data.policies,
        responseTemplates: result.data.responseTemplates,
        lastUpdated: result.data.lastUpdated
      };
      
      res.json({
        success: true,
        data: aiContext
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in AI context route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching AI context data'
    });
  }
});

module.exports = router;