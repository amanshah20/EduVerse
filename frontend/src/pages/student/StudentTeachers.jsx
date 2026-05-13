import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, Star, Clock, DollarSign, CheckCircle, XCircle, Send, X } from 'lucide-react';
import api from '../../utils/api';
const API = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

export default function StudentTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hireModal, setHireModal] = useState(null);
  const [hireForm, setHireForm] = useState({ subject:'', message:'' });
  const [hiring, setHiring] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { api.get('/student/teachers').then(r=>setTeachers(r.data)).finally(()=>setLoading(false)); }, []);

  const hire = async () => {
    if (!hireForm.subject) { toast.error('Please specify a subject'); return; }
    setHiring(true);
    try {
      await api.post('/student/hire-teacher', { teacherId:hireModal._id, ...hireForm });
      toast.success('Request sent! Teacher will be notified.');
      setHireModal(null);
      api.get('/student/teachers').then(r=>setTeachers(r.data));
    } catch (err) { toast.error(err.response?.data?.message||'Request failed'); }
    finally { setHiring(false); }
  };

  const filtered = teachers.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.subjects?.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  const statusMap = { pending:{ cls:'badge-amber', text:'Request pending' }, approved:{ cls:'badge-green', text:'Hired' }, rejected:{ cls:'badge-red', text:'Rejected' } };

  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor:'var(--brand)' }} /></div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom:20 }}>
        <div className="input-wrap" style={{ maxWidth:400 }}>
          <Search size={15} className="input-icon" />
          <input placeholder="Search by name or subject…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length===0 ? (
        <div className="empty" style={{ minHeight:300 }}><Search className="empty-icon" /><p>No teachers available yet</p></div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {filtered.map(t => (
            <div key={t._id} className="card card-hover" style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {/* Header */}
              <div style={{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:14 }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(16,185,129,0.1)', border:'1.5px solid rgba(16,185,129,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:18, color:'var(--green)', overflow:'hidden', flexShrink:0 }}>
                  {t.profilePhoto ? <img src={`${API}${t.profilePhoto}`} alt="" style={{ width:52,height:52,objectFit:'cover' }} /> : t.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:15, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.name}</div>
                  <div style={{ fontSize:12.5, color:'var(--text-muted)', marginTop:2 }}>{t.qualification}</div>
                  {t.hireStatus && <span className={`badge ${statusMap[t.hireStatus]?.cls}`} style={{ fontSize:10.5, marginTop:4 }}>{statusMap[t.hireStatus]?.text}</span>}
                </div>
              </div>

              {/* Subjects */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
                {t.subjects?.slice(0,4).map((s,i) => <span key={i} className="tag" style={{ fontSize:11.5 }}>{s}</span>)}
              </div>

              {t.bio && <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6, marginBottom:14, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{t.bio}</p>}

              {/* Stats row */}
              <div style={{ display:'flex', gap:0, borderTop:'1px solid var(--border-subtle)', borderBottom:'1px solid var(--border-subtle)', padding:'10px 0', marginBottom:14 }}>
                <div style={{ flex:1, textAlign:'center' }}>
                  <div style={{ fontSize:15, fontWeight:800, color:'var(--green)' }}>₹{t.chargeTuition||0}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>per hour</div>
                </div>
                <div style={{ width:1, background:'var(--border-subtle)' }} />
                <div style={{ flex:1, textAlign:'center' }}>
                  <div style={{ fontSize:15, fontWeight:800 }}>{t.experience}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>experience</div>
                </div>
              </div>

              {!t.hireStatus ? (
                <button className="btn btn-primary btn-sm w-full" onClick={()=>{ setHireModal(t); setHireForm({ subject:'', message:'' }); }}>
                  <Send size={13} /> Send Hire Request
                </button>
              ) : t.hireStatus==='approved' ? (
                <div className="alert alert-success" style={{ justifyContent:'center', padding:'8px' }}><CheckCircle size={14} /> You are connected with this teacher</div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Hire Modal */}
      {hireModal && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setHireModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Send Hire Request</div>
              <button className="modal-close" onClick={()=>setHireModal(null)}><X size={18} /></button>
            </div>
            <div style={{ display:'flex', gap:12, alignItems:'center', padding:'14px', background:'var(--bg-elevated)', borderRadius:10, marginBottom:20 }}>
              <div style={{ width:42,height:42,borderRadius:'50%',background:'rgba(16,185,129,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:16,color:'var(--green)',overflow:'hidden',flexShrink:0 }}>
                {hireModal.profilePhoto?<img src={`${API}${hireModal.profilePhoto}`} style={{ width:42,height:42,objectFit:'cover' }} alt="" />:hireModal.name?.charAt(0)}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>{hireModal.name}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{hireModal.subjects?.join(', ')}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontWeight:800, color:'var(--green)', fontSize:16 }}>₹{hireModal.chargeTuition}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>per hour</div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="field">
                <label className="field-label">Subject you need help with *</label>
                <input placeholder="e.g., Mathematics, Physics" value={hireForm.subject} onChange={e=>setHireForm(p=>({ ...p, subject:e.target.value }))} />
              </div>
              <div className="field">
                <label className="field-label">Message to teacher (optional)</label>
                <textarea rows={3} placeholder="Tell the teacher about your goals and schedule…" value={hireForm.message} onChange={e=>setHireForm(p=>({ ...p, message:e.target.value }))} style={{ resize:'vertical' }} />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn btn-ghost" style={{ flex:1 }} onClick={()=>setHireModal(null)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex:1 }} onClick={hire} disabled={hiring}>
                  {hiring?<><span className="spinner" style={{ borderTopColor:'#fff' }} />Sending…</>:<><Send size={14} />Send Request</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
