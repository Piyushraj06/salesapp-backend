const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  productId: String,
  issue: String,
  salespersonId: String,
  salespersonNumber:String,
  vendorId: String,
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Complaint', complaintSchema);
