const express = require('express');
const router = express.Router();
const crypto = require('crypto'); 
const Sale = require('../models/Sale');
const User = require('../models/User');

// POST endpoint to submit sale
const SECRET_KEY = Buffer.from("YourSuperSecretKeyForQR"); // Same secret key bytes as Python

router.post('/submit-sale', async (req, res) => {
  try {
    const {
      delivery_staff_id,
      customer_name,
      customer_mobile_no,
      stove_order_id,
      staff_phone_number,
      staff_name,
      staff_upi_id,
      product_id,
      secret_code,
      sig,
      timestamp
    } = req.body;

    // Log full request for debugging
    // console.log('📝 Complete request body:', req.body);

    // Validate signature presence
    if (!secret_code || !sig) {
      console.warn("⚠️ No signature or secret code provided");
    } else {
      // Signature verification -- SIGN ONLY delivery_staff_id (UUID)
      const message = `${product_id}:${delivery_staff_id}:${timestamp}`;
      const expectedSig = crypto.createHmac('sha256', SECRET_KEY)
                          .update(message)
                          .digest('hex');


      console.log("🧪 Expected signature:", expectedSig);
      console.log("📥 Received signature:", sig);

      if (sig !== expectedSig) {
        console.warn("⚠️ Signature mismatch detected");
        // Optionally reject here:
        // return res.status(403).json({ error: 'Invalid QR signature' });
      }
    }

    // Prevent QR reuse by productId
    const exists = await Sale.findOne({ productId: product_id });
    if (exists) {
      return res.status(409).json({ error: 'QR already used' });
    }

    // Save new sale including secretCode and qrSignature
    const sale = new Sale({
      deliveryStaffId: delivery_staff_id,
      staffName: staff_name || "N/A",
      customerName: customer_name,
      customerMobileNo: customer_mobile_no,
      stoveOrderId: stove_order_id,
      staffPhoneNumber: staff_phone_number,
      staffUpiId: staff_upi_id,
      productId: product_id,
      isScanned: true,
      secretCode: secret_code,
      qrSignature: sig
    });

    const savedSale = await sale.save();

    // console.log("💾 Saved to MongoDB:", savedSale);

    return res.status(201).json({ message: 'Sale submitted successfully' });

  } catch (error) {
    console.error('❌ Submit Error:', error);
    return res.status(500).json({ error: 'Failed to submit sale' });
  }
});



// ✅ 2. Admin Route - Get All Sales (for Admin Dashboard)
router.get('/admin/sales', async (req, res) => {
  try {
    const adminToken = req.headers['authorization'];

    if (!adminToken) {
      return res.status(400).json({ error: 'Authorization token is required' });
    }

    const token = adminToken.replace('Bearer ', '').trim();
    const admin = await Admin.findOne({ token });

    if (!admin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const sales = await Sale.find().sort({ date: -1 });
    res.status(200).json(sales);

  } catch (error) {
    console.error('Admin Sales Error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch sales data for admin' });
  }
});


// ✅ 3. Vendor Route - Already Working, DO NOT TOUCH
router.get('/vendor/sales', async (req, res) => {
  try {
    const vendorToken = req.headers['authorization'];

    if (!vendorToken) {
      return res.status(400).json({ error: 'Authorization token is required' });
    }

    const token = vendorToken.replace('Bearer ', '').trim();
    const vendor = await Vendor.findOne({ token });

    if (!vendor) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Fetch vendor-specific sales (filter logic can be improved)
    const sales = await Sale.find({ deliveryStaffId: vendor._id });
    res.status(200).json(sales);

  } catch (error) {
    console.error('Vendor Sales Error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch sales data for vendor' });
  }
});

module.exports = router;
