import { useState, useEffect } from 'react';
import { Plus, Trash2, X, CheckSquare, Circle, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const PRI_COLOR = { low:'var(--green)', medium:'var(--brand)', high:'var(--red)' };
const STATUS_CYCLE = { 'todo':'in-progress', 'in-progress':'done', 'done':'todo' };

export default function StudentTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title:'', description:'', priority:'medium', dueDate:'' });

  const load = () => api.get('/student/tasks').then(r=>setTasks(r.data)).finally(()=>setLoading(false));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title) { toast.error('Task title required'); return; }
    try {
      await api.post('/student/tasks', { ...form, status:'todo' });
      toast.success('Task created'); setShowModal(false);
      setForm({ title:'', description:'', priority:'medium', dueDate:'' }); load();
    } catch { toast.error('Failed'); }
  };

  const cycleStatus = async (task) => {
    const next = STATUS_CYCLE[task.status];
    try { await api.put(`/student/tasks/${task._id}`, { status:next }); load(); }
    catch { toast.error('Update failed'); }
  };

  const del = async (id) => {
    try { await api.delete(`/student/tasks/${id}`); load(); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  const filtered = filter==='all' ? tasks : tasks.filter(t=>t.status===filter);
  const counts = { all:tasks.length, todo:tasks.filter(t=>t.status==='todo').length, 'in-progress':tasks.filter(t=>t.status==='in-progress').length, done:tasks.filter(t=>t.status==='done').length };

  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor:'var(--brand)' }} /></div>;

  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', gap:6 }}>
          {['all','todo','in-progress','done'].map(f => (
            <button key={f} onClick={()=>setFilter(f)}
              className={`btn btn-sm ${filter===f?'btn-primary':'btn-ghost'}`}
              style={{ textTransform:'capitalize' }}>
              {f.replace('-',' ')} <span style={{ marginLeft:4, opacity:0.8 }}>{counts[f]}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>setShowModal(true)}>
          <Plus size={14} /> New Task
        </button>
      </div>

      {filtered.length===0 ? (
        <div className="empty" style={{ minHeight:300 }}><CheckSquare className="empty-icon" /><p>No tasks here</p></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map(t => {
            const overdue = t.dueDate && new Date(t.dueDate)<new Date() && t.status!=='done';
            return (
              <div key={t._id} style={{ background:'var(--bg-card)', border:`1px solid var(--border-subtle)`, borderRadius:10, padding:'14px 16px', display:'flex', gap:12, alignItems:'flex-start', transition:'border-color 160ms' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-medium)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-subtle)'}>
                
                {/* Status toggle */}
                <button onClick={()=>cycleStatus(t)} style={{ marginTop:2, background:'none', border:'none', cursor:'pointer', flexShrink:0, color:t.status==='done'?'var(--green)':t.status==='in-progress'?'var(--brand)':'var(--text-muted)', display:'flex', transition:'color 160ms' }}>
                  {t.status==='done' ? <CheckSquare size={18} /> : <Circle size={18} />}
                </button>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'flex-start', flexWrap:'wrap' }}>
                    <span style={{ fontWeight:600, fontSize:14, textDecoration:t.status==='done'?'line-through':'none', color:t.status==='done'?'var(--text-muted)':'var(--text-primary)', flex:1 }}>{t.title}</span>
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      <Flag size={12} color={PRI_COLOR[t.priority]} style={{ marginTop:3 }} />
                      {t.dueDate && <span style={{ fontSize:11.5, color:overdue?'var(--red)':'var(--text-muted)', fontWeight:overdue?600:400 }}>{overdue?'Overdue · ':''}{new Date(t.dueDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  {t.description && <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:4, lineHeight:1.5 }}>{t.description}</p>}
                  <div style={{ marginTop:8, display:'flex', gap:6 }}>
                    <span className={`badge badge-${t.priority==='high'?'red':t.priority==='medium'?'blue':'green'}`} style={{ fontSize:10.5 }}>{t.priority}</span>
                    <span className={`badge ${t.status==='done'?'badge-green':t.status==='in-progress'?'badge-blue':'badge-gray'}`} style={{ fontSize:10.5, textTransform:'capitalize' }}>{t.status.replace('-',' ')}</span>
                  </div>
                </div>

                <button onClick={()=>del(t._id)} style={{ color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', display:'flex', padding:2, borderRadius:4, transition:'color 160ms', flexShrink:0 }}
                  onMouseEnter={e=>e.currentTarget.style.color='var(--red)'}
                  onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">New Task</div>
              <button className="modal-close" onClick={()=>setShowModal(false)}><X size={18} /></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="field"><label className="field-label">Task title *</label><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="What needs to be done?" autoFocus /></div>
              <div className="field"><label className="field-label">Description</label><textarea rows={3} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Additional details…" style={{ resize:'vertical' }} /></div>
              <div className="g2">
                <div className="field"><label className="field-label">Priority</label>
                  <select value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                </div>
                <div className="field"><label className="field-label">Due date</label><input type="date" value={form.dueDate} onChange={e=>setForm(p=>({...p,dueDate:e.target.value}))} /></div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn btn-ghost" style={{ flex:1 }} onClick={()=>setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex:1 }} onClick={create}><Plus size={14} /> Create Task</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
