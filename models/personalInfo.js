const mongoose = require('mongoose');
// PersonalInfo schema
const personalInfoSchema = new mongoose.Schema({
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    token: {
      type: String,
    },
    storedCode: { type: Number }
  });

  const PersonalInfo = mongoose.model('PersonalInfo', personalInfoSchema);

  module.exports = PersonalInfo;