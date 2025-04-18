const mongoose = require('mongoose');

// Define the Sale schema
const saleSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  salespersonId: { type: String, required: true },
  quantity: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, default: 'pending' }, // pending, approved, rejected
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Sale', saleSchema);
