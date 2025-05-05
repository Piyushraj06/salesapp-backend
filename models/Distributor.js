const mongoose = require('mongoose');

const distributorSchema = new mongoose.Schema({
  distributorId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  // You can add more fields like phone, address, etc.
});

module.exports = mongoose.model('Distributor', distributorSchema);
