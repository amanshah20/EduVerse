const mongoose = require('mongoose');

// Enrollment
const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  paymentId: String,
  orderId: String,
  amountPaid: Number,
  couponUsed: String,
  progress: [{
    moduleId: String,
    chapterId: String,
    materialId: String,
    completed: Boolean,
    completedAt: Date
  }],
  progressPercent: { type: Number, default: 0 },
  enrolledAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Teacher Hire
const hireSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  message: String,
  subject: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Assignment
const assignmentSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  description: String,
  dueDate: Date,
  fileUrl: String,
  fileName: String,
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  submissions: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fileUrl: String,
    fileName: String,
    submittedAt: Date,
    marks: Number,
    feedback: String,
    status: { type: String, enum: ['submitted', 'graded', 'late'], default: 'submitted' }
  }],
  maxMarks: { type: Number, default: 100 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Announcement
const announcementSchema = new mongoose.Schema({
  title: String,
  content: String,
  type: { type: String, enum: ['hackathon', 'workshop', 'seminar', 'exam', 'general', 'event'], default: 'general' },
  targetRole: { type: String, enum: ['all', 'student', 'teacher'], default: 'all' },
  date: Date,
  location: String,
  registrationLink: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Timetable
const timetableSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  day: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] },
  subject: String,
  startTime: String,
  endTime: String,
  room: String,
  type: { type: String, enum: ['class', 'exam', 'lab'], default: 'class' }
}, { timestamps: true });

// Quiz
const quizSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  description: String,
  duration: Number, // minutes
  questions: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    marks: { type: Number, default: 1 }
  }],
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  results: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: Number,
    totalMarks: Number,
    percentage: Number,
    answers: [Number],
    submittedAt: Date,
    timeTaken: Number
  }],
  isActive: { type: Boolean, default: true },
  startDate: Date,
  endDate: Date,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Attendance
const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: String,
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
  method: { type: String, enum: ['manual', 'qr', 'geo', 'face'], default: 'manual' }
}, { timestamps: true });

// Task
const taskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  description: String,
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  dueDate: Date,
  reminder: Date,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Class/Section
const classSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  subject: { type: String, required: true },
  description: String,
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  schedule: [{
    day: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] },
    startTime: String,
    endTime: String,
    room: String
  }],
  materials: [{
    title: String,
    type: { type: String, enum: ['pdf', 'doc', 'video', 'link', 'image'] },
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Payment
const paymentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  amount: Number,
  currency: { type: String, default: 'INR' },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  coupon: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = {
  Enrollment: mongoose.model('Enrollment', enrollmentSchema),
  Hire: mongoose.model('Hire', hireSchema),
  Assignment: mongoose.model('Assignment', assignmentSchema),
  Announcement: mongoose.model('Announcement', announcementSchema),
  Timetable: mongoose.model('Timetable', timetableSchema),
  Quiz: mongoose.model('Quiz', quizSchema),
  Attendance: mongoose.model('Attendance', attendanceSchema),
  Task: mongoose.model('Task', taskSchema),
  Class: mongoose.model('Class', classSchema),
  Payment: mongoose.model('Payment', paymentSchema)
};
