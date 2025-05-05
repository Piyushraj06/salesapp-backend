// routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Hardcoded admin credentials
const ADMIN_EMAIL = "admin@example.com"; // Change to your admin email
const ADMIN_PASSWORD = "admin123"; // Change to your preferred password

// Admin login route
router.post('/admin/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Simple validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check against hardcoded credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token with 24-hour expiration
    const token = jwt.sign(
      { role: 'admin' },
      process.env.JWT_SECRET || 'your-secret-key-here',
      { expiresIn: '24h' }
    );

    // Return success with token
    res.json({
      message: "Login successful",
      user: { role: 'admin' },
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin token verification middleware
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
    if (decoded.role !== 'admin') return res.status(403).json({ error: "Access denied" });
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = { router, verifyAdmin };