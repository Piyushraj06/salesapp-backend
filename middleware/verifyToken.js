const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function verifyRole(expectedRole) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (decoded.role !== expectedRole) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Store all decoded data in req.user
      req.user = decoded;
      next();
    } catch (err) {
      console.error("Token verification error:", err);
      res.status(401).json({ message: 'Invalid token' });
    }
  };
}

module.exports = {
  verifyAdmin: verifyRole('admin'),
  verifyVendor: verifyRole('vendor'),
  verifySalesperson: verifyRole('salesperson')
};