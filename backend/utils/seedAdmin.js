const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@eduverse.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    
    console.log('🔄 Seeding admin with email:', adminEmail);
    console.log('🔄 Admin password length:', adminPassword.length);
    
    // Delete existing admin to ensure fresh creation
    await User.deleteOne({ role: 'admin' });
    
    // Hash password explicitly
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    const admin = new User({
      name: 'Super Admin',
      email: adminEmail,
      password: adminPassword, // Set plain password, pre-save hook will hash it
      role: 'admin',
      status: 'approved',
      isVerified: true,
      otpVerified: true,
      organization: 'Edu Verse'
    });
    
    await admin.save();
    console.log('✅ Fresh Edu Verse Admin created:', adminEmail);
    console.log('✅ Password hashed and saved successfully');
  } catch (err) {
    console.error('❌ Seed admin error:', err);
  }
};

module.exports = seedAdmin;
