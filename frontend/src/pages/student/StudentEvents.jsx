import { useState, useEffect } from 'react';
import { Calendar, MapPin, ExternalLink, Megaphone } from 'lucide-react';
import api from '../../utils/api';

const TYPE_CFG = {
  hackathon:{ color:'var(--brand)',     bg:'rgba(37,99,235,0.08)',  badgeCls:'badge-blue'   },
  workshop: { color:'var(--green)',     bg:'var(--green-dim)',      badgeCls:'badge-green'  },
  seminar:  { color:'var(--purple)',    bg:'var(--purple-dim)',     badgeCls:'badge-purple' },
  exam:     { color:'var(--red)',       bg:'var(--red-dim)',        badgeCls:'badge-red'    },
  event:    { color:'#f59e0b',         bg:'rgba(245,158,11,0.08)', badgeCls:'badge-amber'  },
  general:  { color:'var(--text-muted)', bg:'rgba(255,255,255,0.03)', badgeCls:'badge-gray' },
};

export default function StudentEvents() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { api.get('/announcements').then(r=>setAnnouncements(r.data)).finally(()=>setLoading(false)); }, []);

  const filtered = filter==='all' ? announcements : announcements.filter(a=>a.type===filter);
  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor:'var(--brand)' }} /></div>;

  return (
    <div className="fade-in">
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
        <button className={`btn btn-sm ${filter==='all'?'btn-primary':'btn-ghost'}`} onClick={()=>setFilter('all')}>All</button>
        {Object.keys(TYPE_CFG).map(t => (
          <button key={t} className={`btn btn-sm ${filter===t?'btn-primary':'btn-ghost'}`} onClick={()=>setFilter(t)} style={{ textTransform:'capitalize' }}>{t}</button>
        ))}
      </div>

      {filtered.length===0 ? (
        <div className="empty" style={{ minHeight:300 }}><Megaphone className="empty-icon" /><p>No announcements yet</p></div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
          {filtered.map(a => {
            const cfg = TYPE_CFG[a.type] || TYPE_CFG.general;
            return (
              <div key={a._id} style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:14, overflow:'hidden', transition:'all 160ms' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-medium)';e.currentTarget.style.transform='translateY(-2px)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-subtle)';e.currentTarget.style.transform='none';}}>
                <div style={{ height:5, background:cfg.color, opacity:0.7 }} />
                <div style={{ padding:'18px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10, gap:8 }}>
                    <div style={{ width:36, height:36, borderRadius:8, background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Megaphone size={17} color={cfg.color} />
                    </div>
                    <span className={`badge ${cfg.badgeCls}`} style={{ fontSize:11 }}>{a.type}</span>
                  </div>
                  <h3 style={{ fontSize:15, fontWeight:700, marginBottom:8, lineHeight:1.35 }}>{a.title}</h3>
                  <p style={{ fontSize:13.5, color:'var(--text-muted)', lineHeight:1.65, marginBottom:14 }}>{a.content}</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:5, fontSize:12.5, color:'var(--text-muted)' }}>
                    {a.date && <div style={{ display:'flex', gap:6, alignItems:'center' }}><Calendar size={12} />{new Date(a.date).toLocaleDateString('en-IN',{ weekday:'short', day:'numeric', month:'long', year:'numeric' })}</div>}
                    {a.location && <div style={{ display:'flex', gap:6, alignItems:'center' }}><MapPin size={12} />{a.location}</div>}
                    {a.registrationLink && <a href={a.registrationLink} target="_blank" rel="noreferrer" style={{ display:'flex', gap:6, alignItems:'center', color:'var(--brand-light)' }}><ExternalLink size={12} />Register Now</a>}
                  </div>
                  <div style={{ marginTop:10, fontSize:11.5, color:'var(--text-faint)' }}>Posted {new Date(a.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
