const mongoose = require('mongoose');

const customer = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  token: {
    type: String,
  },
  storedCode: { type: Number }
}, {
  timestamps: true,
});

const Customer = mongoose.model('customer', customer);

module.exports = Customer;
