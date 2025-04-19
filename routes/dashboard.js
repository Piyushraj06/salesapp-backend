// routes/dashboard.js
const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');

// Bonus Logic
function calculateBonus(units) {
  if (units <= 0) return 0;
  if (units <= 10) return units * 50;
  if (units === 11) return 10 * 50 + 500;
  return 10 * 50 + 500 + (units - 11) * 100;
}

// Admin/Vendor Dashboard Route
router.get('/sales', async (req, res) => {
  try {
    const sales = await Sale.find();

    const summary = {};

    for (const sale of sales) {
      const date = sale.date.toISOString().split('T')[0];
      const key = `${sale.deliveryStaffId}_${date}`;

      if (!summary[key]) {
        summary[key] = {
          date,
          staffId: sale.deliveryStaffId,
          count: 0
        };
      }

      summary[key].count += 1;
    }

    const dashboard = [];
    let grandTotalBonus = 0;

    for (const key in summary) {
      const { staffId, date, count } = summary[key];
      const bonus = calculateBonus(count);
      grandTotalBonus += bonus;

      dashboard.push({
        staffId,
        date,
        unitsSold: count,
        bonus
      });
    }

    res.json({
      dashboard,
      grandTotalBonus
    });
  } catch (error) {
    console.error('Error generating dashboard:', error);
    res.status(500).json({ error: 'Failed to generate dashboard data' });
  }
});

// Test route (Optional for development)
router.get('/', (req, res) => {
  res.json({ message: 'Dashboard route is working' });
});

module.exports = router;
