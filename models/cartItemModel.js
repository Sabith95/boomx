const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'product',
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: [1, 'Quantity cannot be less than one']
  },
  // Store the price at the time of adding to the cart
  priceAddition: {
    type: Number,
    required: true // Ensure price is always stored
  },
  subtotal: {
    type: Number,
    default: 0
  }
});

// Pre-save hook to calculate subtotal before saving
cartItemSchema.pre('save', function (next) {
  this.subtotal = this.priceAddition * this.quantity;
  next();
});

module.exports = cartItemSchema; 
