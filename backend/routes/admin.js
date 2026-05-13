const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const { Enrollment, Hire, Payment, Announcement } = require('../models/index');
const { auth, authorize } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');
const { uploadProfile } = require('../middleware/upload');

const adminAuth = [auth, authorize('admin')];

// Generate random password
const generatePassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
  return Array.from({length: 10}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const generateEmpId = () => 'EMP' + Math.floor(10000 + Math.random() * 90000);

// Dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalCourses, pendingStudents, pendingTeachers] = await Promise.all([
      User.countDocuments({ role: 'student', status: 'approved' }),
      User.countDocuments({ role: 'teacher', status: 'approved' }),
      Course.countDocuments({ isPublished: true }),
      User.countDocuments({ role: 'student', status: 'pending' }),
      User.countDocuments({ role: 'teacher', status: 'pending' })
    ]);
    const payments = await Payment.find({ status: 'success' });
    const revenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    res.json({ totalStudents, totalTeachers, totalCourses, pendingStudents, pendingTeachers, revenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users (students/teachers)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { role, status } = req.query;
    const filter = {};
    
    // Apply role filter
    if (role) {
      filter.role = role;
    } else {
      // Only show student/teacher if no specific role requested
      filter.role = { $in: ['student', 'teacher'] };
    }
    
    // Apply status filter
    if (status) {
      filter.status = status;
    }
    
    const users = await User.find(filter).select('-password -otp').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single user
router.get('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -otp');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve user & send credentials
router.post('/users/:id/approve', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const password = generatePassword();
    let empId = null;
    
    if (user.role === 'teacher') {
      empId = generateEmpId();
      user.empId = empId;
    }
    
    user.status = 'approved';
    user.password = password;
    await user.save();
    
    await sendEmail(user.email, emailTemplates.credentials(user.name, user.email, password, user.role, empId));
    
    res.json({ message: 'User approved and credentials sent', empId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject user
router.post('/users/:id/reject', adminAuth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { status: 'rejected' });
    res.json({ message: 'User rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate password (without approving)
router.post('/users/:id/generate-password', adminAuth, async (req, res) => {
  try {
    const password = generatePassword();
    const empId = req.body.role === 'teacher' ? generateEmpId() : null;
    res.json({ password, empId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle user status
router.post('/users/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `User ${user.isActive ? 'activated' : 'suspended'}`, isActive: user.isActive });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login history / platform stats
router.get('/platform-stats', adminAuth, async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['student', 'teacher'] } }).select('name email role loginHistory loginAttempts lastLogin status');
    const recentLogins = users.flatMap(u => 
      (u.loginHistory || []).slice(-5).map(l => ({ ...l, userName: u.name, userEmail: u.email, role: u.role }))
    ).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50);
    
    res.json({ users, recentLogins });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Announcements
router.get('/announcements', adminAuth, async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/announcements', adminAuth, async (req, res) => {
  try {
    const ann = new Announcement({ ...req.body, createdBy: req.user._id });
    await ann.save();
    res.json(ann);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/announcements/:id', adminAuth, async (req, res) => {
  try {
    const ann = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(ann);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/announcements/:id', adminAuth, async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin profile update
router.put('/profile', adminAuth, uploadProfile.single('photo'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.profilePhoto = `/uploads/profiles/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
