import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, GraduationCap, TrendingUp, AlertTriangle, ArrowRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../utils/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        const [s, p] = await Promise.all([
          api.get('/admin/stats').catch(e => {
            console.error('Failed to load stats:', e.message);
            return { data: {} };
          }),
          api.get('/admin/platform-stats').catch(e => {
            console.error('Failed to load platform stats:', e.message);
            return { data: {} };
          })
        ]);
        setStats(s.data);
        setPlatform(p.data);
      } catch (err) {
        console.error('Error loading admin dashboard:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor:'var(--brand)' }} /></div>;

  if (error) {
    return (
      <div className="fade-in">
        <div className="alert alert-danger" style={{ marginBottom: 24 }}>
          <span>Failed to load dashboard: {error}</span>
          <button onClick={() => window.location.reload()} className="btn btn-sm" style={{ marginLeft: 'auto' }}>Retry</button>
        </div>
      </div>
    );
  }

  const recentLogins = (platform?.recentLogins||[]).slice(0,10);
  const STATS = [
    { label:'Total Students',     value:stats?.totalStudents||0,  icon:GraduationCap, color:'var(--brand)',  bg:'rgba(37,99,235,0.08)' },
    { label:'Total Teachers',     value:stats?.totalTeachers||0,  icon:Users,         color:'var(--green)',  bg:'var(--green-dim)' },
    { label:'Published Courses',  value:stats?.totalCourses||0,   icon:BookOpen,      color:'var(--purple)', bg:'var(--purple-dim)' },
    { label:'Total Revenue',      value:`₹${(stats?.revenue||0).toLocaleString()}`, icon:TrendingUp, color:'#f59e0b', bg:'rgba(245,158,11,0.08)' },
  ];

  return (
    <div className="fade-in">
      {/* Pending alert */}
      {(stats?.pendingStudents > 0 || stats?.pendingTeachers > 0) && (
        <div className="alert alert-warn" style={{ marginBottom:20, justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <AlertTriangle size={15} style={{ flexShrink:0 }} />
            <span><strong>{stats.pendingStudents}</strong> student and <strong>{stats.pendingTeachers}</strong> teacher application(s) need your review.</span>
          </div>
          <Link to="/admin/users" className="btn btn-sm" style={{ background:'rgba(245,158,11,0.15)', color:'var(--amber)', border:'1px solid rgba(245,158,11,0.3)' }}>Review now <ArrowRight size={13} /></Link>
        </div>
      )}

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
        {/* Quick actions */}
        <div className="card">
          <div style={{ fontWeight:700, fontSize:15, marginBottom:18 }}>Quick Actions</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { to:'/admin/users?role=student&status=pending', label:'Review Student Applications', sub:`${stats?.pendingStudents||0} pending`, color:'var(--brand)' },
              { to:'/admin/users?role=teacher&status=pending', label:'Review Teacher Applications', sub:`${stats?.pendingTeachers||0} pending`, color:'var(--green)' },
              { to:'/admin/courses',                           label:'Create New Course',           sub:'Add course content',               color:'var(--purple)' },
              { to:'/admin/announcements',                     label:'Post Announcement',           sub:'Events & updates',                 color:'#f59e0b' },
            ].map((q,i) => (
              <Link key={i} to={q.to} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', borderRadius:10, background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', transition:'all 160ms', textDecoration:'none' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-medium)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-subtle)'}>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{q.label}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{q.sub}</div>
                </div>
                <ArrowRight size={15} color="var(--text-muted)" />
              </Link>
            ))}
          </div>
        </div>

        {/* Login activity */}
        <div className="card">
          <div style={{ fontWeight:700, fontSize:15, marginBottom:18 }}>Recent Login Activity</div>
          {recentLogins.length ? (
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {recentLogins.map((l,i) => (
                <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 0', borderBottom: i<recentLogins.length-1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  {l.success
                    ? <CheckCircle size={15} color="var(--green)" style={{ flexShrink:0 }} />
                    : <XCircle size={15} color="var(--red)" style={{ flexShrink:0 }} />}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13.5, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.userName}</div>
                    <div style={{ fontSize:11.5, color:'var(--text-muted)' }}>{new Date(l.timestamp).toLocaleString()}</div>
                  </div>
                  <span className={`badge badge-${l.role==='student'?'blue':'green'}`} style={{ fontSize:10.5 }}>{l.role}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty"><Clock className="empty-icon" /><p>No login activity yet</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
