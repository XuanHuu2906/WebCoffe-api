const crypto = require('crypto');
const querystring = require('querystring');

class VNPayConfig {
  constructor() {
    this.vnp_TmnCode = process.env.VNP_TMNCODE;
    this.vnp_HashSecret = process.env.VNP_HASHSECRET;
    this.vnp_Url = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.vnp_ReturnUrl = process.env.VNP_RETURN_URL;
    this.vnp_IpnUrl = process.env.VNP_IPN_URL || `${process.env.VNP_RETURN_URL}/ipn`;
    this.vnp_Version = '2.1.0';
    this.vnp_Command = 'pay';
    this.vnp_CurrCode = 'VND';
    this.vnp_Locale = 'vn';
  }

  // Sort object by key
  sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
  }

  // Create payment URL
  createPaymentUrl(orderId, amount, orderInfo, ipAddr, bankCode = '') {
    // Validate required parameters
    if (!orderId || !amount || !orderInfo || !ipAddr) {
      throw new Error('Missing required parameters for VNPay payment');
    }

    // Validate amount (must be positive integer)
    const amountInt = parseInt(amount);
    if (isNaN(amountInt) || amountInt <= 0) {
      throw new Error('Invalid amount for VNPay payment');
    }

    // Validate orderId format (alphanumeric only, max 100 chars)
    if (!/^[a-zA-Z0-9]+$/.test(orderId) || orderId.length > 100) {
      throw new Error('Invalid orderId format for VNPay payment');
    }

    const date = new Date();
    const createDate = this.formatDate(date);
    const expireDate = this.formatDate(new Date(date.getTime() + 15 * 60 * 1000)); // 15 minutes

    // Clean orderInfo to remove special characters and limit length
    const cleanOrderInfo = orderInfo.replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 255);

    let vnp_Params = {
      vnp_Version: this.vnp_Version,
      vnp_Command: this.vnp_Command,
      vnp_TmnCode: this.vnp_TmnCode,
      vnp_Locale: this.vnp_Locale,
      vnp_CurrCode: this.vnp_CurrCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: cleanOrderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: amountInt * 100, // VNPay requires amount in VND cents
      vnp_ReturnUrl: this.vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate
    };

    if (bankCode) {
      vnp_Params.vnp_BankCode = bankCode;
    }

    vnp_Params = this.sortObject(vnp_Params);

    const qs = require('qs');
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params.vnp_SecureHash = signed;

    return this.vnp_Url + '?' + qs.stringify(vnp_Params, { encode: false });
  }

  // Verify return URL
  verifyReturnUrl(vnp_Params) {
    const secureHash = vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const sortedParams = this.sortObject(vnp_Params);
    
    const qs = require('qs');
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash === signed;
  }

  // Format date for VNPay
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  // Get payment status message
  getPaymentStatus(responseCode) {
    const statusMap = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
      '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)'
    };
    return statusMap[responseCode] || 'Lỗi không xác định';
  }
}

module.exports = new VNPayConfig();