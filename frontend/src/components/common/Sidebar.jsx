import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Zap, LogOut } from 'lucide-react';

const API = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

export default function Sidebar({ navSections, role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)||'U';
  const roleColor = { student:'#3b82f6', teacher:'#10b981', admin:'#8b5cf6' }[role] || '#3b82f6';

  const handleLogout = () => { logout(); toast.success('Signed out'); navigate('/login'); };

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo-mark" style={{ background:'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
          <Zap size={17} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize:14.5, fontWeight:900, letterSpacing:'-0.5px', background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>EduVerse</div>
          <div style={{ fontSize:10.5, color:'var(--text-muted)', textTransform:'capitalize', letterSpacing:'0.5px' }}>{role} portal</div>
        </div>
      </div>

      <nav className="sidebar-nav" style={{ flex:1 }}>
        {navSections.map((sec, si) => (
          <div key={si}>
            {sec.label && <div className="nav-section-label">{sec.label}</div>}
            {sec.items.map((item, ii) => {
              const Icon = item.icon;
              return (
                <NavLink key={ii} to={item.to} end={item.end}
                  className={({ isActive }) => `nav-item${isActive?' active':''}`}>
                  <Icon size={16} className="nav-icon" />
                  <span style={{ flex:1 }}>{item.label}</span>
                  {item.badge!=null && <span style={{ background:'var(--red)',color:'#fff',fontSize:10,fontWeight:700,borderRadius:100,minWidth:17,height:17,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 4px' }}>{item.badge}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar" style={{ width:32,height:32,fontSize:12,fontWeight:700,background:`${roleColor}12`,color:roleColor,border:`1px solid ${roleColor}1a` }}>
            {user?.profilePhoto
              ? <img src={`${API}${user.profilePhoto}`} alt="" style={{ width:32,height:32,borderRadius:'50%',objectFit:'cover' }} />
              : initials}
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize:11,color:'var(--text-muted)',textTransform:'capitalize' }}>{user?.role}</div>
          </div>
          <button onClick={handleLogout} title="Sign out"
            style={{ color:'var(--text-muted)',display:'flex',padding:4,borderRadius:4,transition:'color 160ms',background:'none',border:'none',cursor:'pointer' }}
            onMouseEnter={e=>e.currentTarget.style.color='var(--red)'}
            onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
