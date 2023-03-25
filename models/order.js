// Import required modules
const mongoose = require('mongoose');

// Define the Order schema
const orderSchema = new mongoose.Schema({
  pickupLocation: {
    type: String,
    required: true
  },
  dropoffLocation: {
    type: String,
    required: true
  },
  packageSize: {
    type: String,
    required: true
  },
  packageType: {
    type: String,
    required: true
  },
  packageWeight: {
    type: Number,
    required: true
  },
  receiverName: {
    type: String,
    required: true
  },
  receiverNumber: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  vehichleType: {
    type: String,
    enum: ['bicycle', 'bike', 'truck'],
    required: true
  },
});

// Create the Order model
const Order = mongoose.model('Order', orderSchema);

// Export the Order model
module.exports = Order;
