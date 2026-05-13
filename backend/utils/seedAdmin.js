const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@eduverse.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    
    console.log('🔄 Seeding admin with email:', adminEmail);
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin', email: adminEmail });
    if (existingAdmin) {
      console.log('✅ Admin already exists:', adminEmail);
      return;
    }
    
    const admin = new User({
      name: 'Super Admin',
      email: adminEmail,
      password: adminPassword, // Pre-save hook will hash it once
      role: 'admin',
      status: 'approved',
      isVerified: true,
      otpVerified: true,
      organization: 'Edu Verse'
    });
    
    await admin.save();
    console.log('✅ Edu Verse Admin created:', adminEmail);
  } catch (err) {
    console.error('❌ Seed admin error:', err.message);
  }
};

module.exports = seedAdmin;
