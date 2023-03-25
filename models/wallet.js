const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rider',
    required: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  }
});

module.exports = mongoose.model('Wallet', walletSchema);
