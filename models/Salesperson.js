const mongoose = require('mongoose');

const salespersonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'salesperson' },
});

const Salesperson = mongoose.model('Salesperson', salespersonSchema);
module.exports = Salesperson;
