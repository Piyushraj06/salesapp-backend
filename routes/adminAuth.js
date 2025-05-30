// routes/adminLogin.js or inside auth controller
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const ADMIN_USERS = [
  { email: 'sido.indane@gmail.com', password: 'Sidoindane@2025'},
  { email: 'sido1@gmail.com', password: 'Sido@123' },
  { email: 'admin1@gmail.com', password: 'Admin@123' }
];

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const admin = ADMIN_USERS.find(u => u.email === email && u.password === password);

  if (!admin) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  const token = jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '2h' });

  res.json({ token });
});

module.exports = router;
