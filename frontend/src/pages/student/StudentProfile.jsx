import { useState } from 'react';
import { Camera, Save, Key, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
const API = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

export default function StudentProfile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name:user?.name||'', contact:user?.contact||'', grade:user?.grade||'', purpose:user?.purpose||'' });
  const [pw, setPw] = useState({ current:'', next:'', confirm:'' });
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v])=>fd.append(k,v));
      if (photo) fd.append('photo', photo);
      const res = await api.put('/student/profile', fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      setUser(res.data); localStorage.setItem('user', JSON.stringify(res.data));
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); } finally { setSaving(false); }
  };

  const changePw = async () => {
    if (pw.next !== pw.confirm) { toast.error("Passwords don't match"); return; }
    if (pw.next.length < 8) { toast.error('Minimum 8 characters'); return; }
    setChangingPw(true);
    try {
      await api.put('/auth/change-password', { currentPassword:pw.current, newPassword:pw.next });
      toast.success('Password changed!'); setPw({ current:'', next:'', confirm:'' });
    } catch (err) { toast.error(err.response?.data?.message||'Failed'); } finally { setChangingPw(false); }
  };

  const photoSrc = photo ? URL.createObjectURL(photo) : user?.profilePhoto ? `${API}${user.profilePhoto}` : null;

  return (
    <div className="fade-in" style={{ maxWidth:640 }}>
      {/* Profile info card */}
      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', gap:18, alignItems:'center', paddingBottom:20, marginBottom:20, borderBottom:'1px solid var(--border-subtle)', flexWrap:'wrap' }}>
          {/* Avatar */}
          <div style={{ position:'relative', flexShrink:0 }}>
            <div style={{ width:76, height:76, borderRadius:'50%', background:'rgba(37,99,235,0.12)', border:'2px solid rgba(37,99,235,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:24, color:'var(--brand-light)', overflow:'hidden' }}>
              {photoSrc ? <img src={photoSrc} style={{ width:76,height:76,objectFit:'cover' }} alt="" /> : initials}
            </div>
            <label style={{ position:'absolute', bottom:0, right:0, width:26, height:26, background:'var(--brand)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'2px solid var(--bg-card)' }}>
              <Camera size={12} color="#fff" />
              <input type="file" accept="image/*" style={{ display:'none' }} onChange={e=>setPhoto(e.target.files[0])} />
            </label>
          </div>
          <div>
            <h2 style={{ fontSize:19, fontWeight:800, letterSpacing:'-0.3px' }}>{user?.name}</h2>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{user?.email}</div>
            <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
              <span className="badge badge-blue">Student</span>
              {user?.grade && <span className="badge badge-gray">{user.grade}</span>}
              {user?.studentId && <span className="badge badge-purple font-mono" style={{ fontSize:11 }}>ID: {user.studentId}</span>}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="g2">
            <div className="field"><label className="field-label">Full name</label><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} /></div>
            <div className="field"><label className="field-label">Contact</label><input value={form.contact} onChange={e=>setForm(p=>({...p,contact:e.target.value}))} /></div>
          </div>
          <div className="g2">
            <div className="field"><label className="field-label">Grade / Course</label><input value={form.grade} onChange={e=>setForm(p=>({...p,grade:e.target.value}))} /></div>
            <div className="field"><label className="field-label">Purpose</label><input value={form.purpose} onChange={e=>setForm(p=>({...p,purpose:e.target.value}))} /></div>
          </div>
          <button className="btn btn-primary btn-sm" style={{ alignSelf:'flex-start' }} onClick={save} disabled={saving}>
            {saving?<><span className="spinner" style={{ borderTopColor:'#fff',width:14,height:14 }} />Saving…</>:<><Save size={14} />Save Changes</>}
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:18 }}>
          <div style={{ width:36, height:36, background:'var(--purple-dim)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Key size={16} color="var(--purple)" />
          </div>
          <div style={{ fontWeight:700, fontSize:15 }}>Change Password</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div className="field"><label className="field-label">Current password</label><input type="password" value={pw.current} onChange={e=>setPw(p=>({...p,current:e.target.value}))} /></div>
          <div className="g2">
            <div className="field"><label className="field-label">New password</label><input type="password" value={pw.next} onChange={e=>setPw(p=>({...p,next:e.target.value}))} /></div>
            <div className="field"><label className="field-label">Confirm password</label><input type="password" value={pw.confirm} onChange={e=>setPw(p=>({...p,confirm:e.target.value}))} /></div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ alignSelf:'flex-start' }} onClick={changePw} disabled={changingPw}>
            {changingPw?'Changing…':'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
