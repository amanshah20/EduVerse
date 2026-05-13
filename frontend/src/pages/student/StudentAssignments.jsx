import { useState, useEffect } from 'react';
import { Upload, Download, CheckCircle, Clock, AlertTriangle, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
const API = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [uploading, setUploading] = useState(null);

  useEffect(() => { api.get('/student/assignments').then(r=>setAssignments(r.data)).finally(()=>setLoading(false)); }, []);

  const submit = async (id, file) => {
    if (!file) { toast.error('Select a file first'); return; }
    setUploading(id);
    const fd = new FormData(); fd.append('file', file);
    try {
      await api.post(`/student/assignments/${id}/submit`, fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      toast.success('Assignment submitted!');
      api.get('/student/assignments').then(r=>setAssignments(r.data));
    } catch (err) { toast.error(err.response?.data?.message||'Submission failed'); }
    finally { setUploading(null); }
  };

  const pending = assignments.filter(a => !a.mySubmission);
  const submitted = assignments.filter(a => a.mySubmission);
  const list = tab==='pending' ? pending : submitted;

  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor:'var(--brand)' }} /></div>;

  return (
    <div className="fade-in">
      <div className="tabs" style={{ maxWidth:340, marginBottom:24 }}>
        <button className={`tab-btn ${tab==='pending'?'active':''}`} onClick={()=>setTab('pending')}>
          Pending <span className="badge badge-amber" style={{ marginLeft:6,fontSize:10.5 }}>{pending.length}</span>
        </button>
        <button className={`tab-btn ${tab==='submitted'?'active':''}`} onClick={()=>setTab('submitted')}>
          Submitted <span className="badge badge-green" style={{ marginLeft:6,fontSize:10.5 }}>{submitted.length}</span>
        </button>
      </div>

      {list.length===0 ? (
        <div className="empty" style={{ minHeight:300 }}>
          <FileText className="empty-icon" />
          <p>{tab==='pending' ? 'No pending assignments — you\'re all caught up!' : 'No submitted assignments yet'}</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {list.map(a => {
            const overdue = new Date(a.dueDate) < new Date() && !a.mySubmission;
            const dueDays = Math.ceil((new Date(a.dueDate)-Date.now())/(1000*60*60*24));
            return (
              <div key={a._id} className="card">
                <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:12 }}>
                  <div style={{ flex:1, minWidth:200 }}>
                    <h3 style={{ fontSize:15.5, fontWeight:700, marginBottom:4 }}>{a.title}</h3>
                    <div style={{ fontSize:12.5, color:'var(--text-muted)' }}>Assigned by {a.teacher?.name}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5, justifyContent:'flex-end', marginBottom:4 }}>
                      {overdue ? <AlertTriangle size={13} color="var(--red)" /> : <Clock size={13} color="var(--text-muted)" />}
                      <span style={{ fontSize:12.5, color:overdue?'var(--red)':'var(--text-muted)', fontWeight:overdue?600:400 }}>
                        {overdue ? 'Overdue' : dueDays>0 ? `Due in ${dueDays}d` : 'Due today'} · {new Date(a.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="badge badge-gray" style={{ fontSize:11 }}>Max: {a.maxMarks} marks</span>
                  </div>
                </div>

                {a.description && <p style={{ color:'var(--text-secondary)', fontSize:13.5, lineHeight:1.65, marginBottom:14 }}>{a.description}</p>}

                {a.fileUrl && (
                  <a href={`${API}${a.fileUrl}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ marginBottom:14, alignSelf:'flex-start', display:'inline-flex' }}>
                    <Download size={13} /> Download Assignment File
                  </a>
                )}

                {a.mySubmission ? (
                  <div>
                    <div className="alert alert-success" style={{ marginBottom:10 }}>
                      <CheckCircle size={14} style={{ flexShrink:0 }} />
                      <span>Submitted on {new Date(a.mySubmission.submittedAt).toLocaleDateString()}{a.mySubmission.status==='late'?' (Late)':''}</span>
                    </div>
                    {a.mySubmission.marks!=null && (
                      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                        <div style={{ padding:'10px 16px', background:'var(--bg-elevated)', borderRadius:8, border:'1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:2 }}>MARKS OBTAINED</div>
                          <div style={{ fontSize:20, fontWeight:800, color:'var(--green)' }}>{a.mySubmission.marks}<span style={{ fontSize:13,color:'var(--text-muted)',fontWeight:400 }}>/{a.maxMarks}</span></div>
                        </div>
                        {a.mySubmission.feedback && (
                          <div style={{ padding:'10px 16px', background:'var(--bg-elevated)', borderRadius:8, border:'1px solid var(--border-subtle)', flex:1 }}>
                            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:3 }}>TEACHER FEEDBACK</div>
                            <div style={{ fontSize:13.5 }}>{a.mySubmission.feedback}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                    <input type="file" id={`f-${a._id}`} style={{ display:'none' }}
                      onChange={e => submit(a._id, e.target.files[0])}
                      accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg" />
                    <label htmlFor={`f-${a._id}`} className="btn btn-primary" style={{ cursor:'pointer' }}>
                      {uploading===a._id ? <><span className="spinner" style={{ borderTopColor:'#fff' }} />Uploading…</> : <><Upload size={14} /> Submit Assignment</>}
                    </label>
                    <span style={{ fontSize:12, color:'var(--text-muted)' }}>PDF, DOC, ZIP, or image</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
