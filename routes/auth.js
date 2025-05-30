const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
// const crypto = require('crypto');
// const sendEmail = require('../utils/sendEmail'); // create this utility

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, staffId, phone, upi } = req.body;
    if (!name || !email || !password || !staffId || !phone || !upi )
      return res.status(400).json({ error: 'All fields are required' });

    const existing = await User.findOne({ $or: [{ email }, { staffId }] });
    if (existing)
      return res.status(409).json({ error: 'Email or Staff ID already exists' });

    const hashed = await bcrypt.hash(password, 12);
    const newUser = new User({ name, email, phone, staffId, password: hashed, upi});
    const savedUser = await newUser.save();

    const token = jwt.sign(
      {
        userId: savedUser._id,
        salespersonId: savedUser.staffId // ✅ Use staffId not _id
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        _id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        staffId: savedUser.staffId,
        upiId: savedUser.upi
      }
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: 'Registration failed', detail: error.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password, staffId } = req.body;

  const user = await User.findOne({ email, staffId, role: 'salesperson' });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    {
      userId: user._id,
      salespersonId: user.staffId // ✅ Use staffId not _id
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    message: 'Login successful',
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      staffId: user.staffId,
      upiId: user.upi
    }
  });
});

//FORGET PASSWORD
// router.post('/forgot-password', async (req, res) => {
//   const { email } = req.body;

//   try {
//     const user = await Salesperson.findOne({ email });
//     if (!user) return res.status(404).json({ error: 'Salesperson not found' });

//     const token = crypto.randomBytes(32).toString('hex');
//     user.resetToken = token;
//     user.resetTokenExpires = Date.now() + 3600000;
//     await user.save();

//     const resetLink = `http://localhost:5500/reset-password.html?token=${token}&email=${email}&role=sales`;
//     await sendEmail(email, 'Reset Your Password', `<p>Click to reset: <a href="${resetLink}">${resetLink}</a></p>`);

//     res.json({ message: 'Reset link sent to your email.' });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

module.exports = router;
