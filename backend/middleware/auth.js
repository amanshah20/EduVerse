const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -otp');
    
    if (!user) {
      console.log('❌ User not found for id:', decoded.id);
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (!user.isActive) {
      console.log('❌ Account suspended for user:', user.email);
      return res.status(401).json({ message: 'Account suspended' });
    }
    
    console.log('✅ Auth verified for:', user.email, 'role:', user.role);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Auth error:', error.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  console.log('🔐 Authorization check - User role:', req.user.role, 'Required roles:', roles);
  if (!roles.includes(req.user.role)) {
    console.log('❌ Authorization denied for role:', req.user.role);
    return res.status(403).json({ message: 'Access denied' });
  }
  console.log('✅ Authorization granted for role:', req.user.role);
  next();
};

module.exports = { auth, authorize };
