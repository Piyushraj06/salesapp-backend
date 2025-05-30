const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  // deliveryStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salesperson' },
  // salespersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salesperson' },
  // vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  // distributorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Distributor' }, // optional if you have Distributor model
  deliveryStaffId: { type: String, required: true },
  customerName: String,
  customerMobileNo: String,
  stoveOrderId: String,
  staffPhoneNumber: String,
  staffUpiId: String,
  productId: { type: String, unique: true, required: true },
  isScanned: { type: Boolean, default: false },
  staffName: {
    type: String,
    required: false
  },
  bonus: { type: Number, default: 50 },
  date: { type: Date, default: Date.now },
  isConfirmed: { type: Boolean, default: false },
  amount: { type: String, default: '' },
  upiTransactionId: { type: String, default: '' },
  secretCode: { type: String },
  qrSignature: { type: String }
});

module.exports = mongoose.model('Sale', saleSchema);