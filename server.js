const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS Setup
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route Imports
const authRoutes = require('./routes/auth');
const salesRoutes = require('./routes/sales');
const dashboardRoutes = require('./routes/dashboard');
const vendorAuthRoutes = require('./routes/vendorAuth');
const vendorDashboardRoutes = require('./routes/vendorDashboard');
const confirmedPaymentsRoutes = require('./routes/confirmedPayments');
const adminDashboardRoutes = require('./routes/adminDashboard');
const qrAssignmentRoutes = require('./routes/qrAssignmentRoutes');
const complaintRoutes = require('./routes/adminComplaint');
const salespersonRoutes = require('./routes/salespersonRoutes');




// Route Mounting
app.use('/api/auth', authRoutes);
app.use('/api', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/vendor', vendorAuthRoutes);
app.use('/api/vendor', vendorDashboardRoutes);
app.use('/api/confirmed-payments', confirmedPaymentsRoutes);
app.use('/api/admin-dashboard', adminDashboardRoutes);
app.use('/api/qr-assignment', qrAssignmentRoutes);
app.use('/api/admin', complaintRoutes);
app.use('/api/salesperson', salespersonRoutes);


// Test route
app.get('/', (req, res) => {
  res.send('✅ Sales Backend Running Successfully');
});

// MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salesapp')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
