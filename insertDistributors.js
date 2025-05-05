const mongoose = require('mongoose');
require('dotenv').config();

const Distributor = require('./models/Distributor'); // Path to your distributor model
const distributors = require('./distributors'); // Path to your distributor data

// MongoDB Atlas connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test', {
})
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');

    // Optional: Clear existing data
    await Distributor.deleteMany(); // Comment this line if not needed

    // Insert new distributor data
    await Distributor.insertMany(distributors);

    console.log('✅ Distributors inserted successfully!');
    process.exit();
  })
  .catch(err => {
    console.error('❌ Error inserting distributors:', err);
    process.exit(1);
  });
