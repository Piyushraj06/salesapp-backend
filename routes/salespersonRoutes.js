const express = require('express');
const router = express.Router();

const Sale = require('../models/Sale'); // ✅ correct import
const Complaint = require('../models/Complaint');
const authenticateSalesperson = require('../middleware/authenticateSalesperson');
const User = require('../models/User'); // Assuming you store users in 'User' model

router.get('/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      salespersonId: user._id,
      vendorId: user.vendorId || null
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});


// ✅ GET Sales for Logged-in Salesperson only
router.get('/sales', authenticateSalesperson, async (req, res) => {
  try {
    const salespersonId = req.user.salespersonId; // ✅ e.g., '123456_1'

    const user = await User.findOne({ staffId: salespersonId });
    const salespersonName = user?.name || 'Unknown';
    const salespersonPhone = user?.phone || 'Unknown';

    const data = await Sale.find({ deliveryStaffId: salespersonId }).sort({ date: -1 });

    const sales = data.map(entry => ({
      _id: entry._id,
      date: entry.date,
      productId: entry.productId,
      salespersonId: entry.deliveryStaffId,
      salespersonName, // ✅ fetched from User model
      salespersonPhone, // ✅ fetched from User model
      stoveOrderId: entry.stoveOrderId,
      amount: entry.amount || '',
      upiTransactionId: entry.upiTransactionId || '',
      staffUpiId: entry.staffUpiId || '',
      isConfirmed: Boolean(entry.isConfirmed),
      status: entry.isConfirmed ? '✅ Confirmed' : 'Pending'
    }));

    res.json(sales);
  } catch (err) {
    console.error("Sales fetch error:", err);
    res.status(500).json({ error: "Failed to fetch sales data" });
  }
});



// ✅ POST Complaint
router.post('/complaints', async (req, res) => {
  try {
    const complaint = new Complaint(req.body);
    await complaint.save();
    res.status(201).json({ message: 'Complaint submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
});

module.exports = router;
