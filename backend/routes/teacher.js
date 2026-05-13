const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { Hire, Assignment, Attendance, Quiz, Timetable, Class: ClassModel } = require('../models/index');
const { auth, authorize } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');
const { uploadProfile, uploadAssignment } = require('../middleware/upload');

const teacherAuth = [auth, authorize('teacher')];

// Profile update
router.put('/profile', teacherAuth, uploadProfile.single('photo'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.profilePhoto = `/uploads/profiles/${req.file.filename}`;
    if (updates.subjects && typeof updates.subjects === 'string') {
      updates.subjects = updates.subjects.split(',').map(s => s.trim());
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get teacher's hire requests
router.get('/hire-requests', teacherAuth, async (req, res) => {
  try {
    const requests = await Hire.find({ teacher: req.user._id }).populate('student', 'name email grade contact');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Respond to hire request
router.put('/hire-requests/:id', teacherAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const hire = await Hire.findOne({ _id: req.params.id, teacher: req.user._id }).populate('student');
    if (!hire) return res.status(404).json({ message: 'Request not found' });
    
    hire.status = status;
    await hire.save();
    
    if (status === 'approved') {
      await sendEmail(hire.student.email, emailTemplates.studentHireApproved(hire.student.name, req.user.name, hire.subject));
    }
    
    res.json({ message: `Request ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get hired students
router.get('/students', teacherAuth, async (req, res) => {
  try {
    const hires = await Hire.find({ teacher: req.user._id, status: 'approved' }).populate('student', 'name email grade contact profilePhoto');
    res.json(hires.map(h => h.student));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Assignments
router.get('/assignments', teacherAuth, async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacher: req.user._id }).populate('assignedTo', 'name email');
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/assignments', teacherAuth, uploadAssignment.single('file'), async (req, res) => {
  try {
    const hires = await Hire.find({ teacher: req.user._id, status: 'approved' });
    const studentIds = hires.map(h => h.student);
    
    const assignment = new Assignment({
      teacher: req.user._id,
      title: req.body.title,
      description: req.body.description,
      dueDate: req.body.dueDate,
      maxMarks: req.body.maxMarks || 100,
      fileUrl: req.file ? `/uploads/assignments/${req.file.filename}` : null,
      fileName: req.file ? req.file.originalname : null,
      assignedTo: studentIds
    });
    await assignment.save();
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Grade submission
router.put('/assignments/:id/grade/:studentId', teacherAuth, async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, teacher: req.user._id });
    const sub = assignment.submissions.find(s => s.student.toString() === req.params.studentId);
    if (!sub) return res.status(404).json({ message: 'Submission not found' });
    
    sub.marks = req.body.marks;
    sub.feedback = req.body.feedback;
    sub.status = 'graded';
    await assignment.save();
    res.json({ message: 'Graded!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Attendance management
router.post('/attendance', teacherAuth, async (req, res) => {
  try {
    const { studentId, subject, status, date, method } = req.body;
    const record = new Attendance({
      student: studentId,
      teacher: req.user._id,
      subject,
      status,
      date: date || new Date(),
      method: method || 'manual'
    });
    await record.save();
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/attendance/bulk', teacherAuth, async (req, res) => {
  try {
    const { records, subject, date, method } = req.body;
    const docs = records.map(r => ({
      student: r.studentId,
      teacher: req.user._id,
      subject,
      status: r.status,
      date: date || new Date(),
      method: method || 'manual'
    }));
    await Attendance.insertMany(docs);
    res.json({ message: 'Attendance marked for all students' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Quizzes
router.get('/quizzes', teacherAuth, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ teacher: req.user._id }).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/quizzes', teacherAuth, async (req, res) => {
  try {
    const hires = await Hire.find({ teacher: req.user._id, status: 'approved' });
    const studentIds = hires.map(h => h.student);
    
    const quiz = new Quiz({ ...req.body, teacher: req.user._id, assignedTo: studentIds });
    await quiz.save();
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Dashboard stats
router.get('/dashboard', teacherAuth, async (req, res) => {
  try {
    const [hires, assignments, quizzes] = await Promise.all([
      Hire.find({ teacher: req.user._id }),
      Assignment.find({ teacher: req.user._id }),
      Quiz.find({ teacher: req.user._id })
    ]);
    
    const activeStudents = hires.filter(h => h.status === 'approved').length;
    const pendingRequests = hires.filter(h => h.status === 'pending').length;
    const pendingGrading = assignments.reduce((sum, a) => 
      sum + a.submissions.filter(s => s.status === 'submitted').length, 0);
    
    res.json({ activeStudents, pendingRequests, totalAssignments: assignments.length, totalQuizzes: quizzes.length, pendingGrading });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== CLASS MANAGEMENT =====
// Create a new class
router.post('/classes', teacherAuth, async (req, res) => {
  try {
    const { name, subject, description, schedule } = req.body;
    const newClass = new ClassModel({
      teacher: req.user._id,
      name,
      subject,
      description,
      schedule: schedule || [],
      students: []
    });
    await newClass.save();
    res.json(newClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all classes of a teacher
router.get('/classes', teacherAuth, async (req, res) => {
  try {
    const classes = await ClassModel.find({ teacher: req.user._id }).populate('students', 'name email profilePhoto');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific class
router.get('/classes/:id', teacherAuth, async (req, res) => {
  try {
    const cls = await ClassModel.findOne({ _id: req.params.id, teacher: req.user._id }).populate('students', 'name email profilePhoto grade contact');
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.json(cls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update class
router.put('/classes/:id', teacherAuth, async (req, res) => {
  try {
    const cls = await ClassModel.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user._id },
      req.body,
      { new: true }
    ).populate('students', 'name email profilePhoto');
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.json(cls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add student to class
router.post('/classes/:id/add-student', teacherAuth, async (req, res) => {
  try {
    const { studentId } = req.body;
    const cls = await ClassModel.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    
    if (!cls.students.includes(studentId)) {
      cls.students.push(studentId);
      await cls.save();
    }
    
    res.json(cls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove student from class
router.post('/classes/:id/remove-student', teacherAuth, async (req, res) => {
  try {
    const { studentId } = req.body;
    const cls = await ClassModel.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    
    cls.students = cls.students.filter(s => s.toString() !== studentId);
    await cls.save();
    
    res.json(cls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add material to class
router.post('/classes/:id/materials', teacherAuth, uploadAssignment.single('file'), async (req, res) => {
  try {
    const cls = await ClassModel.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    
    const material = {
      title: req.body.title,
      type: req.body.type,
      url: req.file ? `/uploads/assignments/${req.file.filename}` : req.body.url,
      uploadedAt: new Date()
    };
    
    cls.materials.push(material);
    await cls.save();
    
    res.json(cls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete class
router.delete('/classes/:id', teacherAuth, async (req, res) => {
  try {
    const cls = await ClassModel.findOneAndDelete({ _id: req.params.id, teacher: req.user._id });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.json({ message: 'Class deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
