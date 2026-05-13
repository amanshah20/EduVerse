import { useState, useEffect } from 'react';
import { Plus, Trash2, X, ChevronDown, ChevronUp, Timer, Users, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const emptyQ = () => ({ question:'', options:['','','',''], correctAnswer:0, marks:1 });

export default function TeacherQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ title:'', description:'', duration:30, questions:[emptyQ()] });
  const [creating, setCreating] = useState(false);

  const load = () => api.get('/teacher/quizzes').then(r=>setQuizzes(r.data)).finally(()=>setLoading(false));
  useEffect(()=>{ load(); },[]);

  const addQ = () => setForm(p=>({ ...p, questions:[...p.questions, emptyQ()] }));
  const removeQ = i => setForm(p=>({ ...p, questions:p.questions.filter((_,qi)=>qi!==i) }));
  const updQ = (i,k,v) => setForm(p=>{ const qs=[...p.questions]; qs[i]={...qs[i],[k]:v}; return {...p,questions:qs}; });
  const updOpt = (qi,oi,v) => setForm(p=>{ const qs=[...p.questions]; const opts=[...qs[qi].options]; opts[oi]=v; qs[qi]={...qs[qi],options:opts}; return {...p,questions:qs}; });

  const create = async () => {
    if (!form.title) { toast.error('Quiz title required'); return; }
    if (form.questions.some(q=>!q.question||q.options.some(o=>!o))) { toast.error('Fill all questions and options'); return; }
    setCreating(true);
    try {
      await api.post('/teacher/quizzes', form);
      toast.success('Quiz created and sent to students!');
      setShowCreate(false);
      setForm({ title:'', description:'', duration:30, questions:[emptyQ()] });
      load();
    } catch { toast.error('Failed to create quiz'); } finally { setCreating(false); }
  };

  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor:'var(--brand)' }} /></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div />
        <button className="btn btn-primary btn-sm" onClick={()=>setShowCreate(true)}><Plus size={14}/> Create Quiz</button>
      </div>

      {quizzes.length===0 ? (
        <div className="empty" style={{ minHeight:300 }}>
          <Trophy className="empty-icon"/>
          <p>No quizzes yet. Create your first MCQ test for students.</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
          {quizzes.map(q => {
            const isExp = expanded===q._id;
            const avgScore = q.results?.length
              ? Math.round(q.results.reduce((s,r)=>s+(r.percentage||0),0)/q.results.length)
              : null;
            return (
              <div key={q._id} className="card card-hover" style={{ cursor:'default' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <h3 style={{ fontSize:15, fontWeight:700, flex:1 }}>{q.title}</h3>
                  <span className={`badge ${q.isActive?'badge-green':'badge-gray'}`} style={{ fontSize:10.5, flexShrink:0, marginLeft:8 }}>{q.isActive?'Active':'Inactive'}</span>
                </div>
                {q.description && <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.5, marginBottom:12 }}>{q.description}</p>}
                <div style={{ display:'flex', gap:14, fontSize:12.5, color:'var(--text-muted)', marginBottom:14 }}>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}><Timer size={12}/>{q.duration} min</span>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}><Trophy size={12}/>{q.questions?.length} Qs</span>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}><Users size={12}/>{q.results?.length||0} attempts</span>
                  {avgScore!=null && <span style={{ color:'var(--green)', fontWeight:600 }}>{avgScore}% avg</span>}
                </div>
                <button className="btn btn-ghost btn-sm w-full" onClick={()=>setExpanded(isExp?null:q._id)}>
                  {isExp ? <><ChevronUp size={13}/> Hide Results</> : <><ChevronDown size={13}/> View Results</>}
                </button>
                {isExp && (
                  <div style={{ marginTop:12, borderTop:'1px solid var(--border-subtle)', paddingTop:12 }}>
                    {q.results?.length ? (
                      <div className="table-wrap">
                        <table>
                          <thead><tr><th>Rank</th><th>Score</th><th>%</th><th>Time</th></tr></thead>
                          <tbody>
                            {[...q.results].sort((a,b)=>b.percentage-a.percentage).map((r,i)=>(
                              <tr key={i}>
                                <td>
                                  <span style={{ fontWeight:700, color:i===0?'#f59e0b':i===1?'var(--text-secondary)':i===2?'#cd7f32':'var(--text-muted)', fontSize:13 }}>#{i+1}</span>
                                </td>
                                <td style={{ fontWeight:600 }}>{r.score}/{r.totalMarks}</td>
                                <td><span className={`badge ${r.percentage>=60?'badge-green':'badge-red'}`} style={{ fontSize:10.5 }}>{r.percentage?.toFixed(0)}%</span></td>
                                <td style={{ fontSize:12 }}>{r.timeTaken?`${r.timeTaken}m`:'—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ textAlign:'center', color:'var(--text-muted)', fontSize:13, padding:'12px 0' }}>No attempts yet</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowCreate(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div className="modal-title">Create Quiz</div>
              <button className="modal-close" onClick={()=>setShowCreate(false)}><X size={18}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:16, maxHeight:'70vh', overflowY:'auto', paddingRight:4 }}>
              <div className="g2">
                <div className="field"><label className="field-label">Quiz title *</label><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="e.g., Chapter 3 — Newton's Laws" autoFocus/></div>
                <div className="field"><label className="field-label">Duration (minutes)</label><input type="number" min="1" value={form.duration} onChange={e=>setForm(p=>({...p,duration:+e.target.value}))}/></div>
              </div>
              <div className="field"><label className="field-label">Description</label><input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Brief description of this quiz"/></div>

              <div style={{ height:'1px', background:'var(--border-subtle)' }}/>
              <div style={{ fontWeight:700, fontSize:14, color:'var(--text-secondary)' }}>Questions</div>

              {form.questions.map((q,qi)=>(
                <div key={qi} style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', borderRadius:10, padding:'16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                    <span style={{ fontWeight:700, fontSize:13, color:'var(--brand-light)' }}>Question {qi+1}</span>
                    {form.questions.length>1 && (
                      <button onClick={()=>removeQ(qi)} style={{ color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', display:'flex', transition:'color 160ms' }}
                        onMouseEnter={e=>e.currentTarget.style.color='var(--red)'}
                        onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
                        <Trash2 size={14}/>
                      </button>
                    )}
                  </div>
                  <input value={q.question} onChange={e=>updQ(qi,'question',e.target.value)} placeholder="Enter your question here…" style={{ marginBottom:12 }}/>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {q.options.map((opt,oi)=>(
                      <div key={oi} style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', flexShrink:0 }}>
                          <input type="radio" name={`correct-${qi}`} checked={q.correctAnswer===oi} onChange={()=>updQ(qi,'correctAnswer',oi)} style={{ width:'auto', accentColor:'var(--green)' }}/>
                          <span style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600 }}>{String.fromCharCode(65+oi)}</span>
                        </label>
                        <input value={opt} onChange={e=>updOpt(qi,oi,e.target.value)} placeholder={`Option ${String.fromCharCode(65+oi)}`}/>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:8 }}>Select the radio button next to the correct answer</div>
                </div>
              ))}

              <button className="btn btn-ghost btn-sm" style={{ alignSelf:'flex-start' }} onClick={addQ}><Plus size={13}/> Add Question</button>

              <div style={{ display:'flex', gap:10, paddingTop:8, borderTop:'1px solid var(--border-subtle)' }}>
                <button className="btn btn-ghost" style={{ flex:1 }} onClick={()=>setShowCreate(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex:1 }} onClick={create} disabled={creating}>
                  {creating?<><span className="spinner" style={{ borderTopColor:'#fff' }}/>Creating…</>:<><Trophy size={14}/> Create & Publish</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
