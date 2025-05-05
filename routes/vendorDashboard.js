const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const User = require('../models/User');
const QRAssignment = require('../models/QRAssignment');
const Vendor = require('../models/Vendor');
const authenticateVendor = require('../middleware/authenticateVendor');
const Distributor = require('../models/Distributor');
const mongoose = require('mongoose');

console.log("🔥 vendorDashboard.js routes are LOADED");

// ✅ Vendor Dashboard data - vendor-only
router.get('/dashboard', authenticateVendor, async (req, res) => {
  const vendorId = req.user.vendorId;

  const qrAssigned = await QRAssignment.find({ vendorId });
  const totalQR = qrAssigned.filter(a => a.assignedBy === 'admin').reduce((acc, cur) => acc + cur.quantity, 0);
  // const assignedQR = qrAssigned.filter(a => a.assignedBy === 'vendor').reduce((acc, cur) => acc + cur.quantity, 0);

  res.json({
    vendorName: req.user.name,
    totalQR,
   
  });
});

// ✅ Get QR assignments for vendor only
router.get('/dashboard/qr-assignments', authenticateVendor, async (req, res) => {
  const vendorId = req.user.vendorId;
  const assignments = await QRAssignment.find({ vendorId }).sort({ date: -1 });
  res.json(assignments);
});

