const jwt = require('jsonwebtoken');
const Vendor = require('../models/Vendor');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const vendorId = decoded.vendorId;

    const vendor = await Vendor.findOne({ vendorId });
    if (!vendor) return res.status(401).json({ error: 'Vendor not found' });

    req.user = {
      vendorId: vendor.vendorId,
      _id: vendor._id,
      name: vendor.name
    };

    next();
  } catch (err) {
    console.error('Auth Error:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
};
