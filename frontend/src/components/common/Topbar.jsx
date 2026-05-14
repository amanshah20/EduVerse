import { Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';
const API = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';
export default function Topbar({ title, subtitle }) {
  const { user } = useAuth();
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)||'U';
  return (
    <div className="topbar">
      <div>
        <h2 style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.2px' }}>{title}</h2>
        {subtitle && <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:1 }}>{subtitle}</p>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--bg-elevated)', border:'1px solid rgba(59,130,246,0.1)', borderRadius:8, padding:'7px 12px', fontSize:13, color:'var(--text-secondary)' }}>
          <Search size={13} /><span style={{ fontSize:12 }}>Quick search…</span>
          <kbd style={{ background:'var(--bg-highlight)', border:'1px solid var(--border-default)', borderRadius:4, padding:'1px 5px', fontSize:10, color:'var(--text-muted)' }}>⌘K</kbd>
        </div>
        <NotificationBell />
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 10px', borderRadius:8, background:'var(--bg-elevated)', border:'1px solid rgba(59,130,246,0.1)' }}>
          <div className="avatar" style={{ width:26, height:26, fontSize:10, fontWeight:700, background:'rgba(59,130,246,0.1)', color:'#3b82f6' }}>
            {user?.profilePhoto ? <img src={`${API}${user.profilePhoto}`} alt="" style={{ width:26,height:26,borderRadius:'50%',objectFit:'cover' }} /> : initials}
          </div>
          <span style={{ fontSize:13, fontWeight:500 }}>{user?.name?.split(' ')[0]}</span>
        </div>
      </div>
    </div>
  );
}
