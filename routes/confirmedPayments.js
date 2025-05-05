const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale'); // or correct model

router.get('/', async (req, res) => {
  try {
    const confirmed = await Sale.find({ status: 'confirmed' }).sort({ date: -1 });
    res.status(200).json(confirmed);
  } catch (err) {
    console.error("Confirmed Payments Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
