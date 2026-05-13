import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, BarChart2, X, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
const API = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

export default function TeacherStudents() {
  const [students, setStudents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('students');
  const [attModal, setAttModal] = useState(false);
  const [attForm, setAttForm] = useState({ subject:'', date:new Date().toISOString().split('T')[0] });
  const [attRecs, setAttRecs] = useState({});
  const [marking, setMarking] = useState(false);

  const load = () => Promise.all([api.get('/teacher/students'), api.get('/teacher/hire-requests')])
    .then(([s,r])=>{ setStudents(s.data); setRequests(r.data); }).finally(()=>setLoading(false));
  useEffect(()=>{ load(); },[]);

  const respond = async (id, status) => {
    try { await api.put(`/teacher/hire-requests/${id}`,{status}); toast.success(`Request ${status}`); load(); }
    catch { toast.error('Failed'); }
  };

  const markAtt = async () => {
    if (!attForm.subject) { toast.error('Enter subject'); return; }
    setMarking(true);
    try {
      const records = students.map(s=>({ studentId:s._id, status:attRecs[s._id]||'present' }));
      await api.post('/teacher/attendance/bulk', { records, subject:attForm.subject, date:attForm.date });
      toast.success('Attendance marked!'); setAttModal(false); setAttRecs({});
    } catch { toast.error('Failed'); } finally { setMarking(false); }
  };

  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor:'var(--brand)' }} /></div>;
  const pending = requests.filter(r=>r.status==='pending');

  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div className="tabs" style={{ flex:'none' }}>
          <button className={`tab-btn ${tab==='students'?'active':''}`} onClick={()=>setTab('students')}>Students ({students.length})</button>
          <button className={`tab-btn ${tab==='requests'?'active':''}`} onClick={()=>setTab('requests')}>
            Hire Requests {pending.length>0&&<span className="badge badge-red" style={{ marginLeft:5,fontSize:10 }}>{pending.length}</span>}
          </button>
        </div>
        {tab==='students'&&students.length>0 && (
          <button className="btn btn-primary btn-sm" onClick={()=>setAttModal(true)}><BarChart2 size={14} /> Mark Attendance</button>
        )}
      </div>

      {tab==='students' && (
        students.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Student</th><th>Email</th><th>Grade</th><th>Contact</th></tr></thead>
              <tbody>
                {students.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34,height:34,borderRadius:'50%',background:'rgba(37,99,235,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,color:'var(--brand-light)',overflow:'hidden',flexShrink:0 }}>
                          {s.profilePhoto?<img src={`${API}${s.profilePhoto}`} style={{ width:34,height:34,objectFit:'cover' }} alt="" />:s.name?.charAt(0)}
                        </div>
                        <span style={{ fontWeight:600 }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize:13 }}>{s.email}</td>
                    <td><span className="badge badge-gray" style={{ fontSize:11 }}>{s.grade||'—'}</span></td>
                    <td style={{ fontSize:13 }}>{s.contact||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty" style={{ minHeight:300 }}><GraduationCap className="empty-icon" /><p>No students have hired you yet</p></div>
        )
      )}

      {tab==='requests' && (
        requests.length ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {requests.map(r=>(
              <div key={r._id} className="card" style={{ display:'flex', gap:14, alignItems:'center', flexWrap:'wrap' }}>
                <div style={{ width:42,height:42,borderRadius:'50%',background:'rgba(37,99,235,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:16,color:'var(--brand-light)',flexShrink:0 }}>{r.student?.name?.charAt(0)}</div>
                <div style={{ flex:1, minWidth:150 }}>
                  <div style={{ fontWeight:600, fontSize:14 }}>{r.student?.name}</div>
                  <div style={{ fontSize:12.5,color:'var(--text-muted)',marginTop:2 }}>{r.student?.email} · Subject: <strong>{r.subject}</strong></div>
                  {r.message&&<div style={{ fontSize:12.5,color:'var(--text-secondary)',marginTop:4,fontStyle:'italic' }}>"{r.message}"</div>}
                </div>
                {r.status==='pending' ? (
                  <div style={{ display:'flex', gap:8 }}>
                    <button className="btn btn-success btn-sm" onClick={()=>respond(r._id,'approved')}><CheckCircle size={13} /> Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={()=>respond(r._id,'rejected')}><XCircle size={13} /> Reject</button>
                  </div>
                ) : (
                  <span className={`badge ${r.status==='approved'?'badge-green':'badge-red'}`}>{r.status}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty" style={{ minHeight:300 }}><GraduationCap className="empty-icon" /><p>No hire requests yet</p></div>
        )
      )}

      {attModal && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setAttModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div className="modal-title">Mark Attendance</div>
              <button className="modal-close" onClick={()=>setAttModal(false)}><X size={18} /></button>
            </div>
            <div className="g2" style={{ marginBottom:16 }}>
              <div className="field"><label className="field-label">Subject *</label><input placeholder="e.g., Mathematics" value={attForm.subject} onChange={e=>setAttForm(p=>({...p,subject:e.target.value}))} /></div>
              <div className="field"><label className="field-label">Date</label><input type="date" value={attForm.date} onChange={e=>setAttForm(p=>({...p,date:e.target.value}))} /></div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:18 }}>
              {students.map(s=>(
                <div key={s._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'var(--bg-elevated)', borderRadius:8 }}>
                  <span style={{ fontWeight:500, fontSize:14 }}>{s.name}</span>
                  <div style={{ display:'flex', gap:6 }}>
                    {['present','absent','late'].map(st=>(
                      <button key={st} onClick={()=>setAttRecs(p=>({...p,[s._id]:st}))}
                        className={`btn btn-sm ${(attRecs[s._id]||'present')===st ? (st==='present'?'btn-success':st==='absent'?'btn-danger':'btn-ghost') : 'btn-ghost'}`}
                        style={{ fontSize:12, textTransform:'capitalize' }}>{st}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-primary w-full" onClick={markAtt} disabled={marking}>
              {marking?<><span className="spinner" style={{ borderTopColor:'#fff' }} />Saving…</>:<><BarChart2 size={14} />Save Attendance</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
