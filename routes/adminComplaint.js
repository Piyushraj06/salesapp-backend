// routes/adminComplaints.js
const express = require('express');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const router = express.Router();

// ✅ GET all complaints for Admin Dashboard with readable salesperson info
router.get('/complaints', async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ date: -1 });

    const formatted = await Promise.all(
      complaints.map(async (c) => {
        let staffId = 'Unknown';
        let staffPhoneNumber = 'Unknown';
        let staffName = 'Unknown';

        if (c.salespersonId) {
          const user = await User.findById(c.salespersonId);
          if (user) {
            if (user.staffId) staffId = user.staffId;
            if (user.phone) staffPhoneNumber = user.phone;
            if (user.name) staffName = user.name;
          }
        }

        return {
          date: c.date,
          salespersonId: staffId,
          salespersonName: staffName,
          salespersonNumber: staffPhoneNumber,
          productId: c.productId || 'N/A',
          vendorId: c.vendorId || 'Unknown',
          issue: c.issue || 'No description'
        };
      })
    );

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
