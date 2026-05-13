import { Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Users, ClipboardList, BarChart2, CheckSquare, CalendarDays, UserCircle } from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import Topbar from '../../components/common/Topbar';

const NAV = [
  { label: null, items: [
    { to:'/student', end:true, icon:LayoutDashboard, label:'Dashboard' },
  ]},
  { label: 'Learning', items: [
    { to:'/student/courses',     icon:BookOpen,       label:'Courses' },
    { to:'/student/teachers',    icon:Users,          label:'Find Teachers' },
    { to:'/student/assignments', icon:ClipboardList,  label:'Assignments' },
  ]},
  { label: 'Academics', items: [
    { to:'/student/attendance',  icon:BarChart2,      label:'Attendance' },
    { to:'/student/tasks',       icon:CheckSquare,    label:'Tasks' },
    { to:'/student/events',      icon:CalendarDays,   label:'Events' },
  ]},
  { label: 'Account', items: [
    { to:'/student/profile',     icon:UserCircle,     label:'Profile' },
  ]},
];

const TITLES = {
  '/student':              { title:'Dashboard',    subtitle:'Your learning overview' },
  '/student/courses':      { title:'Courses',      subtitle:'Browse and manage your courses' },
  '/student/teachers':     { title:'Find Teachers',subtitle:'Hire expert tutors' },
  '/student/assignments':  { title:'Assignments',  subtitle:'Pending and submitted work' },
  '/student/attendance':   { title:'Attendance',   subtitle:'Track your attendance records' },
  '/student/tasks':        { title:'Tasks',        subtitle:'Daily to-do and reminders' },
  '/student/events':       { title:'Events',       subtitle:'Hackathons, workshops and more' },
  '/student/profile':      { title:'Profile',      subtitle:'Manage your account' },
};

export default function StudentLayout() {
  const { pathname } = useLocation();
  const { title, subtitle } = TITLES[pathname] || { title:'Student Portal', subtitle:'' };
  return (
    <div className="layout">
      <Sidebar navSections={NAV} role="student" />
      <div className="main-content">
        <Topbar title={title} subtitle={subtitle} />
        <div className="page-content"><Outlet /></div>
      </div>
    </div>
  );
}
