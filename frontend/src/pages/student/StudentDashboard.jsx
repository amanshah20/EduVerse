import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, BarChart2, CheckSquare, ArrowRight, TrendingUp, Calendar, Users } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
const API = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/student/dashboard'), api.get('/announcements')])
      .then(([s,a]) => { setStats(s.data); setAnnouncements(a.data.slice(0,5)); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor:'var(--brand)' }} /></div>;

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const STATS = [
    { label:'Enrolled Courses',     value: stats?.totalCourses||0,         icon: BookOpen,      color:'#3b82f6',  bg:'rgba(59,130,246,0.08)' },
    { label:'Pending Assignments',  value: stats?.pendingAssignments||0,   icon: ClipboardList, color:'#f59e0b',       bg:'rgba(245,158,11,0.08)' },
    { label:'Attendance',           value: `${stats?.attendancePercent||0}%`, icon: BarChart2,  color:'var(--green)',  bg:'var(--green-dim)' },
    { label:'Open Tasks',           value: stats?.pendingTasks||0,         icon: CheckSquare,   color:'#8b5cf6', bg:'rgba(139,92,246,0.12)' },
  ];

  const typeColor = { hackathon:'#3b82f6', workshop:'var(--green)', seminar:'#8b5cf6', exam:'var(--red)', general:'var(--text-muted)', event:'#f59e0b' };

  return (
    <div className="fade-in">
      {/* Welcome banner */}
      <div style={{ background:'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.08) 100%)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:16, padding:'24px 28px', marginBottom:24, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.3px', marginBottom:4 }}>{greet}, {user?.name?.split(' ')[0]}</h2>
          <p style={{ color:'var(--text-secondary)', fontSize:13.5 }}>Here's what's happening with your learning today.</p>
        </div>
        <Link to="/student/courses" className="btn btn-primary btn-sm"><BookOpen size={14} /> Browse courses <ArrowRight size={13} /></Link>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom:24 }}>
        {STATS.map((s,i) => { const Icon = s.icon; return (
          <div key={i} className="stat-card">
            <div className="stat-icon-wrap" style={{ background:s.bg }}><Icon size={18} color={s.color} /></div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
          </div>
        );})}
      </div>

      <div className="g2" style={{ gap:20 }}>
        {/* Recent courses */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom:18 }}>
            <div style={{ fontWeight:700, fontSize:15 }}>My Courses</div>
            <Link to="/student/courses" style={{ fontSize:13, color:'#3b82f6', display:'flex', alignItems:'center', gap:4 }}>View all <ArrowRight size={12} /></Link>
          </div>
          {stats?.recentCourses?.length ? stats.recentCourses.map((e,i) => (
            <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'12px 0', borderBottom: i < stats.recentCourses.length-1 ? '1px solid var(--border-subtle)' : 'none' }}>
              <div style={{ width:40, height:40, borderRadius:8, background:'var(--bg-highlight)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                {e.course?.thumbnail ? <img src={`${API}${e.course.thumbnail}`} style={{ width:40,height:40,objectFit:'cover' }} alt="" /> : <BookOpen size={16} color="var(--text-muted)" />}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13.5, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:6 }}>{e.course?.title}</div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div className="progress" style={{ flex:1 }}><div className="progress-fill" style={{ width:`${e.progressPercent||0}%` }} /></div>
                  <span style={{ fontSize:12, color:'var(--text-muted)', flexShrink:0 }}>{e.progressPercent||0}%</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="empty">
              <BookOpen className="empty-icon" />
              <p>No courses enrolled yet</p>
              <Link to="/student/courses" className="btn btn-primary btn-sm" style={{ marginTop:4 }}>Browse courses</Link>
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom:18 }}>
            <div style={{ fontWeight:700, fontSize:15 }}>Announcements</div>
            <Link to="/student/events" style={{ fontSize:13, color:'#3b82f6', display:'flex', alignItems:'center', gap:4 }}>See all <ArrowRight size={12} /></Link>
          </div>
          {announcements.length ? announcements.map((a,i) => (
            <div key={i} style={{ display:'flex', gap:12, padding:'11px 0', borderBottom: i < announcements.length-1 ? '1px solid var(--border-subtle)' : 'none' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:typeColor[a.type]||'var(--text-muted)', marginTop:7, flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13.5, fontWeight:600, marginBottom:3 }}>{a.title}</div>
                <p style={{ fontSize:12.5, color:'var(--text-muted)', lineHeight:1.5 }}>{a.content?.slice(0,72)}…</p>
                <div style={{ display:'flex', gap:8, marginTop:6, alignItems:'center' }}>
                  <span className={`badge badge-${a.type==='hackathon'?'blue':a.type==='workshop'?'green':a.type==='seminar'?'purple':'gray'}`} style={{ fontSize:10.5 }}>{a.type}</span>
                  {a.date && <span style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(a.date).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>
          )) : (
            <div className="empty"><Calendar className="empty-icon" /><p>No announcements yet</p></div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px,1fr))', gap:12, marginTop:20 }}>
        {[
          { to:'/student/teachers',    icon:Users,       label:'Find a Teacher',  color:'var(--brand)' },
          { to:'/student/assignments', icon:ClipboardList,label:'Assignments',    color:'#f59e0b' },
          { to:'/student/attendance',  icon:BarChart2,   label:'Attendance',      color:'var(--green)' },
          { to:'/student/tasks',       icon:CheckSquare, label:'My Tasks',        color:'var(--purple)' },
        ].map((q,i) => { const Icon = q.icon; return (
          <Link key={i} to={q.to} style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:12, padding:'16px', display:'flex', flexDirection:'column', gap:10, transition:'all 160ms', textDecoration:'none' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = q.color; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform='none'; }}>
            <div style={{ width:36, height:36, borderRadius:8, background:`${q.color}14`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon size={17} color={q.color} />
            </div>
            <span style={{ fontSize:13, fontWeight:600, color:q.color }}>{q.label}</span>
          </Link>
        );})}
      </div>
    </div>
  );
}
