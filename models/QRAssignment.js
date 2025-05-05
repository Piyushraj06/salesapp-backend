const mongoose = require('mongoose');

const qrAssignmentSchema = new mongoose.Schema({
  vendorId: { type: String, required: true },
  vendorName: { type: String },       // ✅ already added
  vendorPhone: { type: String },      // ✅ add this line
  distributorId: { type: String },    // optional
  distributorName: { type: String },
  qrStart: { type: String, required: true },
  qrEnd: { type: String, required: true },
  quantity: { type: Number, required: true },
  assignedBy: { type: String, required: true },
  assignedDate: { type: Date, default: Date.now }
});

// ✅ Prevent OverwriteModelError
module.exports = mongoose.models.QRAssignment || mongoose.model('QRAssignment', qrAssignmentSchema);
