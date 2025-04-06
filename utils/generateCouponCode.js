function generateCouponCode() {
    // Generates an 8-character alphanumeric code
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  
  module.exports = generateCouponCode;