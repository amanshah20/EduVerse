import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/global.css';

// ChatBot
import ChatBot from './components/common/ChatBot';

// Auth
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import ApplyPage from './pages/auth/ApplyPage';
import OTPPage from './pages/auth/OTPPage';

// Student
import StudentLayout from './pages/student/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentClasses from './pages/student/StudentClasses';
import StudentCourses from './pages/student/StudentCourses';
import StudentTeachers from './pages/student/StudentTeachers';
import StudentAssignments from './pages/student/StudentAssignments';
import StudentQuizzes from './pages/student/StudentQuizzes';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentTasks from './pages/student/StudentTasks';
import StudentEvents from './pages/student/StudentEvents';
import StudentProfile from './pages/student/StudentProfile';

// Teacher
import TeacherLayout from './pages/teacher/TeacherLayout';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherClasses from './pages/teacher/TeacherClasses';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherStudents from './pages/teacher/TeacherStudents';
import TeacherAssignments from './pages/teacher/TeacherAssignments';
import TeacherQuizzes from './pages/teacher/TeacherQuizzes';
import TeacherProfile from './pages/teacher/TeacherProfile';

// Admin
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminCourseBuilder from './pages/admin/AdminCourseBuilder';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminSettings from './pages/admin/AdminSettings';
import AdminProfile from './pages/admin/AdminProfile';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor:'#3b82f6' }} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor:'#3b82f6' }} /></div>;
  if (user) return <Navigate to={`/${user.role}`} replace />;
  return children;
}

function AppWithChatBot({ children }) {
  const { user } = useAuth();
  return (
    <>
      {children}
      {user && <ChatBot />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { background:'#ffffff', color:'#1e293b', border:'1px solid rgba(59,130,246,0.2)', fontSize:13.5, borderRadius:8, boxShadow: '0 4px 12px rgba(59,130,246,0.1)' },
          success: { iconTheme: { primary:'#10b981', secondary:'#ffffff' } },
          error:   { iconTheme: { primary:'#ef4444', secondary:'#ffffff' } },
        }} />
        <AppWithChatBot>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/apply" element={<PublicRoute><ApplyPage /></PublicRoute>} />
            <Route path="/verify-otp" element={<OTPPage />} />

            <Route path="/student" element={<ProtectedRoute roles={['student']}><StudentLayout /></ProtectedRoute>}>
              <Route index element={<StudentDashboard />} />
              <Route path="classes" element={<StudentClasses />} />
              <Route path="courses" element={<StudentCourses />} />
              <Route path="teachers" element={<StudentTeachers />} />
              <Route path="assignments" element={<StudentAssignments />} />
              <Route path="quizzes" element={<StudentQuizzes />} />
              <Route path="attendance" element={<StudentAttendance />} />
              <Route path="tasks" element={<StudentTasks />} />
              <Route path="events" element={<StudentEvents />} />
              <Route path="profile" element={<StudentProfile />} />
            </Route>

            <Route path="/teacher" element={<ProtectedRoute roles={['teacher']}><TeacherLayout /></ProtectedRoute>}>
              <Route index element={<TeacherDashboard />} />
              <Route path="batches" element={<TeacherClasses />} />
              <Route path="classes" element={<TeacherClasses />} />
              <Route path="attendance" element={<TeacherAttendance />} />
              <Route path="students" element={<TeacherStudents />} />
              <Route path="assignments" element={<TeacherAssignments />} />
              <Route path="quizzes" element={<TeacherQuizzes />} />
              <Route path="profile" element={<TeacherProfile />} />
            </Route>

            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="courses/build/:id" element={<AdminCourseBuilder />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppWithChatBot>
      </BrowserRouter>
    </AuthProvider>
  );
}
