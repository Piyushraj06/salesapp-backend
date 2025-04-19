const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  deliveryStaffId: String,
  customerName: String,
  customerMobileNo: String,
  stoveOrderId: String,
  staffPhoneNumber: String,
  staffUpiId: String,
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Sale', saleSchema);
