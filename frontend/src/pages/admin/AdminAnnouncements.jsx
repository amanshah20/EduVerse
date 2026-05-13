import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Calendar, MapPin, ExternalLink, Megaphone, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const TYPES = ['general','hackathon','workshop','seminar','exam','event'];
const TYPE_CFG = {
  hackathon:{cls:'badge-blue',color:'var(--brand)'},
  workshop: {cls:'badge-green',color:'var(--green)'},
  seminar:  {cls:'badge-purple',color:'var(--purple)'},
  exam:     {cls:'badge-red',color:'var(--red)'},
  event:    {cls:'badge-amber',color:'#f59e0b'},
  general:  {cls:'badge-gray',color:'var(--text-muted)'},
};

export default function AdminAnnouncements() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title:'', content:'', type:'general', targetRole:'all', date:'', location:'', registrationLink:'' });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const load = () => api.get('/admin/announcements').then(r=>setList(r.data)).finally(()=>setLoading(false));
  useEffect(()=>{ load(); },[]);

  const openCreate = () => { setEditing(null); setForm({ title:'', content:'', type:'general', targetRole:'all', date:'', location:'', registrationLink:'' }); setShowModal(true); };
  const openEdit = (a) => {
    setEditing(a);
    setForm({ title:a.title, content:a.content, type:a.type, targetRole:a.targetRole, date:a.date?new Date(a.date).toISOString().split('T')[0]:'', location:a.location||'', registrationLink:a.registrationLink||'' });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.title||!form.content) { toast.error('Title and content required'); return; }
    setSaving(true);
    try {
      if (editing) { await api.put(`/admin/announcements/${editing._id}`, form); toast.success('Updated!'); }
      else { await api.post('/admin/announcements', form); toast.success('Posted!'); }
      setShowModal(false); load();
    } catch { toast.error('Save failed'); } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try { await api.delete(`/admin/announcements/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor:'var(--brand)' }}/></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ color:'var(--text-muted)', fontSize:13.5 }}>{list.length} announcement{list.length!==1?'s':''}</div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14}/> New Announcement</button>
      </div>

      {list.length===0 ? (
        <div className="empty" style={{ minHeight:400 }}><Megaphone className="empty-icon"/><p>No announcements yet.</p></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {list.map(a=>{
            const cfg = TYPE_CFG[a.type]||TYPE_CFG.general;
            return (
              <div key={a._id} style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:14, overflow:'hidden', transition:'border-color 160ms' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-medium)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-subtle)'}>
                <div style={{ height:3, background:cfg.color, opacity:0.6 }}/>
                <div style={{ display:'flex', gap:16, alignItems:'flex-start', padding:'18px 20px' }}>
                  <div style={{ width:40, height:40, borderRadius:8, background:`${cfg.color}12`, border:`1px solid ${cfg.color}22`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Megaphone size={18} color={cfg.color}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:6 }}>
                      <h3 style={{ fontSize:15.5, fontWeight:700 }}>{a.title}</h3>
                      <span className={`badge ${cfg.cls}`} style={{ fontSize:10.5 }}>{a.type}</span>
                      <span className="badge badge-gray" style={{ fontSize:10.5 }}>{a.targetRole==='all'?'All Users':a.targetRole==='student'?'Students':'Teachers'}</span>
                      <span className={`badge ${a.isActive?'badge-green':'badge-gray'}`} style={{ fontSize:10.5 }}>{a.isActive?'Active':'Hidden'}</span>
                    </div>
                    <p style={{ color:'var(--text-secondary)', fontSize:13.5, lineHeight:1.65, marginBottom:10 }}>{a.content}</p>
                    <div style={{ display:'flex', gap:16, fontSize:12.5, color:'var(--text-muted)', flexWrap:'wrap' }}>
                      {a.date && <span style={{ display:'flex', gap:4, alignItems:'center' }}><Calendar size={11}/>{new Date(a.date).toLocaleDateString()}</span>}
                      {a.location && <span style={{ display:'flex', gap:4, alignItems:'center' }}><MapPin size={11}/>{a.location}</span>}
                      {a.registrationLink && <a href={a.registrationLink} target="_blank" rel="noreferrer" style={{ display:'flex', gap:4, alignItems:'center', color:'var(--brand-light)' }}><ExternalLink size={11}/>Link</a>}
                      <span style={{ marginLeft:'auto' }}>Posted {new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(a)}><Edit3 size={13}/></button>
                    <button className="btn btn-danger btn-sm" onClick={()=>del(a._id)}><Trash2 size={13}/></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div className="modal-title">{editing?'Edit':'New'} Announcement</div>
              <button className="modal-close" onClick={()=>setShowModal(false)}><X size={18}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="field"><label className="field-label">Title *</label><input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Announcement title" autoFocus/></div>
              <div className="field"><label className="field-label">Content *</label><textarea rows={4} value={form.content} onChange={e=>set('content',e.target.value)} placeholder="Details…" style={{ resize:'vertical' }}/></div>
              <div className="g2">
                <div className="field"><label className="field-label">Type</label>
                  <select value={form.type} onChange={e=>set('type',e.target.value)}>
                    {TYPES.map(t=><option key={t} value={t} style={{ textTransform:'capitalize' }}>{t}</option>)}
                  </select>
                </div>
                <div className="field"><label className="field-label">Target audience</label>
                  <select value={form.targetRole} onChange={e=>set('targetRole',e.target.value)}>
                    <option value="all">All Users</option>
                    <option value="student">Students Only</option>
                    <option value="teacher">Teachers Only</option>
                  </select>
                </div>
              </div>
              <div className="g2">
                <div className="field"><label className="field-label">Event date</label><input type="date" value={form.date} onChange={e=>set('date',e.target.value)}/></div>
                <div className="field"><label className="field-label">Location</label><input value={form.location} onChange={e=>set('location',e.target.value)} placeholder="e.g., Main Hall, Online"/></div>
              </div>
              <div className="field"><label className="field-label">Registration link</label><input value={form.registrationLink} onChange={e=>set('registrationLink',e.target.value)} placeholder="https://…"/></div>
              <div style={{ display:'flex', gap:10, paddingTop:8, borderTop:'1px solid var(--border-subtle)' }}>
                <button className="btn btn-ghost" style={{ flex:1 }} onClick={()=>setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex:1 }} onClick={save} disabled={saving}>
                  {saving?<><span className="spinner" style={{ borderTopColor:'#fff' }}/>Saving…</>:<><Megaphone size={13}/>{editing?'Update':'Post'} Announcement</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
