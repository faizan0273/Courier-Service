const mongoose = require('mongoose');
// VehicleInfo schema
const vehicleInfoSchema = new mongoose.Schema({
  emiratesIdFront: Buffer,
  emiratesIdBack: Buffer,
  drivingExperience: Number,
  carMake: String,
  model: String,
  year: Number,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  color: String,
  licensePlateNumber: String,
  vehicleType: { type: String, required: false }
});



  module.exports = {
    vehicleInfoSchema
  };