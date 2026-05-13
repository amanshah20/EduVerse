const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@eduverse.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    
    console.log('🔄 Seeding admin...');
    
    // Delete any existing admin to ensure fresh password hash
    await User.deleteMany({ role: 'admin' });
    console.log('🗑️ Old admin records cleaned');
    
    // Create new admin with plain password (pre-save hook will hash once)
    const admin = new User({
      name: 'Super Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      status: 'approved',
      isVerified: true,
      otpVerified: true,
      organization: 'Edu Verse'
    });
    
    await admin.save();
    console.log('✅ Fresh admin created with correct password');
    console.log('📧 Admin Email:', adminEmail);
  } catch (err) {
    console.error('❌ Seed admin error:', err.message);
  }
};

module.exports = seedAdmin;
