const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  staffId: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'vendor', 'sales'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
