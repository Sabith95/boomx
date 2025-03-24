const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  }
});

// Instance method to credit (add to) the wallet balance
walletSchema.methods.credit = async function(amount) {
  this.balance += amount;
  return this.save();
};

module.exports = mongoose.model('Wallet', walletSchema);
