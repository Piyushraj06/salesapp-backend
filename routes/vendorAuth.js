const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Vendor = require('../models/Vendor'); // Make sure you have this model
const router = express.Router();
// const crypto = require('crypto');
// const sendEmail = require('../utils/sendEmail'); // create this utility

// Vendor Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, vendorId, phone } = req.body;
    if (!name || !email || !password || !vendorId || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await Vendor.findOne({ $or: [{ email }, { vendorId }] });
    if (existing) {
      return res.status(409).json({ error: 'Email or Vendor ID already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newVendor = new Vendor({ name, email, phone, vendorId, password: hashedPassword });
    const savedVendor = await newVendor.save();

    const token = jwt.sign({ vendorId: savedVendor._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      message: 'Vendor registration successful',
      token,
      user: {
        name: savedVendor.name,
        email: savedVendor.email,
        vendorId: savedVendor.vendorId
      }
    });
  } catch (error) {
    console.error('Vendor Registration Error:', error);
    res.status(500).json({ error: 'Registration failed', detail: error.message });
  }
});

// Vendor Login
router.post('/login', async (req, res) => {
  const { email, password, vendorId } = req.body;

  try {
    const user = await Vendor.findOne({ email: email.toLowerCase(), vendorId });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ vendorId: user.vendorId }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      vendor: {
        name: user.name,
        vendorId: user.vendorId
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

//FORGET PASSWORD
// router.post('/forgot-password', async (req, res) => {
//   const { email } = req.body;

//   try {
//     const vendor = await Vendor.findOne({ email });
//     if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

//     const token = crypto.randomBytes(32).toString('hex');
//     vendor.resetToken = token;
//     vendor.resetTokenExpires = Date.now() + 3600000;
//     await vendor.save();

//     const resetLink = `http://localhost:5500/reset-password.html?token=${token}&email=${email}&role=vendor`;
//     await sendEmail(email, 'Reset Your Password', `<p>Click to reset: <a href="${resetLink}">${resetLink}</a></p>`);

//     res.json({ message: 'Reset link sent to your email.' });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });


module.exports = router;

//VENDOR LOGIN REGISTRATION HAI ISSE NO EDITING