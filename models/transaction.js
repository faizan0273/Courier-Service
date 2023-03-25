const mongoose = require('mongoose');
// Transaction Schema
const transactionSchema = new mongoose.Schema({
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    method: {
      type: String,
      enum: ['bank', 'mobile'],
      required: true
    },
  }, { timestamps: true });

  // Export schemas
module.exports = {
    transactionSchema
  };