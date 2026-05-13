import { useState, useEffect } from 'react';
import { GraduationCap, ClipboardList, BrainCircuit, AlertCircle, CheckCircle, XCircle, Users, PenSquare } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
const API = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = () => Promise.all([api.get('/teacher/dashboard'), api.get('/teacher/hire-requests')])
    .then(([s,r]) => { setStats(s.data); setRequests(r.data.filter(x=>x.status==='pending')); })
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const respond = async (id, status) => {
    setBusy(id+status);
    try { await api.put(`/teacher/hire-requests/${id}`, { status }); load(); }
    catch {} finally { setBusy(null); }
  };

  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor:'var(--brand)' }} /></div>;
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);

  return (
    <div className="fade-in">
      {/* Profile card */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:16, padding:'24px 28px', marginBottom:24, display:'flex', gap:20, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(16,185,129,0.1)', border:'2px solid rgba(16,185,129,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:22, color:'var(--green)', overflow:'hidden', flexShrink:0 }}>
          {user?.profilePhoto ? <img src={`${API}${user.profilePhoto}`} style={{ width:64,height:64,objectFit:'cover' }} alt="" /> : initials}
        </div>
        <div style={{ flex:1 }}>
          <h2 style={{ fontSize:19, fontWeight:800, letterSpacing:'-0.3px', marginBottom:4 }}>{user?.name}</h2>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:8 }}>{user?.subjects?.join(' · ')}</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {user?.empId && <span className="badge badge-blue font-mono" style={{ fontSize:11 }}>EMP: {user.empId}</span>}
            {user?.qualification && <span className="badge badge-purple">{user.qualification}</span>}
            {user?.experience && <span className="badge badge-green">{user.experience}</span>}
            {user?.chargeTuition>0 && <span className="badge badge-gray">₹{user.chargeTuition}/hr</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom:24 }}>
        {[
          { label:'Active Students',   value:stats?.activeStudents||0,   icon:GraduationCap, color:'var(--brand)',  bg:'rgba(37,99,235,0.08)' },
          { label:'Pending Requests',  value:stats?.pendingRequests||0,  icon:AlertCircle,   color:'#f59e0b',       bg:'rgba(245,158,11,0.08)' },
          { label:'Assignments',       value:stats?.totalAssignments||0, icon:ClipboardList, color:'var(--purple)', bg:'var(--purple-dim)' },
          { label:'Pending Grading',   value:stats?.pendingGrading||0,   icon:PenSquare,     color:'var(--cyan)',   bg:'var(--cyan-dim)' },
        ].map((s,i) => { const Icon = s.icon; return (
          <div key={i} className="stat-card">
            <div className="stat-icon-wrap" style={{ background:s.bg }}><Icon size={18} color={s.color} /></div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
          </div>
        );})}
      </div>

      {/* Pending requests */}
      <div className="card">
        <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Pending Hire Requests</div>
        {requests.length === 0 ? (
          <div className="empty" style={{ padding:'28px 0' }}><Users className="empty-icon" /><p>No pending requests</p></div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {requests.map(r => (
              <div key={r._id} style={{ display:'flex', gap:14, alignItems:'center', padding:'14px 16px', background:'var(--bg-elevated)', borderRadius:10, flexWrap:'wrap' }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:'rgba(37,99,235,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:15, color:'var(--brand-light)', flexShrink:0 }}>
                  {r.student?.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:160 }}>
                  <div style={{ fontWeight:600, fontSize:14 }}>{r.student?.name}</div>
                  <div style={{ fontSize:12.5, color:'var(--text-muted)', marginTop:2 }}>{r.student?.email} · {r.subject}</div>
                  {r.message && <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:4, fontStyle:'italic' }}>"{r.message}"</div>}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-success btn-sm" disabled={!!busy} onClick={()=>respond(r._id,'approved')}>
                    {busy===r._id+'approved'?<span className="spinner-sm" style={{ borderTopColor:'var(--green)' }} />:<CheckCircle size={13} />} Approve
                  </button>
                  <button className="btn btn-danger btn-sm" disabled={!!busy} onClick={()=>respond(r._id,'rejected')}>
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
