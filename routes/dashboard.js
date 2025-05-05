const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const User = require('../models/User');

// GET /api/dashboard
router.get('/', async (req, res) => {
    try {
        // Get the total sales, vendors, and salespersons
        const totalSales = await Sale.aggregate([
            { $group: { _id: null, total: { $sum: "$amount" } } } // Assuming 'amount' field exists in Sale model
        ]);
        const totalVendors = await User.countDocuments({ role: 'vendor' });
        const totalSalespersons = await User.countDocuments({ role: 'salesperson' });

        // Return data as a response
        res.json({
            totalSales: totalSales[0] ? totalSales[0].total : 0,  // If no sales, return 0
            totalVendors,
            totalSalespersons
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
