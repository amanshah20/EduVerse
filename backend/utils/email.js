const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

const emailTemplates = {
  otp: (name, otp) => ({
    subject: '🔐 Your OTP - EduVerse',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff;">EduVerse</h1>
          <p style="margin: 8px 0 0; opacity: 0.95; color: #ffffff;">Next-Gen Learning Platform</p>
        </div>
        <div style="padding: 40px;">
          <h2 style="color: #3b82f6; margin-top: 0;">Hello, ${name}! 👋</h2>
          <p style="color: #64748b; line-height: 1.6;">Your One-Time Password for verification is:</p>
          <div style="background: #f5f3ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 30px; text-align: center; margin: 24px 0;">
            <span style="font-size: 48px; font-weight: 900; letter-spacing: 12px; color: #3b82f6;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">⏰ This OTP expires in <strong style="color: #ef4444;">10 minutes</strong></p>
          <p style="color: #94a3b8; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>
        <div style="background: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
          © 2024 EduVerse. All rights reserved.
        </div>
      </div>
    `
  }),

  credentials: (name, email, password, role, empId) => ({
    subject: '🎉 Your EduVerse Credentials - Welcome!',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff;">EduVerse</h1>
          <p style="margin: 8px 0 0; opacity: 0.95; color: #ffffff;">Your Account is Ready!</p>
        </div>
        <div style="padding: 40px;">
          <h2 style="color: #3b82f6; margin-top: 0;">Welcome, ${name}! 🎓</h2>
          <p style="color: #64748b;">Your application has been approved. Here are your login credentials:</p>
          <div style="background: #f5f3ff; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #64748b; padding: 10px 0; border-bottom: 1px solid #e9d5ff; font-size: 14px;">Role</td>
                <td style="color: #3b82f6; font-weight: 700; padding: 10px 0; border-bottom: 1px solid #e9d5ff; text-transform: capitalize;">${role}</td>
              </tr>
              ${empId ? `<tr><td style="color: #64748b; padding: 10px 0; border-bottom: 1px solid #e9d5ff; font-size: 14px;">Employee ID</td><td style="color: #8b5cf6; font-weight: 700; padding: 10px 0; border-bottom: 1px solid #e9d5ff;">${empId}</td></tr>` : ''}
              <tr>
                <td style="color: #64748b; padding: 10px 0; border-bottom: 1px solid #e9d5ff; font-size: 14px;">Email (Login ID)</td>
                <td style="color: #1e293b; padding: 10px 0; border-bottom: 1px solid #e9d5ff;">${email}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 10px 0; font-size: 14px;">Password</td>
                <td style="color: #ef4444; font-weight: 700; font-family: monospace; font-size: 18px; padding: 10px 0;">${password}</td>
              </tr>
            </table>
          </div>
          <p style="color: #ef4444; font-size: 13px;">⚠️ Please change your password after first login for security.</p>
          <a href="${process.env.FRONTEND_URL}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; margin-top: 16px;">Login to Platform →</a>
        </div>
        <div style="background: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
          © 2024 EduVerse. All rights reserved.
        </div>
      </div>
    `
  }),

  applicationReceived: (name, role) => ({
    subject: '📋 Application Received - EduVerse',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff;">EduVerse</h1>
        </div>
        <div style="padding: 40px;">
          <h2 style="color: #3b82f6;">Application Received! ✅</h2>
          <p style="color: #64748b;">Hello <strong>${name}</strong>,</p>
          <p style="color: #64748b; line-height: 1.6;">Your <strong style="color: #3b82f6;">${role}</strong> application has been received successfully. Our admin team will review it and you'll receive your login credentials via email once approved.</p>
          <p style="color: #94a3b8; font-size: 14px;">This usually takes 24-48 hours.</p>
        </div>
        <div style="background: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
          © 2024 EduVerse. All rights reserved.
        </div>
      </div>
    `
  }),

  teacherHireNotification: (teacherName, studentName, studentEmail, subject) => ({
    subject: '👨‍🎓 New Student Hire Request - EduVerse',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff;">EduVerse</h1>
        </div>
        <div style="padding: 40px;">
          <h2 style="color: #8b5cf6;">New Hire Request! 🎉</h2>
          <p style="color: #64748b;">Hello <strong>${teacherName}</strong>,</p>
          <p style="color: #64748b;">A student wants to hire you for tutoring:</p>
          <div style="background: #f5f3ff; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="margin: 8px 0; color: #64748b;"><strong style="color: #3b82f6;">Student:</strong> ${studentName}</p>
            <p style="margin: 8px 0; color: #64748b;"><strong style="color: #3b82f6;">Email:</strong> ${studentEmail}</p>
            <p style="margin: 8px 0; color: #64748b;"><strong style="color: #3b82f6;">Subject:</strong> ${subject || 'Not specified'}</p>
          </div>
          <p style="color: #64748b;">Please login to your dashboard to approve or reject this request.</p>
        </div>
        <div style="background: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
          © 2024 EduVerse. All rights reserved.
        </div>
      </div>
    `
  }),

  studentHireApproved: (studentName, teacherName, subject) => ({
    subject: '✅ Teacher Hire Approved - EduVerse',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff;">EduVerse</h1>
        </div>
        <div style="padding: 40px;">
          <h2 style="color: #3b82f6;">You're Selected! 🎓</h2>
          <p style="color: #64748b;">Hello <strong>${studentName}</strong>,</p>
          <p style="color: #64748b;">Great news! <strong style="color: #3b82f6;">${teacherName}</strong> has approved your hire request for <strong>${subject || 'tutoring'}</strong>.</p>
          <p style="color: #64748b;">You can now access the teacher's class materials in your dashboard.</p>
        </div>
        <div style="background: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
          © 2024 EduVerse. All rights reserved.
        </div>
      </div>
    `
  })
};

const sendEmail = async (to, template) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"EduVerse" <${process.env.EMAIL_USER}>`,
      to,
      subject: template.subject,
      html: template.html
    });
    console.log(`✅ Email sent successfully to ${to}`, info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', {
      to,
      error: error.message,
      code: error.code,
      response: error.response?.substring(0, 200)
    });
    return false;
  }
};

module.exports = { sendEmail, emailTemplates };
