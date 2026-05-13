const express = require('express');
const router = express.Router();
const { Announcement } = require('../models/index');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.user.role !== 'admin') {
      filter.targetRole = { $in: ['all', req.user.role] };
    }
    const announcements = await Announcement.find(filter).sort({ createdAt: -1 }).limit(20);
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
