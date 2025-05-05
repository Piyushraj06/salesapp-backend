const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, staffId, phone } = req.body;
    if (!name || !email || !password || !staffId || !phone)
      return res.status(400).json({ error: 'All fields are required' });

    const existing = await User.findOne({ $or: [{ email }, { staffId }] });
    if (existing)
      return res.status(409).json({ error: 'Email or Staff ID already exists' });

    const hashed = await bcrypt.hash(password, 12);
    const newUser = new User({ name, email, phone, staffId, password: hashed });
    const savedUser = await newUser.save();

    const token = jwt.sign(
      {
        userId: savedUser._id,
        salespersonId: savedUser.staffId // ✅ Use staffId not _id
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        _id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        staffId: savedUser.staffId
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
    { expiresIn: '1h' }
  );

  res.json({
    message: 'Login successful',
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      staffId: user.staffId
    }
  });
});

module.exports = router;
