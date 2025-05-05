const jwt = require('jsonwebtoken');
const User = require('../models/User'); // ✅ Use User model

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const salespersonId = decoded.salespersonId;

    if (!salespersonId) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // ✅ Find user by staffId
    const user = await User.findOne({ staffId: salespersonId, role: 'salesperson' });

    if (!user) {
      return res.status(401).json({ error: 'Salesperson not found' });
    }

    req.user = {
      _id: user._id,
      staffId: user.staffId,
      name: user.name,
      email: user.email,
      salespersonId: user.staffId // ✅ used in routes like /sales
    };

    next();
  } catch (error) {
    console.error("Sales token auth error:", error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