// ✅ Assign QR to distributor - FINAL FIXED VERSION
router.post('/dashboard/assign-qr', authenticateVendor, async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const { distributorId, qrStart, qrEnd, quantity } = req.body;

    if (!distributorId || !qrStart || !qrEnd || !quantity) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // ✅ Validate QR format
    const qrCodePattern = /^PROD\d{5}$/;
    if (!qrCodePattern.test(qrStart) || !qrCodePattern.test(qrEnd)) {
      return res.status(400).json({ error: 'QR codes must follow format PROD00001' });
    }

    const startNum = parseInt(qrStart.replace('PROD', ''), 10);
    const endNum = parseInt(qrEnd.replace('PROD', ''), 10);
    const expectedEnd = startNum + parseInt(quantity) - 1;

    if (endNum !== expectedEnd) {
      return res.status(400).json({ error: `End QR must be PROD${expectedEnd.toString().padStart(5, '0')}` });
    }

    // ✅ Check if QR range is within admin-assigned range
    const adminAssignments = await QRAssignment.find({ vendorId, assignedBy: 'admin' });
    const isWithinAdminRange = adminAssignments.some(assign => {
      const adminStart = parseInt(assign.qrStart.replace('PROD', ''), 10);
      const adminEnd = parseInt(assign.qrEnd.replace('PROD', ''), 10);
      return startNum >= adminStart && endNum <= adminEnd;
    });

    if (!isWithinAdminRange) {
      return res.status(403).json({ error: 'QR range must be within your admin-assigned range.' });
    }

    // ✅ Prevent duplicate QR range
    const vendorAssignments = await QRAssignment.find({ vendorId, assignedBy: { $ne: 'admin' } });
    const isOverlapping = vendorAssignments.some(assign => {
      const assignedStart = parseInt(assign.qrStart.replace('PROD', ''), 10);
      const assignedEnd = parseInt(assign.qrEnd.replace('PROD', ''), 10);
      return !(endNum < assignedStart || startNum > assignedEnd);
    });

    if (isOverlapping) {
      return res.status(409).json({ error: 'QR range overlaps with already assigned Distributor.' });
    }

    // ✅ Correct fix: use userId (not _id/ObjectId)
    const distributor = await Distributor.findOne({ distributorId: distributorId });
    if (!distributor) {
      return res.status(404).json({ error: 'Distributor not found' });
    }

    const vendor = await Vendor.findOne({ vendorId });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // ✅ Create assignment
    const newAssignment = new QRAssignment({
      vendorId,
      vendorName: vendor.name,
      distributorId,
      distributorName: distributor.name,
      qrStart,
      qrEnd,
      quantity,
      assignedBy: vendor.name,
      assignedDate: new Date()
    });

    await newAssignment.save();

    res.status(201).json({
      message: 'QR Assigned Successfully to Distributor',
      nextAvailable: `PROD${(endNum + 1).toString().padStart(5, '0')}`
    });

  } catch (error) {
    console.error('Vendor Assign QR Error:', error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// ✅ UPDATE QR assignment - NEW ENDPOINT
router.put('/dashboard/update-qr/:id', authenticateVendor, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const vendorId = req.user.vendorId;
    const { distributorId, qrStart, qrEnd, quantity } = req.body;

    // Validate request data
    if (!distributorId || !qrStart || !qrEnd || !quantity) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if assignment exists and belongs to this vendor
    const existingAssignment = await QRAssignment.findOne({ 
      _id: assignmentId, 
      vendorId,
      assignedBy: { $ne: 'admin' } // Can't edit admin assignments
    });

    if (!existingAssignment) {
      return res.status(404).json({ error: 'QR Assignment not found or you do not have permission to edit it' });
    }

    // ✅ Validate QR format
    const qrCodePattern = /^PROD\d{5}$/;
    if (!qrCodePattern.test(qrStart) || !qrCodePattern.test(qrEnd)) {
      return res.status(400).json({ error: 'QR codes must follow format PROD00001' });
    }

    const startNum = parseInt(qrStart.replace('PROD', ''), 10);
    const endNum = parseInt(qrEnd.replace('PROD', ''), 10);
    const expectedEnd = startNum + parseInt(quantity) - 1;

    if (endNum !== expectedEnd) {
      return res.status(400).json({ error: `End QR must be PROD${expectedEnd.toString().padStart(5, '0')}` });
    }

    // ✅ Check if QR range is within admin-assigned range
    const adminAssignments = await QRAssignment.find({ vendorId, assignedBy: 'admin' });
    const isWithinAdminRange = adminAssignments.some(assign => {
      const adminStart = parseInt(assign.qrStart.replace('PROD', ''), 10);
      const adminEnd = parseInt(assign.qrEnd.replace('PROD', ''), 10);
      return startNum >= adminStart && endNum <= adminEnd;
    });

    if (!isWithinAdminRange) {
      return res.status(403).json({ error: 'QR range must be within your admin-assigned range.' });
    }

    // ✅ Prevent duplicate QR range (excluding this assignment)
    const vendorAssignments = await QRAssignment.find({ 
      vendorId, 
      assignedBy: { $ne: 'admin' },
      _id: { $ne: assignmentId }
    });
    
    const isOverlapping = vendorAssignments.some(assign => {
      const assignedStart = parseInt(assign.qrStart.replace('PROD', ''), 10);
      const assignedEnd = parseInt(assign.qrEnd.replace('PROD', ''), 10);
      return !(endNum < assignedStart || startNum > assignedEnd);
    });

    if (isOverlapping) {
      return res.status(409).json({ error: 'QR range overlaps with already assigned Distributor.' });
    }

    // ✅ Verify distributor exists
    const distributor = await Distributor.findOne({ distributorId });
    if (!distributor) {
      return res.status(404).json({ error: 'Distributor not found' });
    }

    // Update assignment
    existingAssignment.distributorId = distributorId;
    existingAssignment.distributorName = distributor.name;
    existingAssignment.qrStart = qrStart;
    existingAssignment.qrEnd = qrEnd;
    existingAssignment.quantity = quantity;
    existingAssignment.lastUpdated = new Date();

    await existingAssignment.save();

    res.json({
      message: 'QR Assignment Updated Successfully',
      assignment: existingAssignment
    });

  } catch (error) {
    console.error('Update QR Assignment Error:', error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// ✅ DELETE QR assignment - NEW ENDPOINT
router.delete('/dashboard/delete-qr/:id', authenticateVendor, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const vendorId = req.user.vendorId;

    // Check if assignment exists and belongs to this vendor
    const existingAssignment = await QRAssignment.findOne({ 
      _id: assignmentId, 
      vendorId,
      assignedBy: { $ne: 'admin' } // Can't delete admin assignments
    });

    if (!existingAssignment) {
      return res.status(404).json({ error: 'QR Assignment not found or you do not have permission to delete it' });
    }

    // Check if any sales have been made against this QR range
    const qrStart = parseInt(existingAssignment.qrStart.replace('PROD', ''), 10);
    const qrEnd = parseInt(existingAssignment.qrEnd.replace('PROD', ''), 10);
    
    const sales = await Sale.find({ isScanned: true });
    const hasRelatedSales = sales.some(sale => {
      const qrCode = parseInt(sale.productId.replace('PROD', ''), 10);
      return qrCode >= qrStart && qrCode <= qrEnd;
    });

    if (hasRelatedSales) {
      return res.status(400).json({ 
        error: 'Cannot delete this QR assignment because there are sales records associated with it' 
      });
    }

    // Delete the assignment
    await QRAssignment.deleteOne({ _id: assignmentId });

    res.json({ message: 'QR Assignment deleted successfully' });

  } catch (error) {
    console.error('Delete QR Assignment Error:', error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// ✅ Filter scanned QR data based on vendor QR ownership
router.get('/dashboard/scanned-qr-data', authenticateVendor, async (req, res) => {
  try {
    const vendorId = req.user.vendorId;

    // Get QR ranges assigned to this vendor
    const vendorQRs = await QRAssignment.find({ vendorId });
    const ranges = vendorQRs.map(a => ({
      start: parseInt(a.qrStart.replace('PROD', '')),
      end: parseInt(a.qrEnd.replace('PROD', ''))
    }));

    // Fetch all scanned sales
    const allSales = await Sale.find({ isScanned: true });

    // Filter only those sales belonging to this vendor based on QR range
    const vendorSales = allSales.filter(sale => {
      const code = parseInt(sale.productId.replace('PROD', ''));
      return ranges.some(r => code >= r.start && code <= r.end);
    });

    // Fetch related user info and format the result
    const formatted = await Promise.all(
      vendorSales.map(async (sale) => {
        const user = await User.findOne({ staffId: sale.deliveryStaffId });

        return {
          _id: sale._id,
          date: sale.date,
          qrCode: sale.productId, // ✅ alias
          salespersonId: sale.deliveryStaffId,
          salespersonName: user?.name || 'Unknown',
          salespersonPhone: user?.phone || 'Unknown',
          productId: sale.stoveOrderId,
          unitsSold: 1,
          amount: sale.amount || '',
          upiTransactionId: sale.upiTransactionId || '',
          isConfirmed: sale.isConfirmed || false
        };
      })
    );

    res.json(formatted);
  } catch (err) {
    console.error("Error in vendor scanned QR data:", err);
    res.status(500).json({ message: "Failed to fetch scanned QR data" });
  }
});


// ✅ Confirm a sale entry (if owned by vendor)
router.post('/dashboard/confirm-entry/:entryId', authenticateVendor, async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const { entryId } = req.params;
    const { amount, upiTransactionId } = req.body;

    const sale = await Sale.findById(entryId);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });

    const qrNum = parseInt(sale.productId.replace('PROD', ''), 10);
    const vendorAssignments = await QRAssignment.find({ vendorId });

    const isOwned = vendorAssignments.some(assign => {
      const start = parseInt(assign.qrStart.replace('PROD', ''), 10);
      const end = parseInt(assign.qrEnd.replace('PROD', ''), 10);
      return qrNum >= start && qrNum <= end;
    });

    if (!isOwned) return res.status(403).json({ message: 'Unauthorized to confirm this entry' });

    if (sale.isConfirmed) {
      return res.status(400).json({ message: 'This entry has already been confirmed and cannot be edited.' });
    }

    sale.amount = amount;
    sale.upiTransactionId = upiTransactionId;
    sale.isConfirmed = true;
    await sale.save();

    res.json({ message: 'Entry confirmed successfully' });
  } catch (error) {
    console.error('Error confirming entry:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// 🔎 Global Search Route (Admin & Vendor can use this)
router.get('/global-search', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'Query parameter is required' });
  }

  try {
    // Import models
    const Sale = require('../models/Sale');
    const Vendor = require('../models/Vendor');
    const User = require('../models/User');
    const QRAssignment = require('../models/QRAssignment');

    // 🔎 Search across collections
    const [salesMatches, vendorMatches, userMatches, qrMatches] = await Promise.all([
      Sale.find({ 
        $or: [
          { stoveOrderId: query }, 
          { deliveryStaffId: query } // ✅ Add this for salesperson ID match
        ] 
      }),
      Vendor.find({ vendorId: query }),
      User.find({ $or: [{ salespersonId: query }, { userId: query }] }),
      QRAssignment.find({ $or: [{ qrStart: query }, { qrEnd: query }] }),
    ]);

    // Combine results
    const combinedResults = [
      ...salesMatches.map(item => ({ type: 'Sale', data: item })),
      ...vendorMatches.map(item => ({ type: 'Vendor', data: item })),
      ...userMatches.map(item => ({ type: 'User', data: item })),
      ...qrMatches.map(item => ({ type: 'QRAssignment', data: item })),
    ];

    res.json(combinedResults);

  } catch (err) {
    console.error('Global Search Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;