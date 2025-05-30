// routes/adminDashboard.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const Sales = require('../models/Sale');
const Vendor = require('../models/Vendor');
const User = require('../models/User'); // salespeople too
const Complaint = require('../models/Complaint');
const QRAssignment = require('../models/QRAssignment');
const ExcelJS = require('exceljs');

// ✅ Middleware to protect admin routes
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: "Access denied" });
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};


// 📊 Dashboard Stats
router.get('/admin-dashboard', verifyAdmin, async (req, res) => {
  try {
    // Fix: Changed Salesperson.countDocuments() to User.countDocuments({ role: 'salesperson' })
    const totalSalespersons = await User.countDocuments({ role: 'salesperson' });
    const totalVendors = await Vendor.countDocuments();

    res.json({ totalSalespersons, totalVendors });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});


// 🧾 Sales Data
router.get('/sales-data', async (req, res) => {
  try {
    const data = await Sales.find().sort({ date: -1 });

    const sales = await Promise.all(
      data.map(async (entry) => {
        // Fetch salesperson details
        const user = await User.findOne({ staffId: entry.deliveryStaffId });

        // Fetch vendor details using vendorId stored in the sale (if available)
        const vendor = entry.vendorId
          ? await Vendor.findOne({ vendorId: entry.vendorId })
          : null;

        return {
          _id: entry._id,
          date: entry.date,
          productId: entry.productId || '-',
          stoveOrderId: entry.stoveOrderId || '-',
          amount: entry.amount || '',
          upiTransactionId: entry.upiTransactionId || '',
          isConfirmed: Boolean(entry.isConfirmed),
          status: entry.isConfirmed ? 'confirmed' : 'pending',
          customerName: entry.customerName,
          customerNumber: entry.customerMobileNo,

          // Salesperson info
          salespersonId: entry.deliveryStaffId || '-',
          salespersonName: user?.name || 'Unknown',
          salespersonPhone: user?.phone || 'Unknown',
          salespersonUpiId: user?.upi || 'Unknown',


          // Vendor info
          // vendorId: entry.vendorId || 'N/A',
          // vendorName: vendor?.name || 'Unknown',
          // vendorPhone: vendor?.phone || 'Unknown'
        };
      })
    );

    res.json(sales);
  } catch (err) {
    console.error("Error fetching sales data:", err);
    res.status(500).json({ error: "Failed to fetch sales data" });
  }
});


// router.get('/confirmed-payments', verifyAdmin, async (req, res) => {
//   try {
//     const confirmed = await Sales.find({ status: 'confirmed' }).sort({ date: -1 });
//     res.json(confirmed);
//   } catch (err) {
//     res.status(500).json({ error: "Error fetching confirmed payments" });
//   }
// });

// 😡 Complaints

router.get('/complaints', verifyAdmin, async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ date: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: "Error fetching complaints" });
  }
});


// 📦 Assign QR to Vendor (Manual Input by Admin)
router.post('/admin/assign-qr', verifyAdmin, async (req, res) => {
  try {
    const { vendorId, quantity, qrStartInput, qrEndInput } = req.body;

    if (!vendorId || !quantity || !qrStartInput || !qrEndInput) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const qrCodePattern = /^PROD\d{5}$/;
    if (!qrCodePattern.test(qrStartInput) || !qrCodePattern.test(qrEndInput)) {
      return res.status(400).json({ error: 'QR codes must follow format PROD00001' });
    }

    const startNum = parseInt(qrStartInput.replace('PROD', ''), 10);
    const endNum = parseInt(qrEndInput.replace('PROD', ''), 10);
    const expectedEndNum = startNum + parseInt(quantity) - 1;

    if (endNum !== expectedEndNum) {
      return res.status(400).json({
        error: `End QR must be PROD${expectedEndNum.toString().padStart(5, '0')}`
      });
    }

    const lastAssignment = await QRAssignment.findOne({ assignedBy: 'admin' }).sort({ assignedDate: -1 });
    if (!lastAssignment) {
      if (qrStartInput !== 'PROD00001') {
        return res.status(400).json({ message: 'First QR must start from PROD00001' });
      }
    } else {
      const lastQRNum = parseInt(lastAssignment.qrEnd.replace('PROD', ''), 10);
      const expectedStartNum = lastQRNum + 1;
      const expectedStartQR = `PROD${expectedStartNum.toString().padStart(5, '0')}`;
      if (qrStartInput !== expectedStartQR) {
        return res.status(400).json({ message: `QR must start from ${expectedStartQR}` });
      }
    }

    // ✅ Fetch vendor name and phone from Vendor model
    const vendor = await Vendor.findOne({ vendorId });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const newQR = new QRAssignment({
      assignedBy: 'admin',
      vendorId,
      // vendorName: vendor.name,     // ✅ Add vendor name
      // vendorPhone: vendor.phone,       // ✅ Add vendor phone
      quantity,
      qrStart: qrStartInput,
      qrEnd: qrEndInput,
      assignedDate: new Date()
    });

    await newQR.save();

    res.status(201).json({
      message: "QR assigned successfully to vendor",
      nextAvailable: `PROD${(endNum + 1).toString().padStart(5, '0')}`
    });
  } catch (error) {
    console.error("Admin Assign QR Error:", error);
    res.status(500).json({ error: "Server Error", message: error.message });
  }
});


