const mongoose = require('mongoose');

// Define the User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true }, // admin, vendor, salesperson
  name: { type: String },
});

module.exports = mongoose.model('User', userSchema);
