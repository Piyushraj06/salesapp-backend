const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');

// GET /api/sales
router.get('/sales', async (req, res) => {
  try {
    const sales = await Sale.find();
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching sales', error: err.message });
  }
});

// GET /api/search-sales
router.get('/search-sales', async (req, res) => {
  const { type, term } = req.query;

  try {
    let query = {};
    if (type === 'salesperson') {
      query.salespersonId = term;
    } else if (type === 'product') {
      query.productId = term;
    }

    const sales = await Sale.find(query);
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching sales', error: err.message });
  }
});

module.exports = router;
