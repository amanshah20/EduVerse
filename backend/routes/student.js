const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { Hire, Assignment, Attendance, Task, Enrollment, Batch, Class: ClassModel, Quiz } = require('../models/index');
const { auth, authorize } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');
const { uploadProfile, uploadAssignment } = require('../middleware/upload');

const studentAuth = [auth, authorize('student')];

// Get all teachers
router.get('/teachers', studentAuth, async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher', status: 'approved', isActive: true })
      .select('name subjects experience chargeTuition profilePhoto bio qualification empId');
    
    const hires = await Hire.find({ student: req.user._id });
    const teacherData = teachers.map(t => {
      const hire = hires.find(h => h.teacher.toString() === t._id.toString());
      return { ...t.toObject(), hireStatus: hire ? hire.status : null, hireId: hire ? hire._id : null };
    });
    
    res.json(teacherData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Hire a teacher
router.post('/hire-teacher', studentAuth, async (req, res) => {
  try {
    const { teacherId, subject, message } = req.body;
    
    const existing = await Hire.findOne({ student: req.user._id, teacher: teacherId, status: { $in: ['pending', 'approved'] } });
    if (existing) return res.status(400).json({ message: 'Already requested or hired this teacher' });
    
    const hire = new Hire({ student: req.user._id, teacher: teacherId, subject, message });
    await hire.save();
    
    const teacher = await User.findById(teacherId);
    await sendEmail(teacher.email, emailTemplates.teacherHireNotification(teacher.name, req.user.name, req.user.email, subject));
    
    res.json({ message: 'Hire request sent! Teacher will be notified.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student's assignments
router.get('/assignments', studentAuth, async (req, res) => {
  try {
    const assignments = await Assignment.find({ assignedTo: req.user._id }).populate('teacher', 'name');
    const enriched = assignments.map(a => {
      const submission = a.submissions.find(s => s.student.toString() === req.user._id.toString());
      return { ...a.toObject(), mySubmission: submission || null };
    });
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit assignment
router.post('/assignments/:id/submit', studentAuth, uploadAssignment.single('file'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    
    const existing = assignment.submissions.findIndex(s => s.student.toString() === req.user._id.toString());
    const submission = {
      student: req.user._id,
      fileUrl: req.file ? `/uploads/assignments/${req.file.filename}` : null,
      fileName: req.file ? req.file.originalname : null,
      submittedAt: new Date(),
      status: new Date() > assignment.dueDate ? 'late' : 'submitted'
    };
    
    if (existing >= 0) assignment.submissions[existing] = submission;
    else assignment.submissions.push(submission);
    
    await assignment.save();
    res.json({ message: 'Assignment submitted!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Attendance
router.get('/attendance', studentAuth, async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.user._id }).sort({ date: -1 });
    
    const bySubject = {};
    records.forEach(r => {
      if (!bySubject[r.subject]) bySubject[r.subject] = { present: 0, absent: 0, late: 0 };
      bySubject[r.subject][r.status]++;
    });
    
    const total = records.length;
    const present = records.filter(r => r.status !== 'absent').length;
    const percentage = total ? Math.round((present / total) * 100) : 0;
    
    res.json({ records, bySubject, overall: { total, present, percentage } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Tasks
router.get('/tasks', studentAuth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/tasks', studentAuth, async (req, res) => {
  try {
    const task = new Task({ ...req.body, user: req.user._id });
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/tasks/:id', studentAuth, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, { new: true });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/tasks/:id', studentAuth, async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Profile update
router.put('/profile', studentAuth, uploadProfile.single('photo'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.profilePhoto = `/uploads/profiles/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Dashboard stats
router.get('/dashboard', studentAuth, async (req, res) => {
  try {
    const [enrollments, assignments, attendanceRecords, tasks] = await Promise.all([
      Enrollment.find({ student: req.user._id }).populate('course', 'title thumbnail'),
      Assignment.find({ assignedTo: req.user._id }),
      Attendance.find({ student: req.user._id }),
      Task.find({ user: req.user._id, status: { $ne: 'done' } })
    ]);
    
    const pendingAssignments = assignments.filter(a => !a.submissions.find(s => s.student.toString() === req.user._id.toString()));
    const present = attendanceRecords.filter(r => r.status !== 'absent').length;
    const attendancePercent = attendanceRecords.length ? Math.round((present / attendanceRecords.length) * 100) : 0;
    
    res.json({
      totalCourses: enrollments.length,
      pendingAssignments: pendingAssignments.length,
      attendancePercent,
      pendingTasks: tasks.length,
      recentCourses: enrollments.slice(0, 3)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== BATCH/SECTION MANAGEMENT =====
// Get all batches from hired teachers
router.get('/batches', studentAuth, async (req, res) => {
  try {
    const hires = await Hire.find({ student: req.user._id, status: 'approved' });
    const teacherIds = hires.map(h => h.teacher);
    
    const batches = await Batch.find({ teacher: { $in: teacherIds }, students: req.user._id })
      .populate('teacher', 'name email subjects')
      .populate('students', 'name email profilePhoto');
    
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific batch
router.get('/batches/:id', studentAuth, async (req, res) => {
  try {
    const batch = await Batch.findOne({
      _id: req.params.id,
      students: req.user._id
    }).populate('teacher', 'name email subjects').populate('students', 'name email profilePhoto');
    
    if (!batch) return res.status(404).json({ message: 'Batch not found or access denied' });
    
    // Get all classes in this batch
    const classes = await ClassModel.find({ batch: batch._id })
      .populate('teacher', 'name email')
      .populate('students', 'name email profilePhoto');
    
    res.json({ ...batch.toObject(), classes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== CLASS MANAGEMENT =====
// Get all classes from hired teachers (organized by batch)
router.get('/classes', studentAuth, async (req, res) => {
  try {
    const hires = await Hire.find({ student: req.user._id, status: 'approved' });
    const teacherIds = hires.map(h => h.teacher);
    
    const classes = await ClassModel.find({ teacher: { $in: teacherIds } })
      .populate('teacher', 'name email subjects')
      .populate('batch', 'name description')
      .populate('students', 'name email profilePhoto');
    
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific class
router.get('/classes/:id', studentAuth, async (req, res) => {
  try {
    const cls = await ClassModel.findById(req.params.id)
      .populate('teacher', 'name email subjects chargeTuition')
      .populate('batch', 'name description')
      .populate('students', 'name email profilePhoto grade');
    
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    
    // Verify student is in the class or is the teacher
    if (cls.students.find(s => s._id.toString() === req.user._id.toString()) || cls.teacher.toString() === req.user._id.toString()) {
      return res.json(cls);
    }
    
    res.status(403).json({ message: 'Access denied' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== QUIZ MANAGEMENT =====
// Get all quizzes assigned to student
router.get('/quizzes', studentAuth, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ assignedTo: req.user._id }).sort({ startDate: -1 });
    const enriched = quizzes.map(q => {
      const result = q.results.find(r => r.student.toString() === req.user._id.toString());
      return { ...q.toObject(), myResult: result || null };
    });
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit quiz answers
router.post('/quizzes/:id/submit', studentAuth, async (req, res) => {
  try {
    const { answers } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Check if already submitted
    if (quiz.results.find(r => r.student.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Already submitted this quiz' });
    }

    // Calculate score
    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) {
        score += q.marks || 1;
      }
    });

    const totalMarks = quiz.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const percentage = Math.round((score / totalMarks) * 100);

    const result = {
      student: req.user._id,
      score,
      totalMarks,
      percentage,
      answers,
      submittedAt: new Date(),
      timeTaken: 0
    };

    quiz.results.push(result);
    await quiz.save();

    res.json({ message: 'Quiz submitted!', score, totalMarks, percentage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all classes for attendance
router.get('/attendance/classes', studentAuth, async (req, res) => {
  try {
    const hires = await Hire.find({ student: req.user._id, status: 'approved' });
    const teacherIds = hires.map(h => h.teacher);
    
    const classes = await ClassModel.find({ teacher: { $in: teacherIds }, isActive: true })
      .populate('teacher', 'name email')
      .populate('batch', 'name');
    
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark attendance by face recognition
router.post('/attendance/mark-face', studentAuth, async (req, res) => {
  try {
    const { classId, batchId, faceImageUrl, method = 'face' } = req.body;
    
    // Verify class and batch exist
    const classDoc = await ClassModel.findById(classId);
    if (!classDoc) return res.status(404).json({ message: 'Class not found' });
    
    // Check if student is in the batch
    const batch = await Batch.findById(batchId);
    const isStudentInBatch = batch.students.some(s => s.toString() === req.user._id.toString());
    if (!isStudentInBatch) return res.status(403).json({ message: 'Not enrolled in this batch' });
    
    // Check if attendance is active for this batch
    const now = new Date();
    if (!batch.attendanceActive || !batch.attendanceStartTime || !batch.attendanceEndTime) {
      return res.status(403).json({ message: 'Attendance marking not enabled for this batch' });
    }
    if (now < batch.attendanceStartTime) {
      return res.status(403).json({ message: 'Attendance marking has not started yet' });
    }
    if (now > batch.attendanceEndTime) {
      return res.status(403).json({ message: 'Attendance marking time has ended' });
    }
    
    // Check if already marked today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await Attendance.findOne({
      student: req.user._id,
      class: classId,
      date: { $gte: today }
    });
    
    if (existing) return res.status(400).json({ message: 'Already marked attendance today' });
    
    const attendance = new Attendance({
      student: req.user._id,
      teacher: classDoc.teacher,
      class: classId,
      batch: batchId,
      subject: classDoc.subject,
      date: new Date(),
      time: new Date().toLocaleTimeString(),
      status: 'present',
      method: method,
      faceImageUrl: faceImageUrl,
      faceVerified: true
    });
    
    await attendance.save();
    res.json({ message: 'Attendance marked successfully!', attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark attendance by geolocation
router.post('/attendance/mark-geolocation', studentAuth, async (req, res) => {
  try {
    const { classId, batchId, latitude, longitude, accuracy } = req.body;
    
    const classDoc = await ClassModel.findById(classId);
    if (!classDoc) return res.status(404).json({ message: 'Class not found' });
    
    const batch = await Batch.findById(batchId);
    const isStudentInBatch = batch.students.some(s => s.toString() === req.user._id.toString());
    if (!isStudentInBatch) return res.status(403).json({ message: 'Not enrolled in this batch' });
    
    // Check if attendance is active for this batch
    const now = new Date();
    if (!batch.attendanceActive || !batch.attendanceStartTime || !batch.attendanceEndTime) {
      return res.status(403).json({ message: 'Attendance marking not enabled for this batch' });
    }
    if (now < batch.attendanceStartTime) {
      return res.status(403).json({ message: 'Attendance marking has not started yet' });
    }
    if (now > batch.attendanceEndTime) {
      return res.status(403).json({ message: 'Attendance marking time has ended' });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await Attendance.findOne({
      student: req.user._id,
      class: classId,
      date: { $gte: today }
    });
    
    if (existing) return res.status(400).json({ message: 'Already marked attendance today' });
    
    const attendance = new Attendance({
      student: req.user._id,
      teacher: classDoc.teacher,
      class: classId,
      batch: batchId,
      subject: classDoc.subject,
      date: new Date(),
      time: new Date().toLocaleTimeString(),
      status: 'present',
      method: 'geolocation',
      latitude,
      longitude,
      accuracy
    });
    
    await attendance.save();
    res.json({ message: 'Attendance marked successfully!', attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark attendance by QR code
router.post('/attendance/mark-qr', studentAuth, async (req, res) => {
  try {
    const { classId, batchId, qrData } = req.body;
    
    const classDoc = await ClassModel.findById(classId);
    if (!classDoc) return res.status(404).json({ message: 'Class not found' });
    
    const batch = await Batch.findById(batchId);
    const isStudentInBatch = batch.students.some(s => s.toString() === req.user._id.toString());
    if (!isStudentInBatch) return res.status(403).json({ message: 'Not enrolled in this batch' });
    
    // Check if attendance is active for this batch
    const now = new Date();
    if (!batch.attendanceActive || !batch.attendanceStartTime || !batch.attendanceEndTime) {
      return res.status(403).json({ message: 'Attendance marking not enabled for this batch' });
    }
    if (now < batch.attendanceStartTime) {
      return res.status(403).json({ message: 'Attendance marking has not started yet' });
    }
    if (now > batch.attendanceEndTime) {
      return res.status(403).json({ message: 'Attendance marking time has ended' });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await Attendance.findOne({
      student: req.user._id,
      class: classId,
      date: { $gte: today }
    });
    
    if (existing) return res.status(400).json({ message: 'Already marked attendance today' });
    
    const attendance = new Attendance({
      student: req.user._id,
      teacher: classDoc.teacher,
      class: classId,
      batch: batchId,
      subject: classDoc.subject,
      date: new Date(),
      time: new Date().toLocaleTimeString(),
      status: 'present',
      method: 'qr',
      qrData
    });
    
    await attendance.save();
    res.json({ message: 'Attendance marked successfully!', attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get attendance history
router.get('/attendance', studentAuth, async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.user._id })
      .populate('teacher', 'name email')
      .populate('class', 'name subject')
      .populate('batch', 'name')
      .sort({ date: -1 });
    
    // Calculate statistics
    const bySubject = {};
    let totalPresent = 0;
    let totalClasses = 0;
    
    records.forEach(record => {
      const subject = record.class?.subject || 'Unknown';
      if (!bySubject[subject]) {
        bySubject[subject] = { present: 0, absent: 0, late: 0 };
      }
      bySubject[subject][record.status]++;
      if (record.status === 'present') totalPresent++;
      totalClasses++;
    });
    
    const percentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
    
    res.json({
      records,
      bySubject,
      overall: {
        total: totalClasses,
        present: totalPresent,
        percentage
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
