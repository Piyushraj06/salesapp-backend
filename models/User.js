const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  staffId: { type: String, required: true, unique: true },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: v => /^\d{10}$/.test(v),
      message: 'Phone number must be 10 digits'
    }
  },
  role: {
    type: String,
    enum: ['admin', 'vendor', 'salesperson'], // Ensure 'salesperson' is in the role enum
    default: 'salesperson'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
