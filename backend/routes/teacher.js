const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { Hire, Assignment, Attendance, Quiz, Timetable, Batch, Class: ClassModel } = require('../models/index');
const { Notification } = require('../models/index');
const { auth, authorize } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');
const { uploadProfile, uploadAssignment } = require('../middleware/upload');
const { createNotification } = require('./notifications');

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
    const assignments = await Assignment.find({ teacher: req.user._id })
      .populate('assignedTo', 'name email')
      .populate('submissions.student', 'name email')
      .sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/assignments', teacherAuth, uploadAssignment.single('file'), async (req, res) => {
  try {
    const { title, description, dueDate, maxMarks } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!dueDate) {
      return res.status(400).json({ message: 'Due date is required' });
    }

    const hires = await Hire.find({ teacher: req.user._id, status: 'approved' });
    const studentIds = hires.map(h => h.student);
    
    if (studentIds.length === 0) {
      return res.status(400).json({ message: 'No approved students. Please approve hire requests first.' });
    }

    const assignment = new Assignment({
      teacher: req.user._id,
      title: title,
      description: description || '',
      dueDate: new Date(dueDate),
      maxMarks: parseInt(maxMarks) || 100,
      fileUrl: req.file ? `/uploads/assignments/${req.file.filename}` : null,
      fileName: req.file ? req.file.originalname : null,
      assignedTo: studentIds,
      submissions: []
    });
    
    await assignment.save();
    await assignment.populate('assignedTo', 'name email');
    
    res.json(assignment);
  } catch (error) {
    console.error('Assignment creation error:', error);
    res.status(500).json({ message: error.message || 'Failed to create assignment' });
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
    const quizzes = await Quiz.find({ teacher: req.user._id })
      .populate('assignedTo', 'name email')
      .populate('results.student', 'name email')
      .sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/quizzes', teacherAuth, async (req, res) => {
  try {
    const { title, description, duration, startDate, endDate, questions } = req.body;
    
    if (!title) return res.status(400).json({ message: 'Quiz title is required' });
    if (!startDate || !endDate) return res.status(400).json({ message: 'Start and end dates are required' });
    if (!questions || questions.length === 0) return res.status(400).json({ message: 'At least one question is required' });

    const hires = await Hire.find({ teacher: req.user._id, status: 'approved' });
    const studentIds = hires.map(h => h.student);
    
    if (studentIds.length === 0) {
      return res.status(400).json({ message: 'No approved students. Please approve hire requests first.' });
    }

    const quiz = new Quiz({
      teacher: req.user._id,
      title,
      description: description || '',
      duration: parseInt(duration) || 30,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      questions: questions || [],
      assignedTo: studentIds,
      results: [],
      isActive: true
    });
    
    await quiz.save();
    await quiz.populate('assignedTo', 'name email');
    
    res.json(quiz);
  } catch (error) {
    console.error('Quiz creation error:', error);
    res.status(500).json({ message: error.message || 'Failed to create quiz' });
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
    
    const totalQuizAttempts = quizzes.reduce((sum, q) => sum + (q.results?.length || 0), 0);
    
    res.json({ 
      activeStudents, 
      pendingRequests, 
      totalAssignments: assignments.length, 
      totalQuizzes: quizzes.length, 
      totalQuizAttempts,
      pendingGrading 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== BATCH/SECTION MANAGEMENT =====
// Create a new batch
router.post('/batches', teacherAuth, async (req, res) => {
  try {
    const { name, description, students } = req.body;
    const batch = new Batch({
      teacher: req.user._id,
      name,
      description,
      students: students || [],
      totalStudents: (students || []).length
    });
    await batch.save();
    await batch.populate('students', 'name email grade contact');
    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all batches for a teacher
router.get('/batches', teacherAuth, async (req, res) => {
  try {
    const batches = await Batch.find({ teacher: req.user._id }).populate('students', 'name email grade contact');
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific batch
router.get('/batches/:id', teacherAuth, async (req, res) => {
  try {
    const batch = await Batch.findOne({ _id: req.params.id, teacher: req.user._id }).populate('students', 'name email grade contact');
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update batch
router.put('/batches/:id', teacherAuth, async (req, res) => {
  try {
    const { name, description, students } = req.body;
    const batch = await Batch.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user._id },
      { name, description, students, totalStudents: (students || []).length },
      { new: true }
    ).populate('students', 'name email grade contact');
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete batch
router.delete('/batches/:id', teacherAuth, async (req, res) => {
  try {
    const batch = await Batch.findOneAndDelete({ _id: req.params.id, teacher: req.user._id });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json({ message: 'Batch deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Pass/Enable attendance for a batch
router.post('/batches/:id/pass-attendance', teacherAuth, async (req, res) => {
  try {
    const { durationMinutes, message, materials } = req.body;
    const batch = await Batch.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + (durationMinutes || 30) * 60000);
    
    batch.attendanceActive = true;
    batch.attendanceStartTime = startTime;
    batch.attendanceEndTime = endTime;
    batch.attendanceMessage = message || `Attendance enabled! You have ${durationMinutes || 30} minutes to mark your attendance.`;
    if (materials && Array.isArray(materials)) {
      batch.classMaterials = materials;
    }
    await batch.save();
    
    // Send notifications to all students in batch
    const notificationPromises = batch.students.map(studentId =>
      createNotification(
        studentId,
        'attendance_enabled',
        `Attendance Enabled - ${batch.name}`,
        `${req.user.name} has enabled attendance marking for ${batch.duration} minutes. ${batch.attendanceMessage}`,
        {
          batchId: batch._id,
          duration: durationMinutes || 30,
          startTime: startTime,
          endTime: endTime
        },
        req.user._id
      )
    );
    
    await Promise.all(notificationPromises);
    
    res.json({ 
      message: 'Attendance enabled for batch', 
      batch: {
        ...batch.toObject(),
        classMaterials: batch.classMaterials,
        attendanceMessage: batch.attendanceMessage
      },
      endTime 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Stop attendance for a batch
router.post('/batches/:id/stop-attendance', teacherAuth, async (req, res) => {
  try {
    const batch = await Batch.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    
    batch.attendanceActive = false;
    batch.attendanceStartTime = null;
    batch.attendanceEndTime = null;
    await batch.save();
    
    res.json({ message: 'Attendance disabled for batch' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== CLASS MANAGEMENT =====
// Create a new class
router.post('/classes', teacherAuth, async (req, res) => {
  try {
    const { name, subject, description, batch, teachingMode, meetingLink, schedule, students } = req.body;
    
    if (!batch) return res.status(400).json({ message: 'Batch is required' });
    
    // Verify batch exists and belongs to teacher
    const batchExists = await Batch.findOne({ _id: batch, teacher: req.user._id });
    if (!batchExists) return res.status(404).json({ message: 'Batch not found' });
    
    const newClass = new ClassModel({
      teacher: req.user._id,
      batch,
      name,
      subject,
      description,
      teachingMode: teachingMode || 'online',
      meetingLink,
      schedule: schedule || [],
      students: students || []
    });
    await newClass.save();
    const classData = await ClassModel.findById(newClass._id)
      .populate('batch', 'name')
      .populate('students', 'name email');
    res.json(classData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all classes of a teacher (organized by batch)
router.get('/classes', teacherAuth, async (req, res) => {
  try {
    const classes = await ClassModel.find({ teacher: req.user._id })
      .populate('batch', 'name description')
      .populate('students', 'name email profilePhoto');
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

// Get batches for attendance
router.get('/attendance/batches', teacherAuth, async (req, res) => {
  try {
    const batches = await Batch.find({ teacher: req.user._id })
      .populate('students', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get classes in a batch
router.get('/attendance/batch/:batchId/classes', teacherAuth, async (req, res) => {
  try {
    const classes = await ClassModel.find({
      teacher: req.user._id,
      batch: req.params.batchId
    });
    
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get students in batch for attendance
router.get('/attendance/batch/:batchId/students', teacherAuth, async (req, res) => {
  try {
    const batch = await Batch.findOne({
      _id: req.params.batchId,
      teacher: req.user._id
    }).populate('students', 'name email _id');
    
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    
    res.json(batch.students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark attendance for student (teacher marks)
router.post('/attendance/mark', teacherAuth, async (req, res) => {
  try {
    const { studentId, classId, batchId, status } = req.body;
    
    // Verify teacher owns this class
    const cls = await ClassModel.findOne({ _id: classId, teacher: req.user._id });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    
    // Check if already marked today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await Attendance.findOne({
      student: studentId,
      class: classId,
      date: { $gte: today }
    });
    
    if (existing) {
      existing.status = status;
      existing.markedBy = req.user._id;
      existing.markedAt = new Date();
      await existing.save();
      return res.json({ message: 'Attendance updated', attendance: existing });
    }
    
    const attendance = new Attendance({
      student: studentId,
      teacher: req.user._id,
      class: classId,
      batch: batchId,
      subject: cls.subject,
      date: new Date(),
      time: new Date().toLocaleTimeString(),
      status: status,
      method: 'manual',
      markedBy: req.user._id,
      markedAt: new Date()
    });
    
    await attendance.save();
    res.json({ message: 'Attendance marked', attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get attendance records for a class
router.get('/attendance/class/:classId', teacherAuth, async (req, res) => {
  try {
    const cls = await ClassModel.findOne({ _id: req.params.classId, teacher: req.user._id });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    
    const records = await Attendance.find({ class: req.params.classId })
      .populate('student', 'name email')
      .sort({ date: -1 });
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get attendance for a date and class
router.get('/attendance/class/:classId/date/:date', teacherAuth, async (req, res) => {
  try {
    const cls = await ClassModel.findOne({ _id: req.params.classId, teacher: req.user._id });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    
    const queryDate = new Date(req.params.date);
    queryDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(queryDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const records = await Attendance.find({
      class: req.params.classId,
      date: { $gte: queryDate, $lt: nextDate }
    }).populate('student', 'name email');
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete attendance record
router.delete('/attendance/:id', teacherAuth, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) return res.status(404).json({ message: 'Attendance not found' });
    
    const cls = await ClassModel.findOne({ _id: attendance.class, teacher: req.user._id });
    if (!cls) return res.status(403).json({ message: 'Not authorized' });
    
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Attendance deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
