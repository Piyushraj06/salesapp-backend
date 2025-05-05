const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  vendorId: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'vendor' }
});

module.exports = mongoose.model('Vendor', vendorSchema);
