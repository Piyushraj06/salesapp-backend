// routes/sales.js
const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');

// Save sale data from form
router.post('/submit-sale', async (req, res) => {
  try {
    const { delivery_staff_id, customer_name, customer_mobile_no, stove_order_id, staff_phone_number, staff_upi_id } = req.body;

    const sale = new Sale({
      deliveryStaffId: delivery_staff_id,
      customerName: customer_name,
      customerMobileNo: customer_mobile_no,
      stoveOrderId: stove_order_id,
      staffPhoneNumber: staff_phone_number,
      staffUpiId: staff_upi_id
    });

    await sale.save();
    res.status(201).json({ message: 'Sale data submitted successfully' });
  } catch (error) {
    console.error('Error submitting sale:', error);
    res.status(500).json({ error: 'Failed to submit sale' });
  }
});

// Test route (Optional for development)
router.get('/', (req, res) => {
  res.json({ message: 'Sales route is working' });
});

module.exports = router;
