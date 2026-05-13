import { Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, Megaphone, Settings, UserCircle } from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import Topbar from '../../components/common/Topbar';

const NAV = [
  { label: null, items: [
    { to:'/admin', end:true, icon:LayoutDashboard, label:'Dashboard' },
  ]},
  { label: 'Management', items: [
    { to:'/admin/users',         icon:Users,       label:'Users' },
    { to:'/admin/courses',       icon:BookOpen,    label:'Courses' },
    { to:'/admin/announcements', icon:Megaphone,   label:'Announcements' },
  ]},
  { label: 'System', items: [
    { to:'/admin/settings',      icon:Settings,    label:'Platform Settings' },
    { to:'/admin/profile',       icon:UserCircle,  label:'Admin Profile' },
  ]},
];
const TITLES = {
  '/admin':                { title:'Dashboard',         subtitle:'Platform overview' },
  '/admin/users':          { title:'User Management',   subtitle:'Students, teachers, approvals' },
  '/admin/courses':        { title:'Course Builder',    subtitle:'Create and publish courses' },
  '/admin/announcements':  { title:'Announcements',     subtitle:'Events and updates' },
  '/admin/settings':       { title:'Platform Settings', subtitle:'Monitor and configure' },
  '/admin/profile':        { title:'Admin Profile',     subtitle:'Manage your account' },
};
export default function AdminLayout() {
  const { pathname } = useLocation();
  const key = Object.keys(TITLES).find(k => pathname === k || (k !== '/admin' && pathname.startsWith(k)));
  const { title, subtitle } = TITLES[key] || { title:'Admin Portal', subtitle:'' };
  return (
    <div className="layout">
      <Sidebar navSections={NAV} role="admin" />
      <div className="main-content">
        <Topbar title={title} subtitle={subtitle} />
        <div className="page-content"><Outlet /></div>
      </div>
    </div>
  );
}
