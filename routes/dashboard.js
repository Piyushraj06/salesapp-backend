const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Complaint = require('../models/Complaint');

// GET /api/dashboard-stats
router.get('/dashboard-stats', async (req, res) => {
  try {
    const totalSales = await Sale.countDocuments();
    const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });

    res.json({
      totalSales,
      pendingComplaints,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching dashboard stats', error: err.message });
  }
});

module.exports = router;
