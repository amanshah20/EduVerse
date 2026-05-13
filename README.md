# ⚡ Edu Verse — Premium Digital Education Platform

A production-ready full-stack digital education platform with **premium SaaS UI**, AI-powered chatbot, role-based dashboards, payment integration, and complete course management.

---

## 🎯 Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Gmail account (for OTP and notifications)
- Razorpay account (for payments)
- Groq API key (for EduBot AI chatbot)

### 2. Install Dependencies
```bash
# Backend
cd backend && npm install

# Frontend  
cd ../frontend && npm install
```

### 3. Configure Environment

**`backend/.env`** — Fill in your credentials:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/eduverse
JWT_SECRET=your_secret_key_here

# Email (Gmail SMTP)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16char_app_password   # Generate at myaccount.google.com/apppasswords

# Admin super credentials
ADMIN_EMAIL=admin@eduverse.com
ADMIN_PASSWORD=Admin@123456

# Razorpay payment gateway
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# Groq AI (for EduBot chatbot) — Get free key at console.groq.com
GROQ_API_KEY=gsk_...

FRONTEND_URL=http://localhost:5173
PLATFORM_NAME=Edu Verse
```

**`frontend/.env`**:
```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_...
VITE_APP_NAME=Edu Verse
```

### 4. Run

```bash
# Terminal 1 — Backend (start MongoDB first)
cd backend && node server.js

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open: **http://localhost:5173**

---

## 🔑 Default Admin Login

Go to **http://localhost:5173/login** → Select **Admin** tab:
- **Email:** `admin@eduverse.com`  
- **Password:** `Admin@123456`

> Admin logs in directly — **no OTP required**. Change credentials in `.env` before going live.

---

## 🤖 EduBot AI Chatbot Setup (Groq)

1. Visit **https://console.groq.com** and create a free account
2. Generate an API key under **API Keys**
3. Add to `backend/.env`:
   ```
   GROQ_API_KEY=gsk_your_key_here
   ```
4. The chatbot uses **LLaMA 3 8B** model via Groq's ultra-fast inference
5. EduBot appears as a floating chat button (bottom-right) for all logged-in users

---

## ✨ Platform Features

### 🎓 Student Portal
| Feature | Description |
|---------|-------------|
| Course Browser | Browse, filter, and enroll in courses |
| Razorpay Checkout | Secure payment with coupon code support |
| Course Progress | Module/chapter completion tracking |
| Teacher Hiring | Browse profiles, send hire requests |
| Assignments | Submit files, view grades and feedback |
| Attendance | Subject-wise tracking with alerts |
| Task Manager | Priority tasks with status tracking |
| Events | Hackathons, workshops, seminars |
| EduBot AI | Ask anything — subject help, platform guide |

### 👨‍🏫 Teacher Portal
| Feature | Description |
|---------|-------------|
| Profile Management | Bio, subjects, rate — visible to students |
| Hire Request Management | Approve/reject student requests |
| Assignment Creation | With file attachments and deadlines |
| Assignment Grading | Marks and feedback for each student |
| Attendance Marking | Bulk attendance with status (present/absent/late) |
| Quiz Builder | MCQ tests with timer, auto-scoring |
| Results Analytics | Rankings and performance stats |

### ⚙️ Admin Portal
| Feature | Description |
|---------|-------------|
| User Management | Approve students/teachers, auto-generate credentials |
| Course Builder | Modules → Chapters → Materials (PDF/Video/YouTube) |
| Coupon System | Percent or flat discount codes with usage limits |
| Announcements | Events, hackathons, workshops for all users |
| Platform Monitor | Login activity, security status, locked accounts |
| Revenue Tracking | Payment history and total revenue |

---

## 🛠 Tech Stack

```
Frontend:  React 18, Vite, React Router v6, Lucide React, Recharts
Backend:   Node.js, Express.js, Mongoose
Database:  MongoDB
Auth:      JWT + bcryptjs + OTP via Email
Email:     Nodemailer (Gmail SMTP)
Payments:  Razorpay
AI:        Groq SDK (LLaMA 3 8B)
Uploads:   Multer (local → use S3/Cloudinary in production)
```

---

## 📁 Project Structure

```
eduverse/
├── backend/
│   ├── models/
│   │   ├── User.js          # Student, Teacher, Admin schema
│   │   ├── Course.js        # Course with modules/chapters/materials
│   │   └── index.js         # Enrollment, Hire, Assignment, Quiz, Attendance...
│   ├── routes/
│   │   ├── auth.js          # Login, apply, OTP, password
│   │   ├── admin.js         # User management, stats, announcements
│   │   ├── courses.js       # Course CRUD, builder, progress
│   │   ├── student.js       # Dashboard, hire, assignments, tasks
│   │   ├── teacher.js       # Students, assignments, quizzes
│   │   ├── payment.js       # Razorpay order + verify
│   │   ├── chatbot.js       # Groq AI chatbot (EduBot)
│   │   └── announcements.js # Public announcements
│   ├── middleware/
│   │   ├── auth.js          # JWT authentication
│   │   └── upload.js        # Multer file upload config
│   ├── utils/
│   │   ├── email.js         # Nodemailer + HTML templates
│   │   └── seedAdmin.js     # Auto-create admin on first run
│   ├── uploads/             # File storage (gitignored)
│   ├── server.js
│   └── .env                 # ← Configure this!
│
└── frontend/
    └── src/
        ├── components/
        │   └── common/
        │       ├── Sidebar.jsx     # Navigation sidebar
        │       ├── Topbar.jsx      # Top header bar
        │       └── ChatBot.jsx     # EduBot AI widget
        ├── context/
        │   └── AuthContext.jsx
        ├── pages/
        │   ├── LandingPage.jsx
        │   ├── auth/               # Login, Apply, OTP
        │   ├── student/            # 8 student pages
        │   ├── teacher/            # 5 teacher pages
        │   └── admin/              # 7 admin pages
        ├── styles/
        │   └── global.css          # Premium dark theme
        └── utils/
            └── api.js              # Axios instance
```

---

## 🚀 Production Deployment

```bash
# Build frontend
cd frontend && npm run build

# Serve with Nginx (point to frontend/dist)
# Run backend with PM2
pm2 start backend/server.js --name eduverse-api

# Use environment variables (not .env files) in production
# Switch to MongoDB Atlas for database
# Use S3 or Cloudinary for file storage
# Configure proper SMTP (SendGrid or AWS SES)
```

---

## 📧 Email Flow

All user communications happen via email:

| Event | Recipient | Content |
|-------|-----------|---------|
| Application submitted | Student/Teacher | Confirmation, wait for approval |
| Admin approves student | Student | Email (login ID) + auto-generated password |
| Admin approves teacher | Teacher | Email + Employee ID + auto-generated password |
| Login attempt | Student/Teacher | 6-digit OTP (10 min expiry) |
| Teacher hire request | Teacher | Student details + subject |
| Teacher approves hire | Student | Welcome message |

---

## 💳 Payment Flow

1. Student clicks **Buy Now** on a course
2. Optional coupon code validation
3. Backend creates Razorpay order
4. Razorpay checkout modal opens
5. On payment success → signature verified → enrollment created
6. Student immediately accesses course content

Free courses (₹0) are enrolled directly without payment gateway.

---

## 🔐 Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens (7-day expiry)
- OTP expires in 10 minutes
- Account locked after 5 failed login attempts (30 min)
- Role-based route protection (student/teacher/admin)
- Admin bypasses OTP for direct access
- Razorpay HMAC signature verification

---

*Built with ❤️ — Edu Verse © 2024*
