const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },
  role: { type: String, enum: ['student', 'teacher', 'admin'], required: true },
  empId: { type: String }, // for teachers
  studentId: { type: String }, // for students
  
  // Student fields
  contact: String,
  purpose: String,
  grade: String,
  
  // Teacher fields
  qualification: String,
  experience: String,
  subjects: [String],
  bio: String,
  chargeTuition: { type: Number, default: 0 },
  profilePhoto: String,
  
  // Status
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'pending' },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  
  // OTP
  otp: String,
  otpExpiry: Date,
  otpAttempts: { type: Number, default: 0 },
  otpVerified: { type: Boolean, default: false }, // Track if user has completed first OTP verification
  
  // Login tracking
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  loginHistory: [{
    timestamp: Date,
    ip: String,
    success: Boolean
  }],
  
  // Admin fields
  organization: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  this.otpAttempts = 0;
  return otp;
};

module.exports = mongoose.model('User', userSchema);