// 🧾 Fetch QR Assigned by Vendor to Distributors
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const data = await QRAssignment.find({ distributorId: { $exists: true } }).sort({ date: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch QR assignments" });
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

    // Perform searches
    const [salesMatches, vendorMatches, userMatches, qrMatches] = await Promise.all([
      Sale.find({
        $or: [
          { stoveOrderId: query },
          { deliveryStaffId: query }
        ]
      }),
      Vendor.find({ vendorId: query }),
      User.find({ $or: [{ salespersonId: query }, { userId: query }] }),
      QRAssignment.find({
        $or: [
          { qrStart: query },
          { qrEnd: query },
          { vendorId: query },
          { distributorId: query }
        ]
      }),
    ]);

    // 🔁 Map vendorId → distributorId from QRAssignments
    const vendorDistributorMap = {};
    qrMatches.forEach(qr => {
      if (qr.vendorId && qr.distributorId) {
        vendorDistributorMap[qr.vendorId] = qr.distributorId;
      }
    });

    // 🔄 Enrich Vendor records with distributorId (if available)
    const enrichedVendors = vendorMatches.map(vendor => {
      const v = vendor.toObject();
      v.distributorId = vendorDistributorMap[v.vendorId] || '-';
      return v;
    });

    // Combine all results
    const combinedResults = [
      ...salesMatches.map(item => ({ type: 'Sale', data: item })),
      ...enrichedVendors.map(item => ({ type: 'Vendor', data: item })),
      ...userMatches.map(item => ({ type: 'User', data: item })),
      ...qrMatches.map(item => ({ type: 'QRAssignment', data: item })),
    ];

    res.json(combinedResults);

  } catch (err) {
    console.error('Global Search Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/verify-qr', async (req, res) => {
  const { product_id, secret_code } = req.body;

  try {
    const sale = await Sale.findOne({ productId: product_id });

    if (!sale) {
      return res.json({ message: "ℹ️ Product not yet marked - Status: Unsold", status: "unsold" });
    }

    if (sale.secretCode === secret_code) {
      return res.json({ message: "✅ Valid Secret Code - Status: Sold", status: "valid" });
    } else {
      return res.json({ message: "❌ Invalid Secret Code - Status: Invalid", status: "invalid" });
    }

  } catch (err) {
    console.error("QR verify error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


// router.get('/export-sales', async (req, res) => {
//   try {
//     const sales = await Sale.find();

//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet("Sales");

//     worksheet.columns = [
//       { header: "Date", key: "date", width: 20 },
//       { header: "Product ID", key: "productId", width: 20 },
//       { header: "Salesperson ID", key: "deliveryStaffId", width: 20 },
//       { header: "Salesperson Name", key: "staffName", width: 20 },
//       { header: "Salesperson Number", key: "staffPhoneNumber", width: 20 },
//       { header: "Units Sold", key: "unitsSold", width: 15 },
//       { header: "Amount", key: "amount", width: 15 },
//       { header: "UPI Transaction ID", key: "upiTransactionId", width: 25 },
//       { header: "Status", key: "isConfirmed", width: 15 }
//     ];

//     sales.forEach((sale) => {
//       worksheet.addRow({
//         date: sale.date,
//         productId: sale.productId,
//         deliveryStaffId: sale.deliveryStaffId,
//         staffName: sale.staffName,
//         staffPhoneNumber: sale.staffPhoneNumber,
//         unitsSold: 1,
//         amount: sale.amount || "",
//         upiTransactionId: sale.upiTransactionId || "",
//         isConfirmed: sale.isConfirmed ? "Confirmed" : "Pending"
//       });
//     });

//     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//     res.setHeader('Content-Disposition', 'attachment; filename=SalesData.xlsx');

//     await workbook.xlsx.write(res);
//     res.end();
//   } catch (error) {
//     console.error("Excel download error:", error);
//     res.status(500).send("Error generating Excel file.");
//   }
// });


// ✅ Exports sales data to Excel
router.get('/export-sales', async (req, res) => {
  try {
    const sales = await Sales.find();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "QR Code", key: "qrCode", width: 20 },                  // productId
      { header: "Salesperson ID", key: "salespersonId", width: 20 },    // deliveryStaffId
      { header: "Salesperson Name", key: "salespersonName", width: 25 },
      { header: "Salesperson Number", key: "salespersonPhone", width: 20 },
      { header: "Salesperson UPI ID", key: "upiId", width: 25 },
      { header: "Customer Name", key: "customerName", width: 25 },
      { header: "Customer Number", key: "customerPhone", width: 20 },
      { header: "Product ID", key: "productId", width: 20 },            // stoveOrderId
      { header: "Units Sold", key: "unitsSold", width: 12 },
      { header: "Amount", key: "amount", width: 12 },
      { header: "UPI Transaction ID", key: "upiTransactionId", width: 30 },
      { header: "Status", key: "status", width: 15 }
    ];

    for (const sale of sales) {
      const user = await User.findOne({ staffId: sale.deliveryStaffId });

      worksheet.addRow({
        date: sale.date.toISOString().split('T')[0],
        qrCode: sale.productId || "-",                      // QR code
        salespersonId: sale.deliveryStaffId || "-",
        salespersonName: user?.name || "Unknown",
        salespersonPhone: user?.phone || "Unknown",
        customerName: sale.customerName || "Unknown",
        customerPhone: sale.customerMobileNo|| "Unknown",
        upiId: user?.upi || "Unknown",
        productId: sale.stoveOrderId || "-",                // actual product ID
        unitsSold: 1,
        amount: sale.amount || "0",
        upiTransactionId: sale.upiTransactionId || "N/A",
        status: sale.isConfirmed ? "Confirmed" : "Pending"
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="SalesData.xlsx"');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("❌ Excel download error:", error);
    res.status(500).send("Error generating Excel file.");
  }
});



// ✏️ Update QR Assignment
// router.put('/qr-assignment/:id', verifyAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { vendorId, quantity, qrStart, qrEnd } = req.body;

//     const qrCodePattern = /^PROD\d{5}$/;
//     if (!qrCodePattern.test(qrStart) || !qrCodePattern.test(qrEnd)) {
//       return res.status(400).json({ error: 'QR codes must follow format PROD00001' });
//     }

//     const updated = await QRAssignment.findByIdAndUpdate(id, {
//       vendorId,
//       quantity,
//       qrStart,
//       qrEnd
//     }, { new: true });

//     if (!updated) {
//       return res.status(404).json({ error: "QR assignment not found" });
//     }

//     res.json(updated);
//   } catch (err) {
//     console.error("Update QR error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// router.put('/admin-dashboard/qr-assignment/:id', verifyAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { vendorId, quantity, qrStart, qrEnd } = req.body;

//     // Input validation
//     if (!vendorId || !quantity || !qrStart || !qrEnd) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     const qrCodePattern = /^PROD\d{5}$/;
//     if (!qrCodePattern.test(qrStart) || !qrCodePattern.test(qrEnd)) {
//       return res.status(400).json({ error: 'QR codes must follow format PROD00001' });
//     }

//     const updated = await QRAssignment.findByIdAndUpdate(id, {
//       vendorId,
//       quantity,
//       qrStart,
//       qrEnd,
//       updatedAt: new Date()
//     }, { new: true });

//     if (!updated) {
//       return res.status(404).json({ error: "QR assignment not found" });
//     }

//     res.json(updated);
//   } catch (err) {
//     console.error("Update QR error:", err);
//     res.status(500).json({ error: "Server error", message: err.message });
//   }
// });

// ❌ Delete QR Assignment
// router.delete('/qr-assignment/:id', verifyAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deleted = await QRAssignment.findByIdAndDelete(id);

//     if (!deleted) {
//       return res.status(404).json({ error: "QR assignment not found" });
//     }

//     res.json({ message: "QR assignment deleted successfully" });
//   } catch (err) {
//     console.error("Delete QR error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// router.delete('/admin-dashboard/qr-assignment/:id', verifyAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     // Validate that id is a valid MongoDB ObjectId
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ error: "Invalid QR assignment ID format" });
//     }
    
//     const deleted = await QRAssignment.findByIdAndDelete(id);

//     if (!deleted) {
//       return res.status(404).json({ error: "QR assignment not found" });
//     }

//     res.json({ message: "QR assignment deleted successfully" });
//   } catch (err) {
//     console.error("Delete QR error:", err);
//     res.status(500).json({ error: "Server error", message: err.message });
//   }
// });

// Get remaining QR for each vendor
// router.get('/remaining-qr/vendor', async (req, res) => {
//   try {
//     const adminAssigned = await QRAssignment.find({ assignedBy: 'admin' });
//     const vendorAssigned = await QRAssignment.find({ distributorId: { $exists: true } });

//     const vendorTotals = {};

//     // Count total assigned to vendor by admin
//     for (let entry of adminAssigned) {
//       const vendorId = entry.vendorId;
//       if (!vendorTotals[vendorId]) vendorTotals[vendorId] = { total: 0, used: 0 };
//       vendorTotals[vendorId].total += entry.quantity;
//     }

//     // Subtract distributor assignments
//     for (let entry of vendorAssigned) {
//       const vendorId = entry.vendorId;
//       if (!vendorTotals[vendorId]) vendorTotals[vendorId] = { total: 0, used: 0 };
//       vendorTotals[vendorId].used += entry.quantity;
//     }

//     // Prepare response
//     const result = Object.entries(vendorTotals).map(([vendorId, stats]) => ({
//       vendorId,
//       totalAssigned: stats.total,
//       assignedToDistributors: stats.used,
//       remaining: stats.total - stats.used
//     }));

//     res.json(result);
//   } catch (err) {
//     console.error("Remaining QR calc error:", err);
//     res.status(500).json({ message: "Server error calculating remaining QR" });
//   }
// });




module.exports = router;
