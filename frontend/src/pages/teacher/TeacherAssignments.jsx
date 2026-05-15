import { useState, useEffect } from 'react';
import { Plus, Download, CheckSquare, X, Upload, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
const API = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ title:'', description:'', dueDate:'', maxMarks:100 });
  const [file, setFile] = useState(null);
  const [creating, setCreating] = useState(false);
  const [gradeModal, setGradeModal] = useState(null);
  const [gradeForm, setGradeForm] = useState({ marks:'', feedback:'' });
  const [gradeAss, setGradeAss] = useState(null);

  const load = () => api.get('/teacher/assignments').then(r=>setAssignments(r.data)).finally(()=>setLoading(false));
  useEffect(()=>{ load(); },[]);

  const create = async () => {
    if (!form.title) { toast.error('Title required'); return; }
    if (!form.dueDate) { toast.error('Due date required'); return; }
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('dueDate', form.dueDate);
      fd.append('maxMarks', parseInt(form.maxMarks) || 100);
      if (file) fd.append('file', file);
      const response = await api.post('/teacher/assignments', fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      toast.success('Assignment created and sent to all students!');
      setShowCreate(false); setForm({ title:'', description:'', dueDate:'', maxMarks:100 }); setFile(null); load();
    } catch (error) { 
      console.error('Assignment creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to create assignment'); 
    } finally { setCreating(false); }
  };

  const grade = async () => {
    try {
      await api.put(`/teacher/assignments/${gradeAss._id}/grade/${gradeModal.student._id}`, gradeForm);
      toast.success('Graded!'); setGradeModal(null); load();
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor:'var(--brand)' }} /></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div />
        <button className="btn btn-primary btn-sm" onClick={()=>setShowCreate(true)}><Plus size={14} /> Create Assignment</button>
      </div>

      {assignments.length===0 ? (
        <div className="empty" style={{ minHeight:300 }}><FileText className="empty-icon" /><p>No assignments yet. Create one to send to your students.</p></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {assignments.map(a => {
            const pending = a.submissions?.filter(s=>s.status==='submitted').length||0;
            const isExp = expanded===a._id;
            return (
              <div key={a._id} className="card">
                <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:12 }}>
                  <div style={{ flex:1 }}>
                    <h3 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{a.title}</h3>
                    <div style={{ fontSize:12.5, color:'var(--text-muted)' }}>Due: {new Date(a.dueDate).toLocaleDateString()} · Max: {a.maxMarks} marks</div>
                  </div>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    {pending>0 && <span className="badge badge-amber" style={{ fontSize:11 }}>{pending} to grade</span>}
                    <span className="badge badge-gray" style={{ fontSize:11 }}>{a.submissions?.length||0} submissions</span>
                    <button className="btn btn-ghost btn-sm" onClick={()=>setExpanded(isExp?null:a._id)}>
                      {isExp?'Hide':'View'} Submissions
                    </button>
                  </div>
                </div>
                {a.description && <p style={{ fontSize:13.5, color:'var(--text-muted)', lineHeight:1.6, marginBottom:a.fileUrl?12:0 }}>{a.description}</p>}
                {a.fileUrl && <a href={`${API}${a.fileUrl}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ alignSelf:'flex-start', display:'inline-flex', marginBottom:0 }}><Download size={13} /> {a.fileName}</a>}

                {isExp && (
                  <div style={{ marginTop:16, borderTop:'1px solid var(--border-subtle)', paddingTop:14 }}>
                    {a.submissions?.length ? (
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {a.submissions.map((s,i) => (
                          <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 14px', background:'var(--bg-elevated)', borderRadius:8, flexWrap:'wrap' }}>
                            <div style={{ flex:1, minWidth:140 }}>
                              <div style={{ fontWeight:600, fontSize:13.5 }}>{s.student?.name||'Student'}</div>
                              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:1 }}>Submitted {new Date(s.submittedAt).toLocaleDateString()}</div>
                            </div>
                            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                              {s.fileUrl && <a href={`${API}${s.fileUrl}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><Download size={13} /></a>}
                              {s.status==='graded' ? (
                                <span className="badge badge-green" style={{ fontSize:11 }}>✓ {s.marks}/{a.maxMarks}</span>
                              ) : (
                                <button className="btn btn-primary btn-sm" onClick={()=>{ setGradeAss(a); setGradeModal(s); setGradeForm({ marks:'', feedback:'' }); }}>
                                  <CheckSquare size={13} /> Grade
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <div style={{ color:'var(--text-muted)', fontSize:13.5, textAlign:'center', padding:'16px 0' }}>No submissions yet</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowCreate(false)}>
          <div className="modal">
            <div className="modal-header"><div className="modal-title">Create Assignment</div><button className="modal-close" onClick={()=>setShowCreate(false)}><X size={18} /></button></div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="field"><label className="field-label">Title *</label><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Assignment title" autoFocus /></div>
              <div className="field"><label className="field-label">Instructions</label><textarea rows={3} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} style={{ resize:'vertical' }} /></div>
              <div className="g2">
                <div className="field"><label className="field-label">Due date & time</label><input type="datetime-local" value={form.dueDate} onChange={e=>setForm(p=>({...p,dueDate:e.target.value}))} /></div>
                <div className="field"><label className="field-label">Max marks</label><input type="number" value={form.maxMarks} onChange={e=>setForm(p=>({...p,maxMarks:e.target.value}))} /></div>
              </div>
              <div className="field">
                <label className="field-label">Attach file (optional)</label>
                <div style={{ padding:'10px 14px', background:'var(--bg-input)', border:'1px solid var(--border-default)', borderRadius:6 }}>
                  <input type="file" accept=".pdf,.doc,.docx,.zip" onChange={e=>setFile(e.target.files[0])} />
                  {file && <div style={{ fontSize:12, color:'var(--green)', marginTop:6 }}>✓ {file.name}</div>}
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn btn-ghost" style={{ flex:1 }} onClick={()=>setShowCreate(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex:1 }} onClick={create} disabled={creating}>
                  {creating?<><span className="spinner" style={{ borderTopColor:'#fff' }} />Creating…</>:<><Upload size={14} />Create & Send</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {gradeModal && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setGradeModal(null)}>
          <div className="modal" style={{ maxWidth:420 }}>
            <div className="modal-header"><div className="modal-title">Grade Submission</div><button className="modal-close" onClick={()=>setGradeModal(null)}><X size={18} /></button></div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="field"><label className="field-label">Marks (out of {gradeAss?.maxMarks})</label><input type="number" min="0" max={gradeAss?.maxMarks} value={gradeForm.marks} onChange={e=>setGradeForm(p=>({...p,marks:e.target.value}))} /></div>
              <div className="field"><label className="field-label">Feedback</label><textarea rows={3} value={gradeForm.feedback} onChange={e=>setGradeForm(p=>({...p,feedback:e.target.value}))} placeholder="Constructive feedback for the student…" style={{ resize:'vertical' }} /></div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn btn-ghost" style={{ flex:1 }} onClick={()=>setGradeModal(null)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex:1 }} onClick={grade}><CheckSquare size={14} /> Save Grade</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
