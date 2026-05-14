import { Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, ClipboardList, BrainCircuit, UserCircle, BookOpen, Folder, CheckSquare } from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import Topbar from '../../components/common/Topbar';

const NAV = [
  { label: null, items: [
    { to:'/teacher', end:true, icon:LayoutDashboard, label:'Dashboard' },
  ]},
  { label: 'Teaching', items: [
    { to:'/teacher/batches',     icon:Folder,         label:'My Batches' },
    { to:'/teacher/classes',     icon:BookOpen,       label:'My Classes' },
    { to:'/teacher/attendance',  icon:CheckSquare,    label:'Attendance' },
    { to:'/teacher/students',    icon:GraduationCap,  label:'My Students' },
    { to:'/teacher/assignments', icon:ClipboardList,  label:'Assignments' },
    { to:'/teacher/quizzes',     icon:BrainCircuit,   label:'Quizzes & Tests' },
  ]},
  { label: 'Account', items: [
    { to:'/teacher/profile',     icon:UserCircle,     label:'Profile' },
  ]},
];
const TITLES = {
  '/teacher':              { title:'Dashboard',        subtitle:'Manage your classes' },
  '/teacher/batches':      { title:'My Batches',       subtitle:'Create and manage student batches' },
  '/teacher/classes':      { title:'My Classes',       subtitle:'Create and manage classes' },
  '/teacher/attendance':   { title:'Attendance',       subtitle:'Track and mark student attendance' },
  '/teacher/students':     { title:'My Students',      subtitle:'Students who hired you' },
  '/teacher/assignments':  { title:'Assignments',      subtitle:'Create and grade assignments' },
  '/teacher/quizzes':      { title:'Quizzes & Tests',  subtitle:'MCQ tests and results' },
  '/teacher/profile':      { title:'Profile',          subtitle:'Your public teacher profile' },
};
export default function TeacherLayout() {
  const { pathname } = useLocation();
  const { title, subtitle } = TITLES[pathname] || { title:'Teacher Portal', subtitle:'' };
  return (
    <div className="layout">
      <Sidebar navSections={NAV} role="teacher" />
      <div className="main-content">
        <Topbar title={title} subtitle={subtitle} />
        <div className="page-content"><Outlet /></div>
      </div>
    </div>
  );
}
