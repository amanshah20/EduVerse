import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Users, Edit3, Trash2, Eye, EyeOff, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
const API = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

export default function AdminCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title:'', description:'', category:'', level:'beginner', price:'', discountPrice:'', instructor:'', duration:'', tags:'' });
  const [creating, setCreating] = useState(false);

  const load = () => api.get('/courses/admin/all').then(r=>setCourses(r.data)).finally(()=>setLoading(false));
  useEffect(()=>{ load(); },[]);

  const create = async () => {
    if (!form.title) { toast.error('Title required'); return; }
    setCreating(true);
    try {
      const payload = { ...form, tags:form.tags?form.tags.split(',').map(t=>t.trim()):[], price:Number(form.price)||0, discountPrice:Number(form.discountPrice)||undefined };
      const res = await api.post('/courses', payload);
      toast.success('Course created! Now build the content.');
      setShowCreate(false);
      navigate(`/admin/courses/build/${res.data._id}`);
    } catch (err) { toast.error(err.response?.data?.message||'Failed'); }
    finally { setCreating(false); }
  };

  const togglePublish = async (course) => {
    try {
      await api.put(`/courses/${course._id}`, { isPublished:!course.isPublished });
      toast.success(`Course ${!course.isPublished?'published':'unpublished'}`);
      load();
    } catch { toast.error('Failed'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    try { await api.delete(`/courses/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const lvlCls = { beginner:'badge-green', intermediate:'badge-amber', advanced:'badge-red' };

  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor:'var(--brand)' }}/></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ color:'var(--text-muted)', fontSize:13.5 }}>{courses.length} course{courses.length!==1?'s':''} total</div>
        <button className="btn btn-primary btn-sm" onClick={()=>setShowCreate(true)}><Plus size={14}/> New Course</button>
      </div>

      {courses.length===0 ? (
        <div className="empty" style={{ minHeight:400 }}>
          <BookOpen className="empty-icon"/>
          <p>No courses yet. Create your first course to get started.</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop:12 }} onClick={()=>setShowCreate(true)}><Plus size={13}/> Create Course</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
          {courses.map(c=>(
            <div key={c._id} style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:14, overflow:'hidden', transition:'border-color 160ms' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-medium)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-subtle)'}>
              <div style={{ height:130, background:'var(--bg-elevated)', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {c.thumbnail
                  ? <img src={`${API}${c.thumbnail}`} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : <BookOpen size={32} color="var(--text-faint)"/>}
                <div style={{ position:'absolute', top:10, right:10 }}>
                  <span className={`badge ${c.isPublished?'badge-green':'badge-gray'}`} style={{ fontSize:10.5 }}>{c.isPublished?'Live':'Draft'}</span>
                </div>
              </div>
              <div style={{ padding:'16px' }}>
                <h3 style={{ fontSize:14.5, fontWeight:700, marginBottom:6, lineHeight:1.35 }}>{c.title}</h3>
                <p style={{ fontSize:12.5, color:'var(--text-muted)', lineHeight:1.5, marginBottom:12, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{c.description}</p>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
                  <span className={`badge ${lvlCls[c.level]||'badge-gray'}`} style={{ fontSize:10.5 }}>{c.level}</span>
                  {c.category && <span className="badge badge-gray" style={{ fontSize:10.5 }}>{c.category}</span>}
                  <span className="badge badge-blue" style={{ fontSize:10.5 }}>₹{c.price||0}</span>
                  <span className="badge badge-gray" style={{ fontSize:10.5, display:'flex', alignItems:'center', gap:3 }}><Users size={10}/>{c.totalStudents}</span>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <Link to={`/admin/courses/build/${c._id}`} className="btn btn-ghost btn-sm" style={{ flex:1, justifyContent:'center' }}><Edit3 size={12}/> Edit</Link>
                  <button className={`btn btn-sm ${c.isPublished?'btn-ghost':'btn-success'}`} onClick={()=>togglePublish(c)} title={c.isPublished?'Unpublish':'Publish'}>
                    {c.isPublished?<EyeOff size={13}/>:<Eye size={13}/>}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={()=>del(c._id)} title="Delete"><Trash2 size={13}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowCreate(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div className="modal-title">Create New Course</div>
              <button className="modal-close" onClick={()=>setShowCreate(false)}><X size={18}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14, maxHeight:'72vh', overflowY:'auto', paddingRight:4 }}>
              <div className="field"><label className="field-label">Course title *</label><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="e.g., Complete JavaScript Masterclass" autoFocus/></div>
              <div className="field"><label className="field-label">Description</label><textarea rows={3} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} style={{ resize:'vertical' }}/></div>
              <div className="g2">
                <div className="field"><label className="field-label">Category</label><input value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} placeholder="e.g., Programming"/></div>
                <div className="field"><label className="field-label">Level</label>
                  <select value={form.level} onChange={e=>setForm(p=>({...p,level:e.target.value}))}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="g2">
                <div className="field"><label className="field-label">Price (₹)</label><input type="number" value={form.price} onChange={e=>setForm(p=>({...p,price:e.target.value}))} placeholder="0 for free"/></div>
                <div className="field"><label className="field-label">Discount Price (₹)</label><input type="number" value={form.discountPrice} onChange={e=>setForm(p=>({...p,discountPrice:e.target.value}))} placeholder="Optional"/></div>
              </div>
              <div className="g2">
                <div className="field"><label className="field-label">Instructor Name</label><input value={form.instructor} onChange={e=>setForm(p=>({...p,instructor:e.target.value}))}/></div>
                <div className="field"><label className="field-label">Duration</label><input value={form.duration} onChange={e=>setForm(p=>({...p,duration:e.target.value}))} placeholder="e.g., 40 hours"/></div>
              </div>
              <div className="field"><label className="field-label">Tags (comma separated)</label><input value={form.tags} onChange={e=>setForm(p=>({...p,tags:e.target.value}))} placeholder="javascript, web, frontend"/></div>
              <div style={{ display:'flex', gap:10, paddingTop:8, borderTop:'1px solid var(--border-subtle)' }}>
                <button className="btn btn-ghost" style={{ flex:1 }} onClick={()=>setShowCreate(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex:1 }} onClick={create} disabled={creating}>
                  {creating?<><span className="spinner" style={{ borderTopColor:'#fff' }}/>Creating…</>:<><Plus size={14}/> Create & Build Content</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
