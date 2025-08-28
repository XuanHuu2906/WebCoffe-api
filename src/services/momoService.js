const crypto = require('crypto');
const https = require('https');

class MoMoService {
  constructor() {
    // MoMo API configuration - these should be moved to environment variables in production
    this.config = {
      accessKey: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
      secretKey: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
      partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
      redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:5173/momo/return',
      ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:5003/api/payments/momo/callback',
      requestType: 'payWithMethod',
      autoCapture: true,
      lang: 'vi',
      endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create'
    };
  }

  /**
   * Generate HMAC SHA256 signature for MoMo API
   * @param {string} rawSignature - Raw signature string
   * @returns {string} - Generated signature
   */
  generateSignature(rawSignature) {
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(rawSignature)
      .digest('hex');
  }

  /**
   * Create MoMo payment request
   * @param {Object} paymentData - Payment information
   * @param {string} paymentData.orderId - Order ID
   * @param {number} paymentData.amount - Payment amount
   * @param {string} paymentData.orderInfo - Order description
   * @param {string} paymentData.extraData - Additional data (optional)
   * @returns {Promise<Object>} - MoMo payment response
   */
  async createPayment(paymentData) {
    try {
      const {
        orderId,
        amount,
        orderInfo = 'Payment for WebCaffe order',
        extraData = ''
      } = paymentData;

      // Generate unique request ID
      const requestId = `${this.config.partnerCode}${Date.now()}`;
      
      // Create raw signature string
      const rawSignature = [
        `accessKey=${this.config.accessKey}`,
        `amount=${amount}`,
        `extraData=${extraData}`,
        `ipnUrl=${this.config.ipnUrl}`,
        `orderId=${orderId}`,
        `orderInfo=${orderInfo}`,
        `partnerCode=${this.config.partnerCode}`,
        `redirectUrl=${this.config.redirectUrl}`,
        `requestId=${requestId}`,
        `requestType=${this.config.requestType}`
      ].join('&');

      // Generate signature
      const signature = this.generateSignature(rawSignature);

      // Prepare request body
      const requestBody = {
        partnerCode: this.config.partnerCode,
        partnerName: 'WebCaffe',
        storeId: 'WebCaffeStore',
        requestId,
        amount: amount.toString(),
        orderId,
        orderInfo,
        redirectUrl: this.config.redirectUrl,
        ipnUrl: this.config.ipnUrl,
        lang: this.config.lang,
        requestType: this.config.requestType,
        autoCapture: this.config.autoCapture,
        extraData,
        signature
      };

      console.log('MoMo Payment Request:', {
        orderId,
        amount,
        requestId,
        rawSignature
      });

      // Make request to MoMo API
      const response = await this.makeHttpsRequest(requestBody);
      
      return {
        success: true,
        data: response,
        requestId,
        orderId
      };
    } catch (error) {
      console.error('MoMo payment creation failed:', error);
      return {
        success: false,
        error: error.message,
        code: error.code || 'MOMO_ERROR'
      };
    }
  }

  /**
   * Make HTTPS request to MoMo API
   * @param {Object} requestBody - Request payload
   * @returns {Promise<Object>} - API response
   */
  makeHttpsRequest(requestBody) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(requestBody);
      
      const options = {
        hostname: 'test-payment.momo.vn',
        port: 443,
        path: '/v2/gateway/api/create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            console.log('MoMo API Response:', {
              status: res.statusCode,
              resultCode: response.resultCode,
              message: response.message
            });
            
            if (res.statusCode === 200) {
              resolve(response);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${response.message || 'Unknown error'}`));
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse MoMo response: ${parseError.message}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('MoMo HTTPS request error:', error);
        reject(new Error(`Network error: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      // Set timeout
      req.setTimeout(30000); // 30 seconds
      
      // Send request
      req.write(postData);
      req.end();
    });
  }

  /**
   * Verify MoMo callback signature
   * @param {Object} callbackData - Callback data from MoMo
   * @returns {boolean} - Signature verification result
   */
  verifyCallback(callbackData) {
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
      } = callbackData;

      // Create raw signature for verification
      const rawSignature = [
        `accessKey=${this.config.accessKey}`,
        `amount=${amount}`,
        `extraData=${extraData}`,
        `message=${message}`,
        `orderId=${orderId}`,
        `orderInfo=${orderInfo}`,
        `orderType=${orderType}`,
        `partnerCode=${partnerCode}`,
        `payType=${payType}`,
        `requestId=${requestId}`,
        `responseTime=${responseTime}`,
        `resultCode=${resultCode}`,
        `transId=${transId}`
      ].join('&');

      const expectedSignature = this.generateSignature(rawSignature);
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('MoMo callback verification failed:', error);
      return false;
    }
  }

  /**
   * Check payment status
   * @param {string} orderId - Order ID
   * @param {string} requestId - Request ID
   * @returns {Promise<Object>} - Payment status
   */
  async checkPaymentStatus(orderId, requestId) {
    try {
      // This would typically call MoMo's query API
      // For now, we'll return a placeholder response
      return {
        success: true,
        resultCode: 0,
        message: 'Payment status check not implemented yet'
      };
    } catch (error) {
      console.error('Payment status check failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new MoMoService();