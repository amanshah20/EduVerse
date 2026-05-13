const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmail, emailTemplates } = require('../utils/email');
const { auth } = require('../middleware/auth');

// Student/Teacher Application
router.post('/apply', async (req, res) => {
  try {
    const { role, name, email, contact, purpose, grade, qualification, experience, subjects, bio, chargeTuition } = req.body;
    
    const emailNorm = email?.trim().toLowerCase();
    const existing = await User.findOne({ email: emailNorm });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    
    const user = new User({
      name, email: emailNorm, role,
      contact, purpose, grade,
      qualification, experience,
      subjects: subjects ? (Array.isArray(subjects) ? subjects : subjects.split(',').map(s => s.trim())) : [],
      bio, chargeTuition,
      status: 'pending'
    });
    await user.save();
    
    // Send confirmation email
    await sendEmail(email, emailTemplates.applicationReceived(name, role));
    
    res.json({ message: 'Application submitted successfully! You will receive credentials via email after approval.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login Step 1 - validate credentials
router.post('/login', async (req, res) => {
  try {
    const { email, password, role, empId } = req.body;
    
    const emailNorm = email?.trim().toLowerCase();
    console.log(`🔐 Login attempt: ${emailNorm} as ${role}`);
    
    const user = await User.findOne({ email: emailNorm, role });
    if (!user) {
      console.log(`❌ User not found: ${emailNorm} with role ${role}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log(`✅ User found: ${user.email}, status: ${user.status}`);
    
    if (user.status !== 'approved') {
      console.log(`❌ Account not approved: ${user.status}`);
      return res.status(401).json({ message: 'Account not approved yet' });
    }
    
    // Teacher - verify Employee ID
    if (role === 'teacher') {
      if (!empId) return res.status(401).json({ message: 'Employee ID required for teachers' });
      if (user.empId !== empId) return res.status(401).json({ message: 'Invalid Employee ID' });
    }
    
    // Check lock
    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(401).json({ message: `Account locked. Try again after ${new Date(user.lockUntil).toLocaleTimeString()}` });
    }
    
    console.log(`🔑 Comparing password for ${user.email}...`);
    const isMatch = await user.comparePassword(password);
    console.log(`🔑 Password match: ${isMatch}`);
    
    if (!isMatch) {
      console.log(`❌ Invalid password for ${user.email}`);
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
      }
      await user.save();
      return res.status(401).json({ message: 'Invalid credentials', attemptsLeft: Math.max(0, 5 - user.loginAttempts) });
    }
    
    // Admin - no OTP
    if (role === 'admin') {
      user.loginAttempts = 0;
      user.lockUntil = null;
      user.lastLogin = new Date();
      user.loginHistory.push({ timestamp: new Date(), ip: req.ip, success: true });
      await user.save();
      
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: sanitizeUser(user), requireOTP: false });
    }
    
    // Student/Teacher - OTP only required on FIRST login (not verified yet)
    if (!user.otpVerified) {
      // First login - require OTP verification
      const otp = user.generateOTP();
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();
      
      await sendEmail(email, emailTemplates.otp(user.name, otp));
      
      return res.json({ message: 'OTP sent to your email', requireOTP: true, userId: user._id });
    } else {
      // Already verified before - allow direct login
      user.loginAttempts = 0;
      user.lockUntil = null;
      user.lastLogin = new Date();
      user.loginHistory.push({ timestamp: new Date(), ip: req.ip, success: true });
      await user.save();
      
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: sanitizeUser(user), requireOTP: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login Step 2 - OTP verification
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (!user.otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP expired. Please login again.' });
    }
    
    user.otpAttempts = (user.otpAttempts || 0) + 1;
    if (user.otpAttempts > 5) {
      user.otp = null;
      await user.save();
      return res.status(400).json({ message: 'Too many OTP attempts. Please login again.' });
    }
    
    if (user.otp !== otp) {
      await user.save();
      return res.status(400).json({ message: 'Invalid OTP', attemptsLeft: 5 - user.otpAttempts });
    }
    
    user.otp = null;
    user.otpExpiry = null;
    user.otpAttempts = 0;
    user.isVerified = true;
    user.otpVerified = true; // Mark as first OTP verification completed
    user.lastLogin = new Date();
    user.loginHistory.push({ timestamp: new Date(), ip: req.ip, success: true });
    await user.save();
    
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const otp = user.generateOTP();
    await user.save();
    await sendEmail(user.email, emailTemplates.otp(user.name, otp));
    
    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json(sanitizeUser(req.user));
});

// Update password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password incorrect' });
    
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

function sanitizeUser(user) {
  const u = user.toObject ? user.toObject() : user;
  delete u.password;
  delete u.otp;
  delete u.otpExpiry;
  return u;
}

module.exports = router;
