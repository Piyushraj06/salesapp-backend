const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();  // Load environment variables
const app = express();

// Import routes
const authRoutes = require('./routes/auth');
const salesRoutes = require('./routes/sales');
const dashboardRoutes = require('./routes/dashboard');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Use routes
app.use('/api', authRoutes);
app.use('/api', salesRoutes);
app.use('/api', dashboardRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

app.get('/', (req, res) => res.send('SalesApp Backend Running'));

app.listen(5000, () => console.log('🚀 Backend running on http://localhost:5000'));
