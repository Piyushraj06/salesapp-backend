const mongoose = require('mongoose');

// Define the Complaint schema
const complaintSchema = new mongoose.Schema({
  customerId: { type: String, required: true },
  complaintText: { type: String, required: true },
  status: { type: String, default: 'pending' }, // pending, resolved
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Complaint', complaintSchema);
