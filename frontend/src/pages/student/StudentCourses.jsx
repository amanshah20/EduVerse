import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, BookOpen, Lock, CheckCircle, Tag, X, ShoppingCart, Play } from 'lucide-react';
import api from '../../utils/api';
const API = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';
const RZP_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

export default function StudentCourses() {
  const [tab, setTab] = useState('browse');
  const [courses, setCourses] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [coupon, setCoupon] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [buying, setBuying] = useState(false);
  const [q, setQ] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/courses'), api.get('/courses/student/my-courses')])
      .then(([c,m]) => { setCourses(c.data); setMine(m.data); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const applyCoupon = async (id) => {
    try {
      const r = await api.post(`/courses/${id}/validate-coupon`, { code: coupon });
      setCouponResult(r.data);
      toast.success(`Coupon applied — ₹${r.data.finalPrice} final`);
    } catch (err) { toast.error(err.response?.data?.message||'Invalid coupon'); setCouponResult(null); }
  };

  const purchase = async (course) => {
    setBuying(true);
    try {
      const r = await api.post('/payment/create-order', { courseId:course._id, couponCode:coupon||undefined });
      if (r.data.free) { toast.success('Enrolled!'); load(); setSelected(null); return; }
      const opts = {
        key: RZP_KEY||r.data.keyId, amount:r.data.amount*100, currency:'INR',
        name:'EduVerse', description:course.title, order_id:r.data.orderId,
        handler: async (res) => {
          try {
            await api.post('/payment/verify', { razorpayOrderId:res.razorpay_order_id, razorpayPaymentId:res.razorpay_payment_id, razorpaySignature:res.razorpay_signature, courseId:course._id, couponCode:coupon||undefined });
            toast.success('Payment successful — course unlocked!'); load(); setSelected(null);
          } catch { toast.error('Payment verification failed'); }
        },
        theme:{ color:'#3b82f6' }
      };
      new window.Razorpay(opts).open();
    } catch (err) { toast.error(err.response?.data?.message||'Purchase failed'); }
    finally { setBuying(false); }
  };

  const filtered = courses.filter(c => c.title?.toLowerCase().includes(q.toLowerCase())||c.category?.toLowerCase().includes(q.toLowerCase()));
  const lvlCls = { beginner:'badge-green', intermediate:'badge-amber', advanced:'badge-red' };

  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor:'var(--brand)' }} /></div>;

  return (
    <div className="fade-in">
      <div className="tabs" style={{ marginBottom:20, maxWidth:320 }}>
        <button className={`tab-btn ${tab==='browse'?'active':''}`} onClick={()=>setTab('browse')}>All Courses</button>
        <button className={`tab-btn ${tab==='my'?'active':''}`} onClick={()=>setTab('my')}>My Courses ({mine.length})</button>
      </div>

      {tab==='browse' && <>
        <div className="input-wrap" style={{ maxWidth:400, marginBottom:20 }}>
          <Search size={15} className="input-icon" />
          <input placeholder="Search courses…" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {filtered.map(c => (
            <div key={c._id} className="course-card" onClick={()=>{ setSelected(c); setCoupon(''); setCouponResult(null); }}>
              <div className="course-thumb">
                {c.thumbnail ? <img src={`${API}${c.thumbnail}`} style={{ width:'100%',height:'100%',objectFit:'cover' }} alt="" /> : <BookOpen size={32} color="var(--text-faint)" />}
              </div>
              <div className="course-body">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8, gap:8 }}>
                  <h3 style={{ fontSize:14.5, fontWeight:700, lineHeight:1.35, flex:1 }}>{c.title}</h3>
                  {c.isEnrolled && <CheckCircle size={16} color="var(--green)" style={{ flexShrink:0, marginTop:2 }} />}
                </div>
                <p style={{ fontSize:12.5, color:'var(--text-muted)', lineHeight:1.5, marginBottom:12, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{c.description}</p>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    {c.price===0 ? <span style={{ fontWeight:800, color:'var(--green)', fontSize:15 }}>Free</span> : <>
                      <span style={{ fontWeight:800, color:'var(--text-primary)', fontSize:16 }}>₹{c.discountPrice||c.price}</span>
                      {c.discountPrice && <span style={{ color:'var(--text-muted)', textDecoration:'line-through', fontSize:12 }}>₹{c.price}</span>}
                    </>}
                  </div>
                  <span className={`badge ${lvlCls[c.level]||'badge-gray'}`} style={{ fontSize:11 }}>{c.level}</span>
                </div>
                {c.isEnrolled && <div style={{ marginTop:10 }}>
                  <div className="progress"><div className="progress-fill" style={{ width:`${c.progress||0}%` }} /></div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{c.progress||0}% complete</div>
                </div>}
              </div>
            </div>
          ))}
        </div>
      </>}

      {tab==='my' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
          {mine.length ? mine.map(e => (
            <div key={e._id} className="card card-hover" onClick={()=>setSelected({ ...e.course, isEnrolled:true })}>
              <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:14 }}>
                <div style={{ width:44,height:44,borderRadius:8,background:'var(--bg-highlight)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0 }}>
                  {e.course?.thumbnail ? <img src={`${API}${e.course.thumbnail}`} style={{ width:44,height:44,objectFit:'cover' }} alt="" /> : <BookOpen size={18} color="var(--text-muted)" />}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.course?.title}</div>
                  <span className="badge badge-green" style={{ fontSize:10.5, marginTop:4 }}>Enrolled</span>
                </div>
              </div>
              <div className="progress"><div className="progress-fill" style={{ width:`${e.progressPercent||0}%` }} /></div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:12, color:'var(--text-muted)' }}>
                <span>Progress</span><span style={{ color:'var(--green)', fontWeight:700 }}>{e.progressPercent||0}%</span>
              </div>
            </div>
          )) : <div className="empty" style={{ gridColumn:'1/-1' }}><BookOpen className="empty-icon" /><p>No courses enrolled yet</p></div>}
        </div>
      )}

      {/* Course detail modal */}
      {selected && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setSelected(null)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div style={{ flex:1, minWidth:0 }}>
                <div className="modal-title truncate">{selected.title}</div>
                <div style={{ display:'flex', gap:6, marginTop:6 }}>
                  <span className={`badge ${lvlCls[selected.level]||'badge-gray'}`} style={{ fontSize:11 }}>{selected.level}</span>
                  {selected.category && <span className="badge badge-gray" style={{ fontSize:11 }}>{selected.category}</span>}
                  {selected.duration && <span className="badge badge-gray" style={{ fontSize:11 }}>{selected.duration}</span>}
                </div>
              </div>
              <button className="modal-close" onClick={()=>setSelected(null)} style={{ marginLeft:10, flexShrink:0 }}><X size={18} /></button>
            </div>
            <p style={{ color:'var(--text-secondary)', fontSize:13.5, lineHeight:1.7, marginBottom:18 }}>{selected.description}</p>

            {selected.modules?.length>0 && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10 }}>Course Content</div>
                {selected.modules.map((mod,i) => (
                  <div key={i} style={{ border:'1px solid var(--border-subtle)', borderRadius:8, marginBottom:6, overflow:'hidden' }}>
                    <div style={{ padding:'12px 14px', background:'var(--bg-elevated)', display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontWeight:600, fontSize:13.5 }}>{mod.title}</span>
                      <span style={{ fontSize:12, color:'var(--text-muted)' }}>{mod.chapters?.length||0} chapters</span>
                    </div>
                    {selected.isEnrolled && mod.chapters?.map((ch,j) => (
                      <div key={j} style={{ padding:'10px 14px 10px 24px', borderTop:'1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize:13, fontWeight:500, marginBottom:4 }}>{ch.title}</div>
                        {ch.materials?.map((m,k) => (
                          <div key={k} style={{ display:'flex', gap:8, alignItems:'center', padding:'4px 0', fontSize:12.5, color:'var(--text-muted)' }}>
                            {m.type==='youtube'?<Play size={12} />:<BookOpen size={12} />}
                            {m.type==='youtube'
                              ? <a href={m.youtubeUrl} target="_blank" rel="noreferrer" style={{ color:'var(--brand-light)' }}>{m.title}</a>
                              : <a href={`${API}${m.url}`} target="_blank" rel="noreferrer" style={{ color:'var(--brand-light)' }}>{m.title}</a>}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {!selected.isEnrolled && (
              <div style={{ borderTop:'1px solid var(--border-subtle)', paddingTop:18 }}>
                <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                  <div className="input-wrap" style={{ flex:1 }}>
                    <Tag size={14} className="input-icon" />
                    <input placeholder="Coupon code" value={coupon} onChange={e=>setCoupon(e.target.value.toUpperCase())} style={{ fontFamily:'monospace' }} />
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={()=>applyCoupon(selected._id)}>Apply</button>
                </div>
                {couponResult && <div className="alert alert-success" style={{ marginBottom:12, fontSize:13 }}><CheckCircle size={14} /> Coupon applied — Final price: <strong>₹{couponResult.finalPrice}</strong></div>}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:24, fontWeight:900, letterSpacing:'-0.5px' }}>
                      {selected.price===0?<span style={{ color:'var(--green)' }}>Free</span>:<span>₹{couponResult?.finalPrice??(selected.discountPrice||selected.price)}</span>}
                    </div>
                    {selected.price>0&&!couponResult&&selected.discountPrice && <div style={{ fontSize:12,color:'var(--text-muted)',textDecoration:'line-through' }}>₹{selected.price}</div>}
                  </div>
                  <button className="btn btn-primary btn-lg" onClick={()=>purchase(selected)} disabled={buying}>
                    {buying?<><span className="spinner" style={{ borderTopColor:'#fff' }} />Processing…</>:<><ShoppingCart size={16} />{selected.price===0?'Enroll Free':'Buy Now'}</>}
                  </button>
                </div>
              </div>
            )}
            {selected.isEnrolled && <div className="alert alert-success"><CheckCircle size={14} /> You are enrolled. Access all course materials above.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
