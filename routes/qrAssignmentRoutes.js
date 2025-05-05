const express = require('express');
const router = express.Router();
const QRAssignment = require('../models/QRAssignment');

// ✅ Admin assigns QR to Vendor
router.post('/assign-qr', async (req, res) => {
  try {
    const { vendorId, qrStart, qrEnd, quantity } = req.body;

    if (!vendorId || !qrStart || !qrEnd || !quantity) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const qrCodePattern = /^PROD\d{5}$/;
    if (!qrCodePattern.test(qrStart) || !qrCodePattern.test(qrEnd)) {
      return res.status(400).json({ message: 'QR codes must follow format PROD00001' });
    }

    const startNum = parseInt(qrStart.replace('PROD', ''));
    const endNum = parseInt(qrEnd.replace('PROD', ''));
    const expectedEnd = startNum + parseInt(quantity) - 1;

    if (endNum !== expectedEnd) {
      return res.status(400).json({ message: `End QR must be PROD${expectedEnd.toString().padStart(5, '0')}` });
    }

    const allAssignments = await QRAssignment.find({ assignedBy: 'admin' });

    const overlap = allAssignments.some(assign => {
      const s = parseInt(assign.qrStart.replace('PROD', ''));
      const e = parseInt(assign.qrEnd.replace('PROD', ''));
      return startNum <= e && endNum >= s;
    });

    if (overlap) {
      return res.status(409).json({ message: 'QR range overlaps with an existing assignment.' });
    }

    const newAssignment = new QRAssignment({
      vendorId,
      qrStart,
      qrEnd,
      quantity,
      assignedBy: 'admin',
      assignedDate: new Date()
    });

    await newAssignment.save();
    res.status(201).json({ message: 'QR Assigned Successfully', assignment: newAssignment });

  } catch (error) {
    console.error("Assign QR Error:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// ✅ Vendor assigns QR to Distributor
router.post('/dashboard/assign-qr', async (req, res) => {
  try {
    const { vendorId, distributorId, qrStart, qrEnd, quantity } = req.body;

    if (!vendorId || !distributorId || !qrStart || !qrEnd || !quantity) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const qrCodePattern = /^PROD\d{5}$/;
    if (!qrCodePattern.test(qrStart) || !qrCodePattern.test(qrEnd)) {
      return res.status(400).json({ error: 'QR codes must follow format PROD00001' });
    }

    const startNum = parseInt(qrStart.replace('PROD', ''));
    const endNum = parseInt(qrEnd.replace('PROD', ''));
    const expectedEnd = startNum + parseInt(quantity) - 1;

    if (endNum !== expectedEnd) {
      return res.status(400).json({ error: `End QR must be PROD${expectedEnd.toString().padStart(5, '0')}` });
    }

    const adminAssignments = await QRAssignment.find({ vendorId, assignedBy: 'admin' });

    let isWithinAssignedRange = false;
    for (const assign of adminAssignments) {
      const adminStart = parseInt(assign.qrStart.replace('PROD', ''));
      const adminEnd = parseInt(assign.qrEnd.replace('PROD', ''));
      if (startNum >= adminStart && endNum <= adminEnd) {
        isWithinAssignedRange = true;
        break;
      }
    }

    if (!isWithinAssignedRange) {
      return res.status(403).json({ error: 'QR range must be within Admin assigned range.' });
    }

    const vendorAssignments = await QRAssignment.find({ vendorId, assignedBy: 'vendor' });

    const isOverlapping = vendorAssignments.some(assign => {
      const assignedStart = parseInt(assign.qrStart.replace('PROD', ''));
      const assignedEnd = parseInt(assign.qrEnd.replace('PROD', ''));
      return !(endNum < assignedStart || startNum > assignedEnd);
    });

    if (isOverlapping) {
      return res.status(409).json({ error: 'QR range overlaps with already assigned Distributor.' });
    }

    const newVendorAssignment = new QRAssignment({
      vendorId,
      distributorId,
      qrStart,
      qrEnd,
      quantity,
      assignedBy: 'vendor',
      assignedDate: new Date()
    });

    await newVendorAssignment.save();
    
    res.status(201).json({ 
      message: 'QR Assigned Successfully to Distributor',
      nextAvailable: `PROD${(endNum + 1).toString().padStart(5, '0')}` 
    });

  } catch (error) {
    console.error("Vendor QR Assign Error:", error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// ✅ Get QR assigned by Vendor to Distributor
router.get('/vendor-to-distributor', async (req, res) => {
  try {
    const data = await QRAssignment.find({ distributorId: { $exists: true, $ne: null } }).sort({ assignedDate: -1 });
    res.status(200).json(data);
  } catch (error) {
    console.error("Fetch Vendor→Distributor QR Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ✅ Get QR assigned by Admin to Vendor
router.get('/admin-to-vendor', async (req, res) => {
  try {
    const assignments = await QRAssignment.find({ assignedBy: 'admin' }).sort({ assignedDate: -1 });
    res.status(200).json(assignments);
  } catch (error) {
    console.error("Fetch Admin→Vendor Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
