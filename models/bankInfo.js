const mongoose = require('mongoose');
// BankInfo schema
const bankInfoSchema = new mongoose.Schema({
    accountType: {
      type: String,
      enum: ['bank', 'mobile'],
      required: true
    },
    cardHolder: {
      type: String
    },
    cardNumber: {
      type: String
    },
    expiryDate: {
      type: String
    },
    ccv: {
      type: String
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  });

  module.exports = {
    bankInfoSchema
  };