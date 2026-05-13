const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { Enrollment } = require('../models/index');
const { auth, authorize } = require('../middleware/auth');
const { uploadCourse } = require('../middleware/upload');
const path = require('path');

// Get all published courses (student view)
router.get('/', auth, async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true }).select('-modules.chapters.materials.url').lean();
    
    // Add enrollment info for students
    if (req.user.role === 'student') {
      const enrollments = await Enrollment.find({ student: req.user._id }).select('course progressPercent');
      courses.forEach(c => {
        const enr = enrollments.find(e => e.course.toString() === c._id.toString());
        c.isEnrolled = !!enr;
        c.progress = enr ? enr.progressPercent : 0;
      });
    }
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all courses (admin)
router.get('/admin/all', auth, authorize('admin'), async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single course
router.get('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    // Check enrollment for full content
    if (req.user.role === 'student') {
      const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.id });
      return res.json({ ...course.toObject(), isEnrolled: !!enrollment, enrollment });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create course (admin)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const course = new Course({ ...req.body, createdBy: req.user._id });
    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update course (admin)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete course
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload course material
router.post('/:courseId/modules/:moduleId/chapters/:chapterId/upload', 
  auth, authorize('admin'), 
  uploadCourse.single('file'), 
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId);
      const module = course.modules.id(req.params.moduleId);
      const chapter = module.chapters.id(req.params.chapterId);
      
      const material = {
        title: req.body.title || req.file.originalname,
        type: req.body.type || 'pdf',
        url: `/uploads/courses/${req.file.filename}`,
        fileName: req.file.originalname,
        order: chapter.materials.length + 1
      };
      
      chapter.materials.push(material);
      await course.save();
      res.json({ message: 'Material uploaded', material });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Add module
router.post('/:id/modules', auth, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    course.modules.push({ ...req.body, order: course.modules.length + 1 });
    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add chapter to module
router.post('/:id/modules/:moduleId/chapters', auth, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    const module = course.modules.id(req.params.moduleId);
    module.chapters.push({ ...req.body, order: module.chapters.length + 1 });
    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add YouTube material
router.post('/:id/modules/:moduleId/chapters/:chapterId/youtube', auth, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    const module = course.modules.id(req.params.moduleId);
    const chapter = module.chapters.id(req.params.chapterId);
    
    chapter.materials.push({
      title: req.body.title,
      type: 'youtube',
      youtubeUrl: req.body.url,
      order: chapter.materials.length + 1
    });
    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Validate coupon
router.post('/:id/validate-coupon', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    const coupon = course.couponCodes.find(c => c.code === req.body.code && c.isActive);
    if (!coupon) return res.status(400).json({ message: 'Invalid or expired coupon' });
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }
    
    let finalPrice = course.price;
    if (coupon.type === 'percent') finalPrice = course.price * (1 - coupon.discount / 100);
    else finalPrice = Math.max(0, course.price - coupon.discount);
    
    res.json({ valid: true, discount: coupon.discount, type: coupon.type, finalPrice: Math.round(finalPrice) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student's enrolled courses
router.get('/student/my-courses', auth, authorize('student'), async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id }).populate('course');
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update progress
router.post('/:id/progress', auth, authorize('student'), async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.id });
    if (!enrollment) return res.status(404).json({ message: 'Not enrolled' });
    
    const { moduleId, chapterId, materialId } = req.body;
    const exists = enrollment.progress.find(p => p.materialId === materialId);
    if (!exists) {
      enrollment.progress.push({ moduleId, chapterId, materialId, completed: true, completedAt: new Date() });
    }
    
    // Calculate percentage
    const course = await Course.findById(req.params.id);
    const totalMaterials = course.modules.reduce((sum, m) => 
      sum + m.chapters.reduce((s, c) => s + c.materials.length, 0), 0);
    enrollment.progressPercent = Math.round((enrollment.progress.length / Math.max(totalMaterials, 1)) * 100);
    
    await enrollment.save();
    res.json({ progress: enrollment.progressPercent });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
