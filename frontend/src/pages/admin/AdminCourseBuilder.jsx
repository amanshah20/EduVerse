import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Upload, Video, FileText, Play, ChevronDown, ChevronUp, Tag, X, Layers, BookOpen, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
const API = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

export default function AdminCourseBuilder() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const [modals, setModals] = useState({ module:false, chapter:false, material:false, coupon:false });
  const open = (k) => setModals(p=>({...p,[k]:true}));
  const close = (k) => setModals(p=>({...p,[k]:false}));

  const [modForm, setModForm] = useState({ title:'', description:'' });
  const [chapForm, setChapForm] = useState({ title:'', description:'' });
  const [matForm, setMatForm] = useState({ title:'', type:'pdf', url:'' });
  const [matFile, setMatFile] = useState(null);
  const [cpnForm, setCpnForm] = useState({ code:'', discount:'', type:'percent', usageLimit:'' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => api.get(`/courses/${id}`).then(r=>{ setCourse(r.data); setLoading(false); });
  useEffect(()=>{ load(); },[id]);

  const addModule = async () => {
    if (!modForm.title) { toast.error('Module title required'); return; }
    setSaving(true);
    try { await api.post(`/courses/${id}/modules`, modForm); toast.success('Module added!'); close('module'); setModForm({title:'',description:''}); load(); }
    catch { toast.error('Failed'); } finally { setSaving(false); }
  };

  const addChapter = async () => {
    if (!chapForm.title||!activeModule) { toast.error('Chapter title required'); return; }
    setSaving(true);
    try { await api.post(`/courses/${id}/modules/${activeModule._id}/chapters`, chapForm); toast.success('Chapter added!'); close('chapter'); setChapForm({title:'',description:''}); load(); }
    catch { toast.error('Failed'); } finally { setSaving(false); }
  };

  const addMaterial = async () => {
    if (!matForm.title||!activeModule||!activeChapter) { toast.error('Fill required fields'); return; }
    setUploading(true);
    try {
      if (matForm.type==='youtube') {
        await api.post(`/courses/${id}/modules/${activeModule._id}/chapters/${activeChapter._id}/youtube`, { title:matForm.title, url:matForm.url });
      } else if (matFile) {
        const fd = new FormData(); fd.append('file',matFile); fd.append('title',matForm.title); fd.append('type',matForm.type);
        await api.post(`/courses/${id}/modules/${activeModule._id}/chapters/${activeChapter._id}/upload`, fd, { headers:{ 'Content-Type':'multipart/form-data' }});
      } else { toast.error('Select a file or enter a YouTube URL'); return; }
      toast.success('Material added!'); close('material'); setMatForm({title:'',type:'pdf',url:''}); setMatFile(null); load();
    } catch { toast.error('Upload failed'); } finally { setUploading(false); }
  };

  const addCoupon = async () => {
    if (!cpnForm.code||!cpnForm.discount) { toast.error('Fill coupon details'); return; }
    try {
      const updated = [...(course.couponCodes||[]), { code:cpnForm.code.toUpperCase(), discount:Number(cpnForm.discount), type:cpnForm.type, isActive:true, usageLimit:cpnForm.usageLimit?Number(cpnForm.usageLimit):null }];
      await api.put(`/courses/${id}`, { couponCodes:updated });
      toast.success('Coupon added!'); close('coupon'); setCpnForm({code:'',discount:'',type:'percent',usageLimit:''}); load();
    } catch { toast.error('Failed'); }
  };

  const toggleCoupon = async (code, isActive) => {
    const updated = course.couponCodes.map(c=>c.code===code?{...c,isActive}:c);
    await api.put(`/courses/${id}`, { couponCodes:updated }); load();
  };

  const togglePublish = async () => {
    try { await api.put(`/courses/${id}`, { isPublished:!course.isPublished }); toast.success(`Course ${!course.isPublished?'published':'unpublished'}`); load(); }
    catch { toast.error('Failed'); }
  };

  const matIcon = { pdf:<FileText size={14}/>, doc:<FileText size={14}/>, youtube:<Video size={14}/>, video:<Play size={14}/>, link:<BookOpen size={14}/> };
  const totalMats = course?.modules?.reduce((s,m)=>s+m.chapters?.reduce((cs,c)=>cs+(c.materials?.length||0),0),0)||0;

  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor:'var(--brand)' }}/></div>;
  if (!course) return <div className="empty"><p>Course not found</p></div>;

  const Modal = ({ k, title, children }) => modals[k] ? (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&close(k)}>
      <div className="modal">
        <div className="modal-header"><div className="modal-title">{title}</div><button className="modal-close" onClick={()=>close(k)}><X size={18}/></button></div>
        {children}
      </div>
    </div>
  ) : null;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:24, flexWrap:'wrap' }}>
        <Link to="/admin/courses" style={{ color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4, fontSize:13, marginTop:4, transition:'color 160ms' }}
          onMouseEnter={e=>e.currentTarget.style.color='var(--text-primary)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
          <ArrowLeft size={15}/> Back
        </Link>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}>
            <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.3px' }}>{course.title}</h2>
            <span className={`badge ${course.isPublished?'badge-green':'badge-gray'}`} style={{ fontSize:10.5 }}>{course.isPublished?'Live':'Draft'}</span>
          </div>
          <div style={{ display:'flex', gap:16, fontSize:12.5, color:'var(--text-muted)' }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><Layers size={12}/>{course.modules?.length||0} modules</span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><FileText size={12}/>{totalMats} materials</span>
            <span>₹{course.price||0}</span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><BookOpen size={12}/>{course.totalStudents} enrolled</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost btn-sm" onClick={()=>open('coupon')}><Tag size={13}/> Coupons</button>
          <button className={`btn btn-sm ${course.isPublished?'btn-ghost':'btn-success'}`} onClick={togglePublish}>
            {course.isPublished?<><EyeOff size={13}/> Unpublish</>:<><Eye size={13}/> Publish</>}
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:20 }}>
        {/* Sidebar — modules */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ fontWeight:700, fontSize:14 }}>Modules</span>
            <button className="btn btn-primary btn-sm" onClick={()=>open('module')} style={{ padding:'5px 10px' }}><Plus size={12}/></button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {!course.modules?.length && (
              <div style={{ textAlign:'center', padding:'28px 16px', background:'var(--bg-card)', borderRadius:10, border:'1px dashed var(--border-medium)', color:'var(--text-muted)', fontSize:13 }}>
                No modules yet.<br/>Add your first module.
              </div>
            )}
            {course.modules?.map((mod)=>(
              <div key={mod._id} style={{ background:activeModule?._id===mod._id?'rgba(37,99,235,0.08)':'var(--bg-card)', border:`1px solid ${activeModule?._id===mod._id?'rgba(37,99,235,0.25)':'var(--border-subtle)'}`, borderRadius:10, padding:'12px 14px', cursor:'pointer', transition:'all 160ms' }}
                onClick={()=>{ setActiveModule(mod); setActiveChapter(null); }}>
                <div style={{ fontWeight:600, fontSize:13.5, color:activeModule?._id===mod._id?'var(--brand-light)':'var(--text-primary)', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{mod.title}</div>
                <div style={{ fontSize:11.5, color:'var(--text-muted)' }}>{mod.chapters?.length||0} chapters</div>
                {activeModule?._id===mod._id && (
                  <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:4 }}>
                    {mod.chapters?.map(ch=>(
                      <div key={ch._id} onClick={e=>{ e.stopPropagation(); setActiveChapter(ch); }}
                        style={{ padding:'7px 10px', borderRadius:6, background:activeChapter?._id===ch._id?'rgba(37,99,235,0.12)':'var(--bg-elevated)', cursor:'pointer', fontSize:12.5, color:activeChapter?._id===ch._id?'var(--brand-light)':'var(--text-secondary)', display:'flex', justifyContent:'space-between', transition:'all 160ms' }}>
                        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ch.title}</span>
                        <span style={{ color:'var(--text-muted)', flexShrink:0, marginLeft:6 }}>{ch.materials?.length||0}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div>
          {!activeModule ? (
            <div style={{ background:'var(--bg-card)', border:'1px dashed var(--border-medium)', borderRadius:14, height:420, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
              <Layers size={40} color="var(--text-faint)"/>
              <p style={{ color:'var(--text-muted)', fontSize:14 }}>Select a module from the left panel to manage its content</p>
              <button className="btn btn-primary btn-sm" onClick={()=>open('module')}><Plus size={13}/> Add First Module</button>
            </div>
          ) : (
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                <div>
                  <h3 style={{ fontSize:16, fontWeight:800 }}>{activeModule.title}</h3>
                  {activeModule.description && <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{activeModule.description}</p>}
                </div>
                <button className="btn btn-primary btn-sm" onClick={()=>open('chapter')}><Plus size={12}/> Chapter</button>
              </div>

              {!activeModule.chapters?.length ? (
                <div style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)', border:'1px dashed var(--border-medium)', borderRadius:10 }}>
                  <FileText size={32} color="var(--text-faint)" style={{ margin:'0 auto 12px' }}/>
                  <p style={{ fontSize:13 }}>No chapters yet. Add your first chapter to this module.</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {activeModule.chapters?.map(ch=>(
                    <div key={ch._id} style={{ border:'1px solid var(--border-subtle)', borderRadius:10, overflow:'hidden' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'13px 16px', background:activeChapter?._id===ch._id?'rgba(37,99,235,0.06)':'var(--bg-elevated)', cursor:'pointer' }}
                        onClick={()=>setActiveChapter(activeChapter?._id===ch._id?null:ch)}>
                        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                          <FileText size={14} color="var(--text-muted)"/>
                          <div>
                            <div style={{ fontWeight:600, fontSize:14 }}>{ch.title}</div>
                            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:1 }}>{ch.materials?.length||0} materials</div>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <button className="btn btn-primary btn-sm" style={{ padding:'5px 10px', fontSize:12 }}
                            onClick={e=>{ e.stopPropagation(); setActiveChapter(ch); open('material'); }}>
                            <Plus size={11}/> Material
                          </button>
                          {activeChapter?._id===ch._id?<ChevronUp size={14} color="var(--text-muted)"/>:<ChevronDown size={14} color="var(--text-muted)"/>}
                        </div>
                      </div>

                      {activeChapter?._id===ch._id && (
                        <div style={{ padding:'12px 16px' }}>
                          {!ch.materials?.length ? (
                            <div style={{ textAlign:'center', padding:'16px', color:'var(--text-muted)', fontSize:13 }}>
                              No materials yet. Add PDF, video, or YouTube content.
                            </div>
                          ) : (
                            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                              {ch.materials?.map((mat,mi)=>(
                                <div key={mi} style={{ display:'flex', gap:12, alignItems:'center', padding:'9px 12px', background:'var(--bg-elevated)', borderRadius:8, border:'1px solid var(--border-subtle)' }}>
                                  <div style={{ color:'var(--text-muted)', flexShrink:0 }}>{matIcon[mat.type]||<FileText size={14}/>}</div>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ fontSize:13.5, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{mat.title}</div>
                                    <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginTop:1 }}>{mat.type}</div>
                                  </div>
                                  {mat.type==='youtube'
                                    ? <a href={mat.youtubeUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize:11.5, padding:'4px 8px' }}><Play size={11}/> View</a>
                                    : mat.url && <a href={`${API}${mat.url}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize:11.5, padding:'4px 8px' }}>View</a>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Coupons list */}
          {course.couponCodes?.length>0 && (
            <div className="card" style={{ marginTop:16 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>Active Coupons</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {course.couponCodes.map((c,i)=>(
                  <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 14px', background:'var(--bg-elevated)', borderRadius:8 }}>
                    <code style={{ fontFamily:'monospace', fontSize:14, fontWeight:700, color:'var(--green)', letterSpacing:2, flex:1 }}>{c.code}</code>
                    <span className="badge badge-purple" style={{ fontSize:10.5 }}>{c.discount}{c.type==='percent'?'%':'₹'} off</span>
                    {c.usageLimit && <span style={{ fontSize:12, color:'var(--text-muted)' }}>{c.usedCount}/{c.usageLimit} used</span>}
                    <button className={`btn btn-sm ${c.isActive?'btn-success':'btn-ghost'}`} style={{ fontSize:11.5, padding:'4px 10px' }} onClick={()=>toggleCoupon(c.code,!c.isActive)}>
                      {c.isActive?'Active':'Inactive'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Module Modal */}
      <Modal k="module" title="Add Module">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="field"><label className="field-label">Module title *</label><input value={modForm.title} onChange={e=>setModForm(p=>({...p,title:e.target.value}))} placeholder="e.g., Introduction to HTML" autoFocus/></div>
          <div className="field"><label className="field-label">Description</label><textarea rows={2} value={modForm.description} onChange={e=>setModForm(p=>({...p,description:e.target.value}))} style={{ resize:'vertical' }}/></div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-ghost" style={{ flex:1 }} onClick={()=>close('module')}>Cancel</button>
            <button className="btn btn-primary" style={{ flex:1 }} onClick={addModule} disabled={saving}>{saving?'Adding…':'Add Module'}</button>
          </div>
        </div>
      </Modal>

      {/* Add Chapter Modal */}
      <Modal k="chapter" title={`Add Chapter to "${activeModule?.title}"`}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="field"><label className="field-label">Chapter title *</label><input value={chapForm.title} onChange={e=>setChapForm(p=>({...p,title:e.target.value}))} placeholder="e.g., Chapter 1: Getting Started" autoFocus/></div>
          <div className="field"><label className="field-label">Description</label><textarea rows={2} value={chapForm.description} onChange={e=>setChapForm(p=>({...p,description:e.target.value}))} style={{ resize:'vertical' }}/></div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-ghost" style={{ flex:1 }} onClick={()=>close('chapter')}>Cancel</button>
            <button className="btn btn-primary" style={{ flex:1 }} onClick={addChapter} disabled={saving}>{saving?'Adding…':'Add Chapter'}</button>
          </div>
        </div>
      </Modal>

      {/* Add Material Modal */}
      <Modal k="material" title={`Add Material to "${activeChapter?.title}"`}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="field">
            <label className="field-label">Material type</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {[{v:'pdf',icon:<FileText size={13}/>,l:'PDF'},{v:'doc',icon:<FileText size={13}/>,l:'DOC'},{v:'video',icon:<Play size={13}/>,l:'Video'},{v:'youtube',icon:<Video size={13}/>,l:'YouTube'}].map(t=>(
                <button key={t.v} className={`btn btn-sm ${matForm.type===t.v?'btn-primary':'btn-ghost'}`} onClick={()=>setMatForm(p=>({...p,type:t.v}))}>
                  {t.icon}{t.l}
                </button>
              ))}
            </div>
          </div>
          <div className="field"><label className="field-label">Title *</label><input value={matForm.title} onChange={e=>setMatForm(p=>({...p,title:e.target.value}))} placeholder={matForm.type==='youtube'?'e.g., Lecture 1: Introduction':'e.g., Chapter 1 Notes'} autoFocus/></div>
          {matForm.type==='youtube' ? (
            <div className="field"><label className="field-label">YouTube URL *</label><input value={matForm.url} onChange={e=>setMatForm(p=>({...p,url:e.target.value}))} placeholder="https://www.youtube.com/watch?v=…"/></div>
          ) : (
            <div className="field">
              <label className="field-label">Upload File *</label>
              <div style={{ padding:'10px 14px', background:'var(--bg-input)', border:'1px solid var(--border-default)', borderRadius:6 }}>
                <input type="file" accept={matForm.type==='pdf'?'.pdf':matForm.type==='doc'?'.doc,.docx':'.mp4,.avi,.mov'} onChange={e=>setMatFile(e.target.files[0])}/>
                {matFile && <div style={{ fontSize:12,color:'var(--green)',marginTop:6 }}>✓ {matFile.name} ({(matFile.size/1024/1024).toFixed(1)}MB)</div>}
              </div>
            </div>
          )}
          {uploading && <div className="alert alert-info"><span className="spinner spinner-sm" style={{ borderTopColor:'var(--brand)' }}/> Uploading… please wait</div>}
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-ghost" style={{ flex:1 }} onClick={()=>close('material')} disabled={uploading}>Cancel</button>
            <button className="btn btn-primary" style={{ flex:1 }} onClick={addMaterial} disabled={uploading}>
              {uploading?<><span className="spinner" style={{ borderTopColor:'#fff' }}/>Uploading…</>:<><Upload size={13}/> Add Material</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* Coupon Modal */}
      <Modal k="coupon" title="Add Coupon Code">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="field"><label className="field-label">Coupon code *</label><input value={cpnForm.code} onChange={e=>setCpnForm(p=>({...p,code:e.target.value.toUpperCase()}))} placeholder="SAVE20" style={{ fontFamily:'monospace', letterSpacing:2 }}/></div>
          <div className="g2">
            <div className="field"><label className="field-label">Discount *</label><input type="number" value={cpnForm.discount} onChange={e=>setCpnForm(p=>({...p,discount:e.target.value}))} placeholder="20"/></div>
            <div className="field"><label className="field-label">Type</label>
              <select value={cpnForm.type} onChange={e=>setCpnForm(p=>({...p,type:e.target.value}))}>
                <option value="percent">Percent (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
          </div>
          <div className="field"><label className="field-label">Usage limit (blank = unlimited)</label><input type="number" value={cpnForm.usageLimit} onChange={e=>setCpnForm(p=>({...p,usageLimit:e.target.value}))} placeholder="100"/></div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-ghost" style={{ flex:1 }} onClick={()=>close('coupon')}>Cancel</button>
            <button className="btn btn-primary" style={{ flex:1 }} onClick={addCoupon}><Tag size={13}/> Add Coupon</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
